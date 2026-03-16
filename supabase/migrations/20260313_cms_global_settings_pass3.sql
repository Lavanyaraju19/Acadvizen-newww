-- Global settings extension for advanced CMS control.
-- Safe/idempotent.

alter table public.site_settings
  add column if not exists company_name text,
  add column if not exists default_og_image text;

update public.site_settings
set company_name = coalesce(company_name, 'Acadvizen')
where id = 'default';

do $$
begin
  if to_regclass('public.seo_metadata') is not null then
    alter table public.seo_metadata
      add column if not exists noindex boolean not null default false;
  end if;
end
$$;
