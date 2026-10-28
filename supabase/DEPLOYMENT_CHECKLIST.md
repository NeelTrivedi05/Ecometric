# Supabase Multi-Tenant Production Deployment & Storage Isolation Guide

This document provides the operational runbook for deploying the **EcoMetric Multi-Tenant Organization & Account Admin Console** system to Supabase with database-level PostgreSQL Row Level Security (RLS) and Storage isolation.

---

## 1. Environment Configuration

### Frontend Variables (`frontend/.env.local` or Vercel Environment Variables)
```env
# Supabase API Credentials
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ClcHwn5beKTBkqG2D8ueEg_htT6wLkx

# Backend API Endpoint (Optional if proxying /api)
VITE_API_URL=https://your-ecometric-api.onrender.com
```

> [!CAUTION]
> Never include your `service_role` key in any frontend code or repository commit. The browser uses exclusively the publishable/anon key with authenticated JWT tokens.

---

## 2. Supabase CLI & Migration Deployment

Follow these commands to deploy the migration script directly to your remote Supabase project:

```powershell
# 1. Install or update the Supabase CLI (if not already installed)
npm install -g supabase

# 2. Log in to your Supabase account
supabase login

# 3. Link your local project to the remote Supabase project
# (Find your Reference ID in Dashboard -> Project Settings -> General)
supabase link --project-ref icurerepycrpkaybfarw

# 4. Push the multi-tenant migration
supabase db push

# 5. (Alternative) Execute directly in Supabase Web Dashboard:
# Open Supabase Dashboard -> SQL Editor -> New Query
# Paste and run supabase/migrations/001_multi_tenant_consoles.sql
```

---

## 3. Storage Bucket & File Isolation

All EPD artifacts, equipment drawings, and verifier dossier PDFs are stored under the bucket `epd-artifacts` with path format:
```text
epd-artifacts/{organization_id}/{timestamp}_{filename}
```

### Storage RLS Policies in `001_multi_tenant_consoles.sql`:
1. **Tenant Read Isolation:**
   ```sql
   CREATE POLICY "epd_artifacts_tenant_select"
   ON storage.objects FOR SELECT TO authenticated
   USING (
     bucket_id IN ('epd-artifacts', 'organization-assets') AND
     ((storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids()))
   );
   ```

2. **Tenant Write Isolation:**
   ```sql
   CREATE POLICY "epd_artifacts_tenant_insert"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (
     bucket_id IN ('epd-artifacts', 'organization-assets') AND
     ((storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids()))
   );
   ```

3. **Account Admin Delete Control:**
   ```sql
   CREATE POLICY "epd_artifacts_tenant_delete"
   ON storage.objects FOR DELETE TO authenticated
   USING (
     bucket_id IN ('epd-artifacts', 'organization-assets') AND
     (public.is_org_admin((storage.foldername(name))[1]::uuid))
   );
   ```

---

## 4. Multi-Tenant Onboarding & RBAC Verification Checklist

| Verification Step | Verification Procedure | Expected Result |
| :--- | :--- | :--- |
| **New User Signup** | Sign up with `organization_name: "Carrier Commercial HVAC"` | Organization record, Profile, and `account_admin` membership created atomically via trigger |
| **Account Admin Console** | Navigate to `/console/carrier-commercial-hvac` | Admin Console opens with Overview, Team Panel, Domain Data, and Org Settings |
| **Non-Admin Access Gate** | Attempt to open `/console/:orgSlug` as `member` | Blocked by `AdminRouteGuard`, showing "Account Administrator Required" banner |
| **Database Cross-Tenant Leakage** | Run `SELECT * FROM public.projects;` as Org B user | PostgreSQL RLS returns strictly Org B projects; zero Org A records returned |
| **Storage Cross-Tenant Leakage** | Attempt to download `epd-artifacts/ORG_A_UUID/report.pdf` using Org B token | Returns HTTP 404 / 403 Access Denied |
| **Realtime Leakage** | Connect WebSocket to `org-${ORG_A_UUID}:projects` | Only Org A members receive postgres_changes broadcast events |

---

## 5. Summary of Architecture Implemented

- **Migration Script:** `supabase/migrations/001_multi_tenant_consoles.sql`
- **State Layer:** `frontend/src/context/TenantContext.jsx` with `useTenant()`
- **Scoped Data Client:** `frontend/src/lib/tenantScopedClient.js`
- **Security Route Guard:** `frontend/src/components/admin/AdminRouteGuard.jsx`
- **Admin Console Layout:** `frontend/src/components/admin/AdminConsoleLayout.jsx`
- **Team Management:** `frontend/src/components/admin/TeamManagementPanel.jsx`
- **Domain Data View:** `frontend/src/components/admin/DomainDataAdminView.jsx`
- **Organization Settings:** `frontend/src/components/admin/OrganizationSettingsView.jsx`
- **Tenant Creation Modal:** `frontend/src/components/admin/CreateOrganizationModal.jsx`

