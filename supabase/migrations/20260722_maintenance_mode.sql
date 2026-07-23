-- Add Maintenance Mode fields to global_settings

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

-- Add maintenance mode columns to global_settings
alter table public.global_settings
add column if not exists maintenance_mode boolean default false,
add column if not exists maintenance_message text default 'Site is under maintenance. Please check back soon.',
add column if not exists maintenance_allowed_ips text[] default array[]::text[],
add column if not exists maintenance_countdown timestamptz;

-- Index for maintenance mode
create index if not exists idx_global_settings_maintenance on public.global_settings(maintenance_mode) where maintenance_mode = true;