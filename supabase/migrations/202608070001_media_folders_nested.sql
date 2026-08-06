-- Nested media folders + display-name rename support.
-- Existing public.media.folder is a flat text label (see 20260806_media_library_folders_tags.sql).
-- This migration adds a real folder hierarchy (media_folders, self-referencing parent_id) and
-- backfills every distinct existing media.folder value into a top-level folder row, so nothing
-- already organized by the flat picker loses its grouping.

create table if not exists public.media_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.media_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_folders_name_not_blank check (btrim(name) <> '')
);

create index if not exists media_folders_parent_id_idx on public.media_folders(parent_id);
create unique index if not exists media_folders_parent_name_unique
  on public.media_folders (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

alter table public.media
  add column if not exists folder_id uuid references public.media_folders(id) on delete set null,
  add column if not exists name text;

create index if not exists media_folder_id_idx on public.media(folder_id);

-- Backfill: one top-level media_folders row per distinct existing media.folder text value.
insert into public.media_folders (name)
select distinct m.folder
from public.media m
where m.folder is not null and btrim(m.folder) <> ''
  and not exists (
    select 1 from public.media_folders f where f.parent_id is null and lower(f.name) = lower(m.folder)
  )
on conflict do nothing;

update public.media m
set folder_id = f.id
from public.media_folders f
where f.parent_id is null
  and lower(f.name) = lower(m.folder)
  and m.folder_id is null
  and m.folder is not null and btrim(m.folder) <> '';

alter table public.media enable row level security;

drop policy if exists media_folders_admin_all on public.media_folders;
create policy media_folders_admin_all on public.media_folders
  for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.media_folders enable row level security;
