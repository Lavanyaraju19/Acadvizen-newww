import { renderDynamicSections } from '../sections/DynamicSectionRenderer'
import Breadcrumbs from './templates/Breadcrumbs'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema } from '../../lib/structuredData'

// Shared renderer for every `pages`/`location_page`/course-CMS/tool-CMS record rendered
// through admin-authored sections. Breadcrumbs render here (not per-route-file) so every
// caller gets them automatically without having to opt in - matching the "admin only edits
// content, template details are automatic" requirement.
export default function DynamicPageRenderer({ page, breadcrumbs }) {
  if (!page) return null

  const breadcrumbItems = breadcrumbs?.length
    ? breadcrumbs
    : [{ label: 'Home', href: '/' }, { label: page.title || 'Page' }]

  return (
    <div data-page-slug={page.slug}>
      <JsonLd id="page-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <Breadcrumbs items={breadcrumbItems} />
      {renderDynamicSections(page.sections || [])}
    </div>
  )
}
