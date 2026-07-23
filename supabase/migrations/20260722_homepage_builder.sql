-- Homepage Builder Schema
-- Create a dedicated homepage template with all sections

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

-- Homepage settings table for homepage-specific configuration
create table if not exists public.homepage_settings (
  id uuid primary key default gen_random_uuid(),
  hero_enabled boolean default true,
  about_enabled boolean default true,
  stats_enabled boolean default true,
  courses_enabled boolean default true,
  placements_enabled boolean default true,
  testimonials_enabled boolean default true,
  gallery_enabled boolean default true,
  faq_enabled boolean default true,
  contact_enabled boolean default true,
  footer_enabled boolean true,
  section_order jsonb not null default '["hero", "about", "stats", "courses", "placements", "testimonials", "gallery", "faq", "contact", "footer"]'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- Insert default homepage settings
insert into public.homepage_settings (section_order)
values ('["hero", "about", "stats", "courses", "placements", "testimonials", "gallery", "faq", "contact", "footer"]'::jsonb)
on conflict do nothing;

-- Index
create index if not exists idx_homepage_settings_id on public.homepage_settings(id);

-- Trigger for updated_at
drop trigger if exists set_homepage_settings_updated_at on public.homepage_settings;
create trigger set_homepage_settings_updated_at
before update on public.homepage_settings
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.homepage_settings enable row level security;

drop policy if exists "homepage_settings_admin_all" on public.homepage_settings;
create policy "homepage_settings_admin_all"
on public.homepage_settings for all to authenticated
using (public.is_admin())
with check (public.is_admin());