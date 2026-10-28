-- =========================================================================
-- EcoMetric Complete Multi-Tenant Supabase Schema
-- Includes Core Tenants, Profiles, RBAC, Domain Tables, RLS, & Storage
-- =========================================================================

-- Enable core extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------------------------------------------------------
-- 1. CORE TENANT TABLES
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN slug TEXT;
        UPDATE public.organizations 
        SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')) || '-' || substring(id::text, 1, 8)
        WHERE slug IS NULL;
        ALTER TABLE public.organizations ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE public.organizations ADD CONSTRAINT uq_organizations_slug UNIQUE (slug);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'settings'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN settings JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    default_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_status_check;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS chk_org_member_role;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS chk_org_member_status;

    UPDATE public.organization_members SET role = 'account_admin' WHERE role = 'admin';
    UPDATE public.organization_members SET role = 'member' WHERE role = 'employee';

    ALTER TABLE public.organization_members 
        ADD CONSTRAINT chk_org_member_role CHECK (role IN ('account_admin', 'manager', 'member'));
    ALTER TABLE public.organization_members 
        ADD CONSTRAINT chk_org_member_status CHECK (status IN ('active', 'invited', 'suspended'));
END $$;

CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('account_admin', 'manager', 'member')),
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_invite_email UNIQUE (organization_id, email)
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_invitations') THEN
        INSERT INTO public.organization_invites (organization_id, email, role, invited_by, accepted_at, created_at)
        SELECT organization_id, email, 
               CASE WHEN role = 'admin' THEN 'account_admin' ELSE 'member' END,
               invited_by, accepted_at, created_at
        FROM public.organization_invitations
        ON CONFLICT (organization_id, email) DO NOTHING;
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 2. DOMAIN TABLES (ECOMETRIC LCA & EPD STUDIO)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    product_category TEXT NOT NULL DEFAULT 'water_cooled_chiller',
    product_model TEXT,
    pcr_ref TEXT NOT NULL DEFAULT 'UL 10010-4 Part B v2.0 2018',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CALCULATED', 'REPORTED', 'VERIFIED')),
    capacity_rt DOUBLE PRECISION DEFAULT 500.0,
    refrigerant TEXT DEFAULT 'R1233zd',
    refrigerant_charge_kg DOUBLE PRECISION DEFAULT 320.0,
    functional_unit TEXT DEFAULT '1 ton of chilling capacity over 25 years reference service life',
    declared_unit TEXT DEFAULT '1 complete chiller unit',
    facility TEXT DEFAULT 'Primary Manufacturing Facility',
    epd_number TEXT,
    gwp_total DOUBLE PRECISION DEFAULT 0.0,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.technical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    chilling_capacity_rt DOUBLE PRECISION DEFAULT 500.0,
    chilling_capacity_kw DOUBLE PRECISION DEFAULT 1758.4,
    refrigerant_type TEXT DEFAULT 'R1233zd',
    refrigerant_charge_kg DOUBLE PRECISION DEFAULT 320.0,
    mass_delivered_kg DOUBLE PRECISION DEFAULT 3470.0,
    conversion_factor_kg_per_ton DOUBLE PRECISION DEFAULT 6.94,
    pressure_drop_ft DOUBLE PRECISION DEFAULT 15.0,
    pressure_drop_kpa DOUBLE PRECISION DEFAULT 44.835,
    energy_efficiency_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'technical_data' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.technical_data ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    impact_category TEXT NOT NULL DEFAULT 'GWP-total',
    methodology TEXT NOT NULL DEFAULT 'TRACI 2.1',
    unit TEXT NOT NULL DEFAULT 'kg CO2e',
    value DOUBLE PRECISION NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.results ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    epd_number TEXT,
    title TEXT NOT NULL,
    pdf_url TEXT,
    version TEXT DEFAULT '1.0',
    disclaimer_text_snapshot TEXT,
    sha256_hash TEXT,
    dqr_score DOUBLE PRECISION,
    pcr_standard TEXT,
    program_operator TEXT,
    verifier TEXT,
    verifier_org TEXT,
    status TEXT DEFAULT 'Draft',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.reports ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.facility_lci_assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assembly_name TEXT NOT NULL,
    facility_name TEXT NOT NULL,
    facility_location TEXT,
    grid_mix_name TEXT DEFAULT 'US-NYUP (Upstate New York Clean Grid Mix)',
    grid_emission_factor DOUBLE PRECISION DEFAULT 0.165,
    grid_provider_id TEXT DEFAULT 'ecoinvent_elec_mv_us',
    fuel_mix_name TEXT DEFAULT 'Clean Natural Gas Cogeneration',
    gas_emission_factor DOUBLE PRECISION DEFAULT 0.048,
    water_provider_id TEXT DEFAULT 'ecoinvent_water_deionised_glo',
    default_refrigerant TEXT DEFAULT 'R1233zd',
    background_database TEXT DEFAULT 'ecoinvent v3.12 Cut-Off',
    sha256_hash TEXT,
    dqr_score DOUBLE PRECISION DEFAULT 1.28,
    pcr_standard TEXT DEFAULT 'UL 10010-4 Part B & EN 15804+A2',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 3. INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_default_org ON public.profiles(default_org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role_status ON public.organization_members(organization_id, role, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_technical_data_org_id ON public.technical_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_results_org_id ON public.results(organization_id);
CREATE INDEX IF NOT EXISTS idx_results_proj_id ON public.results(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON public.reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_proj_id ON public.reports(project_id);
CREATE INDEX IF NOT EXISTS idx_facility_assemblies_org_id ON public.facility_lci_assemblies(organization_id);

-- -------------------------------------------------------------------------
-- 4. NON-RECURSIVE SECURITY DEFINER RLS HELPER FUNCTIONS
-- -------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_org_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_manager_or_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_org_ids() CASCADE;
DROP FUNCTION IF EXISTS public.account_exists(text) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = target_org
          AND user_id = auth.uid()
          AND role = 'account_admin'
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_manager_or_admin(target_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = target_org
          AND user_id = auth.uid()
          AND role IN ('account_admin', 'manager')
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = target_org
          AND user_id = auth.uid()
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.account_exists(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(user_email))
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_org_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_manager_or_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_org_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.account_exists(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_manager_or_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.account_exists(text) TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_lci_assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select"
ON public.organizations FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "org_admins_update"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));

CREATE POLICY "org_admins_delete"
ON public.organizations FOR DELETE
TO authenticated
USING (public.is_org_admin(id));

CREATE POLICY "org_authenticated_insert"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "profiles_select_own_or_colleagues"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    id IN (
        SELECT m.user_id 
        FROM public.organization_members m
        WHERE m.organization_id IN (SELECT public.get_user_org_ids())
          AND m.status = 'active'
    )
);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "members_select_own_orgs"
ON public.organization_members FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()) OR user_id = auth.uid());

CREATE POLICY "admins_insert_members"
ON public.organization_members FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "admins_update_members"
ON public.organization_members FOR UPDATE
TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "admins_delete_members"
ON public.organization_members FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

CREATE POLICY "invites_select_admin_or_invitee"
ON public.organization_invites FOR SELECT
TO authenticated
USING (
    public.is_org_admin(organization_id) OR 
    lower(email) = lower(auth.jwt()->>'email')
);

CREATE POLICY "admins_manage_invites"
ON public.organization_invites FOR ALL
TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "projects_select_org"
ON public.projects FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "projects_insert_org"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "projects_update_org"
ON public.projects FOR UPDATE
TO authenticated
USING (
    public.is_org_manager_or_admin(organization_id) OR 
    (organization_id IN (SELECT public.get_user_org_ids()) AND user_id = auth.uid())
)
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "projects_delete_org_admin"
ON public.projects FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id));

CREATE POLICY "technical_data_select_org"
ON public.technical_data FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "technical_data_manage_org"
ON public.technical_data FOR ALL
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()))
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "results_select_org"
ON public.results FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "results_manage_org"
ON public.results FOR ALL
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()))
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "reports_select_org"
ON public.reports FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "reports_manage_org"
ON public.reports FOR ALL
TO authenticated
USING (
    public.is_org_manager_or_admin(organization_id) OR
    (organization_id IN (SELECT public.get_user_org_ids()) AND public.is_org_admin(organization_id))
)
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "facility_assemblies_select_org"
ON public.facility_lci_assemblies FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "facility_assemblies_manage_admin"
ON public.facility_lci_assemblies FOR ALL
TO authenticated
USING (public.is_org_admin(organization_id))
WITH CHECK (public.is_org_admin(organization_id));

-- -------------------------------------------------------------------------
-- 6. RPC & ONBOARDING TRIGGERS
-- -------------------------------------------------------------------------
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
    VALUES (new_org_id, caller_id, 'account_admin', 'active')
    ON CONFLICT (organization_id, user_id) 
    DO UPDATE SET role = 'account_admin', status = 'active';

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
BEGIN
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

    org_title := trim(coalesce(new.raw_user_meta_data->>'organization_name', ''));

    IF org_title <> '' THEN
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
        VALUES (new_org_id, new.id, 'account_admin', 'active');

        UPDATE public.profiles SET default_org_id = new_org_id WHERE id = new.id;
    ELSE
        FOR invite_record IN 
            SELECT * FROM public.organization_invites 
            WHERE lower(email) = lower(new.email) AND accepted_at IS NULL AND expires_at > now()
        LOOP
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
    END IF;

    RETURN new;
END;
$$;

-- Function to bootstrap an organization for an existing authenticated user if none exists
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_created();

-- -------------------------------------------------------------------------
-- 7. SUPABASE PURE INVITATIONS & ACCESS CONTROL FUNCTIONS
-- -------------------------------------------------------------------------
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

    IF target_org_id IS NULL THEN
        SELECT organization_id INTO target_org_id
        FROM public.organization_members
        WHERE user_id = caller_id AND role = 'account_admin' AND status = 'active'
        LIMIT 1;
    END IF;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'Target organization not specified or caller is not an admin';
    END IF;

    IF NOT public.is_org_admin(target_org_id) THEN
        RAISE EXCEPTION 'Forbidden: Only Account Admins have permission to invite members to this organization';
    END IF;

    norm_email := lower(trim(p_email));
    IF norm_email = '' OR norm_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'Invalid email address provided';
    END IF;

    IF p_role NOT IN ('account_admin', 'manager', 'member') THEN
        p_role := 'member';
    END IF;

    gen_token := encode(gen_random_bytes(24), 'hex');

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

    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE lower(email) = norm_email;

    IF existing_user_id IS NOT NULL THEN
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

    SELECT * INTO inv_record
    FROM public.organization_invites
    WHERE token = p_token AND accepted_at IS NULL AND expires_at > now();

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

    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (inv_record.organization_id, caller_id, inv_record.role, 'active')
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET role = EXCLUDED.role, status = 'active';

    UPDATE public.organization_invites
    SET accepted_at = now()
    WHERE id = inv_record.id;

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
