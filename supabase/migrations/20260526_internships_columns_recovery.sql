-- Recovery migration for 20260527_admin_cms_schema_fix.sql (tracked, not edited here).
--
-- 20260306_admin_seo_cms_upgrade.sql originally created public.internships with only
-- (id, company_name, role, description, logo, created_at). 20260527_admin_cms_schema_fix.sql
-- assumes it can `create table if not exists public.internships (... full columns ...)` to
-- backfill the rest - but CREATE TABLE IF NOT EXISTS is all-or-nothing: since the table
-- already existed, that whole statement was skipped and none of the intended columns
-- (location, duration, salary, deadline, apply_link, eligibility, status, is_active,
-- updated_at) were ever added. The very next statement in that file then references
-- is_active in a CREATE POLICY and fails outright, aborting the rest of that migration
-- (lms_modules/lms_lessons table creation, placements columns, and its final indexes never
-- ran either). Dated to run the day before so 20260527_admin_cms_schema_fix.sql finds every
-- column it expects already present and completes successfully end to end.

alter table public.internships
  add column if not exists location text,
  add column if not exists duration text,
  add column if not exists salary text,
  add column if not exists deadline timestamptz,
  add column if not exists apply_link text,
  add column if not exists eligibility text,
  add column if not exists status text,
  add column if not exists is_active boolean default true,
  add column if not exists updated_at timestamptz not null default now();
