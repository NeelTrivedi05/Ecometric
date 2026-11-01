-- Workspace ownership, subscription entitlements, and usage reservations.
-- Apply after the existing multi-tenant migrations on a staging database first.

ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

UPDATE public.organizations o
SET owner_user_id = m.user_id
FROM public.organization_members m
WHERE m.organization_id = o.id
  AND m.role = 'account_admin'
  AND m.status = 'active'
  AND o.owner_user_id IS NULL;

ALTER TABLE public.organizations
    ALTER COLUMN slug SET NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_organization_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.slug IS DISTINCT FROM OLD.slug THEN
        RAISE EXCEPTION 'Workspace slugs are immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_slug_immutable ON public.organizations;
CREATE TRIGGER organizations_slug_immutable
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_slug_change();

CREATE TABLE IF NOT EXISTS public.plans (
    code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    epd_quota INTEGER NOT NULL CHECK (epd_quota >= 0),
    quota_period TEXT NOT NULL DEFAULT 'month' CHECK (quota_period = 'month'),
    stripe_price_id TEXT UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.plans (code, display_name, epd_quota, quota_period, sort_order)
VALUES
    ('free', 'Free', 1, 'month', 0),
    ('pro', 'Studio', 10, 'month', 1),
    ('business', 'Business', 100, 'month', 2)
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    epd_quota = EXCLUDED.epd_quota,
    quota_period = EXCLUDED.quota_period,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.subscriptions (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL REFERENCES public.plans(code),
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    pending_plan_code TEXT REFERENCES public.plans(code),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscriptions (organization_id, plan_code)
SELECT id, 'free'
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind = 'epd_created'),
    epd_id UUID,
    status TEXT NOT NULL CHECK (status IN ('reserved', 'committed', 'released')),
    idempotency_key TEXT NOT NULL UNIQUE,
    period_start DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    committed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.stripe_events (
    stripe_event_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    error TEXT
);

CREATE OR REPLACE FUNCTION public.workspace_slug_is_reserved(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT lower(candidate) = ANY (ARRAY[
        'login', 'signup', 'api', 'settings', 'pricing', 'verify', 'auth',
        'admin', 'billing', '_next', 'static', 'console', 'app', 'projects'
    ]);
$$;

CREATE OR REPLACE FUNCTION public.ensure_workspace()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id UUID := auth.uid();
    workspace_id UUID;
    base_slug TEXT;
    candidate_slug TEXT;
    suffix TEXT;
    display_name TEXT;
BEGIN
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT organization_id INTO workspace_id
    FROM public.organization_members
    WHERE user_id = caller_id AND role = 'account_admin' AND status = 'active'
    ORDER BY created_at
    LIMIT 1;
    IF workspace_id IS NOT NULL THEN
        RETURN workspace_id;
    END IF;

    display_name := COALESCE(
        NULLIF(trim((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = caller_id)), ''),
        split_part((SELECT email FROM auth.users WHERE id = caller_id), '@', 1),
        'EcoMetric Workspace'
    );
    base_slug := lower(regexp_replace(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'));
    IF base_slug = '' OR public.workspace_slug_is_reserved(base_slug) THEN
        base_slug := 'workspace';
    END IF;
    suffix := substring(encode(gen_random_bytes(3), 'hex') FROM 1 FOR 6);
    candidate_slug := base_slug || '-' || suffix;

    INSERT INTO public.organizations (name, slug, owner_user_id, created_by)
    VALUES (display_name, candidate_slug, caller_id, caller_id)
    RETURNING id INTO workspace_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (workspace_id, caller_id, 'account_admin', 'active');
    INSERT INTO public.profiles (id, email, full_name, default_org_id)
    SELECT caller_id, email, raw_user_meta_data->>'full_name', workspace_id
    FROM auth.users WHERE id = caller_id
    ON CONFLICT (id) DO UPDATE SET default_org_id = EXCLUDED.default_org_id;
    INSERT INTO public.subscriptions (organization_id, plan_code)
    VALUES (workspace_id, 'free');
    RETURN workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_workspace() TO authenticated;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_read_active ON public.plans;
CREATE POLICY plans_read_active ON public.plans FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS subscriptions_read_member ON public.subscriptions;
CREATE POLICY subscriptions_read_member ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS usage_events_read_member ON public.usage_events;
CREATE POLICY usage_events_read_member ON public.usage_events FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));

REVOKE INSERT, UPDATE, DELETE ON public.subscriptions, public.usage_events, public.stripe_events FROM authenticated, anon;
REVOKE INSERT ON public.organizations FROM authenticated;

CREATE OR REPLACE FUNCTION public.reserve_epd_usage(
    target_org UUID,
    reservation_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active_plan public.plans%ROWTYPE;
    subscription_row public.subscriptions%ROWTYPE;
    period_begin DATE := date_trunc('month', now())::date;
    used_count INTEGER;
BEGIN
    IF NOT public.is_org_member(target_org) THEN
        RAISE EXCEPTION 'Workspace not found';
    END IF;
    IF trim(coalesce(reservation_key, '')) = '' THEN
        RAISE EXCEPTION 'Reservation key is required';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(target_org::text || period_begin::text, 0));

    SELECT * INTO subscription_row
    FROM public.subscriptions
    WHERE organization_id = target_org
    FOR UPDATE;
    IF NOT FOUND OR subscription_row.status NOT IN ('active', 'trialing') THEN
        RAISE EXCEPTION 'Workspace subscription is not active';
    END IF;

    SELECT * INTO active_plan FROM public.plans WHERE code = subscription_row.plan_code AND active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workspace plan is unavailable';
    END IF;

    SELECT count(*) INTO used_count
    FROM public.usage_events
    WHERE organization_id = target_org
      AND period_start = period_begin
      AND kind = 'epd_created'
      AND status IN ('reserved', 'committed');

    IF used_count >= active_plan.epd_quota THEN
        RAISE EXCEPTION 'EPD quota exceeded';
    END IF;

    INSERT INTO public.usage_events (
        organization_id, kind, status, idempotency_key, period_start
    ) VALUES (
        target_org, 'epd_created', 'reserved', reservation_key, period_begin
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
        'organization_id', target_org,
        'plan_code', active_plan.code,
        'quota', active_plan.epd_quota,
        'used', used_count + 1,
        'period_start', period_begin
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_epd_usage(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_epd_usage(UUID, TEXT) TO authenticated;
