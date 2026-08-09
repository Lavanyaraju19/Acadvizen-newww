-- Additive geography-type support on the existing "locations" table, per architectural
-- decision: reuse the existing Location entity rather than create a competing geography
-- model. No campus/training-center rows are seeded - no real physical-center data (address,
-- phone, coordinates) exists anywhere in this schema today, and this migration does not
-- invent any. It only makes the schema ready for real campus data to be entered later.

alter table public.locations add column if not exists location_type text not null default 'area';
alter table public.locations add column if not exists address text;
alter table public.locations add column if not exists phone text;
alter table public.locations add column if not exists whatsapp text;
alter table public.locations add column if not exists latitude numeric;
alter table public.locations add column if not exists longitude numeric;
alter table public.locations add column if not exists opening_hours text;
alter table public.locations add column if not exists facilities jsonb;

comment on column public.locations.location_type is 'area (default, SEO landing page) | campus | training_center';
