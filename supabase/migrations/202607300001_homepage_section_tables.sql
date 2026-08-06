-- =============================================================================
-- SAFE: Idempotent migration - only adds missing columns
-- =============================================================================
-- The base migration (20260128_phase1_hybrid_cms_base.sql) already creates ALL
-- homepage_* tables. This migration ONLY ensures the is_admin() helper function
-- exists and sets up RLS policies safely.
--
-- This file is SAFE to run multiple times (idempotent):
--   ✓ CREATE OR REPLACE FUNCTION — replaces function safely
--   ✓ ALTER TABLE ... ENABLE ROW LEVEL SECURITY — no-op if already enabled
--   ✓ DROP POLICY IF EXISTS + CREATE POLICY — idempotent policy management
--   ✓ No CREATE TABLE statements (tables already exist from base migration)
--   ✓ No ALTER TABLE ADD COLUMN (all columns already exist from base migration)
-- =============================================================================

-- =============================================================================
-- Helper function (idempotent)
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- =============================================================================
-- RLS Policies — safely re-created for all homepage tables
-- =============================================================================

-- 1. homepage_hero
alter table public.homepage_hero enable row level security;
drop policy if exists "homepage_hero_public_select" on public.homepage_hero;
create policy "homepage_hero_public_select"
on public.homepage_hero for select to anon, authenticated
using (show_hero = true);
drop policy if exists "homepage_hero_admin_write" on public.homepage_hero;
create policy "homepage_hero_admin_write"
on public.homepage_hero for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 2. homepage_faq
alter table public.homepage_faq enable row level security;
drop policy if exists "homepage_faq_public_select" on public.homepage_faq;
create policy "homepage_faq_public_select"
on public.homepage_faq for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_faq_admin_write" on public.homepage_faq;
create policy "homepage_faq_admin_write"
on public.homepage_faq for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 3. homepage_tools
alter table public.homepage_tools enable row level security;
drop policy if exists "homepage_tools_public_select" on public.homepage_tools;
create policy "homepage_tools_public_select"
on public.homepage_tools for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_tools_admin_write" on public.homepage_tools;
create policy "homepage_tools_admin_write"
on public.homepage_tools for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 4. homepage_curriculum
alter table public.homepage_curriculum enable row level security;
drop policy if exists "homepage_curriculum_public_select" on public.homepage_curriculum;
create policy "homepage_curriculum_public_select"
on public.homepage_curriculum for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_curriculum_admin_write" on public.homepage_curriculum;
create policy "homepage_curriculum_admin_write"
on public.homepage_curriculum for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 5. homepage_course_highlights
alter table public.homepage_course_highlights enable row level security;
drop policy if exists "homepage_course_highlights_public_select" on public.homepage_course_highlights;
create policy "homepage_course_highlights_public_select"
on public.homepage_course_highlights for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_course_highlights_admin_write" on public.homepage_course_highlights;
create policy "homepage_course_highlights_admin_write"
on public.homepage_course_highlights for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 6. homepage_course_modules
alter table public.homepage_course_modules enable row level security;
drop policy if exists "homepage_course_modules_public_select" on public.homepage_course_modules;
create policy "homepage_course_modules_public_select"
on public.homepage_course_modules for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_course_modules_admin_write" on public.homepage_course_modules;
create policy "homepage_course_modules_admin_write"
on public.homepage_course_modules for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 7. homepage_partners
alter table public.homepage_partners enable row level security;
drop policy if exists "homepage_partners_public_select" on public.homepage_partners;
create policy "homepage_partners_public_select"
on public.homepage_partners for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_partners_admin_write" on public.homepage_partners;
create policy "homepage_partners_admin_write"
on public.homepage_partners for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 8. homepage_placements
alter table public.homepage_placements enable row level security;
drop policy if exists "homepage_placements_public_select" on public.homepage_placements;
create policy "homepage_placements_public_select"
on public.homepage_placements for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_placements_admin_write" on public.homepage_placements;
create policy "homepage_placements_admin_write"
on public.homepage_placements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 9. homepage_projects
alter table public.homepage_projects enable row level security;
drop policy if exists "homepage_projects_public_select" on public.homepage_projects;
create policy "homepage_projects_public_select"
on public.homepage_projects for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_projects_admin_write" on public.homepage_projects;
create policy "homepage_projects_admin_write"
on public.homepage_projects for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 10. homepage_testimonials
alter table public.homepage_testimonials enable row level security;
drop policy if exists "homepage_testimonials_public_select" on public.homepage_testimonials;
create policy "homepage_testimonials_public_select"
on public.homepage_testimonials for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_testimonials_admin_write" on public.homepage_testimonials;
create policy "homepage_testimonials_admin_write"
on public.homepage_testimonials for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 11. homepage_cta
alter table public.homepage_cta enable row level security;
drop policy if exists "homepage_cta_public_select" on public.homepage_cta;
create policy "homepage_cta_public_select"
on public.homepage_cta for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_cta_admin_write" on public.homepage_cta;
create policy "homepage_cta_admin_write"
on public.homepage_cta for all to authenticated
using (public.is_admin()) with check (public.is_admin());
