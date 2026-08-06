-- Reusable Sections Schema

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

-- Reusable sections table
create table if not exists public.reusable_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  section_type text not null,
  section_data jsonb not null,
  category text default 'general',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_reusable_sections_type on public.reusable_sections(section_type);
create index if not exists idx_reusable_sections_category on public.reusable_sections(category);

-- Trigger for updated_at
drop trigger if exists set_reusable_sections_updated_at on public.reusable_sections;
create trigger set_reusable_sections_updated_at
before update on public.reusable_sections
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.reusable_sections enable row level security;

drop policy if exists "reusable_sections_admin_all" on public.reusable_sections;
create policy "reusable_sections_admin_all"
on public.reusable_sections for all to authenticated
using (public.is_admin())
with check (public.is_admin());