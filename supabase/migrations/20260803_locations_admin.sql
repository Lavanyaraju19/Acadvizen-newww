-- Locations (Areas) admin management
--
-- app/api/locations/route.js, the public /digital-marketing-courses-{slug} route, and the
-- public footer's dynamic "Digital Marketing Courses in India" link list all already read
-- from a `locations` table -- but no migration ever created it and no Admin screen ever wrote
-- to it, so an administrator had no way to add a footer-linked area without raw SQL/Supabase
-- access. This creates the table (idempotently, so it's a no-op if it already exists with a
-- compatible shape elsewhere) and gives it the same publish/visibility contract as every other
-- CMS entity so it can be managed through the generic Admin entity screen.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  footer_label text,
  meta_title text,
  meta_description text,
  intro_text text,
  why_text text,
  demand_text text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.locations
  add column if not exists slug text,
  add column if not exists footer_label text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists intro_text text,
  add column if not exists why_text text,
  add column if not exists demand_text text,
  add column if not exists order_index int not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.locations_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify_text(coalesce(new.name, 'location')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_locations_slug on public.locations;
create trigger set_locations_slug
before insert or update on public.locations
for each row execute function public.locations_set_slug();

drop trigger if exists set_locations_updated_at on public.locations;
create trigger set_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

update public.locations set updated_at = updated_at where slug is null or btrim(slug) = '';

create unique index if not exists idx_locations_slug on public.locations(slug);
create index if not exists idx_locations_is_active on public.locations(is_active);
create index if not exists idx_locations_order on public.locations(order_index);

alter table public.locations enable row level security;

drop policy if exists "locations_public_select" on public.locations;
create policy "locations_public_select"
on public.locations for select
to anon, authenticated
using (is_active = true);

drop policy if exists "locations_admin_write" on public.locations;
create policy "locations_admin_write"
on public.locations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
