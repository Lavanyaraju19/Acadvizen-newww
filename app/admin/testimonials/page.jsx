export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Testimonials</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage student testimonial cards, ratings, visibility, and ordering directly from the CMS.
        </p>
      </div>

      <EntityCrudManager
        entity="testimonials"
        title="Testimonials"
        subtitle="Create, update, and remove testimonials with photos, videos, and review details."
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'course', label: 'Course' },
          { key: 'rating', label: 'Rating', type: 'number' },
          { key: 'image_url', label: 'Photo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'video_testimonial_url', label: 'Video URL', full: true },
          { key: 'quote', label: 'Review', type: 'textarea', rows: 4, full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Visible', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
