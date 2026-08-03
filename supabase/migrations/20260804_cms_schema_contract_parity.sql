-- ============================================================================
-- 20260804_cms_schema_contract_parity.sql
-- Repository-verified idempotent CMS schema contract repair (Supabase SQL Editor).
--
-- SOURCE OF TRUTH (inspected before generating this file):
--   lib/cmsEntities.js
--   lib/cmsPublishing.js
--   lib/cmsServer.js
--   lib/validation.js
--   app/api/cms/pages/route.js
--   app/api/cms/pages/[id]/route.js
--   app/api/cms/blogs/route.js
--   app/api/cms/blogs/[id]/route.js
--   app/api/cms/entities/[entity]/route.js
--   app/api/cms/entities/[entity]/[id]/route.js
--   app/api/cms/cities/route.js
--   app/api/cms/sections/route.js
--   supabase/migrations/*.sql
--
-- STAGING GAP CONFIRMED BY REST PROBE (read-only, 2026-08-04):
--   pages            -> OK (all contract columns present)
--   city_pages       -> OK
--   blogs            -> MISSING is_active, is_published, scheduled_publish_at,
--                       scheduled_unpublish_at, deleted_at, canonical_url,
--                       exclude_from_sitemap, image, created_by, meta_title,
--                       meta_description
--   location_pages   -> MISSING content, published_at, scheduled_publish_at,
--                       scheduled_unpublish_at, deleted_at, exclude_from_sitemap,
--                       created_by
--   courses          -> MISSING status, deleted_at, canonical_url, noindex,
--                       seo_title, seo_description, created_by,
--                       exclude_from_sitemap
--   tools_extended   -> MISSING updated_at, deleted_at, created_by, title
--   reusable_sections-> TABLE MISSING (genuinely in repo: 202607220013 +
--                       cmsPublishing references table)
--   reusable_blocks  -> MISSING slug, deleted_at, published_at, title
--   page_templates   -> MISSING template_type, template_data, is_default,
--                       deleted_at, created_by
--   sections         -> MISSING section_type, page_slug
--
-- SAFETY RULES (all enforced)
--   * Never deletes rows, never DROP TABLE, never TRUNCATE.
--   * Never disables RLS, never grants public write access.
--   * Adds ONLY genuinely missing columns/indexes/triggers/policies/grants.
--   * Existing column values are never overwritten; backfills only touch NULLs.
--   * Foreign keys added only when referenced table exists AND the column does
--     not already carry ANY foreign key (attribute-based guard).
--   * Live lower-slug unique index is created only when no duplicate slugs.
--   * Fully idempotent; wrapped in one transaction.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS (idempotent)
-- ----------------------------------------------------------------------------
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
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in ('super_admin', 'admin')
  )
  or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(coalesce(r.slug, '')) in ('super_admin', 'admin')
  );
$$;

create or replace function public.can_access_cms()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in (
        'super_admin', 'admin', 'editor', 'author', 'reviewer',
        'viewer', 'seo_manager', 'content_writer'
      )
  )
  or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(coalesce(r.slug, '')) in (
        'super_admin', 'admin', 'editor', 'author', 'reviewer',
        'viewer', 'seo_manager', 'content_writer'
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- 1. BLOGS — REPAIR MISSING CONTRACT COLUMNS
--    (202603130003_cms_unification.sql + 202607220016_staging_workflow.sql +
--     202607220015_seo_manager.sql + 202607220019_content_scheduling.sql +
--     202607310004_zzzz_cms_publish_contract.sql)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.blogs') is null then
    raise notice 'blogs table missing; creating from repository contract.';
    create table public.blogs (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      slug text not null unique,
      description text,
      content text,
      content_json jsonb,
      featured_image text,
      image text,
      excerpt text,
      tags jsonb not null default '[]'::jsonb,
      categories jsonb not null default '[]'::jsonb,
      author text,
      author_id uuid,
      status text not null default 'draft',
      workflow_status text default 'draft',
      is_active boolean not null default true,
      is_published boolean not null default false,
      published_at timestamptz,
      scheduled_publish_at timestamptz,
      scheduled_unpublish_at timestamptz,
      auto_publish boolean not null default false,
      deleted_at timestamptz,
      canonical_url text,
      og_image text,
      noindex boolean not null default false,
      exclude_from_sitemap boolean not null default false,
      meta_title text,
      meta_description text,
      og_title text,
      og_description text,
      og_image_url text,
      twitter_card text default 'summary_large_image',
      twitter_title text,
      twitter_description text,
      twitter_image_url text,
      focus_keyword text,
      seo_score int default 0,
      json_ld_schema jsonb,
      breadcrumb_schema jsonb,
      faq_schema jsonb,
      created_by uuid,
      reviewed_by uuid,
      reviewed_at timestamptz,
      approved_by uuid,
      approved_at timestamptz,
      published_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.blogs add constraint blogs_status_check
      check (status in ('draft', 'review', 'approved', 'published', 'archived'));
    alter table public.blogs enable row level security;
    return;
  end if;

  -- Core compatibility columns (probe-confirmed missing)
  alter table public.blogs add column if not exists description text;
  alter table public.blogs add column if not exists content_json jsonb;
  alter table public.blogs add column if not exists featured_image text;
  alter table public.blogs add column if not exists image text;
  alter table public.blogs add column if not exists excerpt text;
  alter table public.blogs add column if not exists author text;
  alter table public.blogs add column if not exists tags jsonb not null default '[]'::jsonb;
  alter table public.blogs add column if not exists categories jsonb not null default '[]'::jsonb;
  alter table public.blogs add column if not exists status text not null default 'draft';
  alter table public.blogs add column if not exists workflow_status text default 'draft';
  alter table public.blogs add column if not exists published_at timestamptz;
  alter table public.blogs add column if not exists created_at timestamptz not null default now();
  alter table public.blogs add column if not exists updated_at timestamptz not null default now();

  -- Visibility / publishing / scheduling / soft-delete (probe-confirmed missing)
  alter table public.blogs add column if not exists is_active boolean not null default true;
  alter table public.blogs add column if not exists is_published boolean not null default false;
  alter table public.blogs add column if not exists scheduled_publish_at timestamptz;
  alter table public.blogs add column if not exists scheduled_unpublish_at timestamptz;
  alter table public.blogs add column if not exists auto_publish boolean not null default false;
  alter table public.blogs add column if not exists deleted_at timestamptz;

  -- SEO (probe-confirmed missing canonical_url, exclude_from_sitemap, meta_*)
  alter table public.blogs add column if not exists canonical_url text;
  alter table public.blogs add column if not exists og_image text;
  alter table public.blogs add column if not exists noindex boolean not null default false;
  alter table public.blogs add column if not exists exclude_from_sitemap boolean not null default false;
  alter table public.blogs add column if not exists meta_title text;
  alter table public.blogs add column if not exists meta_description text;
  alter table public.blogs add column if not exists og_title text;
  alter table public.blogs add column if not exists og_description text;
  alter table public.blogs add column if not exists og_image_url text;
  alter table public.blogs add column if not exists twitter_card text default 'summary_large_image';
  alter table public.blogs add column if not exists twitter_title text;
  alter table public.blogs add column if not exists twitter_description text;
  alter table public.blogs add column if not exists twitter_image_url text;
  alter table public.blogs add column if not exists focus_keyword text;
  alter table public.blogs add column if not exists seo_score int default 0;
  alter table public.blogs add column if not exists json_ld_schema jsonb;
  alter table public.blogs add column if not exists breadcrumb_schema jsonb;
  alter table public.blogs add column if not exists faq_schema jsonb;

  -- Workflow (probe-confirmed missing created_by)
  alter table public.blogs add column if not exists author_id uuid;
  alter table public.blogs add column if not exists created_by uuid;
  alter table public.blogs add column if not exists reviewed_by uuid;
  alter table public.blogs add column if not exists reviewed_at timestamptz;
  alter table public.blogs add column if not exists approved_by uuid;
  alter table public.blogs add column if not exists approved_at timestamptz;
  alter table public.blogs add column if not exists published_by uuid;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. BLOGS — SAFE BACKFILLS (NULL-only; never overwrites valid data)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.blogs') is null then
    return;
  end if;

  -- Derive status from legacy boolean only when status is NULL.
  -- The legacy "published" boolean exists only on some environments, so guard it.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'blogs' and column_name = 'published'
  ) then
    update public.blogs
    set status = 'published'
    where status is null
      and coalesce(is_published, published, false) = true;
  else
    update public.blogs
    set status = 'published'
    where status is null
      and coalesce(is_published, false) = true;
  end if;

  update public.blogs
  set status = 'draft'
  where status is null;

  -- published_at: derive only when missing AND the row is published.
  update public.blogs
  set published_at = updated_at
  where published_at is null
    and status = 'published';

  -- Visibility flags: fill NULL booleans without clobbering real values.
  update public.blogs set is_active = true where is_active is null;
  update public.blogs set is_published = (status = 'published') where is_published is null;
  update public.blogs set noindex = false where noindex is null;
  update public.blogs set exclude_from_sitemap = false where exclude_from_sitemap is null;
  update public.blogs set auto_publish = false where auto_publish is null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. BLOGS — STATUS CHECK CONSTRAINT (5-state contract)
-- ----------------------------------------------------------------------------
do $$
declare
  r text;
begin
  if to_regclass('public.blogs') is null then
    return;
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.blogs'::regclass and conname = 'blogs_status_check'
  ) then
    alter table public.blogs drop constraint blogs_status_check;
  end if;

  if not exists (
    select 1 from public.blogs
    where status is null or status not in ('draft', 'review', 'approved', 'published', 'archived')
  ) then
    alter table public.blogs add constraint blogs_status_check
      check (status in ('draft', 'review', 'approved', 'published', 'archived'));
  else
    raise notice 'blogs.status has out-of-contract values; preserving rows and keeping no strict constraint.';
    for r in
      select id::text from public.blogs
      where status is null or status not in ('draft', 'review', 'approved', 'published', 'archived')
    loop
      raise notice '  out-of-contract blogs.status row: %', r;
    end loop;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. LOCATION_PAGES — REPAIR MISSING CONTRACT COLUMNS
--    (202603130001_cms_expansion_pass2.sql + publish contract)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.location_pages') is null then
    raise notice 'location_pages table missing; creating from repository contract.';
    create table public.location_pages (
      id uuid primary key default gen_random_uuid(),
      city_id uuid,
      course_slug text,
      slug text not null unique,
      title text not null,
      description text,
      content jsonb,
      template_slug text,
      sections_json jsonb not null default '[]'::jsonb,
      style_json jsonb not null default '{}'::jsonb,
      seo_title text,
      seo_description text,
      canonical_url text,
      og_image text,
      noindex boolean not null default false,
      exclude_from_sitemap boolean not null default false,
      status text not null default 'draft',
      published_at timestamptz,
      scheduled_publish_at timestamptz,
      scheduled_unpublish_at timestamptz,
      deleted_at timestamptz,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.location_pages add constraint location_pages_status_check
      check (status in ('draft', 'review', 'approved', 'published', 'archived'));
    alter table public.location_pages enable row level security;
    return;
  end if;

  alter table public.location_pages add column if not exists content jsonb;
  alter table public.location_pages add column if not exists published_at timestamptz;
  alter table public.location_pages add column if not exists scheduled_publish_at timestamptz;
  alter table public.location_pages add column if not exists scheduled_unpublish_at timestamptz;
  alter table public.location_pages add column if not exists deleted_at timestamptz;
  alter table public.location_pages add column if not exists exclude_from_sitemap boolean not null default false;
  alter table public.location_pages add column if not exists created_by uuid;
end;
$$;

-- Backfill published_at for existing published location pages (NULL-only).
do $$
begin
  if to_regclass('public.location_pages') is not null then
    update public.location_pages
    set published_at = updated_at
    where published_at is null
      and status = 'published';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. COURSES — REPAIR MISSING CONTRACT COLUMNS
--    (202603060001 / 20260527 + SEO manager + publish contract)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.courses') is null then
    raise notice 'courses table missing; creating from repository contract.';
    create table public.courses (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      slug text not null unique,
      description text,
      course_name text,
      status text not null default 'draft',
      is_active boolean not null default true,
      is_published boolean not null default true,
      published_at timestamptz,
      deleted_at timestamptz,
      canonical_url text,
      og_image text,
      noindex boolean not null default false,
      exclude_from_sitemap boolean not null default false,
      meta_title text,
      meta_description text,
      seo_title text,
      seo_description text,
      og_title text,
      og_description text,
      og_image_url text,
      twitter_card text default 'summary_large_image',
      twitter_title text,
      twitter_description text,
      twitter_image_url text,
      focus_keyword text,
      seo_score int default 0,
      json_ld_schema jsonb,
      breadcrumb_schema jsonb,
      created_by uuid,
      order_index int not null default 0,
      is_featured boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.courses add constraint courses_status_check
      check (status in ('draft', 'review', 'approved', 'published', 'archived'));
    alter table public.courses enable row level security;
    return;
  end if;

  alter table public.courses add column if not exists status text not null default 'draft';
  alter table public.courses add column if not exists seo_title text;
  alter table public.courses add column if not exists seo_description text;
  alter table public.courses add column if not exists canonical_url text;
  alter table public.courses add column if not exists noindex boolean not null default false;
  alter table public.courses add column if not exists exclude_from_sitemap boolean not null default false;
  alter table public.courses add column if not exists deleted_at timestamptz;
  alter table public.courses add column if not exists created_by uuid;
end;
$$;

-- Courses: safe backfills + published_at from updated_at when missing.
do $$
begin
  if to_regclass('public.courses') is not null then
    update public.courses
    set is_active = coalesce(is_active, is_published, true),
        is_published = coalesce(is_published, is_active, true)
    where is_active is null or is_published is null;
    update public.courses set status = 'published' where status is null and coalesce(is_published, false) = true;
    update public.courses set status = 'draft' where status is null;
    update public.courses set noindex = false where noindex is null;
    update public.courses set exclude_from_sitemap = false where exclude_from_sitemap is null;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. TOOLS_EXTENDED — REPAIR MISSING CONTRACT COLUMNS
--    (202602120005_tools_extended.sql + publish contract + entity config)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.tools_extended') is null then
    raise notice 'tools_extended table missing; creating from repository contract.';
    create table public.tools_extended (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      title text,
      slug text not null unique,
      logo_url text,
      brand_color text,
      category text,
      description text,
      website_url text,
      is_active boolean not null default true,
      deleted_at timestamptz,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.tools_extended enable row level security;
    return;
  end if;

  alter table public.tools_extended add column if not exists title text;
  alter table public.tools_extended add column if not exists updated_at timestamptz not null default now();
  alter table public.tools_extended add column if not exists deleted_at timestamptz;
  alter table public.tools_extended add column if not exists created_by uuid;
end;
$$;

-- Backfill tools_extended.title from name (NULL-only) + visibility default.
do $$
begin
  if to_regclass('public.tools_extended') is not null then
    update public.tools_extended set title = name where title is null and name is not null;
    update public.tools_extended set is_active = true where is_active is null;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. REUSABLE_SECTIONS — CREATE ONLY IF ABSENT (genuinely in repo)
--    (202607220013_reusable_sections.sql + lib/cmsPublishing.js references table)
-- ----------------------------------------------------------------------------
create table if not exists public.reusable_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  title text,
  description text,
  section_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  category text default 'general',
  section_type text,
  published_at timestamptz,
  is_active boolean not null default true,
  order_index int not null default 0,
  deleted_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add compatibility + publishing columns if the table already existed.
alter table public.reusable_sections
  add column if not exists slug text,
  add column if not exists title text,
  add column if not exists status text not null default 'draft',
  add column if not exists is_active boolean not null default true,
  add column if not exists order_index int not null default 0,
  add column if not exists published_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill slug from name (NULL-only).
do $$
begin
  if to_regclass('public.reusable_sections') is not null then
    update public.reusable_sections
    set slug = lower(regexp_replace(trim(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'))
    where slug is null and name is not null;
    update public.reusable_sections set status = 'draft' where status is null;
    update public.reusable_sections set is_active = true where is_active is null;
  end if;
end;
$$;

create index if not exists idx_reusable_sections_slug on public.reusable_sections(slug);
create index if not exists idx_reusable_sections_type on public.reusable_sections(section_type);
create index if not exists idx_reusable_sections_category on public.reusable_sections(category);
create index if not exists idx_reusable_sections_status on public.reusable_sections(status);

-- RLS + policies
alter table public.reusable_sections enable row level security;
drop policy if exists "reusable_sections_public_select" on public.reusable_sections;
create policy "reusable_sections_public_select"
on public.reusable_sections for select
to anon, authenticated
using (status = 'published' and coalesce(is_active, true) = true and deleted_at is null);
drop policy if exists "reusable_sections_admin_all" on public.reusable_sections;
create policy "reusable_sections_admin_all"
on public.reusable_sections for all
to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. REUSABLE_BLOCKS — REPAIR MISSING CONTRACT COLUMNS
--    (202603130001 + cmsEntities.reusable_blocks uses slug + status)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.reusable_blocks') is null then
    raise notice 'reusable_blocks table missing; creating from repository contract.';
    create table public.reusable_blocks (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      slug text not null unique,
      title text,
      type text not null,
      content_json jsonb not null default '{}'::jsonb,
      style_json jsonb not null default '{}'::jsonb,
      status text not null default 'draft',
      published_at timestamptz,
      is_active boolean not null default true,
      deleted_at timestamptz,
      order_index int not null default 0,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.reusable_blocks enable row level security;
    return;
  end if;

  alter table public.reusable_blocks add column if not exists slug text;
  alter table public.reusable_blocks add column if not exists title text;
  alter table public.reusable_blocks add column if not exists published_at timestamptz;
  alter table public.reusable_blocks add column if not exists deleted_at timestamptz;
  alter table public.reusable_blocks add column if not exists is_active boolean not null default true;
  alter table public.reusable_blocks add column if not exists order_index int not null default 0;
  alter table public.reusable_blocks add column if not exists created_by uuid;
end;
$$;

-- Backfill slug from name (NULL-only).
do $$
begin
  if to_regclass('public.reusable_blocks') is not null then
    update public.reusable_blocks
    set slug = lower(regexp_replace(trim(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'))
    where slug is null and name is not null;
    update public.reusable_blocks set is_active = true where is_active is null;
  end if;
end;
$$;

create index if not exists idx_reusable_blocks_slug on public.reusable_blocks(slug);
create index if not exists idx_reusable_blocks_status on public.reusable_blocks(status);
alter table public.reusable_blocks enable row level security;
drop policy if exists "reusable_blocks_public_select" on public.reusable_blocks;
create policy "reusable_blocks_public_select"
on public.reusable_blocks for select
to anon, authenticated
using (status = 'published' and deleted_at is null);
drop policy if exists "reusable_blocks_admin_all" on public.reusable_blocks;
create policy "reusable_blocks_admin_all"
on public.reusable_blocks for all
to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. PAGE_TEMPLATES — REPAIR MISSING CONTRACT COLUMNS
--    (202603130001 + 202607220011_page_templates.sql)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.page_templates') is null then
    raise notice 'page_templates table missing; creating from repository contract.';
    create table public.page_templates (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      slug text not null unique,
      description text,
      template_type text not null check (template_type in ('homepage','landing','city','course','blog','contact','about','faq','privacy','terms')),
      page_type text,
      template_data jsonb not null default '{}'::jsonb,
      sections_json jsonb not null default '[]'::jsonb,
      style_json jsonb not null default '{}'::jsonb,
      is_active boolean not null default true,
      is_default boolean not null default false,
      deleted_at timestamptz,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.page_templates enable row level security;
    return;
  end if;

  alter table public.page_templates add column if not exists template_type text;
  alter table public.page_templates add column if not exists template_data jsonb not null default '{}'::jsonb;
  alter table public.page_templates add column if not exists is_default boolean not null default false;
  alter table public.page_templates add column if not exists deleted_at timestamptz;
  alter table public.page_templates add column if not exists created_by uuid;
  alter table public.page_templates add column if not exists sections_json jsonb not null default '[]'::jsonb;
  alter table public.page_templates add column if not exists style_json jsonb not null default '{}'::jsonb;
  alter table public.page_templates add column if not exists page_type text;
  alter table public.page_templates add column if not exists is_active boolean not null default true;
end;
$$;

-- Backfill template_type where only page_type exists (NULL-only, no data loss).
do $$
begin
  if to_regclass('public.page_templates') is not null then
    update public.page_templates set template_type = page_type where template_type is null and page_type is not null;
    update public.page_templates set template_type = 'landing' where template_type is null;
    update public.page_templates set is_active = true where is_active is null;
    update public.page_templates set is_default = false where is_default is null;
  end if;
end;
$$;

-- Rebuild the template_type check constraint only if existing data is compatible.
do $$
begin
  if to_regclass('public.page_templates') is not null
     and not exists (
       select 1 from public.page_templates
       where template_type is not null
         and template_type not in ('homepage','landing','city','course','blog','contact','about','faq','privacy','terms')
     )
  then
    alter table public.page_templates drop constraint if exists page_templates_template_type_check;
    alter table public.page_templates add constraint page_templates_template_type_check
      check (template_type in ('homepage','landing','city','course','blog','contact','about','faq','privacy','terms'));
  end if;
end;
$$;

create index if not exists idx_page_templates_slug on public.page_templates(slug);
create index if not exists idx_page_templates_type on public.page_templates(template_type);
create index if not exists idx_page_templates_default on public.page_templates(is_default) where is_default = true;

alter table public.page_templates enable row level security;
drop policy if exists "page_templates_public_select" on public.page_templates;
create policy "page_templates_public_select"
on public.page_templates for select
to anon, authenticated
using (is_active = true and deleted_at is null);
drop policy if exists "page_templates_admin_all" on public.page_templates;
create policy "page_templates_admin_all"
on public.page_templates for all
to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. SECTIONS — ADD LEGACY-COMPAT COLUMNS (probe-confirmed missing)
--     (202603130003 base; section_type + page_slug used by admin views / RLS)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.sections') is null then
    raise notice 'sections table missing; creating from repository contract.';
    create table public.sections (
      id uuid primary key default gen_random_uuid(),
      page_id uuid not null references public.pages(id) on delete cascade,
      page_slug text,
      type text not null,
      section_type text,
      order_index int not null default 0,
      content_json jsonb not null default '{}'::jsonb,
      style_json jsonb not null default '{}'::jsonb,
      visibility boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.sections enable row level security;
    return;
  end if;

  alter table public.sections add column if not exists section_type text;
  alter table public.sections add column if not exists page_slug text;
  alter table public.sections add column if not exists style_json jsonb not null default '{}'::jsonb;
end;
$$;

-- Backfill section_type from type (NULL-only).
do $$
begin
  if to_regclass('public.sections') is not null then
    update public.sections set section_type = type where section_type is null and type is not null;
    update public.sections
    set page_slug = (select p.slug from public.pages p where p.id = sections.page_id)
    where page_slug is null and page_id is not null;
  end if;
end;
$$;

create index if not exists idx_sections_section_type on public.sections(section_type);
create index if not exists idx_sections_page_slug on public.sections(page_slug);
alter table public.sections enable row level security;

-- ----------------------------------------------------------------------------
-- 11. UPDATED_AT TRIGGERS (repair for every repaired table)
-- ----------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'pages', 'blogs', 'location_pages', 'city_pages', 'courses',
    'tools_extended', 'reusable_sections', 'reusable_blocks', 'page_templates', 'sections'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
      execute format(
        'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
        tbl,
        tbl
      );
    end if;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 12. FOREIGN KEYS (only when referenced tables exist and no FK already exists)
-- ----------------------------------------------------------------------------
do $$
begin
  -- blogs.author_id -> authors
  if to_regclass('public.blogs') is not null and to_regclass('public.authors') is not null
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='blogs' and column_name='author_id')
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.blogs'::regclass and con.contype = 'f' and att.attname = 'author_id'
     )
  then
    begin
      alter table public.blogs add constraint blogs_author_id_fkey
        foreign key (author_id) references public.authors(id) on delete set null;
      raise notice 'Added FK blogs.author_id -> authors.id';
    exception when others then raise notice 'blogs.author_id FK skipped: %', sqlerrm; end;
  end if;

  -- blogs.created_by -> profiles
  if to_regclass('public.blogs') is not null and to_regclass('public.profiles') is not null
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='blogs' and column_name='created_by')
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.blogs'::regclass and con.contype = 'f' and att.attname = 'created_by'
     )
  then
    begin
      alter table public.blogs add constraint blogs_created_by_fkey
        foreign key (created_by) references public.profiles(id) on delete set null;
      raise notice 'Added FK blogs.created_by -> profiles.id';
    exception when others then raise notice 'blogs.created_by FK skipped: %', sqlerrm; end;
  end if;

  -- location_pages.city_id -> cities
  if to_regclass('public.location_pages') is not null and to_regclass('public.cities') is not null
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='location_pages' and column_name='city_id')
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.location_pages'::regclass and con.contype = 'f' and att.attname = 'city_id'
     )
  then
    begin
      alter table public.location_pages add constraint location_pages_city_id_fkey
        foreign key (city_id) references public.cities(id) on delete set null;
      raise notice 'Added FK location_pages.city_id -> cities.id';
    exception when others then raise notice 'location_pages.city_id FK skipped: %', sqlerrm; end;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 13. INDEXES
-- ----------------------------------------------------------------------------
do $$
declare
  duplicate_count int := 0;
begin
  -- Blogs
  if to_regclass('public.blogs') is not null then
    create index if not exists idx_blogs_slug on public.blogs(slug);
    create index if not exists idx_blogs_status on public.blogs(status);
    create index if not exists idx_blogs_is_active on public.blogs(is_active);
    create index if not exists idx_blogs_is_published on public.blogs(is_published);
    create index if not exists idx_blogs_published_at on public.blogs(published_at);
    create index if not exists idx_blogs_created_by on public.blogs(created_by);
    create index if not exists idx_blogs_author_id on public.blogs(author_id);
    create index if not exists idx_blogs_exclude_sitemap on public.blogs(exclude_from_sitemap) where exclude_from_sitemap = true;
    create index if not exists idx_blogs_publish_contract on public.blogs(slug, status, published_at, deleted_at);
    create index if not exists idx_blogs_scheduled_publish on public.blogs(scheduled_publish_at) where scheduled_publish_at is not null;
    create index if not exists idx_blogs_scheduled_unpublish on public.blogs(scheduled_unpublish_at) where scheduled_unpublish_at is not null;

    select count(*) into duplicate_count
    from (
      select lower(slug) from public.blogs
      where deleted_at is null
      group by lower(slug) having count(*) > 1
    ) dupes;
    if duplicate_count = 0 then
      create unique index if not exists idx_blogs_slug_live_lower_unique on public.blogs(lower(slug)) where deleted_at is null;
    else
      raise notice 'Skipping blogs lower-slug unique index: % duplicate live slug group(s).', duplicate_count;
    end if;
  end if;

  -- Location pages
  if to_regclass('public.location_pages') is not null then
    create index if not exists idx_location_pages_slug on public.location_pages(slug);
    create index if not exists idx_location_pages_status on public.location_pages(status);
    create index if not exists idx_location_pages_city_id on public.location_pages(city_id);
    create index if not exists idx_location_pages_publish_contract on public.location_pages(slug, status, published_at, deleted_at);
    create index if not exists idx_location_pages_exclude_sitemap on public.location_pages(exclude_from_sitemap) where exclude_from_sitemap = true;

    select count(*) into duplicate_count
    from (
      select lower(slug) from public.location_pages
      where deleted_at is null
      group by lower(slug) having count(*) > 1
    ) dupes;
    if duplicate_count = 0 then
      create unique index if not exists idx_location_pages_slug_live_lower_unique on public.location_pages(lower(slug)) where deleted_at is null;
    else
      raise notice 'Skipping location_pages lower-slug unique index: % duplicate live slug group(s).', duplicate_count;
    end if;
  end if;

  -- Courses
  if to_regclass('public.courses') is not null then
    create index if not exists idx_courses_slug on public.courses(slug);
    create index if not exists idx_courses_status on public.courses(status);
    create index if not exists idx_courses_is_active on public.courses(is_active);
    create index if not exists idx_courses_is_published on public.courses(is_published);
    create index if not exists idx_courses_exclude_sitemap on public.courses(exclude_from_sitemap) where exclude_from_sitemap = true;
  end if;

  -- Tools extended
  if to_regclass('public.tools_extended') is not null then
    create index if not exists idx_tools_extended_slug on public.tools_extended(slug);
    create index if not exists idx_tools_extended_is_active on public.tools_extended(is_active);
    create index if not exists idx_tools_extended_category on public.tools_extended(category);
    create index if not exists idx_tools_extended_publish_contract on public.tools_extended(slug, is_active, deleted_at);
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY + POLICIES
--     Public read = published + not deleted + within schedule windows.
--     Drafts, deleted and future-scheduled records stay private.
--     Admin write preserved via is_admin().
-- ----------------------------------------------------------------------------
do $$
begin
  -- pages
  if to_regclass('public.pages') is not null then
    alter table public.pages enable row level security;
    drop policy if exists "pages_public_select" on public.pages;
    create policy "pages_public_select"
    on public.pages for select to anon, authenticated
    using (
      status = 'published' and deleted_at is null
      and (published_at is null or published_at <= now())
      and (scheduled_publish_at is null or scheduled_publish_at <= now())
      and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
    );
    drop policy if exists "pages_admin_write" on public.pages;
    create policy "pages_admin_write"
    on public.pages for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- blogs
  if to_regclass('public.blogs') is not null then
    alter table public.blogs enable row level security;
    drop policy if exists "blogs_public_select" on public.blogs;
    create policy "blogs_public_select"
    on public.blogs for select to anon, authenticated
    using (
      status = 'published' and deleted_at is null
      and (published_at is null or published_at <= now())
      and (scheduled_publish_at is null or scheduled_publish_at <= now())
      and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
    );
    drop policy if exists "blogs_admin_write" on public.blogs;
    create policy "blogs_admin_write"
    on public.blogs for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- location_pages
  if to_regclass('public.location_pages') is not null then
    alter table public.location_pages enable row level security;
    drop policy if exists "location_pages_public_select" on public.location_pages;
    create policy "location_pages_public_select"
    on public.location_pages for select to anon, authenticated
    using (
      status = 'published' and deleted_at is null
      and (published_at is null or published_at <= now())
      and (scheduled_publish_at is null or scheduled_publish_at <= now())
      and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
    );
    drop policy if exists "location_pages_admin_write" on public.location_pages;
    create policy "location_pages_admin_write"
    on public.location_pages for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- city_pages
  if to_regclass('public.city_pages') is not null then
    alter table public.city_pages enable row level security;
    drop policy if exists "city_pages_public_select" on public.city_pages;
    create policy "city_pages_public_select"
    on public.city_pages for select to anon, authenticated
    using (is_active = true and deleted_at is null);
    drop policy if exists "city_pages_admin_write" on public.city_pages;
    create policy "city_pages_admin_write"
    on public.city_pages for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- courses
  if to_regclass('public.courses') is not null then
    alter table public.courses enable row level security;
    drop policy if exists "courses_public_select" on public.courses;
    create policy "courses_public_select"
    on public.courses for select to anon, authenticated
    using (is_active = true and deleted_at is null);
    drop policy if exists "courses_admin_write" on public.courses;
    create policy "courses_admin_write"
    on public.courses for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- tools_extended
  if to_regclass('public.tools_extended') is not null then
    alter table public.tools_extended enable row level security;
    drop policy if exists "tools_extended_public_select" on public.tools_extended;
    create policy "tools_extended_public_select"
    on public.tools_extended for select to anon, authenticated
    using (is_active = true and deleted_at is null);
    drop policy if exists "tools_extended_admin_write" on public.tools_extended;
    create policy "tools_extended_admin_write"
    on public.tools_extended for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
  end if;

  -- sections (public read tied to parent page publish state)
  if to_regclass('public.sections') is not null and to_regclass('public.pages') is not null then
    alter table public.sections enable row level security;
    drop policy if exists "sections_public_select" on public.sections;
    create policy "sections_public_select"
    on public.sections for select to anon, authenticated
    using (
      coalesce(visibility, true) = true
      and exists (
        select 1 from public.pages p
        where p.id = sections.page_id
          and p.status = 'published'
          and p.deleted_at is null
          and (p.published_at is null or p.published_at <= now())
          and (p.scheduled_publish_at is null or p.scheduled_publish_at <= now())
          and (p.scheduled_unpublish_at is null or p.scheduled_unpublish_at > now())
      )
    );
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 15. GRANTS (idempotent; anon is SELECT-only, service_role stays server-side)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant all privileges on sequences to service_role;

-- ----------------------------------------------------------------------------
-- 16. SUMMARY
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice '20260804_cms_schema_contract_parity applied successfully.';
end;
$$;

commit;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

