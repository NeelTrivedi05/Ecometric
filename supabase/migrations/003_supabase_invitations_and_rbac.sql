-- Migration 003: Pure Supabase Invitations & Robust Database-Level RBAC
-- Enables team invitations, email acceptance, and strict admin jurisdiction directly via Supabase

-- 1. Function for Account Admins to invite members directly in Supabase
CREATE OR REPLACE FUNCTION public.invite_organization_member(
    p_email text,
    p_role text DEFAULT 'member',
    p_org_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID;
    target_org_id UUID := p_org_id;
    norm_email TEXT;
    existing_user_id UUID;
    gen_token TEXT;
    new_invite_id UUID;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Caller must be authenticated to send invitations';
    END IF;

    -- If no target org provided, lookup the caller's active admin organization
    IF target_org_id IS NULL THEN
        SELECT organization_id INTO target_org_id
        FROM public.organization_members
        WHERE user_id = caller_id AND role = 'account_admin' AND status = 'active'
        LIMIT 1;
    END IF;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'Target organization not specified or caller is not an admin';
    END IF;

    -- Verify that caller is Account Admin of target organization
    IF NOT public.is_org_admin(target_org_id) THEN
        RAISE EXCEPTION 'Forbidden: Only Account Admins have permission to invite members to this organization';
    END IF;

    norm_email := lower(trim(p_email));
    IF norm_email = '' OR norm_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'Invalid email address provided';
    END IF;

    -- Ensure invited role is valid (defaults to 'member' for employee)
    IF p_role NOT IN ('account_admin', 'manager', 'member') THEN
        p_role := 'member';
    END IF;

    gen_token := encode(gen_random_bytes(24), 'hex');

    -- Insert or update invite record in public.organization_invites
    INSERT INTO public.organization_invites (
        organization_id,
        email,
        role,
        token,
        invited_by,
        expires_at
    ) VALUES (
        target_org_id,
        norm_email,
        p_role,
        gen_token,
        caller_id,
        now() + interval '7 days'
    )
    ON CONFLICT (organization_id, email)
    DO UPDATE SET
        role = EXCLUDED.role,
        token = gen_token,
        invited_by = caller_id,
        expires_at = now() + interval '7 days',
        accepted_at = NULL
    RETURNING id, token INTO new_invite_id, gen_token;

    -- Check if target user is already registered in auth.users
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE lower(email) = norm_email;

    IF existing_user_id IS NOT NULL THEN
        -- Instantly attach the existing user to the organization as an employee/member
        INSERT INTO public.organization_members (organization_id, user_id, role, status)
        VALUES (target_org_id, existing_user_id, p_role, 'active')
        ON CONFLICT (organization_id, user_id)
        DO UPDATE SET role = EXCLUDED.role, status = 'active';

        UPDATE public.organization_invites
        SET accepted_at = now()
        WHERE id = new_invite_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'invite_id', new_invite_id,
        'token', gen_token,
        'email', norm_email,
        'role', p_role,
        'organization_id', target_org_id,
        'user_already_registered', (existing_user_id IS NOT NULL)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.invite_organization_member(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_organization_member(text, text, uuid) TO authenticated;

-- 2. Function for invited employees to accept an invitation and join organization
CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID;
    caller_email TEXT;
    inv_record RECORD;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to accept invitation';
    END IF;

    SELECT email INTO caller_email FROM auth.users WHERE id = caller_id;

    -- Find matching active invite by token
    SELECT * INTO inv_record
    FROM public.organization_invites
    WHERE token = p_token AND accepted_at IS NULL AND expires_at > now();

    -- Fallback: check matching active invite by authenticated caller email
    IF inv_record IS NULL AND caller_email IS NOT NULL THEN
        SELECT * INTO inv_record
        FROM public.organization_invites
        WHERE lower(email) = lower(caller_email) AND accepted_at IS NULL AND expires_at > now()
        LIMIT 1;
    END IF;

    IF inv_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invitation is invalid, expired, or already accepted'
        );
    END IF;

    -- Add member with invited role
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (inv_record.organization_id, caller_id, inv_record.role, 'active')
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET role = EXCLUDED.role, status = 'active';

    -- Mark invite accepted
    UPDATE public.organization_invites
    SET accepted_at = now()
    WHERE id = inv_record.id;

    -- Update profile default organization
    UPDATE public.profiles
    SET default_org_id = inv_record.organization_id
    WHERE id = caller_id;

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', inv_record.organization_id,
        'role', inv_record.role
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(text) TO authenticated;

-- 3. Confirm and harden Row-Level Security policies on organization_members
DROP POLICY IF EXISTS "admins_update_members" ON public.organization_members;
CREATE POLICY "admins_update_members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "admins_delete_members" ON public.organization_members;
CREATE POLICY "admins_delete_members"
ON public.organization_members FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- 4. Confirm and harden Row-Level Security policies on organizations
DROP POLICY IF EXISTS "org_admins_update" ON public.organizations;
CREATE POLICY "org_admins_update"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));

