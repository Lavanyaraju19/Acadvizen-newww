-- Extends the same admin-managed "designed sections" capability (City, Location/Area) to
-- Service Pages (service_pages - e.g. "Google Ads Course in Bangalore" landing pages), which
-- were previously a fixed-schema renderer with no block-editing capability at all.
--
-- Additive and idempotent only - does not touch service_pages' existing columns or any other
-- content owner's sections table.

create table if not exists public.service_page_sections (
  id uuid primary key default gen_random_uuid(),
  service_page_id uuid not null references public.service_pages(id) on delete cascade,
  type text not null,
  order_index int not null default 0,
  position text not null default 'end',
  content_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  visibility boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_page_sections_order on public.service_page_sections (service_page_id, position, order_index);

drop trigger if exists set_service_page_sections_updated_at on public.service_page_sections;
create trigger set_service_page_sections_updated_at
before update on public.service_page_sections
for each row execute function public.set_updated_at();

alter table public.service_page_sections enable row level security;

drop policy if exists "service_page_sections_public_select" on public.service_page_sections;
create policy "service_page_sections_public_select"
on public.service_page_sections for select
using (
  coalesce(visibility, true) = true
  and exists (
    select 1 from public.service_pages sp
    where sp.id = service_page_sections.service_page_id
    and sp.is_active = true
  )
);

drop policy if exists "service_page_sections_admin_all" on public.service_page_sections;
create policy "service_page_sections_admin_all"
on public.service_page_sections for all
using (is_admin())
with check (is_admin());
