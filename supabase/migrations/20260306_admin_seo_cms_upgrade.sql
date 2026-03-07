-- Admin + SEO CMS upgrade

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text,
  image text,
  meta_title text,
  meta_description text,
  author text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_name text not null,
  description text,
  duration text,
  internship text,
  price text,
  modules jsonb,
  featured_image text,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  logo text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo text,
  created_at timestamptz not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role text,
  description text,
  logo text,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text,
  image text,
  review text,
  created_at timestamptz not null default now()
);

create table if not exists public.lms_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  order_index int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lms_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.lms_modules(id) on delete cascade,
  title text not null,
  content text,
  file_url text,
  order_index int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_meta (
  id uuid primary key default gen_random_uuid(),
  page_slug text unique not null,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  twitter_title text,
  twitter_description text,
  twitter_image text,
  schema_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  file_type text,
  bucket_name text,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values
  ('images', 'images', true),
  ('videos', 'videos', true),
  ('documents', 'documents', true),
  ('lms-files', 'lms-files', true),
  ('blog-images', 'blog-images', true),
  ('course-images', 'course-images', true),
  ('media-files', 'media-files', true),
  ('pdfs', 'pdfs', true),
  ('lectures', 'lectures', true)
on conflict (id) do nothing;
