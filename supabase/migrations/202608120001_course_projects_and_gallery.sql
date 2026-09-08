-- Smallest viable schema addition to support two real, previously-missing Course page sections:
-- practical "Projects" cards and a "Learning Experience" gallery. Mirrors the existing
-- course_details pattern (course_id FK, order_index, admin-only writes, public reads only
-- published rows) rather than inventing a new content-modeling approach. No rows are seeded -
-- both sections stay omitted on the public page until an admin adds real content (see
-- components/cms/immersive/ProjectGrid.jsx and CourseGallery.jsx).

create table if not exists public.course_projects (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  domain text,
  tools_used text,
  outcome text,
  image_url text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_projects_course_id on public.course_projects(course_id);
create index if not exists idx_course_projects_order on public.course_projects(order_index);

drop trigger if exists set_course_projects_updated_at on public.course_projects;
create trigger set_course_projects_updated_at
before update on public.course_projects
for each row execute function public.set_updated_at();

alter table public.course_projects enable row level security;

drop policy if exists "course_projects_public_select" on public.course_projects;
create policy "course_projects_public_select" on public.course_projects for select
  to anon, authenticated using (is_active = true or public.is_admin());

drop policy if exists "course_projects_admin_all" on public.course_projects;
create policy "course_projects_admin_all" on public.course_projects for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.course_gallery (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  image_url text not null,
  caption text,
  alt_text text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_gallery_course_id on public.course_gallery(course_id);
create index if not exists idx_course_gallery_order on public.course_gallery(order_index);

drop trigger if exists set_course_gallery_updated_at on public.course_gallery;
create trigger set_course_gallery_updated_at
before update on public.course_gallery
for each row execute function public.set_updated_at();

alter table public.course_gallery enable row level security;

drop policy if exists "course_gallery_public_select" on public.course_gallery;
create policy "course_gallery_public_select" on public.course_gallery for select
  to anon, authenticated using (is_active = true or public.is_admin());

drop policy if exists "course_gallery_admin_all" on public.course_gallery;
create policy "course_gallery_admin_all" on public.course_gallery for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
