export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Learning Management System</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage course modules, lessons, and learning content for students.
        </p>
      </div>

      <EntityCrudManager
        entity="lms_modules"
        title="Course Modules"
        subtitle="Organize your courses into learning modules and chapters."
        fields={[
          { key: 'course_id', label: 'Associated Course', default: 'course-id' },
          { key: 'title', label: 'Module Title', default: 'Module 1: Introduction to Digital Marketing' },
          { key: 'description', label: 'Module Description', type: 'textarea', full: true, rows: 4, default: 'Learn the fundamentals of digital marketing and understand the digital landscape.' },
          { key: 'order_index', label: 'Module Order', type: 'number', default: 1 },
        ]}
      />

      <EntityCrudManager
        entity="lms_lessons"
        title="Lesson Content"
        subtitle="Create and manage individual lessons within modules."
        fields={[
          { key: 'module_id', label: 'Parent Module', default: 'module-id' },
          { key: 'title', label: 'Lesson Title', default: 'Lesson 1: What is Digital Marketing?' },
          { key: 'file_url', label: 'Lesson Material/Video URL', full: true },
          { key: 'content', label: 'Lesson Content/Notes', type: 'textarea', full: true, rows: 5, default: 'Introduction to digital marketing concepts, channels, and strategies.' },
          { key: 'order_index', label: 'Lesson Order', type: 'number', default: 1 },
        ]}
      />
    </Surface>
  )
}
