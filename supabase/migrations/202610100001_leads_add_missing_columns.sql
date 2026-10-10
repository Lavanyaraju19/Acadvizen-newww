-- Production's leads table predates 202603130001_cms_expansion_pass2.sql: it was created with
-- id, name, email, phone, status and created_at only, so that migration's
-- "create table if not exists public.leads (...)" was skipped and the columns the lead forms send
-- (full_name, page_slug, source, form_type, payload) were never added. The leads API then dropped
-- them on insert: leads kept only their email and phone (found 10 October 2026).
-- Safe to run more than once, and on databases created from the newer definition.

alter table public.leads add column if not exists full_name text;
alter table public.leads add column if not exists page_slug text;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists form_type text;
alter table public.leads add column if not exists payload jsonb not null default '{}'::jsonb;
-- The set_leads_updated_at trigger (202603130001) writes this column on every update.
alter table public.leads add column if not exists updated_at timestamptz not null default now();

-- Leads saved before this migration kept their name in the older "name" column (where it exists).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'name'
  ) then
    update public.leads set full_name = name where full_name is null and name is not null;
  end if;
end $$;
