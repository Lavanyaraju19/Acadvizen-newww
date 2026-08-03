export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Locations</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage areas/locations that appear in the public footer&apos;s location list and at their own public page.
        </p>
      </div>

      <EntityCrudManager
        entity="locations"
        title="Areas / Locations"
        subtitle="Create, update, and remove location records shown in the footer and at their own public URL."
        publicUrlPattern="/digital-marketing-courses-{slug}"
        fields={[
          { key: 'name', label: 'Area / Location Name' },
          { key: 'footer_label', label: 'Footer Link Label (optional, defaults to name)' },
          { key: 'order_index', label: 'Footer Display Order', type: 'number', default: 0 },
          { key: 'meta_title', label: 'SEO Title', full: true },
          { key: 'meta_description', label: 'SEO Description', type: 'textarea', rows: 2, full: true },
          { key: 'intro_text', label: 'Intro Text', type: 'textarea', rows: 3, full: true },
          { key: 'why_text', label: '"Why learn here" Text', type: 'textarea', rows: 3, full: true },
          { key: 'demand_text', label: 'Local Job Demand Text', type: 'textarea', rows: 3, full: true },
          { key: 'is_active', label: 'Published (visible on the page and in the footer)', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
