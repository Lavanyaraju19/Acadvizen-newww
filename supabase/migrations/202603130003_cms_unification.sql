-- Unified CMS schema for fully dynamic page/content rendering
-- Safe/idempotent migration for existing Acadvizen Supabase projects

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

-- =============================================
-- Pages
-- =============================================
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pages
  add column if not exists description text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists status text default 'draft',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.pages
set status = case when coalesce(is_published, false) then 'published' else 'draft' end
where status is null;

alter table public.pages
  drop constraint if exists pages_status_check;
alter table public.pages
  add constraint pages_status_check check (status in ('draft', 'published'));

create index if not exists idx_pages_slug on public.pages (slug);
create index if not exists idx_pages_status on public.pages (status);

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

-- =============================================
-- Sections (dynamic page builder blocks)
-- =============================================
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

create index if not exists idx_sections_page_order on public.sections (page_id, order_index);
create index if not exists idx_sections_visibility on public.sections (visibility);

drop trigger if exists set_sections_updated_at on public.sections;
create trigger set_sections_updated_at
before update on public.sections
for each row execute function public.set_updated_at();

-- =============================================
-- Blogs
-- =============================================
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
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blogs
  add column if not exists description text,
  add column if not exists content_json jsonb,
  add column if not exists featured_image text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists categories jsonb not null default '[]'::jsonb,
  add column if not exists status text default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.blogs
set status = case when coalesce(published, false) then 'published' else 'draft' end
where status is null;

alter table public.blogs
  drop constraint if exists blogs_status_check;
alter table public.blogs
  add constraint blogs_status_check check (status in ('draft', 'published'));

create index if not exists idx_blogs_slug on public.blogs (slug);
create index if not exists idx_blogs_status on public.blogs (status);

drop trigger if exists set_blogs_updated_at on public.blogs;
create trigger set_blogs_updated_at
before update on public.blogs
for each row execute function public.set_updated_at();

-- =============================================
-- Media metadata table (storage-agnostic index)
-- =============================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  bucket text,
  path text,
  type text not null default 'image',
  width int,
  height int,
  size bigint,
  alt_text text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_media_type on public.media (type);
create index if not exists idx_media_created_at on public.media (created_at desc);

drop trigger if exists set_media_updated_at on public.media;
create trigger set_media_updated_at
before update on public.media
for each row execute function public.set_updated_at();

-- =============================================
-- Menus (header/footer/dropdown)
-- =============================================
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  menu_location text not null default 'header',
  title text not null,
  url text not null,
  order_index int not null default 0,
  parent_id uuid references public.menus(id) on delete set null,
  target text not null default '_self',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menus_location_order on public.menus (menu_location, order_index);
create index if not exists idx_menus_parent on public.menus (parent_id);

drop trigger if exists set_menus_updated_at on public.menus;
create trigger set_menus_updated_at
before update on public.menus
for each row execute function public.set_updated_at();

-- =============================================
-- Site settings (single-row global settings)
-- =============================================
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

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- =============================================
-- SEO metadata
-- =============================================
create table if not exists public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null unique,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seo_metadata_page_slug on public.seo_metadata (page_slug);

drop trigger if exists set_seo_metadata_updated_at on public.seo_metadata;
create trigger set_seo_metadata_updated_at
before update on public.seo_metadata
for each row execute function public.set_updated_at();

-- =============================================
-- RLS
-- =============================================
alter table public.pages enable row level security;
alter table public.sections enable row level security;
alter table public.blogs enable row level security;
alter table public.media enable row level security;
alter table public.menus enable row level security;
alter table public.site_settings enable row level security;
alter table public.seo_metadata enable row level security;

drop policy if exists "pages_public_select" on public.pages;
create policy "pages_public_select"
on public.pages
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "sections_public_select" on public.sections;
create policy "sections_public_select"
on public.sections
for select
to anon, authenticated
using (
  visibility = true and exists (
    select 1
    from public.pages p
    where p.id = sections.page_id
      and p.status = 'published'
  )
);

drop policy if exists "blogs_public_select" on public.blogs;
create policy "blogs_public_select"
on public.blogs
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "media_public_select" on public.media;
create policy "media_public_select"
on public.media
for select
to anon, authenticated
using (true);

drop policy if exists "menus_public_select" on public.menus;
create policy "menus_public_select"
on public.menus
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "seo_metadata_public_select" on public.seo_metadata;
create policy "seo_metadata_public_select"
on public.seo_metadata
for select
to anon, authenticated
using (true);

drop policy if exists "pages_admin_write" on public.pages;
create policy "pages_admin_write"
on public.pages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "sections_admin_write" on public.sections;
create policy "sections_admin_write"
on public.sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "blogs_admin_write" on public.blogs;
create policy "blogs_admin_write"
on public.blogs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "media_admin_write" on public.media;
create policy "media_admin_write"
on public.media
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "menus_admin_write" on public.menus;
create policy "menus_admin_write"
on public.menus
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "seo_metadata_admin_write" on public.seo_metadata;
create policy "seo_metadata_admin_write"
on public.seo_metadata
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage buckets commonly used by CMS media workflows
insert into storage.buckets (id, name, public)
values
  ('site-assets', 'site-assets', true),
  ('blog-images', 'blog-images', true),
  ('placements', 'placements', true),
  ('course-images', 'course-images', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

-- =============================================
-- Backfill from legacy CMS tables (if present)
-- =============================================
do $$
begin
  -- Ensure common root pages exist as published entries.
  insert into public.pages (title, slug, description, status)
  values
    ('Home', 'home', 'Homepage content', 'published'),
    ('About', 'about', 'About page content', 'published'),
    ('Contact', 'contact', 'Contact page content', 'published'),
    ('Courses', 'courses', 'Course listing page content', 'published'),
    ('Tools', 'tools', 'Tool listing page content', 'published'),
    ('Placement', 'placement', 'Placement page content', 'published'),
    ('Hire From Us', 'hire-from-us', 'Hire from us page content', 'published'),
    ('Blog', 'blog', 'Blog listing page content', 'published'),
    ('Digital Marketing Course In Bangalore', 'digital-marketing-course-in-bangalore', 'Landing page content', 'published'),
    ('Digital Marketing Course In Jayanagar', 'digital-marketing-course-in-jayanagar', 'Landing page content', 'published'),
    ('AI Digital Marketing Course', 'ai-digital-marketing-course', 'Landing page content', 'published'),
    ('Google Ads Course In Bangalore', 'google-ads-course-in-bangalore', 'Landing page content', 'published'),
    ('SEO Course In Bangalore', 'seo-course-in-bangalore', 'Landing page content', 'published'),
    ('Social Media Marketing Course In Bangalore', 'social-media-marketing-course-in-bangalore', 'Landing page content', 'published'),
    ('Digital Marketing Internship In Bangalore', 'digital-marketing-internship-in-bangalore', 'Landing page content', 'published')
  on conflict (slug) do nothing;

  if to_regclass('public.home_sections') is not null then
    insert into public.sections (page_id, type, order_index, content_json, visibility)
    select
      p.id,
      'custom_rich_text',
      coalesce(h.order_index, 0),
      jsonb_strip_nulls(
        jsonb_build_object(
          'heading', h.title,
          'subheading', h.subtitle,
          'text', h.body,
          'list', h.items_json,
          'cta', h.cta_json
        )
      ),
      coalesce(h.is_active, true)
    from public.home_sections h
    join public.pages p on p.slug = 'home'
    where not exists (
      select 1
      from public.sections s
      where s.page_id = p.id
        and s.order_index = coalesce(h.order_index, 0)
        and s.type = 'custom_rich_text'
    );
  end if;

  if to_regclass('public.page_sections') is not null then
    insert into public.pages (title, slug, description, status)
    select
      initcap(replace(ps.page_slug, '-', ' ')),
      ps.page_slug,
      concat('CMS content for ', ps.page_slug),
      'published'
    from public.page_sections ps
    where ps.page_slug is not null
    on conflict (slug) do nothing;

    insert into public.sections (page_id, type, order_index, content_json, visibility)
    select
      p.id,
      'custom_rich_text',
      coalesce(ps.order_index, 0),
      jsonb_strip_nulls(
        jsonb_build_object(
          'heading', ps.title,
          'subheading', ps.subtitle,
          'text', ps.body,
          'list', ps.items_json,
          'cta', ps.cta_json
        )
      ),
      coalesce(ps.is_active, true)
    from public.page_sections ps
    join public.pages p on p.slug = ps.page_slug
    where not exists (
      select 1
      from public.sections s
      where s.page_id = p.id
        and s.order_index = coalesce(ps.order_index, 0)
        and s.type = 'custom_rich_text'
    );
  end if;
end
$$;
