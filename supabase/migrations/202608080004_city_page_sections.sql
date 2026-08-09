-- Additive: lets Admins attach extra, freely-orderable designed sections to a city_pages record,
-- reusing the exact same section `type` / content_json shape (and immersive variants) the generic
-- Page Builder already supports via DynamicSectionRenderer. Kept as its own table rather than
-- widening `public.sections.page_id` (NOT NULL + FK to pages, actively used by the generic Page
-- Builder) so this change cannot affect that already-working table at all.

create table if not exists public.city_page_sections (
  id uuid primary key default gen_random_uuid(),
  city_page_id uuid not null references public.city_pages(id) on delete cascade,
  type text not null,
  order_index int not null default 0,
  content_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  visibility boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_city_page_sections_order on public.city_page_sections (city_page_id, order_index);

drop trigger if exists set_city_page_sections_updated_at on public.city_page_sections;
create trigger set_city_page_sections_updated_at
before update on public.city_page_sections
for each row execute function public.set_updated_at();

alter table public.city_page_sections enable row level security;

drop policy if exists "city_page_sections_public_select" on public.city_page_sections;
create policy "city_page_sections_public_select"
on public.city_page_sections for select
using (
  coalesce(visibility, true) = true
  and exists (
    select 1 from public.city_pages cp
    where cp.id = city_page_sections.city_page_id
    and cp.is_active = true
  )
);

drop policy if exists "city_page_sections_admin_all" on public.city_page_sections;
create policy "city_page_sections_admin_all"
on public.city_page_sections for all
using (is_admin())
with check (is_admin());
