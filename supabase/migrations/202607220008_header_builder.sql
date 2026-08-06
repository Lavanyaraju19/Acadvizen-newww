-- Header Builder Schema
-- Create table for header configuration

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

-- Header settings table
create table if not exists public.header_settings (
  id uuid primary key default gen_random_uuid(),
  
  -- Logo
  logo_url text,
  logo_alt text,
  logo_link text default '/',
  
  -- Announcement Bar
  announcement_enabled boolean default false,
  announcement_text text,
  announcement_link text,
  announcement_bg_color text default '#10b981',
  announcement_text_color text default '#ffffff',
  
  -- Navigation
  nav_items jsonb not null default '[]'::jsonb,
  
  -- CTA Buttons
  primary_cta_enabled boolean default true,
  primary_cta_text text default 'Get Started',
  primary_cta_link text default '/courses',
  primary_cta_bg_color text default '#14b8a6',
  primary_cta_text_color text default '#ffffff',
  
  secondary_cta_enabled boolean default false,
  secondary_cta_text text default 'Login',
  secondary_cta_link text default '/login',
  secondary_cta_bg_color text default 'transparent',
  secondary_cta_text_color text default '#ffffff',
  secondary_cta_border_color text default '#ffffff',
  
  -- Contact Info
  show_phone boolean default false,
  phone_number text,
  phone_link text,
  
  show_email boolean default false,
  email_address text,
  email_link text,
  
  -- Social Icons
  show_social boolean default false,
  social_items jsonb not null default '[]'::jsonb,
  
  -- Header Settings
  sticky_header boolean default false,
  transparent_header boolean default false,
  header_bg_color text default '#050b12',
  header_text_color text default '#ffffff',
  header_border_color text default 'rgba(255,255,255,0.1)',
  
  -- Mobile Menu
  mobile_menu_style text default 'drawer' check (mobile_menu_style in ('drawer', 'dropdown')),
  
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- header_settings may already exist from 202601280001_phase1_hybrid_cms_base.sql with only its
-- original, smaller column set - the CREATE TABLE above is then a no-op, so these columns (and
-- the INSERT below, which references them) must be added explicitly rather than assumed present.
alter table public.header_settings
  add column if not exists logo_url text,
  add column if not exists logo_alt text,
  add column if not exists logo_link text default '/',
  add column if not exists announcement_enabled boolean default false,
  add column if not exists announcement_text text,
  add column if not exists announcement_link text,
  add column if not exists announcement_bg_color text default '#10b981',
  add column if not exists announcement_text_color text default '#ffffff',
  add column if not exists nav_items jsonb not null default '[]'::jsonb,
  add column if not exists primary_cta_enabled boolean default true,
  add column if not exists primary_cta_text text default 'Get Started',
  add column if not exists primary_cta_link text default '/courses',
  add column if not exists primary_cta_bg_color text default '#14b8a6',
  add column if not exists primary_cta_text_color text default '#ffffff',
  add column if not exists secondary_cta_enabled boolean default false,
  add column if not exists secondary_cta_text text default 'Login',
  add column if not exists secondary_cta_link text default '/login',
  add column if not exists secondary_cta_bg_color text default 'transparent',
  add column if not exists secondary_cta_text_color text default '#ffffff',
  add column if not exists secondary_cta_border_color text default '#ffffff',
  add column if not exists show_phone boolean default false,
  add column if not exists phone_number text,
  add column if not exists phone_link text,
  add column if not exists show_email boolean default false,
  add column if not exists email_address text,
  add column if not exists email_link text,
  add column if not exists show_social boolean default false,
  add column if not exists social_items jsonb not null default '[]'::jsonb,
  add column if not exists sticky_header boolean default false,
  add column if not exists transparent_header boolean default false,
  add column if not exists header_bg_color text default '#050b12',
  add column if not exists header_text_color text default '#ffffff',
  add column if not exists header_border_color text default 'rgba(255,255,255,0.1)',
  add column if not exists mobile_menu_style text default 'drawer',
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists updated_at timestamptz not null default now();

-- Insert default header settings (idempotent: only seed when the table is genuinely empty)
insert into public.header_settings (
  nav_items,
  social_items
)
select
  '[
    {"label": "Home", "link": "/", "active": true},
    {"label": "Courses", "link": "/courses", "active": true},
    {"label": "Blogs", "link": "/blogs", "active": true},
    {"label": "About", "link": "/about", "active": true},
    {"label": "Contact", "link": "/contact", "active": true}
  ]'::jsonb,
  '[
    {"platform": "linkedin", "url": "https://linkedin.com", "active": false},
    {"platform": "twitter", "url": "https://twitter.com", "active": false},
    {"platform": "instagram", "url": "https://instagram.com", "active": false},
    {"platform": "facebook", "url": "https://facebook.com", "active": false}
  ]'::jsonb
where not exists (select 1 from public.header_settings);

-- Index
create index if not exists idx_header_settings_id on public.header_settings(id);

-- Trigger for updated_at
drop trigger if exists set_header_settings_updated_at on public.header_settings;
create trigger set_header_settings_updated_at
before update on public.header_settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.header_settings enable row level security;

drop policy if exists "header_settings_admin_all" on public.header_settings;
create policy "header_settings_admin_all"
on public.header_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());