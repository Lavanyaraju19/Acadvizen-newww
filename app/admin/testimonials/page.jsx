export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Student Testimonials</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage student testimonials, photos, videos, and reviews.
        </p>
      </div>

      <EntityCrudManager
        entity="testimonials"
        title="Student Testimonials"
        subtitle="Create, update, and remove testimonials with photos, videos, and review details."
        fields={[
          { key: 'name', label: 'Student Name', default: 'Rahul Sharma' },
          { key: 'role', label: 'Current Role/Job Title', default: 'Digital Marketing Manager' },
          { key: 'image_url', label: 'Student Photo', type: 'file', bucket: 'site-assets', accept: 'image/*' },
          { key: 'video_url', label: 'Video Testimonial URL (YouTube/Vimeo)', full: true, default: 'https://youtube.com/watch?v=example' },
          { key: 'quote', label: 'Student Review/Feedback', type: 'textarea', rows: 4, full: true, default: 'This course completely transformed my career. The practical projects and industry connections helped me land my dream job.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />
    </Surface>
  )
}
