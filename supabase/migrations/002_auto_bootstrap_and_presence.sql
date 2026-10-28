-- Migration 002: Auto-Bootstrap Organizations & 24-Hour Session Presence Support
-- Ensures every authenticated user is guaranteed an organization and account_admin membership in DB

-- 1. Create or replace public.bootstrap_current_user()
CREATE OR REPLACE FUNCTION public.bootstrap_current_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID;
    caller_email TEXT;
    caller_meta JSONB;
    org_title TEXT;
    existing_org_id UUID;
    new_org_id UUID;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Return existing active organization if already assigned
    SELECT organization_id INTO existing_org_id
    FROM public.organization_members
    WHERE user_id = caller_id AND status = 'active'
    LIMIT 1;

    IF existing_org_id IS NOT NULL THEN
        RETURN existing_org_id;
    END IF;

    -- Retrieve user email and metadata
    SELECT email, raw_user_meta_data INTO caller_email, caller_meta
    FROM auth.users
    WHERE id = caller_id;

    org_title := trim(coalesce(caller_meta->>'organization_name', ''));
    IF org_title = '' THEN
        org_title := trim(coalesce(caller_meta->>'full_name', split_part(caller_email, '@', 1))) || ' Org';
    END IF;

    -- Provision the organization using create_organization_with_admin
    new_org_id := public.create_organization_with_admin(org_title);
    RETURN new_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user() TO authenticated;

-- 2. Update public.handle_auth_user_created() trigger to always provision an organization if none exists
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    org_title TEXT;
    invite_record RECORD;
    has_invite BOOLEAN := false;
BEGIN
    -- Upsert profile record
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

    -- Check if user was invited
    FOR invite_record IN 
        SELECT * FROM public.organization_invites 
        WHERE lower(email) = lower(new.email) AND accepted_at IS NULL AND expires_at > now()
    LOOP
        has_invite := true;
        INSERT INTO public.organization_members (organization_id, user_id, role, status)
        VALUES (invite_record.organization_id, new.id, invite_record.role, 'active')
        ON CONFLICT (organization_id, user_id) 
        DO UPDATE SET role = EXCLUDED.role, status = 'active';

        UPDATE public.organization_invites 
        SET accepted_at = now() 
        WHERE id = invite_record.id;

        UPDATE public.profiles 
        SET default_org_id = invite_record.organization_id 
        WHERE id = new.id AND default_org_id IS NULL;
    END LOOP;

    -- If no invite was accepted, provision a dedicated organization for the user
    IF NOT has_invite THEN
        org_title := trim(coalesce(new.raw_user_meta_data->>'organization_name', ''));
        IF org_title = '' THEN
            org_title := trim(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))) || ' Org';
        END IF;

        INSERT INTO public.organizations (name, slug, created_by, settings)
        VALUES (
            org_title,
            lower(regexp_replace(regexp_replace(org_title, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')) || '-' || substring(gen_random_uuid()::text, 1, 4),
            new.id,
            jsonb_build_object(
                'default_methodology', 'TRACI 2.1',
                'pcr_standard', 'UL 10010-4 Part B v2.0',
                'default_refrigerant', 'R1233zd'
            )
        )
        RETURNING id INTO new_org_id;

        INSERT INTO public.organization_members (organization_id, user_id, role, status)
        VALUES (new_org_id, new.id, 'account_admin', 'active')
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'account_admin', status = 'active';

        UPDATE public.profiles SET default_org_id = new_org_id WHERE id = new.id;
    END IF;

    RETURN new;
END;
$$;

