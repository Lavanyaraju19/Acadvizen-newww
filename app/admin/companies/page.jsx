export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Companies</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage company names and logo assets used across the admin-managed site.
        </p>
      </div>

      <EntityCrudManager
        entity="companies"
        title="Company Profiles"
        subtitle="Create, update, and remove company records with logos, hiring status, and links."
        fields={[
          { key: 'company_name', label: 'Company Name' },
          { key: 'logo', label: 'Logo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
          { key: 'website_url', label: 'Website URL', full: true },
          { key: 'hiring_status', label: 'Hiring Status' },
          { key: 'is_featured', label: 'Featured', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
