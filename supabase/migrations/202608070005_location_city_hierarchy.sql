-- Wires the existing `locations` table (areas/localities, e.g. "JP Nagar") into the existing
-- `cities` table (e.g. "Bangalore") via a real foreign key, matching the FK pattern already used
-- by `location_pages.city_id -> cities.id`. This does not create any new table: `cities` and
-- `locations` already exist in production; this migration only relates them and seeds the two
-- real cities implied by the existing `locations` rows (Bangalore, Mysore) so the relationship is
-- immediately usable. No existing row is deleted or overwritten - `city_id` is added as a nullable
-- column and backfilled only for rows that are genuinely areas within a city.

alter table public.locations
  add column if not exists city_id uuid references public.cities(id) on delete set null;

create index if not exists locations_city_id_idx on public.locations(city_id);

insert into public.cities (name, slug, state, country, is_active)
select 'Bangalore', 'bangalore', 'Karnataka', 'India', true
where not exists (select 1 from public.cities where slug = 'bangalore');

insert into public.cities (name, slug, state, country, is_active)
select 'Mysore', 'mysore', 'Karnataka', 'India', true
where not exists (select 1 from public.cities where slug = 'mysore');

-- Backfill: link existing area/locality rows to Bangalore. The `india`, `bangalore` and `mysore`
-- rows in `locations` represent country/city-level entries (used for the footer index), not areas
-- within a city, so they are intentionally left with city_id = null.
update public.locations
set city_id = (select id from public.cities where slug = 'bangalore')
where slug in (
  'hsr-layout', 'indiranagar', 'jayanagar', 'jp-nagar', 'koramangala',
  'marathahalli', 'mg-road', 'rajajinagar', 'rr-nagar', 'whitefield'
)
and city_id is null;
