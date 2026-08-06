-- Banner Management Schema
-- Create tables for responsive banner management

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

-- Banners table
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'hero' check (type in ('hero', 'sidebar', 'footer', 'popup', 'floating')),
  desktop_image text,
  tablet_image text,
  mobile_image text,
  link_url text,
  alt_text text,
  title text,
  description text,
  button_text text,
  button_color text default '#5eead4',
  text_color text default '#ffffff',
  background_color text default '#050b12',
  is_active boolean default true,
  show_button boolean default true,
  start_date timestamptz,
  end_date timestamptz,
  priority int default 0,
  device_targeting jsonb not null default '{"desktop": true, "tablet": true, "mobile": true}'::jsonb,
  page_targeting jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_banners_status on public.banners(status);
create index if not exists idx_banners_is_active on public.banners(is_active);
create index if not exists idx_banners_priority on public.banners(priority);
create index if not exists idx_banners_type on public.banners(type);

-- Trigger for updated_at
drop trigger if exists set_banners_updated_at on public.banners;
create trigger set_banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.banners enable row level security;

-- Banners: public read published/active, admin full access
drop policy if exists "banners_public_select" on public.banners;
create policy "banners_public_select"
on public.banners for select to anon, authenticated
using (status = 'published' and is_active = true);

drop policy if exists "banners_admin_write" on public.banners;
create policy "banners_admin_write"
on public.banners for all to authenticated
using (public.is_admin())
with check (public.is_admin());