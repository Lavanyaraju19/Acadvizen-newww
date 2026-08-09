export const revalidate = 0
export const dynamic = 'force-dynamic'

import CmsPageResolver from '../../../components/cms/CmsPageResolver'
import ExploreProgramsRenderer from '../../../components/cms/ExploreProgramsRenderer'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata() {
  return buildCmsPageMetadata('explore-programs', '/explore-programs', {
    title: 'Explore Programs',
    description: 'Discover Acadvizen career programs by category, city, and outcome - a premium program discovery experience.',
  })
}

// Separate from /courses (the plain catalogue) by design - this is the premium discovery hub.
// If an admin ever builds a fully custom /explore-programs page in the generic Page Builder,
// that takes priority; otherwise the immersive renderer (real CMS data, no bespoke admin
// screen needed) is the default.
export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <ExploreProgramsRenderer />
  }

  const cmsPage = await fetchCmsPageBySlug('explore-programs')
  return <CmsPageResolver cmsPage={cmsPage} fallback={<ExploreProgramsRenderer />} />
}
