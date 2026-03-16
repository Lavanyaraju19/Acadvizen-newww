-- Pass 4: public-facing copy controls in site settings.
-- Safe/idempotent.

alter table public.site_settings
  add column if not exists ui_copy jsonb not null default '{}'::jsonb;
