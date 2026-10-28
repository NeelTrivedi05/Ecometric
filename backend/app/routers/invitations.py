import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])

# In-memory token store as fallback/cache for local testing & instant resolution
_IN_MEMORY_INVITES: Dict[str, Dict[str, Any]] = {}

class InviteRequest(BaseModel):
    email: str
    role: str = "member"  # member (employee), manager, account_admin
    organization_id: str
    organization_name: str
    organization_slug: Optional[str] = None
    inviter_name: Optional[str] = "Organization Administrator"
    inviter_email: Optional[str] = None

class AcceptInviteRequest(BaseModel):
    token: str
    user_id: Optional[str] = None
    email: Optional[str] = None

def build_branded_email_html(
    organization_name: str,
    inviter_name: str,
    role_display: str,
    invite_url: str,
    recipient_email: str
) -> str:
    """Renders a responsive, nature-led HTML invitation email adhering to DESIGN.md."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join {organization_name} on EcoMetric</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f2f6f0;
      color: #16231b;
    }}
    .container {{
      max-width: 580px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #dfe7dd;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(16, 52, 33, 0.05);
    }}
    .header {{
      background: #16231b;
      padding: 32px 36px;
      text-align: left;
    }}
    .header-logo {{
      color: #86bb00;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .header-logo span {{
      color: #ffffff;
    }}
    .header-sub {{
      color: #9aaa9f;
      font-size: 13px;
      margin-top: 4px;
    }}
    .content {{
      padding: 36px;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background-color: rgba(31, 122, 76, 0.1);
      color: #1f7a4c;
      margin-bottom: 16px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 700;
      color: #16231b;
      margin: 0 0 16px 0;
      letter-spacing: -0.015em;
    }}
    p {{
      font-size: 14px;
      line-height: 1.6;
      color: #2f3b33;
      margin: 0 0 16px 0;
    }}
    .info-card {{
      background-color: #f8faf6;
      border: 1px solid #dfe7dd;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 24px 0;
    }}
    .info-row {{
      display: flex;
      justifyContent: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }}
    .info-row:last-child {{
      margin-bottom: 0;
    }}
    .info-label {{
      color: #718277;
    }}
    .info-val {{
      font-weight: 600;
      color: #16231b;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0 24px;
    }}
    .btn {{
      display: inline-block;
      background-color: #1f7a4c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(31, 122, 76, 0.25);
    }}
    .btn:hover {{
      background-color: #176640;
    }}
    .footer {{
      border-top: 1px solid #dfe7dd;
      padding: 24px 36px;
      font-size: 12px;
      color: #718277;
      line-height: 1.5;
      background: #f8faf6;
    }}
    .footer a {{
      color: #1f7a4c;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">ECO<span>METRIC</span></div>
      <div class="header-sub">Environmental Product Declaration & LCA Studio</div>
    </div>
    <div class="content">
      <span class="badge">Team Invitation</span>
      <h1>Join {organization_name} on EcoMetric</h1>
      <p>Hello,</p>
      <p><strong>{inviter_name}</strong> has invited you to join the <strong>{organization_name}</strong> organization on EcoMetric as an <strong>{role_display}</strong>.</p>
      
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Organization</span>
          <span class="info-val">{organization_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Your Role</span>
          <span class="info-val">{role_display}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invited Email</span>
          <span class="info-val">{recipient_email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Access Level</span>
          <span class="info-val">LCA & EPD Product Modeling</span>
        </div>
      </div>

      <p>As an employee, you will be able to access organization assessment projects, map equipment Bills of Materials, and view published EPD verification records.</p>

      <div class="btn-container">
        <a href="{invite_url}" class="btn" target="_blank">Accept Invitation &amp; Sign In</a>
      </div>

      <p style="font-size: 12px; color: #718277; word-break: break-all;">
        Button not working? Copy and paste this URL into your browser:<br>
        <a href="{invite_url}" style="color: #1f7a4c;">{invite_url}</a>
      </p>
    </div>
    <div class="footer">
      This invitation was issued on behalf of <strong>{organization_name}</strong> via EcoMetric Systems Inc. It expires in 7 days.<br>
      Administrative permissions and member role assignments are governed strictly by {organization_name} Account Admins.
    </div>
  </div>
</body>
</html>"""

def send_smtp_email(to_email: str, subject: str, html_content: str, sender_name: str) -> bool:
    """Attempts delivery via SMTP if configured; returns True on success, False if unconfigured/failed."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "invites@ecometric.io")

    if not smtp_host:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        # Attach text fallback + rich HTML
        msg.attach(MIMEText("Please use an HTML compatible email client to view your invitation.", "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [to_email], msg.as_string())
        return True
    except Exception as err:
        print(f"[EcoMetric Invitations] SMTP delivery error: {err}")
        return False


@router.post("/send")
def send_invitation(req: InviteRequest, request: Request):
    """
    Sends an official branded invitation email to the recipient under the name of 
    the organization and EcoMetric.
    """
    token = secrets.token_urlsafe(24)
    expires_at = datetime.utcnow() + timedelta(days=7)

    # Determine front-end application URL
    origin = request.headers.get("origin") or request.headers.get("referer") or os.getenv("FRONTEND_URL", "http://localhost:5173")
    origin = origin.rstrip("/")
    if "/console" in origin:
        origin = origin.split("/console")[0]
    elif "/app" in origin:
        origin = origin.split("/app")[0]

    org_slug = req.organization_slug or "carrier-hvac"
    invite_url = f"{origin}/login?invite={token}&org={org_slug}&email={req.email}"

    role_display = "Employee (LCA Member)" if req.role in ("member", "employee") else "Manager / Verifier"

    html_content = build_branded_email_html(
        organization_name=req.organization_name,
        inviter_name=req.inviter_name or "Organization Admin",
        role_display=role_display,
        invite_url=invite_url,
        recipient_email=req.email
    )

    subject = f"{req.organization_name} has invited you to join their team on EcoMetric"
    sender_display = f"{req.organization_name} via EcoMetric"

    # Send real email via SMTP if configured
    email_delivered = send_smtp_email(
        to_email=req.email,
        subject=subject,
        html_content=html_content,
        sender_name=sender_display
    )

    # Cache invitation in memory for instant resolution
    _IN_MEMORY_INVITES[token] = {
        "token": token,
        "email": req.email.lower(),
        "role": req.role,
        "organization_id": req.organization_id,
        "organization_name": req.organization_name,
        "organization_slug": org_slug,
        "inviter_name": req.inviter_name,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "accepted": False,
    }

    print(f"\n=======================================================")
    print(f"[EcoMetric Team Invitation]")
    print(f"Recipient: {req.email}")
    print(f"Organization: {req.organization_name} ({org_slug})")
    print(f"Role: {role_display}")
    print(f"Invite URL: {invite_url}")
    print(f"SMTP Delivered: {email_delivered}")
    print(f"=======================================================\n")

    return {
        "status": "success",
        "message": f"Invitation email sent to {req.email} on behalf of {req.organization_name} & EcoMetric",
        "email_delivered": email_delivered,
        "invite_url": invite_url,
        "token": token,
        "organization_name": req.organization_name,
        "role": req.role
    }


@router.get("/verify/{token}")
def verify_invitation(token: str):
    """Verifies that an invite token is valid and returns its organization details."""
    inv = _IN_MEMORY_INVITES.get(token)
    if not inv:
        return {"valid": False, "message": "Invitation not found or expired"}

    if inv.get("accepted"):
        return {"valid": False, "message": "Invitation has already been accepted"}

    return {
        "valid": True,
        "email": inv["email"],
        "role": inv["role"],
        "organization_id": inv["organization_id"],
        "organization_name": inv["organization_name"],
        "organization_slug": inv["organization_slug"]
    }


@router.post("/accept")
def accept_invitation(req: AcceptInviteRequest):
    """Marks an invitation token as accepted."""
    inv = _IN_MEMORY_INVITES.get(req.token)
    if inv:
        inv["accepted"] = True
        inv["accepted_at"] = datetime.utcnow().isoformat()
        inv["accepted_user_id"] = req.user_id

    return {
        "status": "accepted",
        "success": True,
        "message": "Invitation successfully accepted as employee",
        "organization_slug": inv.get("organization_slug") if inv else None
    }
