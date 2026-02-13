-- Blog posts + placements schema
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  featured_image text,
  author text,
  published_at timestamptz,
  is_published boolean default false,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;
drop policy if exists "blog_posts_public_select" on public.blog_posts;
create policy "blog_posts_public_select"
  on public.blog_posts
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "blog_posts_admin_write" on public.blog_posts;
create policy "blog_posts_admin_write"
  on public.blog_posts
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text,
  location text,
  package text,
  role text,
  description text,
  featured_image text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.placements enable row level security;
drop policy if exists "placements_public_select" on public.placements;
create policy "placements_public_select"
  on public.placements
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "placements_admin_write" on public.placements;
create policy "placements_admin_write"
  on public.placements
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage buckets for blog + placements
insert into storage.buckets (id, name, public)
values
  ('blog', 'blog', true),
  ('placements', 'placements', true)
on conflict (id) do nothing;

-- Extend storage policies to include new buckets
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id in ('pdfs','brochures','course-thumbnails','gallery','videos','blog','placements'));

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write"
  on storage.objects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
