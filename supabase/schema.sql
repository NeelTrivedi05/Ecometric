create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'employee' check (role = 'employee'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create or replace function public.bootstrap_organization()
returns trigger language plpgsql security definer set search_path = public
as $$
declare organization_id uuid;
begin
  if coalesce(trim(new.raw_user_meta_data->>'organization_name'), '') <> '' then
    insert into public.organizations (name, created_by)
    values (trim(new.raw_user_meta_data->>'organization_name'), new.id)
    returning id into organization_id;
    insert into public.organization_members (organization_id, user_id, role)
    values (organization_id, new.id, 'admin');
  else
    insert into public.organization_members (organization_id, user_id, role)
    select oi.organization_id, new.id, 'employee'
    from public.organization_invitations oi
    where lower(oi.email) = lower(new.email) and oi.accepted_at is null
    on conflict (organization_id, user_id) do nothing;
    update public.organization_invitations
    set accepted_at = now()
    where lower(email) = lower(new.email) and accepted_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.bootstrap_organization();

create or replace function public.bootstrap_current_user()
returns void language plpgsql security definer set search_path = public
as $$
declare organization_id uuid;
begin
  if auth.uid() is null or coalesce(trim((select raw_user_meta_data->>'organization_name' from auth.users where id = auth.uid())), '') = '' then
    return;
  end if;
  if exists (select 1 from public.organization_members where user_id = auth.uid()) then
    return;
  end if;
  insert into public.organizations (name, created_by)
  select trim(raw_user_meta_data->>'organization_name'), id
  from auth.users
  where id = auth.uid()
  returning id into organization_id;
  insert into public.organization_members (organization_id, user_id, role)
  values (organization_id, auth.uid(), 'admin');
end;
$$;

create or replace function public.account_exists(user_email text)
returns boolean language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(user_email))
  );
$$;

revoke all on function public.account_exists(text) from public;
grant execute on function public.account_exists(text) to anon, authenticated;

drop policy if exists "members can read their organization" on public.organizations;
drop policy if exists "admins update their organization" on public.organizations;
drop policy if exists "admins manage members" on public.organization_members;
drop policy if exists "members can read own membership" on public.organization_members;
drop policy if exists "admins manage invitations" on public.organization_invitations;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

create or replace function public.is_org_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create policy "members can read their organization"
on public.organizations for select using (
  exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = auth.uid() and m.status = 'active')
);
create policy "admins update their organization"
on public.organizations for update using (public.is_org_admin(id))
with check (public.is_org_admin(id));
create policy "admins manage members"
on public.organization_members for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));
create policy "members can read own membership"
on public.organization_members for select using (user_id = auth.uid());
create policy "admins manage invitations"
on public.organization_invitations for all using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));
