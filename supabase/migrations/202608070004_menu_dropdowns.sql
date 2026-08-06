-- Generic dropdown-menu support for any menu item (not just Courses), plus draft/publish
-- and version history for the header/footer navigation, mirroring the page_templates
-- inheritance + versioning pattern (202608070003_page_templates_library.sql). `parent_id`
-- already existed on public.menus (202603130003_cms_unification.sql) and is already read by
-- the frontend - this migration adds the fields the admin UI needs to actually manage a
-- hierarchy through it, and the draft/publish + version-history machinery menus never had.

alter table public.menus
  add column if not exists icon text,
  add column if not exists description text,
  add column if not exists desktop_visible boolean not null default true,
  add column if not exists mobile_visible boolean not null default true,
  add column if not exists status text not null default 'published';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'menus_status_check'
  ) then
    alter table public.menus
      add constraint menus_status_check check (status in ('draft', 'published'));
  end if;
end $$;

-- Existing public/anon reads only ever selected is_active=true rows; requiring status=published
-- too is backward-compatible since every existing row defaults to 'published' above.
drop policy if exists menus_public_select on public.menus;
create policy menus_public_select on public.menus for select
  to anon, authenticated using (is_active = true and status = 'published');

create table if not exists public.menu_versions (
  id uuid primary key default gen_random_uuid(),
  menu_location text not null,
  snapshot jsonb not null,
  label text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists menu_versions_location_idx on public.menu_versions(menu_location, created_at desc);

alter table public.menu_versions enable row level security;

drop policy if exists menu_versions_admin_all on public.menu_versions;
create policy menu_versions_admin_all on public.menu_versions
  for all
  using (public.is_admin())
  with check (public.is_admin());
