export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import ContactLegacyClient from '../../legacy-fallback/ContactLegacyClient'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('contact', '/contact', {
    title: 'Contact',
    description: 'Get in touch with our admissions and support teams.',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <ContactLegacyClient />
  }

  const cmsPage = await fetchCmsPageBySlug('contact')
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <ContactLegacyClient />
}
