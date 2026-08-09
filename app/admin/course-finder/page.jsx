export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Course Finder</h2>
        <p className="mt-1 text-sm text-slate-300">
          Configure the goal-based course finder shown on /explore-programs. Each goal maps to a list of real
          course slugs (from the Courses module) that will be recommended when a visitor picks that goal.
        </p>
      </div>

      <EntityCrudManager
        entity="course_finder_goals"
        title="Goals"
        subtitle="Create, update, hide, and reorder the goals visitors can choose from."
        fields={[
          { key: 'goal', label: 'Goal (e.g. "Start my career")' },
          { key: 'icon', label: 'Icon keyword (e.g. rocket, target, briefcase)' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3, full: true },
          {
            key: 'course_slugs',
            label: 'Recommended Course Slugs (JSON array, e.g. ["digital-marketing-course","seo-course"])',
            type: 'json',
            default: '[]',
            full: true,
          },
          { key: 'priority', label: 'Priority (lower shows first)', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
