insert into storage.buckets (id, name, public)
values
  ('blog', 'blog', true),
  ('blog-images', 'blog-images', true),
  ('blog-videos', 'blog-videos', true),
  ('brochures', 'brochures', true),
  ('course-images', 'course-images', true),
  ('course-pdfs', 'course-pdfs', true),
  ('course-thumbnails', 'course-thumbnails', true),
  ('documents', 'documents', true),
  ('gallery', 'gallery', true),
  ('images', 'images', true),
  ('lectures', 'lectures', true),
  ('lms-files', 'lms-files', true),
  ('media-files', 'media-files', true),
  ('pdfs', 'pdfs', true),
  ('placements', 'placements', true),
  ('site-assets', 'site-assets', true),
  ('tools-assets', 'tools-assets', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in (
      'blog',
      'blog-images',
      'blog-videos',
      'brochures',
      'course-images',
      'course-pdfs',
      'course-thumbnails',
      'documents',
      'gallery',
      'images',
      'lectures',
      'lms-files',
      'media-files',
      'pdfs',
      'placements',
      'site-assets',
      'tools-assets',
      'videos'
    )
  );

drop policy if exists "storage_admin_write" on storage.objects;
create policy "storage_admin_write"
  on storage.objects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
