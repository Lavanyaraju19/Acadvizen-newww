export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <div className="space-y-5">
      <Surface className="space-y-5 p-6 md:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Learner Map</h2>
          <p className="mt-1 text-sm text-slate-300">
            Pins shown on the public Interactive Learner Map block. Learner counts and growth percentages are never
            invented automatically - enter verified numbers here, or leave them blank.
          </p>
        </div>

        <EntityCrudManager
          entity="learner_map_points"
          title="Map Points"
          subtitle="Each row is one pin. Latitude/longitude are required; everything else is optional."
          pageSize={20}
          fields={[
            { key: 'label', label: 'Label (e.g. "JP Nagar, Bangalore")', full: true },
            { key: 'country', label: 'Country', default: 'India' },
            { key: 'state', label: 'State' },
            { key: 'city_id', label: 'City (optional)', type: 'select', optionsFrom: 'cities', emptyLabel: 'None' },
            { key: 'location_id', label: 'Area / Location (optional)', type: 'select', optionsFrom: 'locations', emptyLabel: 'None' },
            { key: 'latitude', label: 'Latitude', type: 'number' },
            { key: 'longitude', label: 'Longitude', type: 'number' },
            { key: 'learner_count', label: 'Learner Count (verified, optional)', type: 'number' },
            { key: 'growth_percent', label: 'Growth % (verified, optional)', type: 'number' },
            { key: 'representative_image', label: 'Representative Image', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
            { key: 'course_id', label: 'Related Course (optional)', type: 'select', optionsFrom: 'courses', optionsLabelKey: 'title', emptyLabel: 'None' },
            { key: 'cta_label', label: 'CTA Label (optional)' },
            { key: 'cta_url', label: 'CTA URL (optional, overrides course link)' },
            { key: 'order_index', label: 'Order', type: 'number', default: 0 },
            { key: 'is_active', label: 'Published on the map', type: 'checkbox', default: true },
          ]}
        />
      </Surface>
    </div>
  )
}
