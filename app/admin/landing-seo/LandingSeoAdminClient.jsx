'use client'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function LandingSeoAdminClient() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Landing Pages & Programmatic SEO</h2>
        <p className="mt-1 text-sm text-slate-300">
          Create city pages, course + city pages, reusable templates, and redirects with full SEO metadata.
        </p>
      </div>

      <EntityCrudManager
        entity="cities"
        title="Cities / Locations"
        fields={[
          { key: 'name', label: 'City Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'state', label: 'State' },
          { key: 'country', label: 'Country' },
          { key: 'meta_title', label: 'SEO Title', full: true },
          { key: 'meta_description', label: 'SEO Description', type: 'textarea', full: true, rows: 3 },
          { key: 'intro_text', label: 'Intro Text', type: 'textarea', full: true, rows: 4 },
          { key: 'highlights', label: 'Highlights (JSON array)', type: 'json', full: true, rows: 5 },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="page_templates"
        title="Landing Page Templates"
        fields={[
          { key: 'name', label: 'Template Name' },
          { key: 'slug', label: 'Template Slug' },
          { key: 'page_type', label: 'Page Type' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
          { key: 'sections_json', label: 'Sections JSON', type: 'json', full: true, rows: 8 },
          { key: 'style_json', label: 'Style JSON', type: 'json', full: true, rows: 5 },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="location_pages"
        title="Course + City Landing Pages"
        fields={[
          { key: 'slug', label: 'Slug' },
          { key: 'title', label: 'Title', full: true },
          { key: 'city_id', label: 'City ID' },
          { key: 'course_slug', label: 'Course Slug' },
          { key: 'template_slug', label: 'Template Slug' },
          { key: 'description', label: 'Description', type: 'textarea', full: true, rows: 3 },
          { key: 'seo_title', label: 'SEO Title', full: true },
          { key: 'seo_description', label: 'SEO Description', type: 'textarea', full: true, rows: 3 },
          { key: 'canonical_url', label: 'Canonical URL', full: true },
          { key: 'og_image', label: 'OG Image URL', full: true },
          { key: 'sections_json', label: 'Sections JSON', type: 'json', full: true, rows: 10 },
          { key: 'style_json', label: 'Style JSON', type: 'json', full: true, rows: 5 },
          { key: 'status', label: 'Status (draft/published)' },
          { key: 'noindex', label: 'Noindex', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="redirects"
        title="Redirects"
        subtitle="Use for slug changes and SEO-safe redirects."
        fields={[
          { key: 'from_path', label: 'From Path (/old-slug)' },
          { key: 'to_path', label: 'To Path (/new-slug)' },
          { key: 'status_code', label: 'Status Code', type: 'number' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]}
      />

      <EntityCrudManager
        entity="reusable_blocks"
        title="Reusable Blocks"
        fields={[
          { key: 'name', label: 'Block Name' },
          { key: 'type', label: 'Section Type' },
          { key: 'content_json', label: 'Content JSON', type: 'json', full: true, rows: 8 },
          { key: 'style_json', label: 'Style JSON', type: 'json', full: true, rows: 5 },
          { key: 'status', label: 'Status (draft/published)' },
        ]}
      />
    </Surface>
  )
}
