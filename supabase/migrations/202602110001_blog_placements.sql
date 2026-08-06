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

-- `blog_posts` predates this migration in some environments as a plain VIEW (likely a
-- compatibility alias over public.blogs, which is where the real, actively-used blog CMS
-- content lives - see app/api/cms/blogs/route.js). `create table if not exists` above is then a
-- no-op (Postgres treats any existing relation, view or table, as satisfying IF NOT EXISTS), and
-- RLS/policies cannot be applied to a plain view - guard so this only runs against a real table.
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'blog_posts' and c.relkind = 'r'
  ) then
    execute 'alter table public.blog_posts enable row level security';
    execute 'drop policy if exists "blog_posts_public_select" on public.blog_posts';
    execute $p$create policy "blog_posts_public_select"
      on public.blog_posts
      for select
      to anon, authenticated
      using (is_published = true)$p$;
    execute 'drop policy if exists "blog_posts_admin_write" on public.blog_posts';
    execute $p$create policy "blog_posts_admin_write"
      on public.blog_posts
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())$p$;
  end if;
end $$;

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
