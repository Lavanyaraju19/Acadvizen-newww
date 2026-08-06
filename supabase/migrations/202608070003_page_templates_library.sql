-- Template Library upgrades: inheritance (parent_template_id), versioning
-- (version + page_template_versions history), and is_active (the entity config in
-- lib/cmsEntities.js already declares visibilityField: 'is_active' for page_templates,
-- but the column never existed - a latent bug that only ever surfaced for anonymous
-- reads, which this closes).

alter table public.page_templates
  add column if not exists is_active boolean not null default true,
  add column if not exists parent_template_id uuid references public.page_templates(id) on delete set null,
  add column if not exists version integer not null default 1;

create index if not exists page_templates_parent_idx on public.page_templates(parent_template_id);

create table if not exists public.page_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.page_templates(id) on delete cascade,
  version_number integer not null,
  template_data jsonb not null,
  name text,
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (template_id, version_number)
);

create index if not exists page_template_versions_template_idx on public.page_template_versions(template_id, version_number desc);

alter table public.page_template_versions enable row level security;

drop policy if exists page_template_versions_admin_all on public.page_template_versions;
create policy page_template_versions_admin_all on public.page_template_versions
  for all
  using (public.is_admin())
  with check (public.is_admin());
