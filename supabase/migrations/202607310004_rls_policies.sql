-- ============================================================================
-- Comprehensive RLS Policies for ALL CMS Tables
-- Run this migration to ensure every table has proper Row Level Security
-- ============================================================================

-- Helper: Ensure is_admin() function exists
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

-- ============================================================================
-- 1. HOMEPAGE SECTIONS
-- ============================================================================

-- homepage_hero
alter table if exists public.homepage_hero enable row level security;
drop policy if exists "homepage_hero_public_select" on public.homepage_hero;
create policy "homepage_hero_public_select" on public.homepage_hero for select
  to anon, authenticated
  using (show_hero = true or show_hero is null);
drop policy if exists "homepage_hero_admin_all" on public.homepage_hero;
create policy "homepage_hero_admin_all" on public.homepage_hero for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_course_highlights
alter table if exists public.homepage_course_highlights enable row level security;
drop policy if exists "homepage_course_highlights_public_select" on public.homepage_course_highlights;
create policy "homepage_course_highlights_public_select" on public.homepage_course_highlights for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_course_highlights_admin_all" on public.homepage_course_highlights;
create policy "homepage_course_highlights_admin_all" on public.homepage_course_highlights for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_course_modules
alter table if exists public.homepage_course_modules enable row level security;
drop policy if exists "homepage_course_modules_public_select" on public.homepage_course_modules;
create policy "homepage_course_modules_public_select" on public.homepage_course_modules for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_course_modules_admin_all" on public.homepage_course_modules;
create policy "homepage_course_modules_admin_all" on public.homepage_course_modules for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_curriculum
alter table if exists public.homepage_curriculum enable row level security;
drop policy if exists "homepage_curriculum_public_select" on public.homepage_curriculum;
create policy "homepage_curriculum_public_select" on public.homepage_curriculum for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_curriculum_admin_all" on public.homepage_curriculum;
create policy "homepage_curriculum_admin_all" on public.homepage_curriculum for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_projects
alter table if exists public.homepage_projects enable row level security;
drop policy if exists "homepage_projects_public_select" on public.homepage_projects;
create policy "homepage_projects_public_select" on public.homepage_projects for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_projects_admin_all" on public.homepage_projects;
create policy "homepage_projects_admin_all" on public.homepage_projects for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_partners
alter table if exists public.homepage_partners enable row level security;
drop policy if exists "homepage_partners_public_select" on public.homepage_partners;
create policy "homepage_partners_public_select" on public.homepage_partners for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_partners_admin_all" on public.homepage_partners;
create policy "homepage_partners_admin_all" on public.homepage_partners for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_placements
alter table if exists public.homepage_placements enable row level security;
drop policy if exists "homepage_placements_public_select" on public.homepage_placements;
create policy "homepage_placements_public_select" on public.homepage_placements for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_placements_admin_all" on public.homepage_placements;
create policy "homepage_placements_admin_all" on public.homepage_placements for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_testimonials
alter table if exists public.homepage_testimonials enable row level security;
drop policy if exists "homepage_testimonials_public_select" on public.homepage_testimonials;
create policy "homepage_testimonials_public_select" on public.homepage_testimonials for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_testimonials_admin_all" on public.homepage_testimonials;
create policy "homepage_testimonials_admin_all" on public.homepage_testimonials for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_faq
alter table if exists public.homepage_faq enable row level security;
drop policy if exists "homepage_faq_public_select" on public.homepage_faq;
create policy "homepage_faq_public_select" on public.homepage_faq for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_faq_admin_all" on public.homepage_faq;
create policy "homepage_faq_admin_all" on public.homepage_faq for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_tools
alter table if exists public.homepage_tools enable row level security;
drop policy if exists "homepage_tools_public_select" on public.homepage_tools;
create policy "homepage_tools_public_select" on public.homepage_tools for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_tools_admin_all" on public.homepage_tools;
create policy "homepage_tools_admin_all" on public.homepage_tools for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- homepage_cta
alter table if exists public.homepage_cta enable row level security;
drop policy if exists "homepage_cta_public_select" on public.homepage_cta;
create policy "homepage_cta_public_select" on public.homepage_cta for select
  to anon, authenticated using (is_active = true);
drop policy if exists "homepage_cta_admin_all" on public.homepage_cta;
create policy "homepage_cta_admin_all" on public.homepage_cta for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 2. HEADER & FOOTER
-- ============================================================================

-- header_settings
alter table if exists public.header_settings enable row level security;
drop policy if exists "header_settings_public_select" on public.header_settings;
create policy "header_settings_public_select" on public.header_settings for select
  to anon, authenticated using (true);
drop policy if exists "header_settings_admin_all" on public.header_settings;
create policy "header_settings_admin_all" on public.header_settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- footer_settings
alter table if exists public.footer_settings enable row level security;
drop policy if exists "footer_settings_public_select" on public.footer_settings;
create policy "footer_settings_public_select" on public.footer_settings for select
  to anon, authenticated using (true);
drop policy if exists "footer_settings_admin_all" on public.footer_settings;
create policy "footer_settings_admin_all" on public.footer_settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 3. PAGES & SECTIONS
-- ============================================================================

-- pages
alter table if exists public.pages enable row level security;
drop policy if exists "pages_public_select" on public.pages;
create policy "pages_public_select" on public.pages for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "pages_admin_all" on public.pages;
create policy "pages_admin_all" on public.pages for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- page_sections
alter table if exists public.page_sections enable row level security;
drop policy if exists "page_sections_public_select" on public.page_sections;
create policy "page_sections_public_select" on public.page_sections for select
  to anon, authenticated using (true);
drop policy if exists "page_sections_admin_all" on public.page_sections;
create policy "page_sections_admin_all" on public.page_sections for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- sections
alter table if exists public.sections enable row level security;
drop policy if exists "sections_public_select" on public.sections;
create policy "sections_public_select" on public.sections for select
  to anon, authenticated using (true);
drop policy if exists "sections_admin_all" on public.sections;
create policy "sections_admin_all" on public.sections for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 4. BLOGS & CONTENT
-- ============================================================================

-- blogs
alter table if exists public.blogs enable row level security;
drop policy if exists "blogs_public_select" on public.blogs;
create policy "blogs_public_select" on public.blogs for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "blogs_admin_all" on public.blogs;
create policy "blogs_admin_all" on public.blogs for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- blog_categories
alter table if exists public.blog_categories enable row level security;
drop policy if exists "blog_categories_public_select" on public.blog_categories;
create policy "blog_categories_public_select" on public.blog_categories for select
  to anon, authenticated using (true);
drop policy if exists "blog_categories_admin_all" on public.blog_categories;
create policy "blog_categories_admin_all" on public.blog_categories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- blog_tags
alter table if exists public.blog_tags enable row level security;
drop policy if exists "blog_tags_public_select" on public.blog_tags;
create policy "blog_tags_public_select" on public.blog_tags for select
  to anon, authenticated using (true);
drop policy if exists "blog_tags_admin_all" on public.blog_tags;
create policy "blog_tags_admin_all" on public.blog_tags for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- blog_content_blocks
alter table if exists public.blog_content_blocks enable row level security;
drop policy if exists "blog_content_blocks_public_select" on public.blog_content_blocks;
create policy "blog_content_blocks_public_select" on public.blog_content_blocks for select
  to anon, authenticated using (true);
drop policy if exists "blog_content_blocks_admin_all" on public.blog_content_blocks;
create policy "blog_content_blocks_admin_all" on public.blog_content_blocks for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- authors
alter table if exists public.authors enable row level security;
drop policy if exists "authors_public_select" on public.authors;
create policy "authors_public_select" on public.authors for select
  to anon, authenticated using (true);
drop policy if exists "authors_admin_all" on public.authors;
create policy "authors_admin_all" on public.authors for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 5. ENTITY TABLES
-- ============================================================================

-- courses
alter table if exists public.courses enable row level security;
drop policy if exists "courses_public_select" on public.courses;
create policy "courses_public_select" on public.courses for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "courses_admin_all" on public.courses;
create policy "courses_admin_all" on public.courses for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- course_details
alter table if exists public.course_details enable row level security;
drop policy if exists "course_details_public_select" on public.course_details;
create policy "course_details_public_select" on public.course_details for select
  to anon, authenticated using (true);
drop policy if exists "course_details_admin_all" on public.course_details;
create policy "course_details_admin_all" on public.course_details for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- testimonials
alter table if exists public.testimonials enable row level security;
drop policy if exists "testimonials_public_select" on public.testimonials;
create policy "testimonials_public_select" on public.testimonials for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- companies
alter table if exists public.companies enable row level security;
drop policy if exists "companies_public_select" on public.companies;
create policy "companies_public_select" on public.companies for select
  to anon, authenticated using (true);
drop policy if exists "companies_admin_all" on public.companies;
create policy "companies_admin_all" on public.companies for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- internships
alter table if exists public.internships enable row level security;
drop policy if exists "internships_public_select" on public.internships;
create policy "internships_public_select" on public.internships for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "internships_admin_all" on public.internships;
create policy "internships_admin_all" on public.internships for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- placements
alter table if exists public.placements enable row level security;
drop policy if exists "placements_public_select" on public.placements;
create policy "placements_public_select" on public.placements for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "placements_admin_all" on public.placements;
create policy "placements_admin_all" on public.placements for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- tools_extended
alter table if exists public.tools_extended enable row level security;
drop policy if exists "tools_extended_public_select" on public.tools_extended;
create policy "tools_extended_public_select" on public.tools_extended for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "tools_extended_admin_all" on public.tools_extended;
create policy "tools_extended_admin_all" on public.tools_extended for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- resources
alter table if exists public.resources enable row level security;
drop policy if exists "resources_public_select" on public.resources;
create policy "resources_public_select" on public.resources for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "resources_admin_all" on public.resources;
create policy "resources_admin_all" on public.resources for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 6. CMS TABLES
-- ============================================================================

-- menus (navigation_menus)
alter table if exists public.navigation_menus enable row level security;
drop policy if exists "navigation_menus_public_select" on public.navigation_menus;
create policy "navigation_menus_public_select" on public.navigation_menus for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "navigation_menus_admin_all" on public.navigation_menus;
create policy "navigation_menus_admin_all" on public.navigation_menus for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- redirects
alter table if exists public.redirects enable row level security;
drop policy if exists "redirects_public_select" on public.redirects;
create policy "redirects_public_select" on public.redirects for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "redirects_admin_all" on public.redirects;
create policy "redirects_admin_all" on public.redirects for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- reusable_blocks
alter table if exists public.reusable_blocks enable row level security;
drop policy if exists "reusable_blocks_public_select" on public.reusable_blocks;
create policy "reusable_blocks_public_select" on public.reusable_blocks for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "reusable_blocks_admin_all" on public.reusable_blocks;
create policy "reusable_blocks_admin_all" on public.reusable_blocks for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- page_templates
alter table if exists public.page_templates enable row level security;
drop policy if exists "page_templates_public_select" on public.page_templates;
create policy "page_templates_public_select" on public.page_templates for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "page_templates_admin_all" on public.page_templates;
create policy "page_templates_admin_all" on public.page_templates for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- location_pages
alter table if exists public.location_pages enable row level security;
drop policy if exists "location_pages_public_select" on public.location_pages;
create policy "location_pages_public_select" on public.location_pages for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());
drop policy if exists "location_pages_admin_all" on public.location_pages;
create policy "location_pages_admin_all" on public.location_pages for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- cities
alter table if exists public.cities enable row level security;
drop policy if exists "cities_public_select" on public.cities;
create policy "cities_public_select" on public.cities for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "cities_admin_all" on public.cities;
create policy "cities_admin_all" on public.cities for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 7. MARKETING TABLES
-- ============================================================================

-- banners
alter table if exists public.banners enable row level security;
drop policy if exists "banners_public_select" on public.banners;
create policy "banners_public_select" on public.banners for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- popups
alter table if exists public.popups enable row level security;
drop policy if exists "popups_public_select" on public.popups;
create policy "popups_public_select" on public.popups for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "popups_admin_all" on public.popups;
create policy "popups_admin_all" on public.popups for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- forms (leads)
alter table if exists public.leads enable row level security;
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads for insert
  to anon, authenticated
  with check (true);
drop policy if exists "leads_admin_select" on public.leads;
create policy "leads_admin_select" on public.leads for select
  to authenticated using (public.is_admin());
drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all" on public.leads for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- form_submissions
alter table if exists public.form_submissions enable row level security;
drop policy if exists "form_submissions_public_insert" on public.form_submissions;
create policy "form_submissions_public_insert" on public.form_submissions for insert
  to anon, authenticated
  with check (true);
drop policy if exists "form_submissions_admin_select" on public.form_submissions;
create policy "form_submissions_admin_select" on public.form_submissions for select
  to authenticated using (public.is_admin());
drop policy if exists "form_submissions_admin_all" on public.form_submissions;
create policy "form_submissions_admin_all" on public.form_submissions for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 8. SEO & SETTINGS
-- ============================================================================

-- seo_metadata
alter table if exists public.seo_metadata enable row level security;
drop policy if exists "seo_metadata_public_select" on public.seo_metadata;
create policy "seo_metadata_public_select" on public.seo_metadata for select
  to anon, authenticated using (true);
drop policy if exists "seo_metadata_admin_all" on public.seo_metadata;
create policy "seo_metadata_admin_all" on public.seo_metadata for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- media
alter table if exists public.media enable row level security;
drop policy if exists "media_public_select" on public.media;
create policy "media_public_select" on public.media for select
  to anon, authenticated using (true);
drop policy if exists "media_admin_all" on public.media;
create policy "media_admin_all" on public.media for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- global_settings
alter table if exists public.global_settings enable row level security;
drop policy if exists "global_settings_public_select" on public.global_settings;
create policy "global_settings_public_select" on public.global_settings for select
  to anon, authenticated using (true);
drop policy if exists "global_settings_admin_all" on public.global_settings;
create policy "global_settings_admin_all" on public.global_settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- site_settings
alter table if exists public.site_settings enable row level security;
drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select" on public.site_settings for select
  to anon, authenticated using (true);
drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 9. VERSION HISTORY & WORKFLOW
-- ============================================================================

-- version_history
alter table if exists public.version_history enable row level security;
drop policy if exists "version_history_public_select" on public.version_history;
create policy "version_history_public_select" on public.version_history for select
  to anon, authenticated
  using (public.is_admin());
drop policy if exists "version_history_admin_all" on public.version_history;
create policy "version_history_admin_all" on public.version_history for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- content_scheduling
alter table if exists public.content_scheduling enable row level security;
drop policy if exists "content_scheduling_public_select" on public.content_scheduling;
create policy "content_scheduling_public_select" on public.content_scheduling for select
  to anon, authenticated
  using (public.is_admin());
drop policy if exists "content_scheduling_admin_all" on public.content_scheduling;
create policy "content_scheduling_admin_all" on public.content_scheduling for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 10. USER MANAGEMENT
-- ============================================================================

-- profiles
alter table if exists public.profiles enable row level security;
drop policy if exists "profiles_public_select" on public.profiles;
create policy "profiles_public_select" on public.profiles for select
  to anon, authenticated
  using (public.is_admin());
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles for select
  to authenticated
  using (auth.uid() = id);
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_roles
alter table if exists public.user_roles enable row level security;
drop policy if exists "user_roles_admin_all" on public.user_roles;
create policy "user_roles_admin_all" on public.user_roles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- permissions
alter table if exists public.permissions enable row level security;
drop policy if exists "permissions_admin_all" on public.permissions;
create policy "permissions_admin_all" on public.permissions for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 11. INSTRUCTORS, CERTIFICATIONS & SOCIAL
-- ============================================================================

-- instructors
alter table if exists public.instructors enable row level security;
drop policy if exists "instructors_public_select" on public.instructors;
create policy "instructors_public_select" on public.instructors for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "instructors_admin_all" on public.instructors;
create policy "instructors_admin_all" on public.instructors for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- certifications
alter table if exists public.certifications enable row level security;
drop policy if exists "certifications_public_select" on public.certifications;
create policy "certifications_public_select" on public.certifications for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "certifications_admin_all" on public.certifications;
create policy "certifications_admin_all" on public.certifications for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- success_stories
alter table if exists public.success_stories enable row level security;
drop policy if exists "success_stories_public_select" on public.success_stories;
create policy "success_stories_public_select" on public.success_stories for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "success_stories_admin_all" on public.success_stories;
create policy "success_stories_admin_all" on public.success_stories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- recruiters
alter table if exists public.recruiters enable row level security;
drop policy if exists "recruiters_public_select" on public.recruiters;
create policy "recruiters_public_select" on public.recruiters for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "recruiters_admin_all" on public.recruiters;
create policy "recruiters_admin_all" on public.recruiters for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 12. HOME SECTIONS (legacy)
-- ============================================================================

-- home_sections
alter table if exists public.home_sections enable row level security;
drop policy if exists "home_sections_public_select" on public.home_sections;
create policy "home_sections_public_select" on public.home_sections for select
  to anon, authenticated using (true);
drop policy if exists "home_sections_admin_all" on public.home_sections;
create policy "home_sections_admin_all" on public.home_sections for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- hiring_partners
alter table if exists public.hiring_partners enable row level security;
drop policy if exists "hiring_partners_public_select" on public.hiring_partners;
create policy "hiring_partners_public_select" on public.hiring_partners for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
drop policy if exists "hiring_partners_admin_all" on public.hiring_partners;
create policy "hiring_partners_admin_all" on public.hiring_partners for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all tables
do $$
declare
  tbl text;
  missing_rls text[] := '{}';
begin
  for tbl in
    select unnest(array[
      'homepage_hero', 'homepage_course_highlights', 'homepage_course_modules',
      'homepage_curriculum', 'homepage_projects', 'homepage_partners',
      'homepage_placements', 'homepage_testimonials', 'homepage_faq',
      'homepage_tools', 'homepage_cta', 'header_settings', 'footer_settings',
      'pages', 'page_sections', 'sections', 'blogs', 'blog_categories',
      'blog_tags', 'blog_content_blocks', 'authors', 'courses',
      'course_details', 'testimonials', 'companies', 'internships',
      'placements', 'tools_extended', 'resources', 'navigation_menus',
      'redirects', 'reusable_blocks', 'page_templates', 'location_pages',
      'cities', 'banners', 'popups', 'leads', 'form_submissions',
      'seo_metadata', 'media', 'global_settings', 'site_settings',
      'version_history', 'content_scheduling', 'profiles', 'user_roles',
      'permissions', 'instructors', 'certifications', 'success_stories',
      'recruiters', 'home_sections', 'hiring_partners', 'lms_modules',
      'lms_lessons', 'community_events', 'cta_blocks',
      'student_metrics', 'trust_badges', 'footer_groups'
    ])
  loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      if not exists (
        select 1 from pg_tables
        where schemaname = 'public'
          and tablename = tbl
          and rowsecurity = true
      ) then
        missing_rls := missing_rls || tbl;
      end if;
    end if;
  end loop;

  if array_length(missing_rls, 1) > 0 then
    raise warning 'Tables missing RLS: %', array_to_string(missing_rls, ', ');
  else
    raise notice '✓ All tables have RLS enabled';
  end if;
end;
$$;

