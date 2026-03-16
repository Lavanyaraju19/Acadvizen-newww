-- Second-pass CMS expansion:
-- visual editing controls, authority/trust modules, scalable SEO landing entities,
-- reusable blocks/templates, and lead/redirect infrastructure.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- ==================================================
-- Add visual/style controls to site settings + sections
-- ==================================================
alter table public.site_settings
  add column if not exists design_tokens jsonb not null default '{}'::jsonb;

alter table public.sections
  add column if not exists style_json jsonb not null default '{}'::jsonb;

create table if not exists public.section_styles (
  id uuid primary key default gen_random_uuid(),
  section_id uuid unique references public.sections(id) on delete cascade,
  style_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_section_styles_updated_at on public.section_styles;
create trigger set_section_styles_updated_at
before update on public.section_styles
for each row execute function public.set_updated_at();

-- ==================================================
-- Reusable blocks + templates
-- ==================================================
create table if not exists public.reusable_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null,
  content_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_reusable_blocks_updated_at on public.reusable_blocks;
create trigger set_reusable_blocks_updated_at
before update on public.reusable_blocks
for each row execute function public.set_updated_at();

create table if not exists public.page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  page_type text,
  sections_json jsonb not null default '[]'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_page_templates_updated_at on public.page_templates;
create trigger set_page_templates_updated_at
before update on public.page_templates
for each row execute function public.set_updated_at();

-- ==================================================
-- Blog taxonomy + authors + structured blocks
-- ==================================================
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  bio text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_authors_updated_at on public.authors;
create trigger set_authors_updated_at
before update on public.authors
for each row execute function public.set_updated_at();

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_blog_categories_updated_at on public.blog_categories;
create trigger set_blog_categories_updated_at
before update on public.blog_categories
for each row execute function public.set_updated_at();

create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_blog_tags_updated_at on public.blog_tags;
create trigger set_blog_tags_updated_at
before update on public.blog_tags
for each row execute function public.set_updated_at();

create table if not exists public.blog_content_blocks (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blogs(id) on delete cascade,
  order_index int not null default 0,
  block_type text not null,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_content_blocks_blog_id on public.blog_content_blocks (blog_id, order_index);

drop trigger if exists set_blog_content_blocks_updated_at on public.blog_content_blocks;
create trigger set_blog_content_blocks_updated_at
before update on public.blog_content_blocks
for each row execute function public.set_updated_at();

alter table public.blogs
  add column if not exists author_id uuid references public.authors(id) on delete set null,
  add column if not exists noindex boolean not null default false,
  add column if not exists og_image text,
  add column if not exists faq_schema jsonb;

-- ==================================================
-- Authority / trust / conversion modules
-- ==================================================
create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  company text,
  summary text,
  image_url text,
  video_url text,
  result_metric text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_success_stories_updated_at on public.success_stories;
create trigger set_success_stories_updated_at
before update on public.success_stories
for each row execute function public.set_updated_at();

create table if not exists public.recruiters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_recruiters_updated_at on public.recruiters;
create trigger set_recruiters_updated_at
before update on public.recruiters
for each row execute function public.set_updated_at();

create table if not exists public.instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  bio text,
  image_url text,
  linkedin_url text,
  expertise jsonb not null default '[]'::jsonb,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_instructors_updated_at on public.instructors;
create trigger set_instructors_updated_at
before update on public.instructors
for each row execute function public.set_updated_at();

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text,
  logo_url text,
  description text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_certifications_updated_at on public.certifications;
create trigger set_certifications_updated_at
before update on public.certifications
for each row execute function public.set_updated_at();

create table if not exists public.student_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null unique,
  label text not null,
  value text not null,
  suffix text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_student_metrics_updated_at on public.student_metrics;
create trigger set_student_metrics_updated_at
before update on public.student_metrics
for each row execute function public.set_updated_at();

create table if not exists public.trust_badges (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  icon text,
  description text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_trust_badges_updated_at on public.trust_badges;
create trigger set_trust_badges_updated_at
before update on public.trust_badges
for each row execute function public.set_updated_at();

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  event_date timestamptz,
  location text,
  description text,
  image_url text,
  registration_url text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_community_events_updated_at on public.community_events;
create trigger set_community_events_updated_at
before update on public.community_events
for each row execute function public.set_updated_at();

create table if not exists public.cta_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  description text,
  button_label text,
  button_url text,
  secondary_label text,
  secondary_url text,
  variant text,
  style_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_cta_blocks_updated_at on public.cta_blocks;
create trigger set_cta_blocks_updated_at
before update on public.cta_blocks
for each row execute function public.set_updated_at();

-- Keep testimonials table compatible for video testimonials
alter table public.testimonials
  add column if not exists video_testimonial_url text,
  add column if not exists student_result text;

-- ==================================================
-- Scalable SEO landing entities
-- ==================================================
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  state text,
  country text default 'India',
  meta_title text,
  meta_description text,
  intro_text text,
  highlights jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cities
  add column if not exists state text,
  add column if not exists country text default 'India',
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists intro_text text,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_cities_updated_at on public.cities;
create trigger set_cities_updated_at
before update on public.cities
for each row execute function public.set_updated_at();

create table if not exists public.location_pages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references public.cities(id) on delete set null,
  course_slug text,
  slug text not null unique,
  title text not null,
  description text,
  template_slug text,
  sections_json jsonb not null default '[]'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_image text,
  noindex boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_location_pages_slug on public.location_pages (slug);
create index if not exists idx_location_pages_city_course on public.location_pages (city_id, course_slug);

drop trigger if exists set_location_pages_updated_at on public.location_pages;
create trigger set_location_pages_updated_at
before update on public.location_pages
for each row execute function public.set_updated_at();

-- Redirects for slug changes and SEO migration control
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code int not null default 301,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_redirects_updated_at on public.redirects;
create trigger set_redirects_updated_at
before update on public.redirects
for each row execute function public.set_updated_at();

-- ==================================================
-- Navigation/footer compatibility entities
-- ==================================================
create table if not exists public.footer_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_footer_groups_updated_at on public.footer_groups;
create trigger set_footer_groups_updated_at
before update on public.footer_groups
for each row execute function public.set_updated_at();

create table if not exists public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  location text not null default 'header',
  title text not null,
  url text not null,
  parent_id uuid references public.navigation_menus(id) on delete set null,
  target text not null default '_self',
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_navigation_menus_updated_at on public.navigation_menus;
create trigger set_navigation_menus_updated_at
before update on public.navigation_menus
for each row execute function public.set_updated_at();

-- ==================================================
-- Leads (conversion submissions)
-- ==================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  page_slug text,
  source text,
  form_type text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- ==================================================
-- RLS policies for new tables
-- ==================================================
alter table public.section_styles enable row level security;
alter table public.reusable_blocks enable row level security;
alter table public.page_templates enable row level security;
alter table public.authors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_content_blocks enable row level security;
alter table public.success_stories enable row level security;
alter table public.recruiters enable row level security;
alter table public.instructors enable row level security;
alter table public.certifications enable row level security;
alter table public.student_metrics enable row level security;
alter table public.trust_badges enable row level security;
alter table public.community_events enable row level security;
alter table public.cta_blocks enable row level security;
alter table public.cities enable row level security;
alter table public.location_pages enable row level security;
alter table public.redirects enable row level security;
alter table public.footer_groups enable row level security;
alter table public.navigation_menus enable row level security;
alter table public.leads enable row level security;

-- Public read policies
drop policy if exists "section_styles_public_select" on public.section_styles;
create policy "section_styles_public_select"
on public.section_styles for select to anon, authenticated using (true);

drop policy if exists "reusable_blocks_public_select" on public.reusable_blocks;
create policy "reusable_blocks_public_select"
on public.reusable_blocks for select to anon, authenticated using (status = 'published');

drop policy if exists "page_templates_public_select" on public.page_templates;
create policy "page_templates_public_select"
on public.page_templates for select to anon, authenticated using (is_active = true);

drop policy if exists "authors_public_select" on public.authors;
create policy "authors_public_select"
on public.authors for select to anon, authenticated using (true);

drop policy if exists "blog_categories_public_select" on public.blog_categories;
create policy "blog_categories_public_select"
on public.blog_categories for select to anon, authenticated using (true);

drop policy if exists "blog_tags_public_select" on public.blog_tags;
create policy "blog_tags_public_select"
on public.blog_tags for select to anon, authenticated using (true);

drop policy if exists "blog_content_blocks_public_select" on public.blog_content_blocks;
create policy "blog_content_blocks_public_select"
on public.blog_content_blocks for select to anon, authenticated using (
  exists (
    select 1
    from public.blogs b
    where b.id = blog_content_blocks.blog_id
      and b.status = 'published'
  )
);

drop policy if exists "success_stories_public_select" on public.success_stories;
create policy "success_stories_public_select"
on public.success_stories for select to anon, authenticated using (is_active = true);

drop policy if exists "recruiters_public_select" on public.recruiters;
create policy "recruiters_public_select"
on public.recruiters for select to anon, authenticated using (is_active = true);

drop policy if exists "instructors_public_select" on public.instructors;
create policy "instructors_public_select"
on public.instructors for select to anon, authenticated using (is_active = true);

drop policy if exists "certifications_public_select" on public.certifications;
create policy "certifications_public_select"
on public.certifications for select to anon, authenticated using (is_active = true);

drop policy if exists "student_metrics_public_select" on public.student_metrics;
create policy "student_metrics_public_select"
on public.student_metrics for select to anon, authenticated using (is_active = true);

drop policy if exists "trust_badges_public_select" on public.trust_badges;
create policy "trust_badges_public_select"
on public.trust_badges for select to anon, authenticated using (is_active = true);

drop policy if exists "community_events_public_select" on public.community_events;
create policy "community_events_public_select"
on public.community_events for select to anon, authenticated using (is_active = true);

drop policy if exists "cta_blocks_public_select" on public.cta_blocks;
create policy "cta_blocks_public_select"
on public.cta_blocks for select to anon, authenticated using (is_active = true);

drop policy if exists "cities_public_select" on public.cities;
create policy "cities_public_select"
on public.cities for select to anon, authenticated using (is_active = true);

drop policy if exists "location_pages_public_select" on public.location_pages;
create policy "location_pages_public_select"
on public.location_pages for select to anon, authenticated using (status = 'published');

drop policy if exists "redirects_public_select" on public.redirects;
create policy "redirects_public_select"
on public.redirects for select to anon, authenticated using (is_active = true);

drop policy if exists "footer_groups_public_select" on public.footer_groups;
create policy "footer_groups_public_select"
on public.footer_groups for select to anon, authenticated using (is_active = true);

drop policy if exists "navigation_menus_public_select" on public.navigation_menus;
create policy "navigation_menus_public_select"
on public.navigation_menus for select to anon, authenticated using (is_active = true);

-- Leads: no public read
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert"
on public.leads for insert to anon, authenticated with check (true);

-- Admin write policies
do $$
declare
  tbl text;
  tables text[] := array[
    'section_styles',
    'reusable_blocks',
    'page_templates',
    'authors',
    'blog_categories',
    'blog_tags',
    'blog_content_blocks',
    'success_stories',
    'recruiters',
    'instructors',
    'certifications',
    'student_metrics',
    'trust_badges',
    'community_events',
    'cta_blocks',
    'cities',
    'location_pages',
    'redirects',
    'footer_groups',
    'navigation_menus',
    'leads'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "%I_admin_write" on public.%I', tbl, tbl);
    execute format(
      'create policy "%I_admin_write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      tbl,
      tbl
    );
  end loop;
end
$$;
