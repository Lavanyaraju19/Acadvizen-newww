-- courses.short_description is read by the Courses admin form (app/admin/courses/CoursesAdminClient.jsx)
-- and by lib/contentMeta.js's fetchCourseBySlug, but the column was only ever added via a
-- `create table if not exists` in the bootstrap migration - which silently does nothing on a
-- database where `courses` already existed without it, leaving the column permanently missing
-- and every course save that included this field failing with a schema-cache error.
alter table if exists public.courses
  add column if not exists short_description text;
