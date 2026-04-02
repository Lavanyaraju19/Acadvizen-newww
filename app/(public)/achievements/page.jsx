import AchievementsPage from '../../../components/achievements/AchievementsPage'
import { buildMetadata } from '../../lib/seo'
import { achievementsPageDescription, achievementsPageHeading } from '../../../lib/achievementsContent'

export function generateMetadata() {
  return buildMetadata({
    title: achievementsPageHeading,
    description: achievementsPageDescription,
    path: '/achievements',
    image: '/achievements/award-01.jpeg',
  })
}

export default function Page() {
  return <AchievementsPage />
}
