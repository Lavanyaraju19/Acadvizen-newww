-- Bootstrap core tables that later historical migrations assume already exist.
-- This is intentionally idempotent and does not overwrite existing project data.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  approval_status text not null default 'pending',
  student_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text not null default 'user',
  add column if not exists approval_status text not null default 'pending',
  add column if not exists student_id text unique,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  image_url text,
  order_index int not null default 0,
  is_published boolean not null default true,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category text,
  image_url text,
  link_url text,
  order_index int not null default 0,
  is_published boolean not null default true,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  resource_type text,
  file_url text,
  external_url text,
  description text,
  course_id uuid references public.courses(id) on delete set null,
  tool_id uuid references public.tools(id) on delete set null,
  order_index int not null default 0,
  is_published boolean not null default true,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_details (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  content text,
  section_title text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  seo_title text,
  seo_description text,
  status text not null default 'draft',
  is_published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  order_index int not null default 0,
  content_json jsonb not null default '{}'::jsonb,
  visibility boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  content text,
  content_json jsonb,
  featured_image text,
  seo_title text,
  seo_description text,
  tags jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'default',
  logo text,
  favicon text,
  contact_email text,
  phone_number text,
  address text,
  social_links jsonb not null default '{}'::jsonb,
  footer_content text,
  announcement_bar text,
  default_seo_title text,
  default_seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role, approval_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'approval_status', 'pending')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_approval on public.profiles(approval_status);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_tools_slug on public.tools(slug);
create index if not exists idx_resources_course on public.resources(course_id);
create index if not exists idx_resources_tool on public.resources(tool_id);
create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_status on public.pages(status);
create index if not exists idx_sections_page_order on public.sections(page_id, order_index);
create index if not exists idx_blogs_slug on public.blogs(slug);
create index if not exists idx_blogs_status on public.blogs(status);
