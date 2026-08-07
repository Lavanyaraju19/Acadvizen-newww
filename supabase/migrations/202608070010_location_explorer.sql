-- Phase 6: Location Explorer - a reusable, admin-curated location directory block (original
-- Acadvizen design, not a copy of any competitor's plain-text location link list). A group is one
-- curated set of areas (optionally scoped to a single city) that an admin can insert as a
-- page-builder block anywhere; the same group can be reused across multiple pages, similar in
-- spirit to reusable_sections but specific to location data instead of arbitrary HTML.

create table if not exists public.location_explorer_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  city_id uuid references public.cities(id) on delete set null,
  variant text not null default 'explorer' check (variant in ('explorer', 'constellation', 'index', 'grid')),
  heading text,
  subheading text,
  cta_label text,
  cta_url text,
  is_active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists location_explorer_groups_city_id_idx on public.location_explorer_groups(city_id);

create table if not exists public.location_explorer_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.location_explorer_groups(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  custom_label text,
  custom_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint location_explorer_items_has_target check (location_id is not null or custom_url is not null)
);

create index if not exists location_explorer_items_group_id_idx on public.location_explorer_items(group_id);
create index if not exists location_explorer_items_location_id_idx on public.location_explorer_items(location_id);

alter table public.location_explorer_groups enable row level security;
drop policy if exists "location_explorer_groups_public_read" on public.location_explorer_groups;
create policy "location_explorer_groups_public_read" on public.location_explorer_groups for select using (is_active = true);
drop policy if exists "location_explorer_groups_service_role_all" on public.location_explorer_groups;
create policy "location_explorer_groups_service_role_all" on public.location_explorer_groups for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.location_explorer_items enable row level security;
drop policy if exists "location_explorer_items_public_read" on public.location_explorer_items;
create policy "location_explorer_items_public_read" on public.location_explorer_items for select using (is_active = true);
drop policy if exists "location_explorer_items_service_role_all" on public.location_explorer_items;
create policy "location_explorer_items_service_role_all" on public.location_explorer_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
