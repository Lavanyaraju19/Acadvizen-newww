-- Additive fields so the existing "placements" table (already a registered CMS entity
-- with generic CRUD at /api/cms/entities/placements) can fully back the public alumni
-- showcase, which previously only existed as a hardcoded array in src/lib/sitePageContent.js.
-- No existing column is touched or dropped.

alter table public.placements add column if not exists company_logo text;
alter table public.placements add column if not exists accent_color text;

comment on column public.placements.title is 'Student/alumni display name.';
comment on column public.placements.featured_image is 'Student photo/cutout image path or URL.';
comment on column public.placements.company_logo is 'Company logo path or URL for the alumni showcase card.';
comment on column public.placements.accent_color is 'Optional hex accent color for the alumni showcase card.';
