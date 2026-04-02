export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import TestimonialsLegacyClient from '../../legacy-fallback/TestimonialsLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('testimonials', '/testimonials', {
    title: 'Testimonials',
    description: 'Explore Acadvizen alumni outcomes and student placement stories.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <TestimonialsLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('testimonials')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <TestimonialsLegacyClient />
}
