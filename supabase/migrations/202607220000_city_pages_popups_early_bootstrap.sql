-- Ordering-dependency fix for the 2026-07-22 migration batch (tracked files not edited here).
--
-- Two of that day's tracked migrations reference tables that are only created by OTHER
-- migrations dated the same day:
--   202607220015_seo_manager.sql       -> `alter table public.city_pages ...` (no IF EXISTS)
--                                          but public.city_pages is created by
--                                          20260722_city_pages.sql
--   20260722_content_scheduling.sql    -> `alter table public.popups ...` (no IF EXISTS)
--                                          but public.popups is created by
--                                          20260722_popup_management.sql
-- Both pairs sort in the wrong relative order for filename-based migration application (the
-- 12-digit-prefix files from an earlier naming convention sort before the 8-digit-prefix
-- files for the same day), so seo_manager and content_scheduling fail outright and abort
-- before creating public.sitemap_settings / public.handle_scheduled_publishing() /
-- public.get_scheduled_items() - real, needed objects declared later in those same files.
--
-- This migration creates city_pages and popups early (numeric prefix 202607220000, sorting
-- before every other 2026-07-22 migration) using the exact schema their real creator files
-- (20260722_city_pages.sql / 20260722_popup_management.sql) define, so those files become
-- harmless no-ops (CREATE TABLE IF NOT EXISTS) when they run later the same day, and every
-- same-day migration that references these tables finds them already in place.

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- city_pages (matches 20260722_city_pages.sql exactly)
create table if not exists public.city_pages (
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
  is_active boolean default true,
  priority int default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_city_pages_slug on public.city_pages(slug);
create index if not exists idx_city_pages_is_active on public.city_pages(is_active);
create index if not exists idx_city_pages_priority on public.city_pages(priority);
create index if not exists idx_city_pages_city_name on public.city_pages(city_name);
drop trigger if exists set_city_pages_updated_at on public.city_pages;
create trigger set_city_pages_updated_at
before update on public.city_pages
for each row execute function public.set_updated_at();
alter table public.city_pages enable row level security;
drop policy if exists "city_pages_public_select" on public.city_pages;
create policy "city_pages_public_select"
on public.city_pages for select to anon, authenticated
using (is_active = true);
drop policy if exists "city_pages_admin_write" on public.city_pages;
create policy "city_pages_admin_write"
on public.city_pages for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- popups (matches 20260722_popup_management.sql exactly)
create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'modal' check (type in ('modal', 'slide_in', 'bar', 'corner')),
  trigger_type text not null default 'delay' check (trigger_type in ('immediate', 'delay', 'scroll', 'exit_intent', 'click')),
  trigger_value int default 5,
  content text,
  html_content text,
  image_url text,
  close_button boolean default true,
  overlay boolean default true,
  mobile_enabled boolean default true,
  tablet_enabled boolean default true,
  desktop_enabled boolean default true,
  show_frequency text default 'session' check (show_frequency in ('session', 'always', 'once_per_visitor', 'custom')),
  custom_frequency_days int default 7,
  start_date timestamptz,
  end_date timestamptz,
  target_pages jsonb not null default '[]'::jsonb,
  exclude_pages jsonb not null default '[]'::jsonb,
  is_active boolean default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_popups_status on public.popups(status);
create index if not exists idx_popups_is_active on public.popups(is_active);
create index if not exists idx_popups_updated_at on public.popups(updated_at desc);
drop trigger if exists set_popups_updated_at on public.popups;
create trigger set_popups_updated_at
before update on public.popups
for each row execute function public.set_updated_at();
alter table public.popups enable row level security;
drop policy if exists "popups_public_select" on public.popups;
create policy "popups_public_select"
on public.popups for select to anon, authenticated
using (status = 'published' and is_active = true);
drop policy if exists "popups_admin_write" on public.popups;
create policy "popups_admin_write"
on public.popups for all to authenticated
using (public.is_admin())
with check (public.is_admin());
