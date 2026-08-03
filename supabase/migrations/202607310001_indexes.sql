-- ============================================================================
-- Comprehensive Database Indexes
-- Adds performance indexes for frequently queried columns
-- ============================================================================

-- ── Pages ────────────────────────────────────────────────────────────────
alter table if exists public.pages
  add column if not exists parent_id uuid references public.pages(id) on delete set null;

alter table if exists public.blogs
  add column if not exists category_id uuid references public.blog_categories(id) on delete set null;

alter table if exists public.navigation_menus
  add column if not exists location text,
  add column if not exists parent_id uuid references public.navigation_menus(id) on delete set null,
  add column if not exists is_active boolean default true,
  add column if not exists order_index int default 0;

alter table if exists public.sections
  add column if not exists section_type text;

alter table if exists public.seo_metadata
  add column if not exists page_id uuid references public.pages(id) on delete cascade,
  add column if not exists entity_type text;

alter table if exists public.media
  add column if not exists entity_type text;

alter table if exists public.companies
  add column if not exists is_featured boolean default false;

alter table if exists public.content_scheduling
  add column if not exists publish_at timestamptz;

alter table if exists public.form_submissions
  add column if not exists form_type text;

alter table if exists public.banners
  add column if not exists position text;

create table if not exists public.version_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  version_data jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.content_scheduling (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  publish_at timestamptz,
  status text not null default 'pending',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_status on public.pages(status);
create index if not exists idx_pages_created_at on public.pages(created_at);
create index if not exists idx_pages_updated_at on public.pages(updated_at);
create index if not exists idx_pages_parent_id on public.pages(parent_id);
create index if not exists idx_pages_slug_status on public.pages(slug, status);

-- ── Blogs ────────────────────────────────────────────────────────────────
create index if not exists idx_blogs_slug on public.blogs(slug);
create index if not exists idx_blogs_status on public.blogs(status);
create index if not exists idx_blogs_created_at on public.blogs(created_at);
create index if not exists idx_blogs_published_at on public.blogs(published_at);
create index if not exists idx_blogs_author_id on public.blogs(author_id);
create index if not exists idx_blogs_category_id on public.blogs(category_id);
create index if not exists idx_blogs_slug_status on public.blogs(slug, status);

-- ── Courses ──────────────────────────────────────────────────────────────
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_courses_is_active on public.courses(is_active);
create index if not exists idx_courses_is_featured on public.courses(is_featured);
create index if not exists idx_courses_created_at on public.courses(created_at);
create index if not exists idx_courses_order_index on public.courses(order_index);

-- ── Course Details ───────────────────────────────────────────────────────
create index if not exists idx_course_details_course_id on public.course_details(course_id);
create index if not exists idx_course_details_order_index on public.course_details(order_index);

-- ── Testimonials ─────────────────────────────────────────────────────────
create index if not exists idx_testimonials_is_active on public.testimonials(is_active);
create index if not exists idx_testimonials_rating on public.testimonials(rating);
create index if not exists idx_testimonials_order_index on public.testimonials(order_index);

-- ── Placements ──────────────────────────────────────────────────────────
create index if not exists idx_placements_is_active on public.placements(is_active);
create index if not exists idx_placements_created_at on public.placements(created_at);
create index if not exists idx_placements_company_name on public.placements(company_name);

-- ── Tools Extended ──────────────────────────────────────────────────────
create index if not exists idx_tools_extended_slug on public.tools_extended(slug);
create index if not exists idx_tools_extended_is_active on public.tools_extended(is_active);
create index if not exists idx_tools_extended_category on public.tools_extended(category);

-- ── Navigation Menus ────────────────────────────────────────────────────
create index if not exists idx_navigation_menus_location on public.navigation_menus(location);
create index if not exists idx_navigation_menus_parent_id on public.navigation_menus(parent_id);
create index if not exists idx_navigation_menus_is_active on public.navigation_menus(is_active);
create index if not exists idx_navigation_menus_order_index on public.navigation_menus(order_index);

-- ── Redirects ───────────────────────────────────────────────────────────
create index if not exists idx_redirects_from_path on public.redirects(from_path);
create index if not exists idx_redirects_is_active on public.redirects(is_active);

-- ── Sections ────────────────────────────────────────────────────────────
create index if not exists idx_sections_page_id on public.sections(page_id);
create index if not exists idx_sections_order_index on public.sections(order_index);
create index if not exists idx_sections_section_type on public.sections(section_type);

-- ── Page Sections ───────────────────────────────────────────────────────
create index if not exists idx_page_sections_page_slug on public.page_sections(page_slug);
create index if not exists idx_page_sections_section_key on public.page_sections(section_key);

-- ── Cities ──────────────────────────────────────────────────────────────
create index if not exists idx_cities_slug on public.cities(slug);
create index if not exists idx_cities_is_active on public.cities(is_active);
create index if not exists idx_cities_state on public.cities(state);

-- ── Location Pages ──────────────────────────────────────────────────────
create index if not exists idx_location_pages_slug on public.location_pages(slug);
create index if not exists idx_location_pages_status on public.location_pages(status);
create index if not exists idx_location_pages_city_id on public.location_pages(city_id);
create index if not exists idx_location_pages_course_slug on public.location_pages(course_slug);

-- ── SEO Metadata ────────────────────────────────────────────────────────
create index if not exists idx_seo_metadata_page_id on public.seo_metadata(page_id);
create index if not exists idx_seo_metadata_entity_type on public.seo_metadata(entity_type);

-- ── Media ────────────────────────────────────────────────────────────────
create index if not exists idx_media_created_at on public.media(created_at);
create index if not exists idx_media_entity_type on public.media(entity_type);

-- ── Leads / Forms ──────────────────────────────────────────────────────
create index if not exists idx_leads_created_at on public.leads(created_at);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_form_submissions_created_at on public.form_submissions(created_at);
create index if not exists idx_form_submissions_form_type on public.form_submissions(form_type);

-- ── Banners ─────────────────────────────────────────────────────────────
create index if not exists idx_banners_is_active on public.banners(is_active);
create index if not exists idx_banners_position on public.banners(position);
create index if not exists idx_banners_created_at on public.banners(created_at);

-- ── Popups ──────────────────────────────────────────────────────────────
create index if not exists idx_popups_is_active on public.popups(is_active);
create index if not exists idx_popups_created_at on public.popups(created_at);

-- ── Profiles ────────────────────────────────────────────────────────────
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- ── Version History ────────────────────────────────────────────────────
create index if not exists idx_version_history_entity_type on public.version_history(entity_type);
create index if not exists idx_version_history_entity_id on public.version_history(entity_id);
create index if not exists idx_version_history_created_at on public.version_history(created_at);
create index if not exists idx_version_history_entity on public.version_history(entity_type, entity_id);

-- ── Content Scheduling ──────────────────────────────────────────────────
create index if not exists idx_content_scheduling_publish_at on public.content_scheduling(publish_at);
create index if not exists idx_content_scheduling_status on public.content_scheduling(status);
create index if not exists idx_content_scheduling_entity on public.content_scheduling(entity_type, entity_id);

-- ── Homepage Tables ────────────────────────────────────────────────────
create index if not exists idx_homepage_hero_show_hero on public.homepage_hero(show_hero);
create index if not exists idx_homepage_course_highlights_order on public.homepage_course_highlights(order_index);
create index if not exists idx_homepage_course_highlights_active on public.homepage_course_highlights(is_active);
create index if not exists idx_homepage_course_modules_order on public.homepage_course_modules(order_index);
create index if not exists idx_homepage_course_modules_active on public.homepage_course_modules(is_active);
create index if not exists idx_homepage_curriculum_order on public.homepage_curriculum(order_index);
create index if not exists idx_homepage_curriculum_active on public.homepage_curriculum(is_active);
create index if not exists idx_homepage_projects_order on public.homepage_projects(order_index);
create index if not exists idx_homepage_projects_active on public.homepage_projects(is_active);
create index if not exists idx_homepage_partners_order on public.homepage_partners(order_index);
create index if not exists idx_homepage_partners_active on public.homepage_partners(is_active);
create index if not exists idx_homepage_placements_order on public.homepage_placements(order_index);
create index if not exists idx_homepage_placements_active on public.homepage_placements(is_active);
create index if not exists idx_homepage_placements_company on public.homepage_placements(company_name);
create index if not exists idx_homepage_testimonials_order on public.homepage_testimonials(order_index);
create index if not exists idx_homepage_testimonials_active on public.homepage_testimonials(is_active);
create index if not exists idx_homepage_testimonials_rating on public.homepage_testimonials(rating);
create index if not exists idx_homepage_faq_order on public.homepage_faq(order_index);
create index if not exists idx_homepage_faq_active on public.homepage_faq(is_active);
create index if not exists idx_homepage_faq_category on public.homepage_faq(category);
create index if not exists idx_homepage_tools_order on public.homepage_tools(order_index);
create index if not exists idx_homepage_tools_active on public.homepage_tools(is_active);
create index if not exists idx_homepage_tools_category on public.homepage_tools(category);
create index if not exists idx_homepage_cta_active on public.homepage_cta(is_active);

-- ── Other entities ──────────────────────────────────────────────────────
create index if not exists idx_instructors_is_active on public.instructors(is_active);
create index if not exists idx_instructors_order_index on public.instructors(order_index);
create index if not exists idx_certifications_is_active on public.certifications(is_active);
create index if not exists idx_success_stories_is_active on public.success_stories(is_active);
create index if not exists idx_recruiters_is_active on public.recruiters(is_active);
create index if not exists idx_recruiters_order_index on public.recruiters(order_index);
create index if not exists idx_student_metrics_is_active on public.student_metrics(is_active);
create index if not exists idx_trust_badges_is_active on public.trust_badges(is_active);
create index if not exists idx_community_events_is_active on public.community_events(is_active);
create index if not exists idx_community_events_event_date on public.community_events(event_date);
create index if not exists idx_cta_blocks_key on public.cta_blocks(key);
create index if not exists idx_cta_blocks_is_active on public.cta_blocks(is_active);
create index if not exists idx_footer_groups_key on public.footer_groups(key);
create index if not exists idx_footer_groups_is_active on public.footer_groups(is_active);
create index if not exists idx_footer_groups_order_index on public.footer_groups(order_index);
create index if not exists idx_hiring_partners_is_active on public.hiring_partners(is_active);
create index if not exists idx_lms_modules_course_id on public.lms_modules(course_id);
create index if not exists idx_lms_modules_order_index on public.lms_modules(order_index);
create index if not exists idx_lms_lessons_module_id on public.lms_lessons(module_id);
create index if not exists idx_lms_lessons_order_index on public.lms_lessons(order_index);
create index if not exists idx_blog_categories_slug on public.blog_categories(slug);
create index if not exists idx_blog_tags_slug on public.blog_tags(slug);
create index if not exists idx_authors_slug on public.authors(slug);
create index if not exists idx_resources_course_id on public.resources(course_id);
create index if not exists idx_resources_tool_id on public.resources(tool_id);
create index if not exists idx_resources_is_active on public.resources(is_active);
create index if not exists idx_companies_is_featured on public.companies(is_featured);
create index if not exists idx_internships_is_active on public.internships(is_active);
create index if not exists idx_internships_status on public.internships(status);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
do $$
declare
  index_count integer;
begin
  select count(*) into index_count
  from pg_indexes
  where schemaname = 'public'
    and tablename in (
      'pages', 'blogs', 'courses', 'course_details', 'testimonials',
      'placements', 'tools_extended', 'navigation_menus', 'redirects',
      'sections', 'page_sections', 'cities', 'location_pages',
      'seo_metadata', 'media', 'leads', 'form_submissions',
      'banners', 'popups', 'profiles', 'version_history',
      'content_scheduling', 'homepage_hero', 'homepage_course_highlights',
      'homepage_course_modules', 'homepage_curriculum', 'homepage_projects',
      'homepage_partners', 'homepage_placements', 'homepage_testimonials',
      'homepage_faq', 'homepage_tools', 'homepage_cta',
      'instructors', 'certifications', 'success_stories', 'recruiters',
      'student_metrics', 'trust_badges', 'community_events', 'cta_blocks',
      'footer_groups', 'header_settings', 'footer_settings',
      'hiring_partners', 'lms_modules', 'lms_lessons',
      'blog_categories', 'blog_tags', 'authors', 'resources',
      'companies', 'internships', 'reusable_blocks', 'page_templates'
    );
  raise notice '✓ Total indexes on CMS tables: %', index_count;
end;
$$;
