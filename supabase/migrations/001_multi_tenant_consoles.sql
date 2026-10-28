-- =========================================================================
-- Migration: 001_multi_tenant_consoles.sql
-- Description: Production-Ready Multi-Tenant Architecture & Account Admin Isolation
-- Project: EcoMetric LCA & EPD Studio
-- Standards: ISO 14025, EN 15804+A2, UL 10010-4 Part B
-- =========================================================================

-- Enable core extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------------------------------------------------------
-- 1. CORE TENANT TABLES
-- -------------------------------------------------------------------------

-- 1.1 Organizations (Tenants)
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

-- Ensure slug & settings columns exist if organizations table was created before
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN slug TEXT;
        -- Populate slug from name for existing records
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

-- 1.2 User Profiles with Default Organization Pointer
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    default_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Organization Members (Multi-Tenant Membership & RBAC)
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

-- Harmonize organization_members columns, roles, and status checks
DO $$
BEGIN
    -- Ensure id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- Drop old constraints if they exist
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_status_check;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS chk_org_member_role;
    ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS chk_org_member_status;

    -- Migrate legacy role values ('admin' -> 'account_admin', 'employee' -> 'member')
    UPDATE public.organization_members SET role = 'account_admin' WHERE role = 'admin';
    UPDATE public.organization_members SET role = 'member' WHERE role = 'employee';

    -- Add standard check constraints
    ALTER TABLE public.organization_members 
        ADD CONSTRAINT chk_org_member_role CHECK (role IN ('account_admin', 'manager', 'member'));
    ALTER TABLE public.organization_members 
        ADD CONSTRAINT chk_org_member_status CHECK (status IN ('active', 'invited', 'suspended'));
END $$;

-- 1.4 Organization Invites (Pending Invitations)
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

-- Migrate legacy organization_invitations if present
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
-- 2. DOMAIN TABLE ADAPTATION (ECOMETRIC LCA & EPD STUDIO)
-- -------------------------------------------------------------------------

-- 2.1 Projects: Industrial Chiller & Heat Pump LCA Assessments
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

-- 2.2 Technical Data: Engineering & Thermodynamic Balance
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

-- 2.3 Results: LCIA Impact Matrices
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

-- 2.4 Reports: Type III Environmental Product Declarations
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

-- 2.5 Facility LCI Assemblies: Regional Electricity Grid Mix & LCI Configurations
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
-- 3. HIGH-PERFORMANCE TENANT & LOOKUP INDEXES
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
-- Drop old functions with CASCADE to safely clear parameter name mismatch and dependent policies
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

-- Grant permissions
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

-- Enable RLS across all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_lci_assemblies ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DROP POLICY IF EXISTS "org_members_select" ON public.organizations;
DROP POLICY IF EXISTS "org_admins_update" ON public.organizations;
DROP POLICY IF EXISTS "org_admins_delete" ON public.organizations;
DROP POLICY IF EXISTS "org_authenticated_insert" ON public.organizations;
DROP POLICY IF EXISTS "members can read their organization" ON public.organizations;
DROP POLICY IF EXISTS "admins update their organization" ON public.organizations;

DROP POLICY IF EXISTS "profiles_select_own_or_colleagues" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

DROP POLICY IF EXISTS "members_select_own_orgs" ON public.organization_members;
DROP POLICY IF EXISTS "admins_insert_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins_update_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins_delete_members" ON public.organization_members;
DROP POLICY IF EXISTS "admins manage members" ON public.organization_members;
DROP POLICY IF EXISTS "members can read own membership" ON public.organization_members;

DROP POLICY IF EXISTS "invites_select_admin_or_invitee" ON public.organization_invites;
DROP POLICY IF EXISTS "admins_manage_invites" ON public.organization_invites;

DROP POLICY IF EXISTS "projects_select_org" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_org" ON public.projects;
DROP POLICY IF EXISTS "projects_update_org" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_org_admin" ON public.projects;

DROP POLICY IF EXISTS "technical_data_select_org" ON public.technical_data;
DROP POLICY IF EXISTS "technical_data_manage_org" ON public.technical_data;

DROP POLICY IF EXISTS "results_select_org" ON public.results;
DROP POLICY IF EXISTS "results_manage_org" ON public.results;

DROP POLICY IF EXISTS "reports_select_org" ON public.reports;
DROP POLICY IF EXISTS "reports_manage_org" ON public.reports;

DROP POLICY IF EXISTS "facility_assemblies_select_org" ON public.facility_lci_assemblies;
DROP POLICY IF EXISTS "facility_assemblies_manage_admin" ON public.facility_lci_assemblies;

-- 5.1 Organizations Policies
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

-- 5.2 Profiles Policies
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

-- 5.3 Organization Members Policies
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

-- 5.4 Organization Invites Policies
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

-- 5.5 Domain Table: Projects Policies
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

-- 5.6 Domain Table: Technical Data Policies
CREATE POLICY "technical_data_select_org"
ON public.technical_data FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "technical_data_manage_org"
ON public.technical_data FOR ALL
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()))
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

-- 5.7 Domain Table: Results Policies
CREATE POLICY "results_select_org"
ON public.results FOR SELECT
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "results_manage_org"
ON public.results FOR ALL
TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids()))
WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));

-- 5.8 Domain Table: Reports Policies
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

-- 5.9 Domain Table: Facility LCI Assemblies Policies
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
-- 6. ATOMIC ONBOARDING RPC & SIGNUP TRIGGER
-- -------------------------------------------------------------------------

-- 6.1 RPC to create a new organization and assign caller as account_admin
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

GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(TEXT, TEXT) TO authenticated;

-- 6.2 Trigger on auth.users: Profile auto-creation, Org Onboarding, & Invite Acceptance
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_created();

-- -------------------------------------------------------------------------
-- 7. STORAGE ROW LEVEL SECURITY (EPD ARTIFACTS & ORG MEDIA)
-- -------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('epd-artifacts', 'epd-artifacts', false)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO storage.buckets (id, name, public)
        VALUES ('organization-assets', 'organization-assets', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DROP POLICY IF EXISTS "epd_artifacts_tenant_select" ON storage.objects;
        DROP POLICY IF EXISTS "epd_artifacts_tenant_insert" ON storage.objects;
        DROP POLICY IF EXISTS "epd_artifacts_tenant_delete" ON storage.objects;

        CREATE POLICY "epd_artifacts_tenant_select"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
            bucket_id IN ('epd-artifacts', 'organization-assets') AND
            ((storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids()))
        );

        CREATE POLICY "epd_artifacts_tenant_insert"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id IN ('epd-artifacts', 'organization-assets') AND
            ((storage.foldername(name))[1]::uuid IN (SELECT public.get_user_org_ids()))
        );

        CREATE POLICY "epd_artifacts_tenant_delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id IN ('epd-artifacts', 'organization-assets') AND
            (public.is_org_admin((storage.foldername(name))[1]::uuid))
        );
    END IF;
END $$;
