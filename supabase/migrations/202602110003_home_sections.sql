-- Home page dynamic content sections
create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text,
  subtitle text,
  body text,
  items_json jsonb,
  cta_json jsonb,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_home_sections_updated_at on public.home_sections;
create trigger set_home_sections_updated_at
before update on public.home_sections
for each row
execute function public.set_updated_at();

alter table public.home_sections enable row level security;
drop policy if exists "home_sections_public_select" on public.home_sections;
create policy "home_sections_public_select"
  on public.home_sections
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "home_sections_admin_write" on public.home_sections;
create policy "home_sections_admin_write"
  on public.home_sections
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.home_sections
  (section_key, title, subtitle, body, items_json, cta_json, order_index, is_active)
values
  (
    'hero',
    'Acadvizen - Build Your Own',
    'Choose your tools, customize your syllabus, and train for real jobs in India and abroad.',
    null,
    null,
    '{
      "badge": "Premium, build-your-own syllabus",
      "highlight": "Digital Marketing Course",
      "primary_label": "Explore Courses",
      "primary_href": "/courses",
      "secondary_label": "Explore Tools",
      "secondary_href": "/tools"
    }'::jsonb,
    1,
    true
  ),
  (
    'differences',
    'Why We Are Different',
    'Most institutes force a fixed syllabus. At Acadvizen, you build your own learning path.',
    null,
    '[
      "What modules you want",
      "Which tools you want to master",
      "Your pace and career goals",
      "Your specialization (SEO, Ads, Social, Analytics)"
    ]'::jsonb,
    null,
    2,
    true
  ),
  (
    'career_paths',
    'Choose your career path:',
    null,
    null,
    '[
      { "title": "Freshers", "desc": "Start your career in digital marketing with a customized learning plan." },
      { "title": "Working Professionals", "desc": "Upskill with tools and modules that match your job requirements." },
      { "title": "Business Owners", "desc": "Learn marketing tools that grow your business." },
      { "title": "Freelancers", "desc": "Build your own skill stack and get more clients." }
    ]'::jsonb,
    null,
    3,
    true
  ),
  (
    'syllabus',
    'Build Your Own Syllabus',
    null,
    'Core Modules',
    '[
      "Digital Marketing Fundamentals",
      "Content Marketing",
      "SEO (On-page and Off-page)",
      "Social Media Marketing",
      "Google Ads and Performance Marketing",
      "Email Marketing and Automation",
      "Analytics (GA4 and Tag Manager)"
    ]'::jsonb,
    null,
    4,
    true
  ),
  (
    'real_projects',
    'Real Projects',
    null,
    'Work on real campaigns and get hands-on experience.',
    null,
    null,
    5,
    true
  ),
  (
    'placement_support',
    'Placement Support',
    null,
    'We help you prepare for interviews and placements.',
    '[
      "Resume building",
      "LinkedIn optimization",
      "Mock interviews",
      "Hiring partners",
      "Internships and job opportunities"
    ]'::jsonb,
    null,
    6,
    true
  ),
  (
    'featured_courses',
    'Featured Courses',
    null,
    'No courses published yet.',
    null,
    '{"label":"View all courses","href":"/courses"}'::jsonb,
    6,
    true
  ),
  (
    'tools_section',
    'Tools You Will Master',
    'Build confidence with the exact tools used by top digital marketing teams.',
    'No tools available yet.',
    null,
    null,
    7,
    true
  ),
  (
    'upcoming_cohort',
    'Upcoming Cohort',
    'Secure your seat for the next fast-track cohort.',
    'Limited Seats',
    null,
    '{"empty_label":"No cohorts announced yet."}'::jsonb,
    8,
    true
  ),
  (
    'success_stories',
    'Success Stories',
    'Hear from learners who transformed their careers.',
    'No testimonials yet.',
    null,
    null,
    9,
    true
  ),
  (
    'learner_highlights',
    'Learner Highlights',
    'Moments from workshops, demos, and placements.',
    'No videos yet.',
    null,
    null,
    10,
    true
  ),
  (
    'campus_tour',
    'Campus Tour',
    'Explore our classrooms, labs, and learning lounges.',
    'No gallery items yet.',
    null,
    null,
    11,
    true
  ),
  (
    'faq',
    'FAQ',
    null,
    'No FAQs yet.',
    null,
    null,
    12,
    true
  ),
  (
    'alumni',
    'Alumni Network',
    'Learners now work across these hiring partners.',
    'No alumni yet.',
    null,
    null,
    13,
    true
  ),
  (
    'stats_section',
    'Impact Stats',
    null,
    'No stats yet.',
    null,
    null,
    14,
    true
  ),
  (
    'actions',
    null,
    null,
    E'No 647-35/29 5th Block, Jayanagar\nBangalore, Karnataka 560078',
    null,
    '{
      "apply_label": "Apply Now",
      "call_label": "Call",
      "whatsapp_label": "WhatsApp",
      "address_label": "Address",
      "phone": "+917411314848",
      "whatsapp": "917411314848"
    }'::jsonb,
    15,
    true
  ),
  (
    'registration_popup',
    'Quick Registration',
    'Reserve your spot in under 60 seconds.',
    'I agree to the Privacy Policy and allow Acadvizen to contact me.',
    null,
    '{"submit_label":"Register Now"}'::jsonb,
    16,
    true
  )
on conflict (section_key)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  items_json = excluded.items_json,
  cta_json = excluded.cta_json,
  order_index = excluded.order_index,
  is_active = excluded.is_active;
