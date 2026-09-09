-- Fixes a schema-drift bug discovered while testing 202608130002_slug_unique_index_draft_
-- exclusion.sql: pages.slug and locations.slug each had a PLAIN unique constraint from their
-- original bootstrap "slug text unique" column declaration (Postgres auto-names these
-- <table>_<column>_key - pages_slug_key / locations_slug_key), predating and never removed when
-- the later partial indexes (idx_pages_slug_live_lower_unique / idx_locations_slug) were added
-- alongside them. That leftover plain constraint still enforces table-wide uniqueness regardless
-- of draft_of_id, so it blocks the very first "Start Draft" insert (same slug as the live row)
-- with a duplicate-key error even after 202608130002 - confirmed live via the end-to-end test.
--
-- Safe to drop: the partial index added in 202608130002 already fully enforces uniqueness among
-- every real/live row (deleted_at is null and draft_of_id is null for pages; draft_of_id is null
-- for locations) - this plain constraint is now purely redundant with it for every row EXCEPT
-- shadow drafts, which is exactly the case it needs to stop blocking. Zero rows are touched.
alter table public.pages drop constraint if exists pages_slug_key;
alter table public.locations drop constraint if exists locations_slug_key;
