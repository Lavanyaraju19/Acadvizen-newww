'use client'

import EntityCrudManager from '../_components/EntityCrudManager'

export default function CoursesAdminClient() {
  return (
    <EntityCrudManager
      entity="courses"
      title="Courses"
      subtitle="Manage the course catalog powering the public course listing, detail pages, and live page data feeds."
      fields={[
        { key: 'title', label: 'Course Title', default: 'Digital Marketing Masterclass' },
        { key: 'slug', label: 'Website URL (auto-generated)', default: 'digital-marketing-masterclass' },
        { key: 'short_description', label: 'Short Description (1-2 sentences)', type: 'textarea', rows: 3, full: true, default: 'Learn digital marketing from scratch with hands-on projects.' },
        { key: 'description', label: 'Full Course Description', type: 'textarea', rows: 5, full: true, default: 'Comprehensive digital marketing course covering SEO, social media, content marketing, and analytics.' },
        { key: 'image_url', label: 'Course Cover Image', type: 'file', bucket: 'course-images', accept: 'image/*' },
        { key: 'thumbnail_url', label: 'Course Thumbnail', type: 'file', bucket: 'course-thumbnails', accept: 'image/*' },
        { key: 'pdf_url', label: 'Course Brochure (PDF)', type: 'file', bucket: 'course-pdfs', accept: '.pdf' },
        { key: 'duration', label: 'Course Duration', default: '3 months' },
        { key: 'price', label: 'Course Price', default: '₹25,000' },
        { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
        { key: 'is_active', label: 'Published (Visible on website)', type: 'checkbox', default: true },
        { key: 'is_featured', label: 'Featured Course (Highlight on homepage)', type: 'checkbox', default: false },
      ]}
    />
  )
}
