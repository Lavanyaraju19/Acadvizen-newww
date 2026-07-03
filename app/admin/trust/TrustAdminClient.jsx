'use client'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function TrustAdminClient() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Trust & Conversion Elements</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage success stories, recruiters, instructors, certifications, metrics, badges, events, and call-to-action blocks.
        </p>
      </div>

      <EntityCrudManager
        entity="success_stories"
        title="Student Success Stories"
        subtitle="Highlight student achievements and career outcomes."
        fields={[
          { key: 'name', label: 'Student Name', default: 'Priya Patel' },
          { key: 'role', label: 'Current Role', default: 'Marketing Manager' },
          { key: 'company', label: 'Company', default: 'Amazon' },
          { key: 'result_metric', label: 'Achievement/Result', default: '50% salary increase after course completion' },
          { key: 'image_url', label: 'Student Photo', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'video_url', label: 'Success Story Video URL', full: true },
          { key: 'summary', label: 'Success Story Summary', type: 'textarea', full: true, rows: 4, default: 'Completed the Digital Marketing Masterclass and secured a position at a Fortune 500 company.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="placements"
        title="Placement Records"
        subtitle="Track student placements and hiring details."
        fields={[
          { key: 'title', label: 'Placement Title', default: 'Digital Marketing Executive Placement' },
          { key: 'company_name', label: 'Hiring Company', default: 'Infosys' },
          { key: 'role', label: 'Job Role', default: 'Digital Marketing Executive' },
          { key: 'location', label: 'Job Location', default: 'Bangalore' },
          { key: 'salary', label: 'Salary Package', default: '6 LPA' },
          { key: 'featured_image', label: 'Featured Image', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'description', label: 'Placement Details', type: 'textarea', full: true, rows: 4, default: 'Student placed through campus placement drive.' },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="recruiters"
        title="Hiring Partners"
        subtitle="Companies that hire from your institution."
        fields={[
          { key: 'name', label: 'Company Name', default: 'Google' },
          { key: 'logo_url', label: 'Company Logo', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'website_url', label: 'Company Website', full: true, default: 'https://www.google.com' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="instructors"
        title="Instructor Profiles"
        subtitle="Manage faculty and training staff information."
        fields={[
          { key: 'name', label: 'Instructor Name', default: 'Dr. Amit Sharma' },
          { key: 'title', label: 'Professional Title', default: 'Senior Digital Marketing Consultant' },
          { key: 'linkedin_url', label: 'LinkedIn Profile URL', full: true },
          { key: 'image_url', label: 'Instructor Photo', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'expertise', label: 'Areas of Expertise (JSON format)', type: 'json', full: true, rows: 5, default: '["SEO", "Social Media", "Analytics"]' },
          { key: 'bio', label: 'Professional Biography', type: 'textarea', full: true, rows: 4, default: '15+ years of experience in digital marketing with Fortune 500 companies.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="certifications"
        title="Industry Certifications"
        subtitle="Certifications students can earn through your programs."
        fields={[
          { key: 'name', label: 'Certification Name', default: 'Google Ads Certification' },
          { key: 'issuer', label: 'Issuing Organization', default: 'Google' },
          { key: 'logo_url', label: 'Certification Logo', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'description', label: 'Certification Description', type: 'textarea', full: true, default: 'Industry-recognized certification for digital advertising professionals.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="student_metrics"
        title="Achievement Counters"
        subtitle="Display key statistics and achievements."
        fields={[
          { key: 'metric_key', label: 'Metric Identifier', default: 'students_placed' },
          { key: 'label', label: 'Display Label', default: 'Students Placed' },
          { key: 'value', label: 'Counter Value', default: '5000+' },
          { key: 'suffix', label: 'Value Suffix', default: '+' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="trust_badges"
        title="Trust Badges & Accreditations"
        subtitle="Display trust signals and accreditations."
        fields={[
          { key: 'label', label: 'Badge Label', default: 'ISO Certified' },
          { key: 'icon', label: 'Badge Icon or Image', default: 'shield' },
          { key: 'description', label: 'Badge Description', type: 'textarea', full: true, default: 'Internationally recognized quality certification.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="community_events"
        title="Events & Workshops"
        subtitle="Manage upcoming workshops, webinars, and community events."
        fields={[
          { key: 'title', label: 'Event Title', default: 'Digital Marketing Workshop 2024' },
          { key: 'event_type', label: 'Event Type', default: 'Workshop' },
          { key: 'event_date', label: 'Event Date & Time', type: 'datetime' },
          { key: 'location', label: 'Event Location', default: 'Online via Zoom' },
          { key: 'registration_url', label: 'Registration Link', full: true },
          { key: 'image_url', label: 'Event Banner Image', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'description', label: 'Event Description', type: 'textarea', full: true, rows: 4, default: 'Learn the latest digital marketing strategies from industry experts.' },
          { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="cta_blocks"
        title="Call-to-Action Blocks"
        subtitle="Manage CTAs for brochures, consultations, and bookings."
        fields={[
          { key: 'key', label: 'CTA Identifier (unique)', default: 'brochure_download' },
          { key: 'title', label: 'CTA Heading', default: 'Download Our Course Brochure' },
          { key: 'description', label: 'CTA Description', type: 'textarea', full: true, rows: 4, default: 'Get detailed information about our courses and curriculum.' },
          { key: 'button_label', label: 'Primary Button Text', default: 'Download Now' },
          { key: 'button_url', label: 'Primary Button Link', full: true },
          { key: 'secondary_label', label: 'Secondary Button Text', default: 'Contact Us' },
          { key: 'secondary_url', label: 'Secondary Button Link', full: true },
          { key: 'variant', label: 'Design Style', default: 'primary' },
          { key: 'style_json', label: 'Custom Styles (JSON)', type: 'json', full: true, rows: 5 },
          { key: 'is_active', label: 'Visible (Show on website)', type: 'checkbox', default: true },
        ]}
      />
    </Surface>
  )
}
