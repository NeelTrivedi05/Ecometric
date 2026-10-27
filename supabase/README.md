# Supabase authentication setup

## 1. Create the Supabase project

Create a Supabase project and copy its **Project URL** and browser-safe **anon key** into
`frontend/.env.local`:

Find them in **Supabase Dashboard → Project Settings → API**:

- **Project URL** is the value for `VITE_SUPABASE_URL`.
- **Publishable key** (or legacy **anon public** key) is the value for `VITE_SUPABASE_ANON_KEY`.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the `service_role` key in the frontend or commit `.env.local`.

## 2. Create the organization and access tables

In Supabase **SQL Editor**, run [`schema.sql`](./schema.sql). The first email/password
signup that includes an organization name becomes that organization's `admin`. A user
created without an organization name is added as an `employee` only when an administrator
has created a matching pending invitation.

The row-level security policies prevent employees from managing members or invitations.
The database, not the React UI, is the source of truth for privileges.

## 3. Configure authentication providers

In **Authentication > Providers**:

1. Enable Email. Decide whether email confirmation is required.
2. Under **Authentication > URL Configuration**, set the Site URL to
   `http://localhost:5173` during local development and add these Redirect URLs:
   `http://localhost:5173/app`, `http://localhost:5173/reset-password`, and the matching
   production URLs.
3. Enable Google and create OAuth credentials in **Google Cloud Console**:
   - Configure the OAuth consent screen.
   - Create a Web application OAuth client.
   - Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI.
   - Copy the Google client ID and secret into Supabase's Google provider settings.
4. Test both email/password and Google sign-in from `/login` and `/signup`.

## 4. Bootstrap the administrator

Open `/login`, choose **Create an account**, enter the organization name, and confirm the
email if confirmation is enabled. The database trigger creates the organization and admin
membership.

## 5. Invite employees

An admin workflow should create a row in `organization_invitations` with the employee's
email and the admin's `organization_id`, then send an email using a trusted backend or
Supabase Edge Function. Do not call the Supabase Admin API with a service-role key from
the browser. When the employee signs up with that email (password or Google), the trigger
creates the employee membership.

For production, expose this as an admin-only Edge Function that:

1. Verifies the caller's Supabase access token.
2. Checks `is_org_admin(organization_id)`.
3. Inserts the pending invitation.
4. Calls `supabase.auth.admin.inviteUserByEmail` with the service-role key held only in
   the function's secrets.

## 6. Run the frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

The calculation studio routes require a Supabase session and redirect unauthenticated
visitors to `/login`. A signed-in user without an active organization membership sees
`Access pending`; employees cannot access the organization settings route.

## 7. Password recovery

The login page's **Forgot password?** action calls `resetPasswordForEmail`. Supabase emails
the user a link to `/reset-password`, where the new password is saved with
`auth.updateUser`. Add the reset URL to Supabase's redirect allow-list before testing.

## 8. Email OTP sign-in

The login page includes **Sign in with email code**. It only requests an OTP for an
existing Supabase account (`shouldCreateUser: false`), so an unknown email cannot bypass
the organization signup and invitation flow.

Configure the email OTP in Supabase:

1. Open **Authentication > Email Templates > Magic Link**.
2. Use an OTP-oriented template containing `{{ .Token }}`. Keep the token visible as a
   six-digit code; do not remove the token variable.
3. Open **Authentication > Providers > Email** and confirm email sign-in is enabled.
4. In the Auth settings, set the email OTP/token expiry to **100 seconds** if that setting
   is available in your project version. The UI also enforces a 100-second resend window.
5. Test from `/login`: enter an existing user's email and select **Sign in with email code**.

The code is verified through `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
After 100 seconds the verification page changes from `Resend in Ns` to **Resend Otp**.
Resending starts a new 100-second window. A verified user still must have an active
organization membership before `/app` is accessible.

## 9. Email delivery troubleshooting

Email delivery is performed by Supabase SMTP, not by the frontend. After saving SMTP:

1. Send a Supabase test email.
2. Check Supabase **Authentication > Logs > Emails** for delivery errors.
3. Check the recipient's spam folder.
4. For Gmail, use a Google App Password, port `587`, and make the sender email match
   the SMTP username.
5. Confirm the sender address is valid and that the SMTP provider has not rate-limited it.

Run the updated [`schema.sql`](./schema.sql) after pulling this change so the
`account_exists` function is available. The policy section is idempotent: it drops and
recreates only the five policies defined by this file, so the complete schema can be run
again safely. It lets the UI distinguish an unknown email from an incorrect password; this
intentionally allows email-account enumeration because that was requested for the login
experience.
