-- Recovery migration for 20260128_phase1_hybrid_cms_base.sql (tracked, not edited here).
--
-- That migration's "public_select" RLS policy for 9 of its 13 tables is malformed:
--   create policy "..._public_select" ... using (is_active = true) order by order_index;
-- "ORDER BY" is not valid syntax on CREATE POLICY at all (it looks like a copy/paste
-- fragment intended for a view/query). Applied with ON_ERROR_STOP, the file aborts at the
-- FIRST such statement (homepage_course_highlights_public_select) and every table/policy/
-- trigger/index declared after that point in the file never gets created:
--   homepage_course_highlights_admin_write (policy only - table itself already exists)
--   homepage_course_modules, homepage_curriculum, homepage_projects, homepage_partners,
--   homepage_placements, homepage_testimonials, homepage_faq, homepage_tools, homepage_cta,
--   header_settings, footer_settings (tables + everything on them)
--
-- This migration recreates exactly that missing content, idempotently, with the ORDER BY
-- removed from every policy (their real intent - ordering happens client-side / in queries,
-- never inside a row-security predicate). Every table/index/trigger/policy uses IF NOT
-- EXISTS / DROP+CREATE guards so this is safe to run whether or not fragments of the
-- original file already partially applied.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "homepage_course_highlights_admin_write" on public.homepage_course_highlights;
create policy "homepage_course_highlights_admin_write"
on public.homepage_course_highlights for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE COURSE MODULES
-- ============================================================================
create table if not exists public.homepage_course_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration text,
  focus text,
  pillars jsonb not null default '[]'::jsonb,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_course_modules_order on public.homepage_course_modules(order_index);
create index if not exists idx_homepage_course_modules_is_active on public.homepage_course_modules(is_active);
drop trigger if exists set_homepage_course_modules_updated_at on public.homepage_course_modules;
create trigger set_homepage_course_modules_updated_at
before update on public.homepage_course_modules
for each row execute function public.set_updated_at();
alter table public.homepage_course_modules enable row level security;
drop policy if exists "homepage_course_modules_public_select" on public.homepage_course_modules;
create policy "homepage_course_modules_public_select"
on public.homepage_course_modules for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_course_modules_admin_write" on public.homepage_course_modules;
create policy "homepage_course_modules_admin_write"
on public.homepage_course_modules for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE CURRICULUM
-- ============================================================================
create table if not exists public.homepage_curriculum (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  items jsonb not null default '[]'::jsonb,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_curriculum_order on public.homepage_curriculum(order_index);
create index if not exists idx_homepage_curriculum_is_active on public.homepage_curriculum(is_active);
drop trigger if exists set_homepage_curriculum_updated_at on public.homepage_curriculum;
create trigger set_homepage_curriculum_updated_at
before update on public.homepage_curriculum
for each row execute function public.set_updated_at();
alter table public.homepage_curriculum enable row level security;
drop policy if exists "homepage_curriculum_public_select" on public.homepage_curriculum;
create policy "homepage_curriculum_public_select"
on public.homepage_curriculum for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_curriculum_admin_write" on public.homepage_curriculum;
create policy "homepage_curriculum_admin_write"
on public.homepage_curriculum for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE PROJECTS
-- ============================================================================
create table if not exists public.homepage_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  link text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_projects_order on public.homepage_projects(order_index);
create index if not exists idx_homepage_projects_is_active on public.homepage_projects(is_active);
drop trigger if exists set_homepage_projects_updated_at on public.homepage_projects;
create trigger set_homepage_projects_updated_at
before update on public.homepage_projects
for each row execute function public.set_updated_at();
alter table public.homepage_projects enable row level security;
drop policy if exists "homepage_projects_public_select" on public.homepage_projects;
create policy "homepage_projects_public_select"
on public.homepage_projects for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_projects_admin_write" on public.homepage_projects;
create policy "homepage_projects_admin_write"
on public.homepage_projects for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE PARTNERS
-- ============================================================================
create table if not exists public.homepage_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_partners_order on public.homepage_partners(order_index);
create index if not exists idx_homepage_partners_is_active on public.homepage_partners(is_active);
drop trigger if exists set_homepage_partners_updated_at on public.homepage_partners;
create trigger set_homepage_partners_updated_at
before update on public.homepage_partners
for each row execute function public.set_updated_at();
alter table public.homepage_partners enable row level security;
drop policy if exists "homepage_partners_public_select" on public.homepage_partners;
create policy "homepage_partners_public_select"
on public.homepage_partners for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_partners_admin_write" on public.homepage_partners;
create policy "homepage_partners_admin_write"
on public.homepage_partners for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE PLACEMENTS
-- ============================================================================
create table if not exists public.homepage_placements (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  student_name text,
  role text,
  testimonial text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_placements_order on public.homepage_placements(order_index);
create index if not exists idx_homepage_placements_is_active on public.homepage_placements(is_active);
create index if not exists idx_homepage_placements_company on public.homepage_placements(company_name);
drop trigger if exists set_homepage_placements_updated_at on public.homepage_placements;
create trigger set_homepage_placements_updated_at
before update on public.homepage_placements
for each row execute function public.set_updated_at();
alter table public.homepage_placements enable row level security;
drop policy if exists "homepage_placements_public_select" on public.homepage_placements;
create policy "homepage_placements_public_select"
on public.homepage_placements for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_placements_admin_write" on public.homepage_placements;
create policy "homepage_placements_admin_write"
on public.homepage_placements for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE TESTIMONIALS
-- ============================================================================
create table if not exists public.homepage_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text,
  image_url text,
  company text,
  rating int default 5 check (rating >= 1 and rating <= 5),
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_testimonials_order on public.homepage_testimonials(order_index);
create index if not exists idx_homepage_testimonials_is_active on public.homepage_testimonials(is_active);
create index if not exists idx_homepage_testimonials_rating on public.homepage_testimonials(rating);
drop trigger if exists set_homepage_testimonials_updated_at on public.homepage_testimonials;
create trigger set_homepage_testimonials_updated_at
before update on public.homepage_testimonials
for each row execute function public.set_updated_at();
alter table public.homepage_testimonials enable row level security;
drop policy if exists "homepage_testimonials_public_select" on public.homepage_testimonials;
create policy "homepage_testimonials_public_select"
on public.homepage_testimonials for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_testimonials_admin_write" on public.homepage_testimonials;
create policy "homepage_testimonials_admin_write"
on public.homepage_testimonials for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE FAQ
-- ============================================================================
create table if not exists public.homepage_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  category text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_faq_order on public.homepage_faq(order_index);
create index if not exists idx_homepage_faq_is_active on public.homepage_faq(is_active);
create index if not exists idx_homepage_faq_category on public.homepage_faq(category);
drop trigger if exists set_homepage_faq_updated_at on public.homepage_faq;
create trigger set_homepage_faq_updated_at
before update on public.homepage_faq
for each row execute function public.set_updated_at();
alter table public.homepage_faq enable row level security;
drop policy if exists "homepage_faq_public_select" on public.homepage_faq;
create policy "homepage_faq_public_select"
on public.homepage_faq for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_faq_admin_write" on public.homepage_faq;
create policy "homepage_faq_admin_write"
on public.homepage_faq for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE TOOLS
-- ============================================================================
create table if not exists public.homepage_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  category text,
  link text,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_tools_order on public.homepage_tools(order_index);
create index if not exists idx_homepage_tools_is_active on public.homepage_tools(is_active);
create index if not exists idx_homepage_tools_category on public.homepage_tools(category);
drop trigger if exists set_homepage_tools_updated_at on public.homepage_tools;
create trigger set_homepage_tools_updated_at
before update on public.homepage_tools
for each row execute function public.set_updated_at();
alter table public.homepage_tools enable row level security;
drop policy if exists "homepage_tools_public_select" on public.homepage_tools;
create policy "homepage_tools_public_select"
on public.homepage_tools for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_tools_admin_write" on public.homepage_tools;
create policy "homepage_tools_admin_write"
on public.homepage_tools for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================================
-- HOMEPAGE CTA
-- ============================================================================
create table if not exists public.homepage_cta (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  button_text text,
  button_link text,
  background_color text default '#050b12',
  text_color text default '#ffffff',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homepage_cta_is_active on public.homepage_cta(is_active);
drop trigger if exists set_homepage_cta_updated_at on public.homepage_cta;
create trigger set_homepage_cta_updated_at
before update on public.homepage_cta
for each row execute function public.set_updated_at();
alter table public.homepage_cta enable row level security;
drop policy if exists "homepage_cta_public_select" on public.homepage_cta;
create policy "homepage_cta_public_select"
on public.homepage_cta for select to anon, authenticated
using (is_active = true);
drop policy if exists "homepage_cta_admin_write" on public.homepage_cta;
create policy "homepage_cta_admin_write"
on public.homepage_cta for all to authenticated
using (public.is_admin())
with check (public.is_admin());
insert into public.homepage_cta (title, description, button_text, button_link, is_active)
select 'Ready to Start Your Journey?', 'Join thousands of learners who have transformed their careers with Acadvizen.', 'Get Started', '/courses', true
where not exists (select 1 from public.homepage_cta);

-- ============================================================================
-- HEADER SETTINGS
-- ============================================================================
create table if not exists public.header_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  logo_alt text,
  logo_link text default '/',
  announcement_enabled boolean default false,
  announcement_text text,
  announcement_link text,
  announcement_bg_color text default '#10b981',
  announcement_text_color text default '#ffffff',
  nav_items jsonb not null default '[]'::jsonb,
  primary_cta_enabled boolean default true,
  primary_cta_text text default 'Get Started',
  primary_cta_link text default '/courses',
  primary_cta_bg_color text default '#14b8a6',
  primary_cta_text_color text default '#ffffff',
  secondary_cta_enabled boolean default false,
  secondary_cta_text text default 'Login',
  secondary_cta_link text default '/login',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_header_settings_id on public.header_settings(id);
drop trigger if exists set_header_settings_updated_at on public.header_settings;
create trigger set_header_settings_updated_at
before update on public.header_settings
for each row execute function public.set_updated_at();
alter table public.header_settings enable row level security;
drop policy if exists "header_settings_public_select" on public.header_settings;
create policy "header_settings_public_select"
on public.header_settings for select to anon, authenticated
using (true);
drop policy if exists "header_settings_admin_write" on public.header_settings;
create policy "header_settings_admin_write"
on public.header_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());
insert into public.header_settings (nav_items)
select '[
    {"label": "Home", "link": "/", "active": true},
    {"label": "Courses", "link": "/courses", "active": true},
    {"label": "Blogs", "link": "/blogs", "active": true},
    {"label": "About", "link": "/about", "active": true},
    {"label": "Contact", "link": "/contact", "active": true}
  ]'::jsonb
where not exists (select 1 from public.header_settings);

-- ============================================================================
-- FOOTER SETTINGS
-- ============================================================================
create table if not exists public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  columns jsonb not null default '[]'::jsonb,
  copyright_text text default '(c) 2024 Acadvizen. All rights reserved.',
  social_links jsonb not null default '[]'::jsonb,
  contact_info jsonb not null default '[]'::jsonb,
  show_newsletter boolean default false,
  newsletter_title text default 'Subscribe to our newsletter',
  newsletter_placeholder text default 'Enter your email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_footer_settings_id on public.footer_settings(id);
drop trigger if exists set_footer_settings_updated_at on public.footer_settings;
create trigger set_footer_settings_updated_at
before update on public.footer_settings
for each row execute function public.set_updated_at();
alter table public.footer_settings enable row level security;
drop policy if exists "footer_settings_public_select" on public.footer_settings;
create policy "footer_settings_public_select"
on public.footer_settings for select to anon, authenticated
using (true);
drop policy if exists "footer_settings_admin_write" on public.footer_settings;
create policy "footer_settings_admin_write"
on public.footer_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());
insert into public.footer_settings (columns, social_links, contact_info)
select
  '[
    {"title": "Quick Links", "links": [{"label": "Home", "link": "/", "active": true}, {"label": "About Us", "link": "/about", "active": true}, {"label": "Courses", "link": "/courses", "active": true}, {"label": "Blogs", "link": "/blogs", "active": true}, {"label": "Contact", "link": "/contact", "active": true}]},
    {"title": "Courses", "links": [{"label": "Digital Marketing", "link": "/courses/digital-marketing", "active": true}, {"label": "SEO Training", "link": "/courses/seo", "active": true}, {"label": "Social Media", "link": "/courses/social-media", "active": true}, {"label": "Google Ads", "link": "/courses/google-ads", "active": true}]},
    {"title": "Company", "links": [{"label": "About Us", "link": "/about", "active": true}, {"label": "Careers", "link": "/careers", "active": true}, {"label": "Partners", "link": "/partners", "active": true}, {"label": "Blog", "link": "/blogs", "active": true}]},
    {"title": "Contact", "links": [{"label": "Phone", "link": "tel:+919876543210", "active": true}, {"label": "Email", "link": "mailto:info@acadvizen.com", "active": true}, {"label": "Location", "link": "/contact", "active": true}]}
  ]'::jsonb,
  '[{"platform": "linkedin", "url": "https://linkedin.com", "active": true}, {"platform": "twitter", "url": "https://twitter.com", "active": true}, {"platform": "instagram", "url": "https://instagram.com", "active": true}, {"platform": "facebook", "url": "https://facebook.com", "active": true}]'::jsonb,
  '[{"type": "phone", "value": "+91 98765 43210", "label": "Phone"}, {"type": "email", "value": "info@acadvizen.com", "label": "Email"}, {"type": "address", "value": "Bangalore, Karnataka", "label": "Location"}]'::jsonb
where not exists (select 1 from public.footer_settings);
