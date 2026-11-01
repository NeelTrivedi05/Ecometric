-- Allow authenticated members to see the profile details of active colleagues
-- in organizations they belong to. This powers the team roster without
-- exposing profiles outside the member's organization.
DROP POLICY IF EXISTS profiles_select_own_or_colleagues ON public.profiles;
CREATE POLICY profiles_select_own_or_colleagues
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR id IN (
        SELECT member.user_id
        FROM public.organization_members AS member
        WHERE member.organization_id IN (SELECT public.get_user_org_ids())
          AND member.status = 'active'
    )
);
