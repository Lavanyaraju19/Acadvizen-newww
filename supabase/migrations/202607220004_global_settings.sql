-- Global Settings Consolidation Schema
-- Create a centralized settings table for all site-wide configuration

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

-- Global settings table
create table if not exists public.global_settings (
  id uuid primary key default gen_random_uuid(),
  
  -- Business Information
  business_name text default 'Acadvizen',
  tagline text,
  description text,
  
  -- Branding
  logo_url text,
  logo_alt text default 'Acadvizen Logo',
  favicon_url text,
  
  -- Contact Information
  phone text,
  phone_formatted text,
  email text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  
  -- Social Media
  linkedin_url text,
  twitter_url text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  whatsapp_url text,
  
  -- Google Maps
  google_maps_enabled boolean default true,
  google_maps_api_key text,
  google_maps_embed_url text,
  
  -- Business Hours
  business_hours jsonb not null default '{
    "monday": "9:00 AM - 6:00 PM",
    "tuesday": "9:00 AM - 6:00 PM",
    "wednesday": "9:00 AM - 6:00 PM",
    "thursday": "9:00 AM - 6:00 PM",
    "friday": "9:00 AM - 6:00 PM",
    "saturday": "10:00 AM - 4:00 PM",
    "sunday": "Closed"
  }'::jsonb,
  
  -- Analytics
  google_analytics_id text,
  google_tag_manager_id text,
  facebook_pixel_id text,
  meta_pixel_id text,
  
  -- Email/SMTP
  smtp_enabled boolean default false,
  smtp_host text,
  smtp_port int default 587,
  smtp_username text,
  smtp_password text,
  smtp_from_email text,
  smtp_from_name text,
  
  -- SEO Defaults
  default_meta_title text,
  default_meta_description text,
  default_og_image_url text,
  
  -- Site Settings
  maintenance_mode boolean default false,
  maintenance_message text,
  cookie_banner_enabled boolean default true,
  cookie_banner_text text,
  
  -- Footer
  copyright_text text default '© 2024 Acadvizen. All rights reserved.',
  
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Insert default global settings
insert into public.global_settings (
  business_name,
  tagline,
  description,
  email,
  phone,
  address,
  city,
  state,
  country,
  cookie_banner_text
) values (
  'Acadvizen',
  'Digital Marketing Excellence',
  'Leading digital marketing training institute offering comprehensive courses in SEO, Social Media, PPC, and more.',
  'info@acadvizen.com',
  '+91 98765 43210',
  '123 Tech Park, Electronic City',
  'Bangalore',
  'Karnataka',
  'India',
  'We use cookies to improve your experience. By continuing to use this site, you accept our privacy policy.'
)
on conflict do nothing;

-- Index
create index if not exists idx_global_settings_id on public.global_settings(id);

-- Trigger for updated_at
drop trigger if exists set_global_settings_updated_at on public.global_settings;
create trigger set_global_settings_updated_at
before update on public.global_settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.global_settings enable row level security;

drop policy if exists "global_settings_admin_all" on public.global_settings;
create policy "global_settings_admin_all"
on public.global_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Public read policy for non-sensitive data
drop policy if exists "global_settings_public_read" on public.global_settings;
create policy "global_settings_public_read"
on public.global_settings for select to anon, authenticated
using (true);