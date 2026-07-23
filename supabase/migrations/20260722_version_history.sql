-- Version History Schema
-- Create tables for tracking page and blog versions

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

-- Page versions table
create table if not exists public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  version_number int not null,
  content_json jsonb,
  seo_title text,
  seo_description text,
  status text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  notes text,
  change_summary text
);

-- Blog versions table
create table if not exists public.blog_versions (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blogs(id) on delete cascade,
  version_number int not null,
  title text,
  content jsonb,
  excerpt text,
  seo_title text,
  seo_description text,
  status text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  notes text,
  change_summary text
);

-- Indexes
create index if not exists idx_page_versions_page_id on public.page_versions(page_id);
create index if not exists idx_page_versions_created_at on public.page_versions(created_at desc);
create index if not exists idx_page_versions_version_number on public.page_versions(page_id, version_number desc);

create index if not exists idx_blog_versions_blog_id on public.blog_versions(blog_id);
create index if not exists idx_blog_versions_created_at on public.blog_versions(created_at desc);
create index if not exists idx_blog_versions_version_number on public.blog_versions(blog_id, version_number desc);

-- Function to create page version
create or replace function public.create_page_version(
  p_page_id uuid,
  p_content_json jsonb,
  p_seo_title text,
  p_seo_description text,
  p_status text,
  p_notes text default null,
  p_change_summary text default null
)
returns uuid
language plpgsql
as $$
declare
  v_version_number int;
  v_id uuid;
begin
  -- Get the next version number
  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.page_versions
  where page_id = p_page_id;
  
  -- Insert new version
  insert into public.page_versions (
    page_id,
    version_number,
    content_json,
    seo_title,
    seo_description,
    status,
    created_by,
    notes,
    change_summary
  ) values (
    p_page_id,
    v_version_number,
    p_content_json,
    p_seo_title,
    p_seo_description,
    p_status,
    auth.uid(),
    p_notes,
    p_change_summary
  )
  returning id into v_id;
  
  return v_id;
end;
$$;

-- Function to create blog version
create or replace function public.create_blog_version(
  p_blog_id uuid,
  p_title text,
  p_content jsonb,
  p_excerpt text,
  p_seo_title text,
  p_seo_description text,
  p_status text,
  p_notes text default null,
  p_change_summary text default null
)
returns uuid
language plpgsql
as $$
declare
  v_version_number int;
  v_id uuid;
begin
  -- Get the next version number
  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.blog_versions
  where blog_id = p_blog_id;
  
  -- Insert new version
  insert into public.blog_versions (
    blog_id,
    version_number,
    title,
    content,
    excerpt,
    seo_title,
    seo_description,
    status,
    created_by,
    notes,
    change_summary
  ) values (
    p_blog_id,
    v_version_number,
    p_title,
    p_content,
    p_excerpt,
    p_seo_title,
    p_seo_description,
    p_status,
    auth.uid(),
    p_notes,
    p_change_summary
  )
  returning id into v_id;
  
  return v_id;
end;
$$;

-- RLS policies
alter table public.page_versions enable row level security;
alter table public.blog_versions enable row level security;

-- Page versions: admin full access
drop policy if exists "page_versions_admin_all" on public.page_versions;
create policy "page_versions_admin_all"
on public.page_versions for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Blog versions: admin full access
drop policy if exists "blog_versions_admin_all" on public.blog_versions;
create policy "blog_versions_admin_all"
on public.blog_versions for all to authenticated
using (public.is_admin())
with check (public.is_admin());