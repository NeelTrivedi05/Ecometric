-- Return the complete active roster for an organization to its members.
-- SECURITY DEFINER avoids profile RLS join issues while the membership check
-- keeps the result limited to the caller's organization.
CREATE OR REPLACE FUNCTION public.get_organization_team(target_org UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF NOT public.is_org_member(target_org) THEN
        RAISE EXCEPTION 'Workspace not found';
    END IF;

    RETURN QUERY
    SELECT
        member.id,
        member.user_id,
        member.role,
        member.status,
        member.created_at,
        profile.full_name,
        profile.email,
        profile.avatar_url
    FROM public.organization_members AS member
    LEFT JOIN public.profiles AS profile ON profile.id = member.user_id
    WHERE member.organization_id = target_org
      AND member.status = 'active'
    ORDER BY
        CASE member.role
            WHEN 'account_admin' THEN 0
            WHEN 'manager' THEN 1
            ELSE 2
        END,
        member.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_organization_team(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_organization_team(UUID) TO authenticated;
