-- The admin entity config orders tools by order_index, a column production's tools_extended never
-- received. The Main admin's Tools screen therefore listed no tools at all (found 10 October 2026).
-- The API now falls back to creation order; this adds the column so the configured order works.
alter table public.tools_extended add column if not exists order_index integer not null default 0;
