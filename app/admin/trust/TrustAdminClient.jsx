'use client'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function TrustAdminClient() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Trust, Authority & Conversion</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage testimonials, success stories, recruiters, instructors, metrics, trust badges, events, and CTA blocks.
        </p>
      </div>

      <EntityCrudManager
        entity="testimonials"
        title="Testimonials"
        subtitle="Text + optional video testimonial URL."
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'quote', label: 'Quote', type: 'textarea', full: true, rows: 4 },
          { key: 'video_testimonial_url', label: 'Video URL', full: true },
          { key: 'student_result', label: 'Result Highlight', full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="success_stories"
        title="Student Success Stories"
        fields={[
          { key: 'name', label: 'Student Name' },
          { key: 'role', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'result_metric', label: 'Result Metric' },
          { key: 'image_url', label: 'Image URL', full: true },
          { key: 'video_url', label: 'Video URL', full: true },
          { key: 'summary', label: 'Summary', type: 'textarea', full: true, rows: 4 },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="placements"
        title="Placements"
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'company_name', label: 'Company Name' },
          { key: 'role', label: 'Role' },
          { key: 'location', label: 'Location' },
          { key: 'salary', label: 'Salary' },
          { key: 'featured_image', label: 'Featured Image URL', full: true },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="recruiters"
        title="Recruiter / Hiring Logos"
        fields={[
          { key: 'name', label: 'Company Name' },
          { key: 'logo_url', label: 'Logo URL', full: true },
          { key: 'website_url', label: 'Website URL', full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="instructors"
        title="Instructor Profiles"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'title', label: 'Title' },
          { key: 'linkedin_url', label: 'LinkedIn URL', full: true },
          { key: 'image_url', label: 'Image URL', full: true },
          { key: 'expertise', label: 'Expertise (JSON array)', type: 'json', full: true, rows: 5 },
          { key: 'bio', label: 'Bio', type: 'textarea', full: true, rows: 4 },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="certifications"
        title="Certifications"
        fields={[
          { key: 'name', label: 'Certification Name' },
          { key: 'issuer', label: 'Issuer' },
          { key: 'logo_url', label: 'Logo URL', full: true },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="student_metrics"
        title="Student Metrics / Counters"
        fields={[
          { key: 'metric_key', label: 'Metric Key' },
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' },
          { key: 'suffix', label: 'Suffix' },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="trust_badges"
        title="Trust Badges"
        fields={[
          { key: 'label', label: 'Label' },
          { key: 'icon', label: 'Icon URL or Icon Name' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="community_events"
        title="Workshops / Events / Community"
        fields={[
          { key: 'title', label: 'Event Title' },
          { key: 'event_type', label: 'Event Type' },
          { key: 'event_date', label: 'Event Date', type: 'datetime' },
          { key: 'location', label: 'Location' },
          { key: 'registration_url', label: 'Registration URL', full: true },
          { key: 'image_url', label: 'Image URL', full: true },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
          { key: 'order_index', label: 'Order', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="cta_blocks"
        title="CTA Blocks (Brochure / Consultation / Book-a-call)"
        fields={[
          { key: 'key', label: 'CTA Key (unique)' },
          { key: 'title', label: 'Title' },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 4 },
          { key: 'button_label', label: 'Primary Button Label' },
          { key: 'button_url', label: 'Primary Button URL', full: true },
          { key: 'secondary_label', label: 'Secondary Button Label' },
          { key: 'secondary_url', label: 'Secondary Button URL', full: true },
          { key: 'variant', label: 'Variant' },
          { key: 'style_json', label: 'Style JSON', type: 'json', full: true, rows: 5 },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />
    </Surface>
  )
}
