-- Companies and Internships public-consumer support
-- The admin UI for Companies already collects description/website_url/hiring_status/is_featured,
-- but the underlying table never had those columns, so saves silently dropped them.
-- Both entities also need a slug + an is_active gate so they can be published to/removed from
-- the public site the same way every other CMS entity is.

alter table if exists public.companies
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists website_url text,
  add column if not exists hiring_status text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- Some environments already had a set_companies_updated_at trigger referencing
-- updated_at before the column existed, which would fail every update. Make sure
-- the trigger exists now that the column is guaranteed to be present.
drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table if exists public.internships
  add column if not exists slug text;

create or replace function public.slugify_text(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Slugs are always derived from the name field(s) + a short id suffix, so they are
-- guaranteed unique without requiring the admin to type or manage a slug themselves.
create or replace function public.companies_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify_text(coalesce(new.company_name, 'company')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

create or replace function public.internships_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify_text(coalesce(new.company_name, '') || '-' || coalesce(new.role, 'internship')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_companies_slug on public.companies;
create trigger set_companies_slug
before insert or update on public.companies
for each row execute function public.companies_set_slug();

drop trigger if exists set_internships_slug on public.internships;
create trigger set_internships_slug
before insert or update on public.internships
for each row execute function public.internships_set_slug();

-- Backfill existing rows so nothing already in the table is left without a slug.
update public.companies set updated_at = updated_at where slug is null or btrim(slug) = '';
update public.internships set updated_at = updated_at where slug is null or btrim(slug) = '';

create unique index if not exists idx_companies_slug on public.companies(slug);
create unique index if not exists idx_internships_slug on public.internships(slug);
create index if not exists idx_companies_is_active on public.companies(is_active);

-- Companies previously had an unconditional public-read policy (no publish gate at all).
-- Bring it in line with every other public content type: public only sees is_active = true.
drop policy if exists "companies_public_select" on public.companies;
create policy "companies_public_select"
on public.companies
for select
to anon, authenticated
using (is_active = true);
