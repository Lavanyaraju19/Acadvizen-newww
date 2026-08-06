-- Schema integrity cleanup found by a full from-empty migration replay + audit:
--   1. admins / media_files / seo_meta have row level security DISABLED while `anon` holds
--      a table-level GRANT SELECT (from the blanket `grant select on all tables in schema
--      public to anon` statements repeated throughout this migration history) - so every row,
--      including admins.email, is currently readable by any unauthenticated request. All three
--      are legacy tables with zero references anywhere in the current application code
--      (superseded by profiles/auth.users, media, and seo_metadata respectively) - not dropped
--      here since a dead-code grep is not proof of zero external dependents, but locked down to
--      the same RLS contract their successor tables already use.
--   2. 37 functionally duplicate indexes (same table + same column set, two different names -
--      mostly a hand-written `idx_X_Y` coexisting with the index Postgres already auto-creates
--      for a `unique` column constraint, plus a few abbreviated-vs-full-name duplicates like
--      `_active` vs `_is_active`). Harmless but real redundant write overhead; the constraint-
--      backed or full-column-name index is kept in every case, the redundant custom one dropped.

-- 1. Lock down legacy ungated tables -----------------------------------------------------

alter table public.admins enable row level security;
drop policy if exists "admins_admin_only" on public.admins;
create policy "admins_admin_only"
on public.admins for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.media_files enable row level security;
drop policy if exists "media_files_public_select" on public.media_files;
create policy "media_files_public_select"
on public.media_files for select
to anon, authenticated
using (true);
drop policy if exists "media_files_admin_write" on public.media_files;
create policy "media_files_admin_write"
on public.media_files for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.seo_meta enable row level security;
drop policy if exists "seo_meta_public_select" on public.seo_meta;
create policy "seo_meta_public_select"
on public.seo_meta for select
to anon, authenticated
using (true);
drop policy if exists "seo_meta_admin_write" on public.seo_meta;
create policy "seo_meta_admin_write"
on public.seo_meta for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 2. Drop redundant duplicate indexes (constraint-backed or full-name index kept in each pair) --

drop index if exists public.idx_authors_slug;
drop index if exists public.idx_blog_categories_slug;
drop index if exists public.idx_blog_tags_slug;
drop index if exists public.idx_blogs_slug;
drop index if exists public.idx_cities_slug;
drop index if exists public.idx_city_pages_slug;
drop index if exists public.idx_courses_slug;
drop index if exists public.idx_cta_blocks_key;
drop index if exists public.idx_footer_groups_key;
drop index if exists public.idx_footer_settings_id;
drop index if exists public.idx_global_settings_id;
drop index if exists public.idx_header_settings_id;
drop index if exists public.idx_homepage_course_highlights_active;
drop index if exists public.idx_homepage_course_modules_active;
drop index if exists public.idx_homepage_cta_active;
drop index if exists public.idx_homepage_curriculum_active;
drop index if exists public.idx_homepage_faq_active;
drop index if exists public.idx_homepage_partners_active;
drop index if exists public.idx_homepage_placements_active;
drop index if exists public.idx_homepage_projects_active;
drop index if exists public.idx_homepage_settings_id;
drop index if exists public.idx_homepage_testimonials_active;
drop index if exists public.idx_homepage_tools_active;
drop index if exists public.idx_lms_lessons_module;
drop index if exists public.idx_lms_lessons_order;
drop index if exists public.idx_lms_modules_course;
drop index if exists public.idx_lms_modules_order;
drop index if exists public.idx_location_pages_slug;
drop index if exists public.idx_page_templates_slug;
drop index if exists public.idx_pages_slug;
drop index if exists public.idx_redirects_from_path;
drop index if exists public.idx_redirects_active;
drop index if exists public.idx_resources_course;
drop index if exists public.idx_resources_tool;
drop index if exists public.idx_seo_metadata_page_slug;
drop index if exists public.idx_tools_slug;
drop index if exists public.idx_tools_extended_slug;
