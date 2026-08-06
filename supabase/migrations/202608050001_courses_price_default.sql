-- courses.price is NOT NULL with no default, but the Courses admin form
-- (app/admin/courses/CoursesAdminClient.jsx) has no price field at all, so every course
-- created through the admin dashboard failed with a not-null constraint violation.
alter table if exists public.courses
  alter column price set default 0;

update public.courses set price = 0 where price is null;
