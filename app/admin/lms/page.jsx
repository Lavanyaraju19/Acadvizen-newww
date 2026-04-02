export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">LMS</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage course modules and lessons used for LMS content delivery.
        </p>
      </div>

      <EntityCrudManager
        entity="lms_modules"
        title="LMS Modules"
        subtitle="Create, edit, and delete module records."
        fields={[
          { key: 'course_id', label: 'Course ID' },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
          { key: 'order_index', label: 'Order', type: 'number' },
        ]}
      />

      <EntityCrudManager
        entity="lms_lessons"
        title="LMS Lessons"
        subtitle="Create, edit, and delete lesson records."
        fields={[
          { key: 'module_id', label: 'Module ID' },
          { key: 'title', label: 'Title' },
          { key: 'file_url', label: 'File URL', full: true },
          { key: 'content', label: 'Content', type: 'textarea', full: true, rows: 5 },
          { key: 'order_index', label: 'Order', type: 'number' },
        ]}
      />
    </Surface>
  )
}
