'use client'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function LandingSeoAdminClient() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Landing Pages & SEO</h2>
        <p className="mt-1 text-sm text-slate-300">
          Create location-specific pages, landing templates, and manage SEO redirects.
        </p>
      </div>

      <EntityCrudManager
        entity="cities"
        title="Target Locations"
        subtitle="Manage cities and locations for SEO landing pages."
        fields={[
          { key: 'name', label: 'City Name', default: 'Bangalore' },
          { key: 'slug', label: 'Website URL (auto-generated)', default: 'bangalore' },
          { key: 'state', label: 'State', default: 'Karnataka' },
          { key: 'country', label: 'Country', default: 'India' },
          { key: 'meta_title', label: 'Google Search Title', full: true, default: 'Digital Marketing Course in Bangalore' },
          { key: 'meta_description', label: 'Google Search Description', type: 'textarea', full: true, rows: 3, default: 'Learn digital marketing in Bangalore with hands-on training and placement support.' },
          { key: 'intro_text', label: 'Page Introduction', type: 'textarea', full: true, rows: 4, default: 'Our digital marketing course in Bangalore offers comprehensive training with industry experts.' },
          { key: 'highlights', label: 'Key Highlights (JSON array)', type: 'json', full: true, rows: 5, default: '["100% Placement Support", "Industry Expert Trainers", "Hands-on Projects"]' },
          { key: 'is_active', label: 'Active (Visible on website)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="page_templates"
        title="Landing Page Templates"
        subtitle="Create reusable templates for landing pages."
        fields={[
          { key: 'name', label: 'Template Name', default: 'Course Landing Page' },
          { key: 'slug', label: 'Template Identifier', default: 'course-landing' },
          { key: 'page_type', label: 'Page Type', default: 'course' },
          { key: 'description', label: 'Template Description', type: 'textarea', full: true, default: 'Standard template for course landing pages with hero, features, and CTA sections.' },
          { key: 'sections_json', label: 'Page Sections (JSON)', type: 'json', full: true, rows: 8 },
          { key: 'style_json', label: 'Design Styles (JSON)', type: 'json', full: true, rows: 5 },
          { key: 'is_active', label: 'Active (Available for use)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="location_pages"
        title="Location-Specific Landing Pages"
        subtitle="Create SEO-optimized pages for specific locations and courses."
        fields={[
          { key: 'slug', label: 'Website URL (auto-generated)', default: 'digital-marketing-bangalore' },
          { key: 'title', label: 'Page Title', full: true, default: 'Digital Marketing Course in Bangalore' },
          { key: 'city_id', label: 'Location ID' },
          { key: 'course_slug', label: 'Course Identifier' },
          { key: 'template_slug', label: 'Template to Use' },
          { key: 'description', label: 'Page Description', type: 'textarea', full: true, rows: 3, default: 'Comprehensive digital marketing training tailored for the Bangalore market.' },
          { key: 'seo_title', label: 'Google Search Title', full: true, default: 'Digital Marketing Course in Bangalore | Best Training Institute' },
          { key: 'seo_description', label: 'Google Search Description', type: 'textarea', full: true, rows: 3, default: 'Join the top-rated digital marketing course in Bangalore with 100% placement assistance.' },
          { key: 'canonical_url', label: 'Canonical URL', full: true },
          { key: 'og_image', label: 'Social Media Image', full: true },
          { key: 'sections_json', label: 'Page Sections (JSON)', type: 'json', full: true, rows: 10 },
          { key: 'style_json', label: 'Design Styles (JSON)', type: 'json', full: true, rows: 5 },
          { key: 'status', label: 'Page Status (draft/published)', default: 'draft' },
          { key: 'noindex', label: 'Hide from Search Engines', type: 'checkbox', default: false },
        ]}
      />

      <EntityCrudManager
        entity="redirects"
        title="URL Redirects"
        subtitle="Manage URL redirects for SEO and site structure changes."
        fields={[
          { key: 'from_path', label: 'Old URL Path', default: '/old-course-page' },
          { key: 'to_path', label: 'New URL Path', default: '/new-course-page' },
          { key: 'status_code', label: 'Redirect Type (301=Permanent, 302=Temporary)', type: 'number', default: 301 },
          { key: 'is_active', label: 'Active (Redirect enabled)', type: 'checkbox', default: true },
        ]}
      />

      <EntityCrudManager
        entity="reusable_blocks"
        title="Reusable Content Blocks"
        subtitle="Create content blocks that can be reused across multiple pages."
        fields={[
          { key: 'name', label: 'Block Name', default: 'Course Features Block' },
          { key: 'type', label: 'Block Type', default: 'feature_cards' },
          { key: 'content_json', label: 'Block Content (JSON)', type: 'json', full: true, rows: 8 },
          { key: 'style_json', label: 'Block Styles (JSON)', type: 'json', full: true, rows: 5 },
          { key: 'status', label: 'Block Status (draft/published)', default: 'draft' },
        ]}
      />
    </Surface>
  )
}
