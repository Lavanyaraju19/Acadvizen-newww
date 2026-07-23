-- Popup Management Schema
-- Create tables for popup/overlay management

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

-- Popups table
create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'modal' check (type in ('modal', 'slide_in', 'bar', 'corner')),
  trigger_type text not null default 'delay' check (trigger_type in ('immediate', 'delay', 'scroll', 'exit_intent', 'click')),
  trigger_value int default 5,
  content text,
  html_content text,
  image_url text,
  close_button boolean default true,
  overlay boolean default true,
  mobile_enabled boolean default true,
  tablet_enabled boolean default true,
  desktop_enabled boolean default true,
  show_frequency text default 'session' check (show_frequency in ('session', 'always', 'once_per_visitor', 'custom')),
  custom_frequency_days int default 7,
  start_date timestamptz,
  end_date timestamptz,
  target_pages jsonb not null default '[]'::jsonb,
  exclude_pages jsonb not null default '[]'::jsonb,
  is_active boolean default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_popups_status on public.popups(status);
create index if not exists idx_popups_is_active on public.popups(is_active);
create index if not exists idx_popups_updated_at on public.popups(updated_at desc);

-- Trigger for updated_at
drop trigger if exists set_popups_updated_at on public.popups;
create trigger set_popups_updated_at
before update on public.popups
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.popups enable row level security;

-- Popups: public read published/active, admin full access
drop policy if exists "popups_public_select" on public.popups;
create policy "popups_public_select"
on public.popups for select to anon, authenticated
using (status = 'published' and is_active = true);

drop policy if exists "popups_admin_write" on public.popups;
create policy "popups_admin_write"
on public.popups for all to authenticated
using (public.is_admin())
with check (public.is_admin());