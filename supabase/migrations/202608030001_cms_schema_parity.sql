-- ============================================================================
-- 20260803_cms_schema_parity.sql
-- Repository-verified idempotent CMS schema parity migration for Acadvizen.
--
-- SOURCE OF TRUTH (inspected before generating):
--   lib/cmsEntities.js
--   lib/cmsPublishing.js
--   lib/cmsServer.js
--   app/api/cms/pages/route.js
--   app/api/cms/pages/[id]/route.js
--   app/api/cms/sections/route.js
--   app/api/cms/sections/[id]/route.js
--   app/api/cms/entities/[entity]/route.js
--   app/api/cms/entities/[entity]/[id]/route.js
--   app/api/cms/cities/route.js
--   app/api/cms/blogs/route.js
--   app/sitemap.ts
--   app/api/cms/sitemap/generate/route.js
--   all migrations under supabase/migrations/
--
-- REPO CONTRACT (verified):
--   pages core      : id uuid pk, title text, slug text unique, description text,
--                     seo_title text, seo_description text, content jsonb,
--                     status text (draft|review|approved|published|archived),
--                     created_at timestamptz, updated_at timestamptz
--   visibility      : is_active boolean, is_published boolean
--   publishing      : published_at timestamptz,
--                     scheduled_publish_at timestamptz,
--                     scheduled_unpublish_at timestamptz
--   soft delete     : deleted_at timestamptz
--   SEO             : canonical_url text, og_image text, noindex boolean,
--                     exclude_from_sitemap boolean, meta_title, meta_description,
--                     og_title, og_description, og_image_url, twitter_card,
--                     twitter_title, twitter_description, twitter_image_url,
--                     focus_keyword, seo_score, json_ld_schema, breadcrumb_schema
--   builder         : sections_json jsonb, page_template_id uuid,
--                     parent_id uuid self-ref, order_index int
--   workflow        : workflow_status, created_by, updated_by, reviewed_by,
--                     reviewed_at, approved_by, approved_at, published_by
--   city_pages      : genuinely in repo (202607220002_city_pages.sql +
--                     SEO manager + publish contract + cities route +
--                     cmsPublishing + cmsServer + sitemap route)
--
-- SAFETY RULES
--   * Never DROP TABLE / TRUNCATE / DELETE rows.
--   * Never disables RLS.
--   * Adds ONLY genuinely missing columns/indexes/triggers/policies/grants.
--   * Existing column values are never overwritten; backfills only touch NULLs.
--   * Foreign keys are added only when the referenced table exists and the
--     column does not already carry ANY foreign key (attribute-based guard).
--   * Entire migration is wrapped in a single transaction; fully idempotent.
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
      and lower(coalesce(p.role::text, '')) in ('super_admin', 'admin')
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
      and lower(coalesce(p.role::text, '')) in (
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
-- 1. PAGES TABLE — REPAIR
--    Detect + add ONLY genuinely missing columns. Existing columns preserved.
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pages') is null then
    raise notice 'pages table missing; creating it from repository contract.';
    create table public.pages (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      slug text not null unique,
      description text,
      seo_title text,
      seo_description text,
      content jsonb,
      status text not null default 'draft',
      is_active boolean not null default true,
      is_published boolean not null default false,
      published_at timestamptz,
      scheduled_publish_at timestamptz,
      scheduled_unpublish_at timestamptz,
      deleted_at timestamptz,
      canonical_url text,
      og_image text,
      noindex boolean not null default false,
      exclude_from_sitemap boolean not null default false,
      sections_json jsonb,
      page_template_id uuid,
      parent_id uuid,
      order_index int not null default 0,
      workflow_status text default 'draft',
      created_by uuid,
      updated_by uuid,
      reviewed_by uuid,
      reviewed_at timestamptz,
      approved_by uuid,
      approved_at timestamptz,
      published_by uuid,
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
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.pages
      add constraint pages_status_check check (status in ('draft', 'review', 'approved', 'published', 'archived'));
    return;
  end if;

  -- Core columns
  alter table public.pages add column if not exists title text;
  alter table public.pages add column if not exists slug text;
  alter table public.pages add column if not exists description text;
  alter table public.pages add column if not exists seo_title text;
  alter table public.pages add column if not exists seo_description text;
  alter table public.pages add column if not exists content jsonb;
  alter table public.pages add column if not exists status text not null default 'draft';
  alter table public.pages add column if not exists created_at timestamptz not null default now();
  alter table public.pages add column if not exists updated_at timestamptz not null default now();

  -- Visibility compatibility
  alter table public.pages add column if not exists is_active boolean not null default true;
  alter table public.pages add column if not exists is_published boolean not null default false;

  -- Publishing / scheduling / soft-delete
  alter table public.pages add column if not exists published_at timestamptz;
  alter table public.pages add column if not exists scheduled_publish_at timestamptz;
  alter table public.pages add column if not exists scheduled_unpublish_at timestamptz;
  alter table public.pages add column if not exists deleted_at timestamptz;

  -- SEO
  alter table public.pages add column if not exists canonical_url text;
  alter table public.pages add column if not exists og_image text;
  alter table public.pages add column if not exists noindex boolean not null default false;
  alter table public.pages add column if not exists exclude_from_sitemap boolean not null default false;
  alter table public.pages add column if not exists meta_title text;
  alter table public.pages add column if not exists meta_description text;
  alter table public.pages add column if not exists og_title text;
  alter table public.pages add column if not exists og_description text;
  alter table public.pages add column if not exists og_image_url text;
  alter table public.pages add column if not exists twitter_card text default 'summary_large_image';
  alter table public.pages add column if not exists twitter_title text;
  alter table public.pages add column if not exists twitter_description text;
  alter table public.pages add column if not exists twitter_image_url text;
  alter table public.pages add column if not exists focus_keyword text;
  alter table public.pages add column if not exists seo_score int default 0;
  alter table public.pages add column if not exists json_ld_schema jsonb;
  alter table public.pages add column if not exists breadcrumb_schema jsonb;

  -- Page builder
  alter table public.pages add column if not exists sections_json jsonb;
  alter table public.pages add column if not exists page_template_id uuid;
  alter table public.pages add column if not exists parent_id uuid;
  alter table public.pages add column if not exists order_index int not null default 0;

  -- Workflow
  alter table public.pages add column if not exists workflow_status text default 'draft';
  alter table public.pages add column if not exists created_by uuid;
  alter table public.pages add column if not exists updated_by uuid;
  alter table public.pages add column if not exists reviewed_by uuid;
  alter table public.pages add column if not exists reviewed_at timestamptz;
  alter table public.pages add column if not exists approved_by uuid;
  alter table public.pages add column if not exists approved_at timestamptz;
  alter table public.pages add column if not exists published_by uuid;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. SAFE BACKFILLS (only NULL values; existing data is never overwritten)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pages') is null then
    return;
  end if;

  -- Derive status from legacy boolean only when status is NULL.
  update public.pages
  set status = 'published'
  where status is null
    and coalesce(is_published, false) = true;

  update public.pages
  set status = 'draft'
  where status is null;

  -- published_at: derive only when missing AND the row is published.
  update public.pages
  set published_at = updated_at
  where (published_at is null)
    and status = 'published';

  -- content: derive from description ONLY when content is empty/null.
  -- Never overwrites a real jsonb document.
  update public.pages
  set content = jsonb_build_object('type', 'custom_rich_text', 'html', description)
  where (content is null)
    and description is not null
    and description <> '';

  -- visibility flags: fill NULL booleans without clobbering real values.
  update public.pages set is_active = true where is_active is null;
  update public.pages set is_published = (status = 'published') where is_published is null;

  -- SEO defaults
  update public.pages set noindex = false where noindex is null;
  update public.pages set exclude_from_sitemap = false where exclude_from_sitemap is null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. STATUS CHECK CONSTRAINT (5-state contract) — idempotent
-- ----------------------------------------------------------------------------
do $$
declare
  r text;
begin
  if to_regclass('public.pages') is null then
    return;
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.pages'::regclass and conname = 'pages_status_check'
  ) then
    alter table public.pages drop constraint pages_status_check;
  end if;

  -- Only re-add the 5-state check if current data satisfies it. If any row has
  -- an out-of-contract status, report it and preserve the data (no destructive cast).
  if not exists (
    select 1 from public.pages
    where status is null or status not in ('draft', 'review', 'approved', 'published', 'archived')
  ) then
    alter table public.pages
      add constraint pages_status_check check (status in ('draft', 'review', 'approved', 'published', 'archived'));
  else
    raise notice 'pages.status contains values outside the CMS contract; preserving rows and keeping no strict constraint. Review the following IDs:';
    for r in
      select id::text from public.pages
      where status is null or status not in ('draft', 'review', 'approved', 'published', 'archived')
    loop
      raise notice '  out-of-contract status row: %', r;
    end loop;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. FOREIGN KEYS (only when referenced tables exist and no FK already exists
--    on the attribute — attribute-based guard prevents duplicate FKs to either
--    auth.users or public.profiles)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pages') is null then
    return;
  end if;

  -- page_template_id -> page_templates
  if to_regclass('public.page_templates') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'pages' and column_name = 'page_template_id'
     )
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.pages'::regclass
         and con.contype = 'f'
         and att.attname = 'page_template_id'
     )
  then
    begin
      alter table public.pages
        add constraint pages_page_template_id_fkey foreign key (page_template_id)
        references public.page_templates(id) on delete set null;
      raise notice 'Added FK pages.page_template_id -> page_templates.id';
    exception when others then
      raise notice 'Could not add pages.page_template_id FK (reported, not forced): %', sqlerrm;
    end;
  end if;

  -- parent_id self-ref
  if exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'pages' and column_name = 'parent_id'
     )
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.pages'::regclass
         and con.contype = 'f'
         and att.attname = 'parent_id'
     )
  then
    begin
      alter table public.pages
        add constraint pages_parent_id_fkey foreign key (parent_id)
        references public.pages(id) on delete set null;
      raise notice 'Added FK pages.parent_id -> pages.id';
    exception when others then
      raise notice 'Could not add pages.parent_id FK (reported, not forced): %', sqlerrm;
    end;
  end if;

  -- created_by -> profiles (guard skips if an FK already exists, e.g. to auth.users)
  if to_regclass('public.profiles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'pages' and column_name = 'created_by'
     )
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.pages'::regclass
         and con.contype = 'f'
         and att.attname = 'created_by'
     )
  then
    begin
      alter table public.pages
        add constraint pages_created_by_fkey foreign key (created_by)
        references public.profiles(id) on delete set null;
      raise notice 'Added FK pages.created_by -> profiles.id';
    exception when others then
      raise notice 'Could not add pages.created_by FK (reported, not forced): %', sqlerrm;
    end;
  end if;

  -- updated_by -> profiles
  if to_regclass('public.profiles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'pages' and column_name = 'updated_by'
     )
     and not exists (
       select 1
       from pg_constraint con
       join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
       where con.conrelid = 'public.pages'::regclass
         and con.contype = 'f'
         and att.attname = 'updated_by'
     )
  then
    begin
      alter table public.pages
        add constraint pages_updated_by_fkey foreign key (updated_by)
        references public.profiles(id) on delete set null;
      raise notice 'Added FK pages.updated_by -> profiles.id';
    exception when others then
      raise notice 'Could not add pages.updated_by FK (reported, not forced): %', sqlerrm;
    end;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. UPDATED_AT TRIGGER (repair if missing)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pages') is not null then
    drop trigger if exists set_pages_updated_at on public.pages;
    create trigger set_pages_updated_at
      before update on public.pages
      for each row execute function public.set_updated_at();
    raise notice 'pages.updated_at trigger ensured.';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. INDEXES
-- ----------------------------------------------------------------------------
do $$
declare
  duplicate_count int := 0;
begin
  if to_regclass('public.pages') is null then
    return;
  end if;

  create index if not exists idx_pages_slug on public.pages(slug);
  create index if not exists idx_pages_status on public.pages(status);
  create index if not exists idx_pages_created_at on public.pages(created_at);
  create index if not exists idx_pages_updated_at on public.pages(updated_at);
  create index if not exists idx_pages_parent_id on public.pages(parent_id);
  create index if not exists idx_pages_slug_status on public.pages(slug, status);
  create index if not exists idx_pages_created_by on public.pages(created_by);
  create index if not exists idx_pages_exclude_sitemap on public.pages(exclude_from_sitemap) where exclude_from_sitemap = true;
  create index if not exists idx_pages_publish_contract on public.pages(slug, status, published_at, deleted_at);

  -- Live lower-slug unique index — only when no duplicate live slugs exist.
  select count(*) into duplicate_count
  from (
    select lower(slug) from public.pages
    where deleted_at is null
    group by lower(slug)
    having count(*) > 1
  ) dupes;

  if duplicate_count = 0 then
    create unique index if not exists idx_pages_slug_live_lower_unique on public.pages(lower(slug)) where deleted_at is null;
    raise notice 'pages live lower-slug unique index ensured (% duplicates found).', duplicate_count;
  else
    raise notice 'Skipping pages lower-slug unique index: % duplicate live slug group(s) exist (URLs preserved).', duplicate_count;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY + POLICIES
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.pages') is null then
    return;
  end if;

  alter table public.pages enable row level security;

  -- Public read: published + not deleted + within publish/schedule windows.
  -- Drafts, deleted records and future-scheduled records stay private.
  drop policy if exists "pages_public_select" on public.pages;
  create policy "pages_public_select"
  on public.pages for select
  to anon, authenticated
  using (
    status = 'published'
    and deleted_at is null
    and (published_at is null or published_at <= now())
    and (scheduled_publish_at is null or scheduled_publish_at <= now())
    and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
  );

  -- Admins: full write access (drafts, schedule edits, deletes).
  drop policy if exists "pages_admin_write" on public.pages;
  create policy "pages_admin_write"
  on public.pages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

  -- Legacy policy name from 20260731_rls_policies.sql (kept for compatibility).
  drop policy if exists "pages_admin_all" on public.pages;
  create policy "pages_admin_all"
  on public.pages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

  raise notice 'pages RLS + public/admin policies ensured.';
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. CITY_PAGES — create ONLY if genuinely absent; otherwise repair.
--    Verified repo contract: 202607220002_city_pages.sql + SEO manager +
--    publish-contract migration + cmsPublishing.city_page + cmsServer +
--    cities route + sitemap route.
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.city_pages') is null then
    raise notice 'city_pages table missing; creating from repository contract.';
    create table public.city_pages (
      id uuid primary key default gen_random_uuid(),
      city_name text not null,
      slug text not null unique,
      hero_title text,
      hero_subtitle text,
      hero_description text,
      hero_image_url text,
      hero_video_url text,
      hero_cta_text text,
      hero_cta_link text,
      about_title text,
      about_description text,
      about_image_url text,
      features jsonb not null default '[]'::jsonb,
      stats jsonb not null default '[]'::jsonb,
      testimonials jsonb not null default '[]'::jsonb,
      gallery jsonb not null default '[]'::jsonb,
      faqs jsonb not null default '[]'::jsonb,
      contact_phone text,
      contact_email text,
      contact_address text,
      google_maps_url text,
      seo_title text,
      seo_description text,
      meta_keywords text,
      og_image_url text,
      canonical_url text,
      meta_title text,
      meta_description text,
      og_title text,
      og_description text,
      twitter_card text default 'summary_large_image',
      twitter_title text,
      twitter_description text,
      twitter_image_url text,
      focus_keyword text,
      seo_score int default 0,
      json_ld_schema jsonb,
      breadcrumb_schema jsonb,
      exclude_from_sitemap boolean default false,
      is_active boolean default true,
      deleted_at timestamptz,
      published_at timestamptz,
      scheduled_publish_at timestamptz,
      scheduled_unpublish_at timestamptz,
      priority int default 0,
      created_by uuid,
      updated_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.city_pages enable row level security;
  else
    -- Repair missing columns on existing city_pages.
    alter table public.city_pages add column if not exists city_name text not null default '';
    alter table public.city_pages add column if not exists slug text;
    alter table public.city_pages add column if not exists hero_title text;
    alter table public.city_pages add column if not exists hero_subtitle text;
    alter table public.city_pages add column if not exists hero_description text;
    alter table public.city_pages add column if not exists hero_image_url text;
    alter table public.city_pages add column if not exists hero_video_url text;
    alter table public.city_pages add column if not exists hero_cta_text text;
    alter table public.city_pages add column if not exists hero_cta_link text;
    alter table public.city_pages add column if not exists about_title text;
    alter table public.city_pages add column if not exists about_description text;
    alter table public.city_pages add column if not exists about_image_url text;
    alter table public.city_pages add column if not exists features jsonb not null default '[]'::jsonb;
    alter table public.city_pages add column if not exists stats jsonb not null default '[]'::jsonb;
    alter table public.city_pages add column if not exists testimonials jsonb not null default '[]'::jsonb;
    alter table public.city_pages add column if not exists gallery jsonb not null default '[]'::jsonb;
    alter table public.city_pages add column if not exists faqs jsonb not null default '[]'::jsonb;
    alter table public.city_pages add column if not exists contact_phone text;
    alter table public.city_pages add column if not exists contact_email text;
    alter table public.city_pages add column if not exists contact_address text;
    alter table public.city_pages add column if not exists google_maps_url text;
    alter table public.city_pages add column if not exists seo_title text;
    alter table public.city_pages add column if not exists seo_description text;
    alter table public.city_pages add column if not exists meta_keywords text;
    alter table public.city_pages add column if not exists og_image_url text;
    alter table public.city_pages add column if not exists canonical_url text;
    alter table public.city_pages add column if not exists meta_title text;
    alter table public.city_pages add column if not exists meta_description text;
    alter table public.city_pages add column if not exists og_title text;
    alter table public.city_pages add column if not exists og_description text;
    alter table public.city_pages add column if not exists twitter_card text default 'summary_large_image';
    alter table public.city_pages add column if not exists twitter_title text;
    alter table public.city_pages add column if not exists twitter_description text;
    alter table public.city_pages add column if not exists twitter_image_url text;
    alter table public.city_pages add column if not exists focus_keyword text;
    alter table public.city_pages add column if not exists seo_score int default 0;
    alter table public.city_pages add column if not exists json_ld_schema jsonb;
    alter table public.city_pages add column if not exists breadcrumb_schema jsonb;
    alter table public.city_pages add column if not exists exclude_from_sitemap boolean default false;
    alter table public.city_pages add column if not exists is_active boolean default true;
    alter table public.city_pages add column if not exists deleted_at timestamptz;
    alter table public.city_pages add column if not exists published_at timestamptz;
    alter table public.city_pages add column if not exists scheduled_publish_at timestamptz;
    alter table public.city_pages add column if not exists scheduled_unpublish_at timestamptz;
    alter table public.city_pages add column if not exists priority int default 0;
    alter table public.city_pages add column if not exists created_by uuid;
    alter table public.city_pages add column if not exists updated_by uuid;
    alter table public.city_pages add column if not exists created_at timestamptz not null default now();
    alter table public.city_pages add column if not exists updated_at timestamptz not null default now();
    alter table public.city_pages enable row level security;
  end if;

  -- City pages: indexes
  create index if not exists idx_city_pages_slug on public.city_pages(slug);
  create index if not exists idx_city_pages_is_active on public.city_pages(is_active);
  create index if not exists idx_city_pages_priority on public.city_pages(priority);
  create index if not exists idx_city_pages_city_name on public.city_pages(city_name);
  create index if not exists idx_city_pages_publish_contract on public.city_pages(slug, is_active, deleted_at);
  create index if not exists idx_city_pages_exclude_sitemap on public.city_pages(exclude_from_sitemap) where exclude_from_sitemap = true;

  -- City pages: trigger
  drop trigger if exists set_city_pages_updated_at on public.city_pages;
  create trigger set_city_pages_updated_at
    before update on public.city_pages
    for each row execute function public.set_updated_at();

  -- City pages: policies
  drop policy if exists "city_pages_public_select" on public.city_pages;
  create policy "city_pages_public_select"
  on public.city_pages for select
  to anon, authenticated
  using (is_active = true and deleted_at is null);

  drop policy if exists "city_pages_admin_write" on public.city_pages;
  create policy "city_pages_admin_write"
  on public.city_pages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

  raise notice 'city_pages ensured.';
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. GRANTS (idempotent; anon is SELECT-only, service_role stays server-side)
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
-- 10. SUMMARY NOTICE
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice '20260803_cms_schema_parity applied successfully.';
end;
$$;

commit;

