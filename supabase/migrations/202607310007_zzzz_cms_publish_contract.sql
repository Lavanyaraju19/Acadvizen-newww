-- CMS publishing contract hardening.
-- Keeps existing URLs/data, adds compatibility columns, and tightens public read rules.

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

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'pages',
    'blogs',
    'location_pages',
    'city_pages',
    'courses',
    'tools_extended',
    'reusable_sections',
    'reusable_blocks',
    'page_templates'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format('alter table public.%I add column if not exists deleted_at timestamptz', tbl);
      execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', tbl);
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

alter table if exists public.pages
  add column if not exists published_at timestamptz,
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists scheduled_unpublish_at timestamptz;

alter table if exists public.blogs
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists scheduled_unpublish_at timestamptz;

alter table if exists public.location_pages
  add column if not exists published_at timestamptz,
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists scheduled_unpublish_at timestamptz;

alter table if exists public.reusable_sections
  add column if not exists published_at timestamptz;

alter table if exists public.reusable_blocks
  add column if not exists published_at timestamptz;

alter table if exists public.courses
  add column if not exists is_active boolean not null default true,
  add column if not exists is_published boolean not null default true;

do $$
begin
  if to_regclass('public.courses') is not null then
    update public.courses
    set is_active = coalesce(is_active, is_published, true),
        is_published = coalesce(is_published, is_active, true);
  end if;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['pages', 'blogs', 'location_pages', 'reusable_sections', 'reusable_blocks']
  loop
    if to_regclass('public.' || tbl) is not null and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = tbl
        and column_name = 'status'
    ) then
      execute format('alter table public.%I drop constraint if exists %I_status_check', tbl, tbl);
      execute format(
        'alter table public.%I add constraint %I_status_check check (status in (''draft'', ''review'', ''approved'', ''published'', ''archived''))',
        tbl,
        tbl
      );
    end if;
  end loop;
end;
$$;

do $$
declare
  duplicate_count int := 0;
  invalid_count int := 0;
begin
  if to_regclass('public.pages') is not null then
    create index if not exists idx_pages_publish_contract on public.pages(slug, status, published_at, deleted_at);
    select count(*) into duplicate_count
    from (
      select lower(slug)
      from public.pages
      where deleted_at is null
      group by lower(slug)
      having count(*) > 1
    ) duplicates;
    select count(*) into invalid_count
    from public.pages
    where slug is null or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    if duplicate_count > 0 then
      raise warning 'Skipping pages lower-slug unique index: % duplicate live slug group(s) exist.', duplicate_count;
    end if;
    if invalid_count > 0 then
      raise warning 'Pages contains % invalid slug(s). Existing URLs are preserved; clean these manually before enforcing stricter validation.', invalid_count;
    end if;
  end if;

  if to_regclass('public.blogs') is not null then
    create index if not exists idx_blogs_publish_contract on public.blogs(slug, status, published_at, deleted_at);
    select count(*) into duplicate_count
    from (
      select lower(slug)
      from public.blogs
      where deleted_at is null
      group by lower(slug)
      having count(*) > 1
    ) duplicates;
    select count(*) into invalid_count
    from public.blogs
    where slug is null or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    if duplicate_count > 0 then
      raise warning 'Skipping blogs lower-slug unique index: % duplicate live slug group(s) exist.', duplicate_count;
    end if;
    if invalid_count > 0 then
      raise warning 'Blogs contains % invalid slug(s). Existing URLs are preserved; clean these manually before enforcing stricter validation.', invalid_count;
    end if;
  end if;

  if to_regclass('public.location_pages') is not null then
    create index if not exists idx_location_pages_publish_contract on public.location_pages(slug, status, published_at, deleted_at);
    select count(*) into duplicate_count
    from (
      select lower(slug)
      from public.location_pages
      where deleted_at is null
      group by lower(slug)
      having count(*) > 1
    ) duplicates;
    select count(*) into invalid_count
    from public.location_pages
    where slug is null or slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$';
    if duplicate_count > 0 then
      raise warning 'Skipping location_pages lower-slug unique index: % duplicate live slug group(s) exist.', duplicate_count;
    end if;
    if invalid_count > 0 then
      raise warning 'Location pages contains % invalid slug(s). Existing URLs are preserved; clean these manually before enforcing stricter validation.', invalid_count;
    end if;
  end if;

  if to_regclass('public.city_pages') is not null then
    create index if not exists idx_city_pages_publish_contract on public.city_pages(slug, is_active, deleted_at);
  end if;

  if to_regclass('public.courses') is not null then
    create index if not exists idx_courses_publish_contract on public.courses(slug, is_active, deleted_at);
  end if;

  if to_regclass('public.tools_extended') is not null then
    create index if not exists idx_tools_extended_publish_contract on public.tools_extended(slug, is_active, deleted_at);
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.pages') is not null and not exists (
    select 1
    from public.pages
    where deleted_at is null
    group by lower(slug)
    having count(*) > 1
  ) then
    create unique index if not exists idx_pages_slug_live_lower_unique on public.pages(lower(slug)) where deleted_at is null;
  end if;

  if to_regclass('public.blogs') is not null and not exists (
    select 1
    from public.blogs
    where deleted_at is null
    group by lower(slug)
    having count(*) > 1
  ) then
    create unique index if not exists idx_blogs_slug_live_lower_unique on public.blogs(lower(slug)) where deleted_at is null;
  end if;

  if to_regclass('public.location_pages') is not null and not exists (
    select 1
    from public.location_pages
    where deleted_at is null
    group by lower(slug)
    having count(*) > 1
  ) then
    create unique index if not exists idx_location_pages_slug_live_lower_unique on public.location_pages(lower(slug)) where deleted_at is null;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.pages') is not null then
    alter table public.pages enable row level security;
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
  end if;

  if to_regclass('public.blogs') is not null then
    alter table public.blogs enable row level security;
    drop policy if exists "blogs_public_select" on public.blogs;
    create policy "blogs_public_select"
    on public.blogs for select
    to anon, authenticated
    using (
      status = 'published'
      and deleted_at is null
      and published_at is not null
      and published_at <= now()
      and (scheduled_publish_at is null or scheduled_publish_at <= now())
      and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
    );
  end if;

  if to_regclass('public.location_pages') is not null then
    alter table public.location_pages enable row level security;
    drop policy if exists "location_pages_public_select" on public.location_pages;
    create policy "location_pages_public_select"
    on public.location_pages for select
    to anon, authenticated
    using (
      status = 'published'
      and deleted_at is null
      and (published_at is null or published_at <= now())
      and (scheduled_publish_at is null or scheduled_publish_at <= now())
      and (scheduled_unpublish_at is null or scheduled_unpublish_at > now())
    );
  end if;

  if to_regclass('public.sections') is not null and to_regclass('public.pages') is not null then
    alter table public.sections enable row level security;
    drop policy if exists "sections_public_select" on public.sections;
    create policy "sections_public_select"
    on public.sections for select
    to anon, authenticated
    using (
      coalesce(visibility, true) = true
      and exists (
        select 1
        from public.pages p
        where p.id = sections.page_id
          and p.status = 'published'
          and p.deleted_at is null
          and (p.published_at is null or p.published_at <= now())
          and (p.scheduled_publish_at is null or p.scheduled_publish_at <= now())
          and (p.scheduled_unpublish_at is null or p.scheduled_unpublish_at > now())
      )
    );
  end if;

  if to_regclass('public.blog_content_blocks') is not null and to_regclass('public.blogs') is not null then
    alter table public.blog_content_blocks enable row level security;
    drop policy if exists "blog_content_blocks_public_select" on public.blog_content_blocks;
    create policy "blog_content_blocks_public_select"
    on public.blog_content_blocks for select
    to anon, authenticated
    using (
      exists (
        select 1
        from public.blogs b
        where b.id = blog_content_blocks.blog_id
          and b.status = 'published'
          and b.deleted_at is null
          and b.published_at is not null
          and b.published_at <= now()
          and (b.scheduled_publish_at is null or b.scheduled_publish_at <= now())
          and (b.scheduled_unpublish_at is null or b.scheduled_unpublish_at > now())
      )
    );
  end if;

  if to_regclass('public.city_pages') is not null then
    alter table public.city_pages enable row level security;
    drop policy if exists "city_pages_public_select" on public.city_pages;
    create policy "city_pages_public_select"
    on public.city_pages for select
    to anon, authenticated
    using (is_active = true and deleted_at is null);
  end if;

  if to_regclass('public.courses') is not null then
    alter table public.courses enable row level security;
    drop policy if exists "courses_public_select" on public.courses;
    create policy "courses_public_select"
    on public.courses for select
    to anon, authenticated
    using (is_active = true and deleted_at is null);
  end if;
end;
$$;

do $$
begin
  raise notice 'Applied CMS publish contract migration.';
end;
$$;
