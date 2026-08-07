export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <div className="space-y-5">
      <Surface className="space-y-5 p-6 md:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Cities</h2>
          <p className="mt-1 text-sm text-slate-300">
            The city level of the location hierarchy (Country → State → City → Area). Areas below are assigned to a
            city here.
          </p>
        </div>

        <EntityCrudManager
          entity="cities"
          title="Cities"
          subtitle="Create the cities that areas/locations and city landing pages belong to."
          compact
          pageSize={20}
          fields={[
            { key: 'name', label: 'City Name' },
            { key: 'slug', label: 'Slug' },
            { key: 'state', label: 'State' },
            { key: 'country', label: 'Country', default: 'India' },
            { key: 'meta_title', label: 'SEO Title', full: true },
            { key: 'meta_description', label: 'SEO Description', type: 'textarea', rows: 2, full: true },
            { key: 'intro_text', label: 'Intro Text', type: 'textarea', rows: 3, full: true },
            { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
          ]}
        />
      </Surface>

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
            { key: 'city_id', label: 'City', type: 'select', optionsFrom: 'cities', emptyLabel: 'No city (e.g. country/city-level entry)' },
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
    </div>
  )
}
