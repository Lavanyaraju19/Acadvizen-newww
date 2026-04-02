export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Internships</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage internship partners, role names, and internship descriptions.
        </p>
      </div>

      <EntityCrudManager
        entity="internships"
        title="Internship Listings"
        subtitle="Create, update, and delete internship records."
        fields={[
          { key: 'company_name', label: 'Company Name' },
          { key: 'role', label: 'Role' },
          { key: 'logo', label: 'Logo URL', full: true },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
        ]}
      />
    </Surface>
  )
}
