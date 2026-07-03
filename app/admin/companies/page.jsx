export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Company Profiles</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage company names and logos used across the website.
        </p>
      </div>

      <EntityCrudManager
        entity="companies"
        title="Company Profiles"
        subtitle="Create, update, and remove company records with names and logos."
        fields={[
          { key: 'company_name', label: 'Company Name', default: 'Google' },
          { key: 'logo', label: 'Company Logo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
        ]}
      />
    </Surface>
  )
}
