'use client'

import EntityCrudManager from '../_components/EntityCrudManager'

export default function CoursesAdminClient() {
  return (
    <EntityCrudManager
      entity="courses"
      title="Courses"
      subtitle="Manage the course catalog powering the public course listing, detail pages, and live page data feeds."
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'Slug' },
        { key: 'short_description', label: 'Short Description', type: 'textarea', rows: 3, full: true },
        { key: 'description', label: 'Description', type: 'textarea', rows: 5, full: true },
        { key: 'image_url', label: 'Course Image', type: 'file', bucket: 'course-images', accept: 'image/*' },
        { key: 'thumbnail_url', label: 'Thumbnail', type: 'file', bucket: 'course-thumbnails', accept: 'image/*' },
        { key: 'pdf_url', label: 'Brochure / PDF', type: 'file', bucket: 'course-pdfs', accept: '.pdf,image/*' },
        { key: 'order_index', label: 'Order Index', type: 'number' },
        { key: 'is_active', label: 'Published', type: 'checkbox' },
      ]}
    />
  )
}
