-- Extends the admin-managed "extra sections" capability (previously City-only, via
-- city_page_sections) to Locations/Areas, and adds an insertion-zone anchor so admin blocks can
-- be placed between existing fixed sections rather than only appended at the very end.
--
-- Additive and idempotent only - does not touch page_sections/sections (generic Page Builder) or
-- any existing city_pages/locations columns.

alter table public.city_page_sections
  add column if not exists position text not null default 'end';

create table if not exists public.location_sections (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  type text not null,
  order_index int not null default 0,
  position text not null default 'end',
  content_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  visibility boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_location_sections_order on public.location_sections (location_id, position, order_index);

drop trigger if exists set_location_sections_updated_at on public.location_sections;
create trigger set_location_sections_updated_at
before update on public.location_sections
for each row execute function public.set_updated_at();

alter table public.location_sections enable row level security;

drop policy if exists "location_sections_public_select" on public.location_sections;
create policy "location_sections_public_select"
on public.location_sections for select
using (
  coalesce(visibility, true) = true
  and exists (
    select 1 from public.locations loc
    where loc.id = location_sections.location_id
    and loc.is_active = true
  )
);

drop policy if exists "location_sections_admin_all" on public.location_sections;
create policy "location_sections_admin_all"
on public.location_sections for all
using (is_admin())
with check (is_admin());
