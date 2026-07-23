-- Add robots.txt field to global_settings

alter table public.global_settings
add column if not exists robots_txt text default 'User-agent: *
Allow: /

Sitemap: https://acadvizen.com/api/cms/sitemap/generate';