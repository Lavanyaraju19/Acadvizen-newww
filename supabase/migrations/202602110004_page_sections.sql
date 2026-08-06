-- Page-level dynamic content sections (courses/tools/about/contact)
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null,
  title text,
  subtitle text,
  body text,
  items_json jsonb,
  cta_json jsonb,
  order_index int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_slug, section_key)
);

drop trigger if exists set_page_sections_updated_at on public.page_sections;
create trigger set_page_sections_updated_at
before update on public.page_sections
for each row
execute function public.set_updated_at();

alter table public.page_sections enable row level security;
drop policy if exists "page_sections_public_select" on public.page_sections;
create policy "page_sections_public_select"
  on public.page_sections
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "page_sections_admin_write" on public.page_sections;
create policy "page_sections_admin_write"
  on public.page_sections
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.page_sections
  (page_slug, section_key, title, subtitle, body, items_json, cta_json, order_index, is_active)
values
  (
    'courses',
    'hero',
    'Courses',
    'Structured learning with premium resources - built for marketers who want outcomes, not noise.',
    null,
    null,
    null,
    1,
    true
  ),
  (
    'courses',
    'empty',
    null,
    null,
    'No courses available.',
    null,
    null,
    2,
    true
  ),
  (
    'tools',
    'hero',
    'Tool Library',
    'Search and filter the full collection. Hover to feel the depth - click to open tool details.',
    null,
    null,
    null,
    1,
    true
  ),
  (
    'tools',
    'empty',
    null,
    null,
    'No tools found.',
    null,
    null,
    2,
    true
  ),
  (
    'tools',
    'meta',
    null,
    null,
    null,
    null,
    '{"tip":"Tip: Hover cards for 3D lift + glow","search_placeholder":"Search tools..."}'::jsonb,
    3,
    true
  ),
  (
    'about',
    'hero',
    'A premium platform built for marketers who ship',
    'Acadvizen is designed to remove friction from learning and execution - so you can move from strategy to results with speed, clarity, and confidence.',
    null,
    null,
    '{"badge":"Our story"}'::jsonb,
    1,
    true
  ),
  (
    'about',
    'story',
    'Our Story',
    null,
    null,
    '[
      "Digital marketing moves fast. Tools change weekly. Playbooks get outdated. Teams waste time stitching together tabs, notes, and scattered assets.",
      "Acadvizen brings everything into one premium environment: a curated tool library, structured courses, and a resource hub that supports real execution - not just theory."
    ]'::jsonb,
    null,
    2,
    true
  ),
  (
    'about',
    'stats',
    null,
    null,
    null,
    '[{"k":"75+","v":"Tools"},{"k":"Courses","v":"Structured"},{"k":"RLS","v":"Secure"}]'::jsonb,
    null,
    3,
    true
  ),
  (
    'about',
    'highlights',
    'Crafted for premium outcomes',
    null,
    null,
    '[
      {"title":"Strategy to execution","desc":"Structure that speeds decisions.","bg":"from-teal-400/25 via-sky-400/10 to-transparent"},
      {"title":"Operator-grade tools","desc":"Curated for real workflows.","bg":"from-indigo-400/25 via-teal-400/10 to-transparent"},
      {"title":"Premium learning","desc":"Courses + resources together.","bg":"from-sky-400/25 via-indigo-400/10 to-transparent"},
      {"title":"Secure access","desc":"Roles, approvals, and RLS.","bg":"from-teal-400/25 via-indigo-400/10 to-transparent"}
    ]'::jsonb,
    '{"scroll_label":"Scroll ->"}'::jsonb,
    4,
    true
  ),
  (
    'about',
    'mission',
    'Mission',
    'To democratize access to premium digital marketing resources and education - so teams and individuals can build better campaigns, faster, with less guesswork.',
    null,
    '[
      {"t":"Premium by default","d":"Dark, elegant UI with subtle motion and depth."},
      {"t":"Clarity > complexity","d":"Information architecture that stays clean at scale."},
      {"t":"Built for trust","d":"Roles, approvals, and secure data boundaries."}
    ]'::jsonb,
    null,
    5,
    true
  ),
  (
    'contact',
    'form',
    'Contact Us',
    null,
    'Thank you for your message! We will get back to you soon.',
    null,
    '{"submit_label":"Send Message"}'::jsonb,
    1,
    true
  )
on conflict (page_slug, section_key)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  items_json = excluded.items_json,
  cta_json = excluded.cta_json,
  order_index = excluded.order_index,
  is_active = excluded.is_active;
