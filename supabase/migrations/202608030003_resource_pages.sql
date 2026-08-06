-- Resource Pages: give every `resources` row (Admin > Resources) a real public page.
--
-- The `resources` table already existed for downloadable/linked attachments (course_id,
-- tool_id, resource_type, file_url, external_url) surfaced inside Course/Tool pages, but it
-- had no `slug` and no standalone public route - so a "resource" created in Admin had nowhere
-- of its own to live on the live site. This adds slug + SEO fields (auto-generated slug,
-- admin-editable override, same pattern as locations/companies/internships) so each resource
-- can also render as a real, indexable page at /resources/{slug}.

alter table public.resources
  add column if not exists slug text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists content text;

create or replace function public.resources_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.slugify_text(coalesce(new.title, 'resource')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists set_resources_slug on public.resources;
create trigger set_resources_slug
before insert or update on public.resources
for each row execute function public.resources_set_slug();

update public.resources set slug = public.slugify_text(coalesce(title, 'resource')) || '-' || substr(id::text, 1, 8)
where slug is null or btrim(slug) = '';

create unique index if not exists idx_resources_slug on public.resources(slug);
