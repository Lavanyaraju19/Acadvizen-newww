export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Internship Opportunities</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage internship listings, company partners, and application details.
        </p>
      </div>

      <EntityCrudManager
        entity="internships"
        title="Internship Listings"
        subtitle="Create, update, and delete internship records."
        fields={[
          { key: 'company_name', label: 'Company Name', default: 'Google' },
          { key: 'role', label: 'Job Role/Title', default: 'Digital Marketing Intern' },
          { key: 'logo', label: 'Company Logo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'description', label: 'Job Description', type: 'textarea', full: true, rows: 4, default: 'Hands-on experience in digital marketing campaigns, social media management, and content creation.' },
        ]}
      />
    </Surface>
  )
}
