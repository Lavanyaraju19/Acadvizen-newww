-- Harden RBAC helpers and close public draft-privacy gaps without rewriting older migrations.

create or replace function public.user_role_slugs(p_user_id uuid default auth.uid())
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array(
      select distinct lower(r.slug)
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.slug is not null
    ),
    '{}'::text[]
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('super_admin', 'admin')
  )
  or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(coalesce(r.slug, '')) in ('super_admin', 'admin')
  );
$$;

create or replace function public.can_access_cms()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in (
        'super_admin',
        'admin',
        'editor',
        'author',
        'reviewer',
        'viewer',
        'seo_manager',
        'content_writer'
      )
  )
  or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(coalesce(r.slug, '')) in (
        'super_admin',
        'admin',
        'editor',
        'author',
        'reviewer',
        'viewer',
        'seo_manager',
        'content_writer'
      )
  );
$$;

create or replace function public.has_permission(user_id uuid, permission text, action text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized_permission text := lower(coalesce(permission, ''));
  normalized_action text := lower(coalesce(action, ''));
begin
  if normalized_permission = '' or normalized_action = '' then
    return false;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and lower(coalesce(p.role, '')) in ('super_admin', 'admin')
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = user_id
      and (
        (r.permissions -> normalized_permission) ? normalized_action
        or (r.permissions -> normalized_permission) ? '*'
        or (r.permissions -> '*') ? normalized_action
        or (r.permissions -> '*') ? '*'
      )
  );
end;
$$;

alter table if exists public.roles enable row level security;
drop policy if exists "roles_cms_read" on public.roles;
create policy "roles_cms_read"
on public.roles for select
to authenticated
using (public.can_access_cms());

alter table if exists public.user_roles enable row level security;
drop policy if exists "user_roles_self_select" on public.user_roles;
create policy "user_roles_self_select"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

alter table if exists public.page_sections enable row level security;
drop policy if exists "page_sections_public_select" on public.page_sections;
create policy "page_sections_public_select"
on public.page_sections for select
to anon, authenticated
using (coalesce(is_active, true) = true);

alter table if exists public.sections enable row level security;
drop policy if exists "sections_public_select" on public.sections;
create policy "sections_public_select"
on public.sections for select
to anon, authenticated
using (
  coalesce(visibility, true) = true
  and exists (
    select 1
    from public.pages p
    where p.id = sections.page_id
      and p.status = 'published'
  )
);

alter table if exists public.blog_content_blocks enable row level security;
drop policy if exists "blog_content_blocks_public_select" on public.blog_content_blocks;
create policy "blog_content_blocks_public_select"
on public.blog_content_blocks for select
to anon, authenticated
using (
  exists (
    select 1
    from public.blogs b
    where b.id = blog_content_blocks.blog_id
      and b.status = 'published'
  )
);
