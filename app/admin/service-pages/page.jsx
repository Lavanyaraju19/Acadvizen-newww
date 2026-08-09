export const revalidate = 1

import EntityCrudManager from '../_components/EntityCrudManager'
import { Surface } from '../../../src/components/ui/Surface'
import EntitySectionsPanel from '../shared/EntitySectionsPanel'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Service Pages</h2>
        <p className="mt-1 text-sm text-slate-300">
          Create &ldquo;service + city&rdquo; landing pages (e.g. Google Ads Course in Bangalore). Enter the full URL slug -
          it automatically renders using the standard Acadvizen page template.
        </p>
      </div>

      <EntityCrudManager
        entity="service_pages"
        title="Service Pages"
        subtitle="Create, update, and remove service landing pages."
        publicUrlPattern="/{slug}"
        fields={[
          { key: 'title', label: 'Page Title (e.g. Google Ads Course in Bangalore)', full: true },
          { key: 'slug', label: 'URL Slug (auto-generated from title, editable)', full: true },
          { key: 'hero_title', label: 'Hero Title (optional, defaults to Page Title)', full: true },
          { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea', rows: 2, full: true },
          { key: 'overview', label: 'Overview', type: 'textarea', rows: 4, full: true },
          {
            key: 'curriculum',
            label: 'Curriculum (JSON array of strings, e.g. ["Module 1", "Module 2"])',
            type: 'json',
            default: '[]',
            rows: 4,
            full: true,
          },
          {
            key: 'benefits',
            label: 'Benefits (JSON array of {"title","description"})',
            type: 'json',
            default: '[]',
            rows: 4,
            full: true,
          },
          {
            key: 'faqs',
            label: 'FAQs (JSON array of {"question","answer"})',
            type: 'json',
            default: '[]',
            rows: 4,
            full: true,
          },
          { key: 'meta_title', label: 'SEO Title', full: true },
          { key: 'meta_description', label: 'SEO Description', type: 'textarea', rows: 2, full: true },
          { key: 'order_index', label: 'Order', type: 'number', default: 0 },
          { key: 'is_active', label: 'Published', type: 'checkbox' },
        ]}
      />

      <div className="border-t border-white/10 pt-5">
        <h3 className="text-lg font-semibold text-slate-50">Designed Sections</h3>
        <p className="mt-1 text-sm text-slate-300">
          Add Hero, Feature Cards, Statistics, Testimonials, FAQ, CTA, and every other Page Builder block to a
          specific service page - insert them above, between, or below its existing overview/benefits/curriculum/FAQ
          content, reorder by drag-and-drop, and publish instantly.
        </p>
        <div className="mt-4">
          <EntitySectionsPanel
            entity="service_pages"
            ownerParam="service_page_id"
            apiBase="/api/cms/service-page-sections"
            publicUrlPattern="/{slug}"
            labelField="title"
          />
        </div>
      </div>
    </Surface>
  )
}
