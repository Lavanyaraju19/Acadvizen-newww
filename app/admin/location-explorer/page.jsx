export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import LocationExplorerItemsPanel from './LocationExplorerItemsPanel'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <div className="space-y-5">
      <Surface className="space-y-5 p-6 md:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Location Explorer</h2>
          <p className="mt-1 text-sm text-slate-300">
            Curated location-directory blocks that can be inserted into any page via the Page Builder. Create a group,
            pick a layout, then add the areas it should list below.
          </p>
        </div>

        <EntityCrudManager
          entity="location_explorer_groups"
          title="Explorer Groups"
          subtitle="Each group is one insertable Location Explorer block. Reuse the same group across multiple pages."
          fields={[
            { key: 'name', label: 'Group Name' },
            { key: 'slug', label: 'Slug (optional, for reference only)' },
            { key: 'city_id', label: 'City (leave empty to show all cities)', type: 'select', optionsFrom: 'cities', emptyLabel: 'All cities' },
            {
              key: 'variant',
              label: 'Layout Variant',
              type: 'select',
              default: 'explorer',
              allowEmpty: false,
              options: [
                { value: 'explorer', label: 'Location Explorer (default)' },
                { value: 'constellation', label: 'Location Constellation' },
                { value: 'index', label: 'Location Index' },
                { value: 'grid', label: 'City + Area Grid' },
              ],
            },
            { key: 'heading', label: 'Heading', full: true },
            { key: 'subheading', label: 'Subheading', type: 'textarea', rows: 2, full: true },
            { key: 'cta_label', label: 'CTA Label' },
            { key: 'cta_url', label: 'CTA URL' },
            { key: 'order_index', label: 'Order', type: 'number', default: 0 },
            { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
          ]}
        />
      </Surface>

      <Surface className="p-6 md:p-8">
        <LocationExplorerItemsPanel />
      </Surface>
    </div>
  )
}
