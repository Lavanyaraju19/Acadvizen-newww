-- Three tables have an RLS policy explicitly designed to let anon INSERT (public form
-- submissions, the public contact/leads form, and public course registrations), but every
-- GRANT statement across this migration history only ever gives `anon` SELECT
-- (`grant select on all tables in schema public to anon`, repeated in several migrations).
-- An RLS policy can only ever RESTRICT access further - it cannot substitute for the base
-- table-level privilege Postgres requires before RLS is even evaluated. Without this,
-- POST /api/cms/forms/[id]/submit (and any other public-insert flow using the anon-scoped
-- client) fails with "permission denied for table ..." for every real anonymous visitor,
-- even though the policy itself is correctly written.

grant insert on public.form_submissions to anon;
grant insert on public.leads to anon;
grant insert on public.registrations to anon;
