-- Comprehensive SEO Manager Schema
-- Add advanced SEO fields to all content tables

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

-- Add advanced SEO columns to pages
alter table public.pages
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists canonical_url text,
add column if not exists og_title text,
add column if not exists og_description text,
add column if not exists og_image_url text,
add column if not exists twitter_card text default 'summary_large_image',
add column if not exists twitter_title text,
add column if not exists twitter_description text,
add column if not exists twitter_image_url text,
add column if not exists focus_keyword text,
add column if not exists seo_score int default 0,
add column if not exists json_ld_schema jsonb,
add column if not exists breadcrumb_schema jsonb,
add column if not exists exclude_from_sitemap boolean default false;

-- Add advanced SEO columns to blogs
alter table public.blogs
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists canonical_url text,
add column if not exists og_title text,
add column if not exists og_description text,
add column if not exists og_image_url text,
add column if not exists twitter_card text default 'summary_large_image',
add column if not exists twitter_title text,
add column if not exists twitter_description text,
add column if not exists twitter_image_url text,
add column if not exists focus_keyword text,
add column if not exists seo_score int default 0,
add column if not exists json_ld_schema jsonb,
add column if not exists breadcrumb_schema jsonb,
add column if not exists exclude_from_sitemap boolean default false;

-- Add advanced SEO columns to courses
alter table public.courses
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists canonical_url text,
add column if not exists og_title text,
add column if not exists og_description text,
add column if not exists og_image_url text,
add column if not exists twitter_card text default 'summary_large_image',
add column if not exists twitter_title text,
add column if not exists twitter_description text,
add column if not exists twitter_image_url text,
add column if not exists focus_keyword text,
add column if not exists seo_score int default 0,
add column if not exists json_ld_schema jsonb,
add column if not exists breadcrumb_schema jsonb,
add column if not exists exclude_from_sitemap boolean default false;

-- Add advanced SEO columns to city_pages
alter table public.city_pages
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists canonical_url text,
add column if not exists og_title text,
add column if not exists og_description text,
add column if not exists og_image_url text,
add column if not exists twitter_card text default 'summary_large_image',
add column if not exists twitter_title text,
add column if not exists twitter_description text,
add column if not exists twitter_image_url text,
add column if not exists focus_keyword text,
add column if not exists seo_score int default 0,
add column if not exists json_ld_schema jsonb,
add column if not exists breadcrumb_schema jsonb,
add column if not exists exclude_from_sitemap boolean default false;

-- Create sitemap table
create table if not exists public.sitemap_settings (
  id uuid primary key default gen_random_uuid(),
  last_generated timestamptz,
  include_pages boolean default true,
  include_blogs boolean default true,
  include_courses boolean default true,
  include_cities boolean default true,
  changefreq_pages text default 'weekly',
  changefreq_blogs text default 'weekly',
  changefreq_courses text default 'monthly',
  changefreq_cities text default 'monthly',
  priority_pages numeric default 0.8,
  priority_blogs numeric default 0.6,
  priority_courses numeric default 0.7,
  priority_cities numeric default 0.5,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Insert default sitemap settings
insert into public.sitemap_settings (include_pages, include_blogs, include_courses, include_cities)
values (true, true, true, true)
on conflict do nothing;

-- Indexes
create index if not exists idx_pages_exclude_sitemap on public.pages(exclude_from_sitemap) where exclude_from_sitemap = true;
create index if not exists idx_blogs_exclude_sitemap on public.blogs(exclude_from_sitemap) where exclude_from_sitemap = true;
create index if not exists idx_courses_exclude_sitemap on public.courses(exclude_from_sitemap) where exclude_from_sitemap = true;
create index if not exists idx_city_pages_exclude_sitemap on public.city_pages(exclude_from_sitemap) where exclude_from_sitemap = true;

-- Trigger for updated_at
drop trigger if exists set_sitemap_settings_updated_at on public.sitemap_settings;
create trigger set_sitemap_settings_updated_at
before update on public.sitemap_settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.sitemap_settings enable row level security;

drop policy if exists "sitemap_settings_admin_all" on public.sitemap_settings;
create policy "sitemap_settings_admin_all"
on public.sitemap_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());