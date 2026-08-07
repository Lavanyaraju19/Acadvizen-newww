-- Phase 7: real interactive learner map data. No rows are seeded here on purpose - the prompt
-- driving this work explicitly forbids inventing learner totals, and no verified enrollment-count
-- source exists in this schema yet. The table exists so an admin can enter real, CMS-managed
-- counts; the public map renders nothing until at least one active point exists.

create table if not exists public.learner_map_points (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  country text not null default 'India',
  state text,
  city_id uuid references public.cities(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  latitude numeric not null,
  longitude numeric not null,
  learner_count integer,
  growth_percent numeric,
  representative_image text,
  course_id uuid references public.courses(id) on delete set null,
  cta_label text,
  cta_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learner_map_points_city_id_idx on public.learner_map_points(city_id);
create index if not exists learner_map_points_location_id_idx on public.learner_map_points(location_id);

alter table public.learner_map_points enable row level security;
drop policy if exists "learner_map_points_public_read" on public.learner_map_points;
create policy "learner_map_points_public_read" on public.learner_map_points for select using (is_active = true);
drop policy if exists "learner_map_points_service_role_all" on public.learner_map_points;
create policy "learner_map_points_service_role_all" on public.learner_map_points for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
