export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Placements</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage the alumni/success-story cards shown on the public Placements page - student name, photo,
          hiring company, logo, and ordering. This is the canonical editing surface: publishing here updates
          what visitors see on /placement.
        </p>
      </div>

      <EntityCrudManager
        entity="placements"
        title="Placements"
        subtitle="Create, update, hide, and reorder alumni success stories."
        fields={[
          { key: 'title', label: 'Student Name' },
          { key: 'company_name', label: 'Company' },
          { key: 'role', label: 'Role' },
          { key: 'location', label: 'Location' },
          { key: 'package', label: 'Package' },
          { key: 'salary', label: 'Salary' },
          { key: 'featured_image', label: 'Student Photo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'company_logo', label: 'Company Logo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'accent_color', label: 'Accent Color (hex)' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Visible', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
