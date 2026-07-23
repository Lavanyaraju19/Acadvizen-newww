-- City Page Builder Schema
-- Create tables for city-specific landing pages

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

-- City pages table
create table if not exists public.city_pages (
  id uuid primary key default gen_random_uuid(),
  city_name text not null,
  slug text not null unique,
  hero_title text,
  hero_subtitle text,
  hero_description text,
  hero_image_url text,
  hero_video_url text,
  hero_cta_text text,
  hero_cta_link text,
  about_title text,
  about_description text,
  about_image_url text,
  features jsonb not null default '[]'::jsonb,
  stats jsonb not null default '[]'::jsonb,
  testimonials jsonb not null default '[]'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  contact_phone text,
  contact_email text,
  contact_address text,
  google_maps_url text,
  seo_title text,
  seo_description text,
  meta_keywords text,
  og_image_url text,
  canonical_url text,
  is_active boolean default true,
  priority int default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_city_pages_slug on public.city_pages(slug);
create index if not exists idx_city_pages_is_active on public.city_pages(is_active);
create index if not exists idx_city_pages_priority on public.city_pages(priority);
create index if not exists idx_city_pages_city_name on public.city_pages(city_name);

-- Trigger for updated_at
drop trigger if exists set_city_pages_updated_at on public.city_pages;
create trigger set_city_pages_updated_at
before update on public.city_pages
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.city_pages enable row level security;

-- City pages: public read active, admin full access
drop policy if exists "city_pages_public_select" on public.city_pages;
create policy "city_pages_public_select"
on public.city_pages for select to anon, authenticated
using (is_active = true);

drop policy if exists "city_pages_admin_write" on public.city_pages;
create policy "city_pages_admin_write"
on public.city_pages for all to authenticated
using (public.is_admin())
with check (public.is_admin());