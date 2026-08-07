-- Extends the existing `courses` table and adds `course_categories` for a real Course CMS, per
-- the "Phase 2 - Course CMS" spec. Purely additive: every new column is nullable or has a safe
-- default, so existing rows and existing admin/API code (app/api/cms/entities/courses via
-- lib/cmsEntities.js) keep working unchanged. The existing free-text `duration` column is left
-- untouched (still used for display like "6 Months") - `duration_value`/`duration_unit` are new,
-- optional, structured fields for pages that want a numeric duration instead.

create table if not exists public.course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  menu_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_categories_slug_idx on public.course_categories(slug);

alter table public.courses add column if not exists category_id uuid references public.course_categories(id) on delete set null;
alter table public.courses add column if not exists subtitle text;
alter table public.courses add column if not exists short_title text;
alter table public.courses add column if not exists duration_value numeric;
alter table public.courses add column if not exists duration_unit text;
alter table public.courses add column if not exists learning_mode text;
alter table public.courses add column if not exists delivery_modes jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists learning_hours integer;
alter table public.courses add column if not exists projects_count integer;
alter table public.courses add column if not exists case_studies_count integer;
alter table public.courses add column if not exists ai_tools_count integer;
alter table public.courses add column if not exists certification_count integer;
alter table public.courses add column if not exists internship boolean not null default false;
alter table public.courses add column if not exists placement_support boolean not null default false;
alter table public.courses add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists curriculum jsonb not null default '[]'::jsonb;
alter table public.courses add column if not exists icon text;
alter table public.courses add column if not exists brochure_url text;
alter table public.courses add column if not exists primary_cta_label text;
alter table public.courses add column if not exists primary_cta_url text;
alter table public.courses add column if not exists secondary_cta_label text;
alter table public.courses add column if not exists secondary_cta_url text;
alter table public.courses add column if not exists badge text;

create index if not exists courses_category_id_idx on public.courses(category_id);

-- `order_index` is NOT NULL with no database default, which meant creating a brand-new course
-- through the generic admin form (no explicit order_index typed in) failed with a not-null
-- violation - a real, pre-existing bug surfaced while testing this Course CMS extension, not
-- something introduced by it. Giving it a default fixes the root cause for every caller, not just
-- the admin UI (which also now defaults the field to 0).
alter table public.courses alter column order_index set default 0;

-- course <-> city/area relationships ("AI Integrated Digital Marketing -> Bangalore -> JP Nagar")
create table if not exists public.course_locations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint course_locations_has_target check (city_id is not null or location_id is not null)
);

create index if not exists course_locations_course_id_idx on public.course_locations(course_id);
create index if not exists course_locations_city_id_idx on public.course_locations(city_id);
create index if not exists course_locations_location_id_idx on public.course_locations(location_id);

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'course_locations_unique_pair'
  ) then
    execute 'create unique index course_locations_unique_pair on public.course_locations (course_id, coalesce(city_id, ''00000000-0000-0000-0000-000000000000''::uuid), coalesce(location_id, ''00000000-0000-0000-0000-000000000000''::uuid))';
  end if;
end $$;

alter table public.course_categories enable row level security;
drop policy if exists "course_categories_public_read" on public.course_categories;
create policy "course_categories_public_read" on public.course_categories for select using (is_active = true);
drop policy if exists "course_categories_service_role_all" on public.course_categories;
create policy "course_categories_service_role_all" on public.course_categories for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.course_locations enable row level security;
drop policy if exists "course_locations_public_read" on public.course_locations;
create policy "course_locations_public_read" on public.course_locations for select using (true);
drop policy if exists "course_locations_service_role_all" on public.course_locations;
create policy "course_locations_service_role_all" on public.course_locations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into public.course_categories (name, slug, description, order_index)
select 'Flagship Programs', 'flagship-programs', 'Our core, longest-duration career programs.', 0
where not exists (select 1 from public.course_categories where slug = 'flagship-programs');

insert into public.course_categories (name, slug, description, order_index)
select 'Career Programs', 'career-programs', 'Focused programs for a specific career track.', 1
where not exists (select 1 from public.course_categories where slug = 'career-programs');

insert into public.course_categories (name, slug, description, order_index)
select 'Specialist Courses', 'specialist-courses', 'Short, skill-specific courses.', 2
where not exists (select 1 from public.course_categories where slug = 'specialist-courses');

insert into public.course_categories (name, slug, description, order_index)
select 'Certification Courses', 'certification-courses', 'Certification-focused short courses.', 3
where not exists (select 1 from public.course_categories where slug = 'certification-courses');
