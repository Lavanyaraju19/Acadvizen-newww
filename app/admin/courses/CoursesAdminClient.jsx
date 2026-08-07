'use client'

import EntityCrudManager from '../_components/EntityCrudManager'

export default function CoursesAdminClient() {
  return (
    <div className="space-y-5">
      <EntityCrudManager
        entity="course_categories"
        title="Course Categories"
        subtitle="Groups courses in the catalog and the course mega-menu (Flagship, Career, Specialist, etc.). Create unlimited categories."
        compact
        pageSize={20}
        fields={[
          { key: 'name', label: 'Category Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'icon', label: 'Icon (lucide-react icon name, optional)' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 2, full: true },
          { key: 'order_index', label: 'Sort Order', type: 'number', default: 0 },
          { key: 'is_featured', label: 'Featured', type: 'checkbox' },
          { key: 'menu_visible', label: 'Visible in mega-menu', type: 'checkbox', default: true },
          { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="courses"
        title="Courses"
        subtitle="Manage the course catalog powering the public course listing, detail pages, and live page data feeds."
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'subtitle', label: 'Subtitle' },
          { key: 'short_title', label: 'Short Title (used in tight spaces like the mega-menu)' },
          { key: 'category_id', label: 'Category', type: 'select', optionsFrom: 'course_categories' },
          { key: 'badge', label: 'Badge (e.g. "New", "Popular")' },
          { key: 'short_description', label: 'Short Description', type: 'textarea', rows: 3, full: true },
          { key: 'description', label: 'Description', type: 'textarea', rows: 5, full: true },
          { key: 'duration', label: 'Duration (display text, e.g. "6 Months")' },
          { key: 'duration_value', label: 'Duration Value (structured, optional)', type: 'number' },
          { key: 'duration_unit', label: 'Duration Unit (e.g. Months, Weeks)' },
          { key: 'learning_mode', label: 'Learning Mode (e.g. Classroom + Online)' },
          { key: 'learning_hours', label: 'Learning Hours', type: 'number' },
          { key: 'projects_count', label: 'Projects Count', type: 'number' },
          { key: 'case_studies_count', label: 'Case Studies Count', type: 'number' },
          { key: 'ai_tools_count', label: 'AI Tools Count', type: 'number' },
          { key: 'certification_count', label: 'Certification Count', type: 'number' },
          { key: 'internship', label: 'Internship included', type: 'checkbox' },
          { key: 'placement_support', label: 'Placement support', type: 'checkbox' },
          { key: 'primary_cta_label', label: 'Primary CTA Label' },
          { key: 'primary_cta_url', label: 'Primary CTA URL' },
          { key: 'secondary_cta_label', label: 'Secondary CTA Label' },
          { key: 'secondary_cta_url', label: 'Secondary CTA URL' },
          { key: 'icon', label: 'Icon (lucide-react icon name, optional)' },
          { key: 'image_url', label: 'Course Image', type: 'file', bucket: 'course-images', accept: 'image/*' },
          { key: 'thumbnail_url', label: 'Thumbnail', type: 'file', bucket: 'course-thumbnails', accept: 'image/*' },
          { key: 'pdf_url', label: 'Brochure / PDF', type: 'file', bucket: 'course-pdfs', accept: '.pdf,image/*' },
          { key: 'order_index', label: 'Order Index', type: 'number', default: 0 },
          { key: 'is_featured', label: 'Featured', type: 'checkbox' },
          { key: 'is_active', label: 'Published', type: 'checkbox' },
        ]}
      />
    </div>
  )
}
