export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import AchievementsPage from '../../../components/achievements/AchievementsPage'
import { fetchCmsPageBySlug } from '../../../lib/cmsServer'
import { buildCmsPageMetadata } from '../../lib/cmsPageRoute'
import { achievementsPageDescription, achievementsPageHeading } from '../../../lib/achievementsContent'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export function generateMetadata() {
  return buildCmsPageMetadata('achievements', '/achievements', {
    title: achievementsPageHeading,
    description: achievementsPageDescription,
    image: '/achievements/award-01.jpeg',
  })
}

export default async function Page() {
  if (!isPublicCmsEnabled()) {
    return <AchievementsPage />
  }

  const cmsPage = await fetchCmsPageBySlug('achievements')
  // Only use CMS renderer if the page has actual sections with content.
  // If sections array is empty, fall back to legacy component to avoid blank page.
  return cmsPage?.sections?.length ? <DynamicPageRenderer page={cmsPage} /> : <AchievementsPage />
}
