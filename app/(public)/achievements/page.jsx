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
  return cmsPage ? <DynamicPageRenderer page={cmsPage} /> : <AchievementsPage />
}
