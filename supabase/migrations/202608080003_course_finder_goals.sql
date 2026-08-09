-- Goal-Based Course Finder: admin-managed goal -> recommended-courses mapping. A single small
-- table (not a new complex schema) since the requirement is just "goal, description, icon,
-- recommended courses, priority, visibility" - a flat CRUD entity fits cleanly using the same
-- generic EntityCrudManager pattern already used for testimonials/companies/placements.

create table if not exists public.course_finder_goals (
  id uuid primary key default gen_random_uuid(),
  goal text not null,
  description text,
  icon text,
  course_slugs jsonb not null default '[]'::jsonb,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_finder_goals enable row level security;
drop policy if exists "course_finder_goals_public_read" on public.course_finder_goals;
create policy "course_finder_goals_public_read" on public.course_finder_goals for select using (is_active = true);
drop policy if exists "course_finder_goals_service_role_all" on public.course_finder_goals;
create policy "course_finder_goals_service_role_all" on public.course_finder_goals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
