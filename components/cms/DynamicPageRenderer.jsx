import { renderDynamicSections } from '../sections/DynamicSectionRenderer'

export default function DynamicPageRenderer({ page }) {
  if (!page) return null
  return (
    <div data-page-slug={page.slug}>
      {renderDynamicSections(page.sections || [])}
    </div>
  )
}
