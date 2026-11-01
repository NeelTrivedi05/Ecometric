-- Migration 004: Restrict each account admin to one active organization

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_account_admin_one_organization
ON public.organization_members (user_id)
WHERE role = 'account_admin' AND status = 'active';

CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
    org_name TEXT,
    org_slug TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    final_slug TEXT;
    caller_id UUID;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Caller must be authenticated to provision an organization';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

    IF EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = caller_id
          AND role = 'account_admin'
          AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Each Account Admin can have only one organization';
    END IF;

    IF trim(coalesce(org_name, '')) = '' THEN
        RAISE EXCEPTION 'Organization name cannot be empty';
    END IF;

    IF trim(coalesce(org_slug, '')) = '' THEN
        final_slug := lower(regexp_replace(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'));
    ELSE
        final_slug := lower(regexp_replace(regexp_replace(org_slug, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'));
    END IF;

    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) THEN
        final_slug := final_slug || '-' || substring(gen_random_uuid()::text, 1, 4);
    END IF;

    INSERT INTO public.organizations (name, slug, created_by, settings)
    VALUES (
        trim(org_name),
        final_slug,
        caller_id,
        jsonb_build_object(
            'default_methodology', 'TRACI 2.1',
            'pcr_standard', 'UL 10010-4 Part B v2.0',
            'dqr_threshold', 2.0,
            'default_refrigerant', 'R1233zd'
        )
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, caller_id, 'account_admin', 'active');

    INSERT INTO public.facility_lci_assemblies (
        organization_id,
        assembly_name,
        facility_name,
        facility_location,
        grid_mix_name,
        grid_emission_factor,
        default_refrigerant,
        pcr_standard
    ) VALUES (
        new_org_id,
        trim(org_name) || ' Primary Plant LCI Assembly',
        trim(org_name) || ' Main Facility',
        'Regional Facility',
        'US-NYUP (Upstate New York Clean Grid Mix)',
        0.165,
        'R1233zd',
        'UL 10010-4 Part B & EN 15804+A2'
    );

    UPDATE public.profiles
    SET default_org_id = new_org_id
    WHERE id = caller_id;

    RETURN new_org_id;
END;
$$;
