-- Service Pages: admin-manageable "service + city" landing pages (e.g. "Google Ads Course in
-- Bangalore", "SEO Course in Bangalore"), the pattern already hand-coded as one-off static
-- pages (app/(public)/google-ads-course-in-bangalore etc.) with no admin path to create new
-- ones. CMS_CONTENT_TYPES already had a `service_location` stub for this URL shape but it was
-- never backed by a real table or admin screen (see lib/cmsPublishing.js).
--
-- Unlike Cities/Locations (which combine a static prefix + admin-entered remainder slug),
-- the admin enters the FULL slug here (e.g. "google-ads-course-in-bangalore") - same
-- exact-slug-match contract as Standard Pages - so this reuses the generic /[slug] catch-all's
-- existing exact-match resolver instead of needing new prefix-matching logic.

create table if not exists public.service_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text,
  hero_title text,
  hero_subtitle text,
  overview text,
  curriculum jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  meta_title text,
  meta_description text,
  order_index int not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.service_pages_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify_text(coalesce(new.title, 'service')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_service_pages_slug on public.service_pages;
create trigger set_service_pages_slug
before insert or update on public.service_pages
for each row execute function public.service_pages_set_slug();

drop trigger if exists set_service_pages_updated_at on public.service_pages;
create trigger set_service_pages_updated_at
before update on public.service_pages
for each row execute function public.set_updated_at();

create unique index if not exists idx_service_pages_slug on public.service_pages(slug);
create index if not exists idx_service_pages_is_active on public.service_pages(is_active);
create index if not exists idx_service_pages_order on public.service_pages(order_index);

alter table public.service_pages enable row level security;

drop policy if exists "service_pages_public_select" on public.service_pages;
create policy "service_pages_public_select"
on public.service_pages for select
to anon, authenticated
using (is_active = true);

drop policy if exists "service_pages_admin_write" on public.service_pages;
create policy "service_pages_admin_write"
on public.service_pages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
