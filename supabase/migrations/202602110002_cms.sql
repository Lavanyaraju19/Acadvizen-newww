-- Acadvizen CMS/CRM schema + RLS policies
-- Run this in Supabase SQL Editor (project-level).

create extension if not exists "pgcrypto";

-- Helper: admin role check
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

-- Registrations (public insert, admin read/delete)
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  learning_mode text not null,
  page text,
  created_at timestamptz not null default now()
);
alter table public.registrations enable row level security;

drop policy if exists "registrations_public_insert" on public.registrations;
create policy "registrations_public_insert"
  on public.registrations
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "registrations_admin_select" on public.registrations;
create policy "registrations_admin_select"
  on public.registrations
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "registrations_admin_delete" on public.registrations;
create policy "registrations_admin_delete"
  on public.registrations
  for delete
  to authenticated
  using (public.is_admin());

-- Courses (existing table may already exist; ensure visibility flags)
alter table public.courses
  add column if not exists is_active boolean default true,
  add column if not exists is_featured boolean default false;
update public.courses set is_active = true where is_active is null;

alter table public.courses enable row level security;
drop policy if exists "courses_public_select" on public.courses;
create policy "courses_public_select"
  on public.courses
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "courses_admin_write" on public.courses;
create policy "courses_admin_write"
  on public.courses
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tools (existing table may already exist; ensure visibility flags)
alter table public.tools
  add column if not exists is_active boolean default true,
  add column if not exists is_featured boolean default false;
update public.tools set is_active = true where is_active is null;

alter table public.tools enable row level security;
drop policy if exists "tools_public_select" on public.tools;
create policy "tools_public_select"
  on public.tools
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "tools_admin_write" on public.tools;
create policy "tools_admin_write"
  on public.tools
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Resources (existing table may already exist; ensure visibility flags)
alter table public.resources
  add column if not exists is_active boolean default true,
  add column if not exists is_featured boolean default false,
  add column if not exists resource_type text;
update public.resources set is_active = true where is_active is null;

alter table public.resources enable row level security;
drop policy if exists "resources_public_select" on public.resources;
create policy "resources_public_select"
  on public.resources
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "resources_admin_write" on public.resources;
create policy "resources_admin_write"
  on public.resources
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Videos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  thumbnail_url text,
  order_index int default 0,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.videos enable row level security;
drop policy if exists "videos_public_select" on public.videos;
create policy "videos_public_select"
  on public.videos
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "videos_admin_write" on public.videos;
create policy "videos_admin_write"
  on public.videos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Cohorts
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_date date not null,
  mode text not null,
  weekday text,
  capacity text,
  campus text,
  cta_label text default 'Enroll Now',
  limited_seats boolean default true,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.cohorts enable row level security;
drop policy if exists "cohorts_public_select" on public.cohorts;
create policy "cohorts_public_select"
  on public.cohorts
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "cohorts_admin_write" on public.cohorts;
create policy "cohorts_admin_write"
  on public.cohorts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text,
  image_url text,
  video_url text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
drop policy if exists "testimonials_public_select" on public.testimonials;
create policy "testimonials_public_select"
  on public.testimonials
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write"
  on public.testimonials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- FAQs
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.faqs enable row level security;
drop policy if exists "faqs_public_select" on public.faqs;
create policy "faqs_public_select"
  on public.faqs
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write"
  on public.faqs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Alumni
create table if not exists public.alumni (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  logo_url text,
  color text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.alumni enable row level security;
drop policy if exists "alumni_public_select" on public.alumni;
create policy "alumni_public_select"
  on public.alumni
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "alumni_admin_write" on public.alumni;
create policy "alumni_admin_write"
  on public.alumni
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Stats (single table with rows)
create table if not exists public.stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.stats enable row level security;
drop policy if exists "stats_public_select" on public.stats;
create policy "stats_public_select"
  on public.stats
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "stats_admin_write" on public.stats;
create policy "stats_admin_write"
  on public.stats
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Ticker items
create table if not exists public.ticker (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
alter table public.ticker enable row level security;
drop policy if exists "ticker_public_select" on public.ticker;
create policy "ticker_public_select"
  on public.ticker
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "ticker_admin_write" on public.ticker;
create policy "ticker_admin_write"
  on public.ticker
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Gallery
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  media_url text not null,
  media_type text default 'image',
  order_index int default 0,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.gallery enable row level security;
drop policy if exists "gallery_public_select" on public.gallery;
create policy "gallery_public_select"
  on public.gallery
  for select
  to anon, authenticated
  using (is_active = true);
drop policy if exists "gallery_admin_write" on public.gallery;
create policy "gallery_admin_write"
  on public.gallery
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage buckets (idempotent inserts)
insert into storage.buckets (id, name, public)
values
  ('pdfs', 'pdfs', true),
  ('brochures', 'brochures', true),
  ('course-thumbnails', 'course-thumbnails', true),
  ('gallery', 'gallery', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

-- Storage policies: public read, admin write
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('pdfs','brochures','course-thumbnails','gallery','videos'));

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write"
  on storage.objects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
