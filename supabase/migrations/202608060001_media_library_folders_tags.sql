-- Media library folders and tags
-- The admin media manager (app/admin/media/MediaManagerClient.jsx) already has folder and tag
-- UI, but the `media` table never had columns for either, so every folder assignment and tag
-- was silently dropped on save. This adds real storage for both.

alter table public.media
  add column if not exists folder text,
  add column if not exists tags jsonb not null default '[]'::jsonb;

create index if not exists idx_media_folder on public.media (folder);
create index if not exists idx_media_tags on public.media using gin (tags);
