export const CMS_MEDIA_BUCKETS = [
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
  'videos',
]

export function isAllowedCmsBucket(bucket = '') {
  return CMS_MEDIA_BUCKETS.includes(String(bucket || '').trim())
}
