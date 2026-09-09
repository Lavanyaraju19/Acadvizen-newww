-- FLAGGED - DO NOT APPLY WITHOUT EXPLICIT SIGN-OFF (see Data safety section of the Phase 1 plan).
--
-- This is a DROP + CREATE of two EXISTING unique indexes, not a purely new addition. It touches
-- zero rows and zero data - only which (slug) combinations Postgres considers a duplicate - but
-- per this project's standing rule, any change to an existing schema object (as opposed to a new
-- column/table) requires explicit go-ahead before it's run, so it ships as its own migration file
-- rather than bundled into the additive 202608130001 migration.
--
-- Why it's needed: 202608130001 lets a "shadow draft" of an already-published page/location exist
-- as a second row with the SAME slug as the live row it's a pending edit of. Both pages.slug and
-- locations.slug currently have plain uniqueness (pages: idx_pages_slug_live_lower_unique, already
-- partial on "where deleted_at is null"; locations: idx_locations_slug, fully plain) that does not
-- account for draft_of_id. Without this migration, the very first "Start Draft" click on any live
-- page/location fails immediately with a unique-constraint violation the instant the shadow row is
-- inserted - this is a hard prerequisite for the staged-editing feature to work at all.
--
-- BEFORE running the two DROP/CREATE INDEX statements below, run these two pre-checks and confirm
-- both return ZERO rows (mirrors the duplicate-detection pattern already used in
-- 202608030001_cms_schema_parity.sql). If either returns rows, STOP - do not apply this migration -
-- those existing duplicate live slugs need to be resolved first, separately, with your review.
--
--   select lower(slug), count(*) from public.pages
--     where deleted_at is null group by 1 having count(*) > 1;
--
--   select slug, count(*) from public.locations
--     group by 1 having count(*) > 1;

drop index if exists public.idx_pages_slug_live_lower_unique;
create unique index if not exists idx_pages_slug_live_lower_unique
  on public.pages(lower(slug)) where deleted_at is null and draft_of_id is null;

drop index if exists public.idx_locations_slug;
create unique index if not exists idx_locations_slug
  on public.locations(slug) where draft_of_id is null;
