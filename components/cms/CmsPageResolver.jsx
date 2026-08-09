import DynamicPageRenderer from './DynamicPageRenderer'
import CityPageRenderer from './CityPageRenderer'
import CityCoursePageRenderer from './CityCoursePageRenderer'
import LocationPageRenderer from './LocationPageRenderer'
import ServicePageRenderer from './ServicePageRenderer'

// Shared source-based branching for a record returned by lib/cmsServer.js's
// fetchCmsPageBySlug()/fetchCmsPageByAnySlug(). city_page/location/city_course records always
// carry `sections: []` (their content lives on the raw row, not in a sections table), so any
// caller that gated rendering on `cmsPage.sections.length` - as every legacy static route under
// app/(public)/{prefix}-{slug}/page.jsx did - silently fell through to its fallback for every
// real admin-authored record of those types. This centralizes the correct branch-by-source
// logic (originally only present in the app/(public)/[slug] catch-all) so every caller gets it.
export default function CmsPageResolver({ cmsPage, fallback = null }) {
  if (!cmsPage) return fallback

  if (cmsPage.source === 'city_page') {
    return <CityPageRenderer cityPage={cmsPage.raw} />
  }
  if (cmsPage.source === 'location') {
    return <LocationPageRenderer locationRecord={cmsPage.raw?.id ? cmsPage.raw : null} locationSlug={cmsPage.raw?.locationSlug} />
  }
  if (cmsPage.source === 'city_course') {
    return <CityCoursePageRenderer cityRecord={cmsPage.raw?.id ? cmsPage.raw : null} citySlug={cmsPage.raw?.citySlug} />
  }
  if (cmsPage.source === 'service_page') {
    return <ServicePageRenderer servicePage={cmsPage.raw} />
  }
  if (cmsPage.sections?.length) {
    return <DynamicPageRenderer page={cmsPage} />
  }
  return fallback
}
