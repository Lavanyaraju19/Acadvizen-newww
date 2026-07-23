-- Footer Builder Schema
-- Create table for footer configuration

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

-- Footer settings table
create table if not exists public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  
  -- Logo
  logo_url text,
  logo_alt text default 'Acadvizen',
  
  -- Footer Columns
  column1_title text default 'Quick Links',
  column1_links jsonb not null default '[]'::jsonb,
  
  column2_title text default 'Courses',
  column2_links jsonb not null default '[]'::jsonb,
  
  column3_title text default 'Company',
  column3_links jsonb not null default '[]'::jsonb,
  
  column4_title text default 'Contact',
  column4_links jsonb not null default '[]'::jsonb,
  
  -- Contact Info
  show_contact boolean default true,
  contact_phone text,
  contact_email text,
  contact_address text,
  
  -- Social Icons
  show_social boolean default true,
  social_items jsonb not null default '[]'::jsonb,
  
  -- Newsletter
  show_newsletter boolean default false,
  newsletter_title text default 'Subscribe to our newsletter',
  newsletter_placeholder text default 'Enter your email',
  
  -- Copyright
  copyright_text text default '© 2024 Acadvizen. All rights reserved.',
  
  -- Legal Links
  show_legal boolean default true,
  privacy_policy_link text default '/privacy',
  terms_link text default '/terms',
  cookie_policy_link text default '/cookies',
  
  -- Footer Settings
  footer_bg_color text default '#050b12',
  footer_text_color text default '#ffffff',
  footer_link_color text default '#94a3b8',
  footer_border_color text default 'rgba(255,255,255,0.1)',
  
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Insert default footer settings
insert into public.footer_settings (
  column1_links,
  column2_links,
  column3_links,
  column4_links,
  social_items
) values (
  '[
    {"label": "Home", "link": "/", "active": true},
    {"label": "About Us", "link": "/about", "active": true},
    {"label": "Courses", "link": "/courses", "active": true},
    {"label": "Blogs", "link": "/blogs", "active": true},
    {"label": "Contact", "link": "/contact", "active": true}
  ]'::jsonb,
  '[
    {"label": "Digital Marketing", "link": "/courses/digital-marketing", "active": true},
    {"label": "SEO Training", "link": "/courses/seo", "active": true},
    {"label": "Social Media", "link": "/courses/social-media", "active": true},
    {"label": "Google Ads", "link": "/courses/google-ads", "active": true}
  ]'::jsonb,
  '[
    {"label": "About Us", "link": "/about", "active": true},
    {"label": "Careers", "link": "/careers", "active": true},
    {"label": "Partners", "link": "/partners", "active": true},
    {"label": "Blog", "link": "/blogs", "active": true}
  ]'::jsonb,
  '[
    {"label": "Phone", "link": "tel:+919876543210", "active": true},
    {"label": "Email", "link": "mailto:info@acadvizen.com", "active": true},
    {"label": "Location", "link": "/contact", "active": true}
  ]'::jsonb,
  '[
    {"platform": "linkedin", "url": "https://linkedin.com", "active": true},
    {"platform": "twitter", "url": "https://twitter.com", "active": true},
    {"platform": "instagram", "url": "https://instagram.com", "active": true},
    {"platform": "facebook", "url": "https://facebook.com", "active": true}
  ]'::jsonb
)
on conflict do nothing;

-- Index
create index if not exists idx_footer_settings_id on public.footer_settings(id);

-- Trigger for updated_at
drop trigger if exists set_footer_settings_updated_at on public.footer_settings;
create trigger set_footer_settings_updated_at
before update on public.footer_settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.footer_settings enable row level security;

drop policy if exists "footer_settings_admin_all" on public.footer_settings;
create policy "footer_settings_admin_all"
on public.footer_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());