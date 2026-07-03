-- Fix database schema to match CMS entity configurations
-- This migration adds missing tables and columns for all admin modules

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ==================================================
-- Fix Courses table - add missing columns
-- ==================================================
alter table public.courses
  add column if not exists thumbnail_url text,
  add column if not exists pdf_url text,
  add column if not exists duration text,
  add column if not exists price text,
  add column if not exists is_featured boolean default false;

-- ==================================================
-- Fix Testimonials table - add missing columns
-- ==================================================
alter table public.testimonials
  add column if not exists company text,
  add column if not exists course text,
  add column if not exists message text,
  add column if not exists student_result text,
  add column if not exists rating int;

-- ==================================================
-- Create Companies table (missing)
-- ==================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
drop policy if exists "companies_public_select" on public.companies;
create policy "companies_public_select"
on public.companies
for select
to anon, authenticated
using (true);

drop policy if exists "companies_admin_write" on public.companies;
create policy "companies_admin_write"
on public.companies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ==================================================
-- Create Internships table (missing)
-- ==================================================
create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role text,
  description text,
  logo text,
  location text,
  duration text,
  salary text,
  deadline timestamptz,
  apply_link text,
  eligibility text,
  status text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_internships_updated_at on public.internships;
create trigger set_internships_updated_at
before update on public.internships
for each row execute function public.set_updated_at();

alter table public.internships enable row level security;
drop policy if exists "internships_public_select" on public.internships;
create policy "internships_public_select"
on public.internships
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "internships_admin_write" on public.internships;
create policy "internships_admin_write"
on public.internships
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ==================================================
-- Create LMS Modules table (missing)
-- ==================================================
create table if not exists public.lms_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_lms_modules_updated_at on public.lms_modules;
create trigger set_lms_modules_updated_at
before update on public.lms_modules
for each row execute function public.set_updated_at();

alter table public.lms_modules enable row level security;
drop policy if exists "lms_modules_public_select" on public.lms_modules;
create policy "lms_modules_public_select"
on public.lms_modules
for select
to anon, authenticated
using (true);

drop policy if exists "lms_modules_admin_write" on public.lms_modules;
create policy "lms_modules_admin_write"
on public.lms_modules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ==================================================
-- Create LMS Lessons table (missing)
-- ==================================================
create table if not exists public.lms_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.lms_modules(id) on delete set null,
  title text not null,
  content text,
  file_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_lms_lessons_updated_at on public.lms_lessons;
create trigger set_lms_lessons_updated_at
before update on public.lms_lessons
for each row execute function public.set_updated_at();

alter table public.lms_lessons enable row level security;
drop policy if exists "lms_lessons_public_select" on public.lms_lessons;
create policy "lms_lessons_public_select"
on public.lms_lessons
for select
to anon, authenticated
using (true);

drop policy if exists "lms_lessons_admin_write" on public.lms_lessons;
create policy "lms_lessons_admin_write"
on public.lms_lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ==================================================
-- Fix navigation_menus table location column to menu_location
-- ==================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'navigation_menus' and column_name = 'location'
  ) then
    alter table public.navigation_menus rename column location to menu_location;
  end if;
end $$;

-- ==================================================
-- Fix placements table - add missing columns
-- ==================================================
alter table public.placements
  add column if not exists company_name text,
  add column if not exists salary text,
  add column if not exists package text,
  add column if not exists is_active boolean default true,
  add column if not exists order_index int default 0,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_placements_updated_at on public.placements;
create trigger set_placements_updated_at
before update on public.placements
for each row execute function public.set_updated_at();

-- ==================================================
-- Ensure indexes exist for performance
-- ==================================================
create index if not exists idx_companies_created_at on public.companies (created_at desc);
create index if not exists idx_internships_created_at on public.internships (created_at desc);
create index if not exists idx_internships_is_active on public.internships (is_active);
create index if not exists idx_lms_modules_course on public.lms_modules (course_id);
create index if not exists idx_lms_modules_order on public.lms_modules (order_index);
create index if not exists idx_lms_lessons_module on public.lms_lessons (module_id);
create index if not exists idx_lms_lessons_order on public.lms_lessons (order_index);
