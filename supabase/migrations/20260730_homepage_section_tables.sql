-- Create dedicated homepage section tables that CMS APIs expect
-- These tables are referenced by app/api/cms/homepage/* route files
-- but were never created in earlier migrations.

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
-- homepage_hero
-- ==================================================
create table if not exists public.homepage_hero (
  id uuid primary key default gen_random_uuid(),
  heading text,
  subheading text,
  video_url text,
  video_title text,
  video_autoplay boolean default false,
  background_image text,
  mobile_background_image text,
  cta_text text default 'Enroll Now',
  cta_link text default '/courses',
  secondary_cta_text text,
  secondary_cta_link text,
  badge_text text default '100% Job Guaranteed*',
  badge_color text default '#10b981',
  show_hero boolean default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Insert default hero record
insert into public.homepage_hero (heading, subheading, badge_text)
values (
  'Master AI-Powered Digital Marketing Course',
  'Build Your Own Learning Path with Guidance from Global Industry Experts',
  '100% Job Guaranteed*'
)
on conflict do nothing;

drop trigger if exists set_homepage_hero_updated_at on public.homepage_hero;
create trigger set_homepage_hero_updated_at
before update on public.homepage_hero
for each row execute function public.set_updated_at();

alter table public.homepage_hero enable row level security;
drop policy if exists "homepage_hero_public_select" on public.homepage_hero;
create policy "homepage_hero_public_select"
on public.homepage_hero for select to anon, authenticated using (true);
drop policy if exists "homepage_hero_admin_all" on public.homepage_hero;
create policy "homepage_hero_admin_all"
on public.homepage_hero for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_faq
-- ==================================================
create table if not exists public.homepage_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_faq_updated_at on public.homepage_faq;
create trigger set_homepage_faq_updated_at
before update on public.homepage_faq
for each row execute function public.set_updated_at();

alter table public.homepage_faq enable row level security;
drop policy if exists "homepage_faq_public_select" on public.homepage_faq;
create policy "homepage_faq_public_select"
on public.homepage_faq for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_faq_admin_all" on public.homepage_faq;
create policy "homepage_faq_admin_all"
on public.homepage_faq for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_tools (featured tools for homepage display)
-- ==================================================
create table if not exists public.homepage_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_tools_updated_at on public.homepage_tools;
create trigger set_homepage_tools_updated_at
before update on public.homepage_tools
for each row execute function public.set_updated_at();

alter table public.homepage_tools enable row level security;
drop policy if exists "homepage_tools_public_select" on public.homepage_tools;
create policy "homepage_tools_public_select"
on public.homepage_tools for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_tools_admin_all" on public.homepage_tools;
create policy "homepage_tools_admin_all"
on public.homepage_tools for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_curriculum
-- ==================================================
create table if not exists public.homepage_curriculum (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_curriculum_updated_at on public.homepage_curriculum;
create trigger set_homepage_curriculum_updated_at
before update on public.homepage_curriculum
for each row execute function public.set_updated_at();

alter table public.homepage_curriculum enable row level security;
drop policy if exists "homepage_curriculum_public_select" on public.homepage_curriculum;
create policy "homepage_curriculum_public_select"
on public.homepage_curriculum for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_curriculum_admin_all" on public.homepage_curriculum;
create policy "homepage_curriculum_admin_all"
on public.homepage_curriculum for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_course_highlights
-- ==================================================
create table if not exists public.homepage_course_highlights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_course_highlights_updated_at on public.homepage_course_highlights;
create trigger set_homepage_course_highlights_updated_at
before update on public.homepage_course_highlights
for each row execute function public.set_updated_at();

alter table public.homepage_course_highlights enable row level security;
drop policy if exists "homepage_course_highlights_public_select" on public.homepage_course_highlights;
create policy "homepage_course_highlights_public_select"
on public.homepage_course_highlights for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_course_highlights_admin_all" on public.homepage_course_highlights;
create policy "homepage_course_highlights_admin_all"
on public.homepage_course_highlights for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_course_modules
-- ==================================================
create table if not exists public.homepage_course_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_course_modules_updated_at on public.homepage_course_modules;
create trigger set_homepage_course_modules_updated_at
before update on public.homepage_course_modules
for each row execute function public.set_updated_at();

alter table public.homepage_course_modules enable row level security;
drop policy if exists "homepage_course_modules_public_select" on public.homepage_course_modules;
create policy "homepage_course_modules_public_select"
on public.homepage_course_modules for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_course_modules_admin_all" on public.homepage_course_modules;
create policy "homepage_course_modules_admin_all"
on public.homepage_course_modules for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_partners
-- ==================================================
create table if not exists public.homepage_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_partners_updated_at on public.homepage_partners;
create trigger set_homepage_partners_updated_at
before update on public.homepage_partners
for each row execute function public.set_updated_at();

alter table public.homepage_partners enable row level security;
drop policy if exists "homepage_partners_public_select" on public.homepage_partners;
create policy "homepage_partners_public_select"
on public.homepage_partners for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_partners_admin_all" on public.homepage_partners;
create policy "homepage_partners_admin_all"
on public.homepage_partners for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_placements
-- ==================================================
create table if not exists public.homepage_placements (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  company_name text,
  role text,
  image_url text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_placements_updated_at on public.homepage_placements;
create trigger set_homepage_placements_updated_at
before update on public.homepage_placements
for each row execute function public.set_updated_at();

alter table public.homepage_placements enable row level security;
drop policy if exists "homepage_placements_public_select" on public.homepage_placements;
create policy "homepage_placements_public_select"
on public.homepage_placements for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_placements_admin_all" on public.homepage_placements;
create policy "homepage_placements_admin_all"
on public.homepage_placements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_projects
-- ==================================================
create table if not exists public.homepage_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  project_url text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_projects_updated_at on public.homepage_projects;
create trigger set_homepage_projects_updated_at
before update on public.homepage_projects
for each row execute function public.set_updated_at();

alter table public.homepage_projects enable row level security;
drop policy if exists "homepage_projects_public_select" on public.homepage_projects;
create policy "homepage_projects_public_select"
on public.homepage_projects for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_projects_admin_all" on public.homepage_projects;
create policy "homepage_projects_admin_all"
on public.homepage_projects for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_testimonials
-- ==================================================
create table if not exists public.homepage_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  quote text,
  image_url text,
  order_index int default 0,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_testimonials_updated_at on public.homepage_testimonials;
create trigger set_homepage_testimonials_updated_at
before update on public.homepage_testimonials
for each row execute function public.set_updated_at();

alter table public.homepage_testimonials enable row level security;
drop policy if exists "homepage_testimonials_public_select" on public.homepage_testimonials;
create policy "homepage_testimonials_public_select"
on public.homepage_testimonials for select to anon, authenticated using (is_active = true);
drop policy if exists "homepage_testimonials_admin_all" on public.homepage_testimonials;
create policy "homepage_testimonials_admin_all"
on public.homepage_testimonials for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ==================================================
-- homepage_cta
-- ==================================================
create table if not exists public.homepage_cta (
  id uuid primary key default gen_random_uuid(),
  heading text,
  subheading text,
  button_text text default 'Get Started',
  button_link text default '/courses',
  secondary_button_text text,
  secondary_button_link text,
  background_image text,
  is_active boolean default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_homepage_cta_updated_at on public.homepage_cta;
create trigger set_homepage_cta_updated_at
before update on public.homepage_cta
for each row execute function public.set_updated_at();

alter table public.homepage_cta enable row level security;
drop policy if exists "homepage_cta_public_select" on public.homepage_cta;
create policy "homepage_cta_public_select"
on public.homepage_cta for select to anon, authenticated using (true);
drop policy if exists "homepage_cta_admin_all" on public.homepage_cta;
create policy "homepage_cta_admin_all"
on public.homepage_cta for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Insert default homepage_cta record
insert into public.homepage_cta (heading, subheading, button_text, button_link)
values ('Ready to Start Your Journey?', 'Join thousands of successful students who transformed their careers with Acadvizen', 'Enroll Now', '/courses')
on conflict do nothing;
