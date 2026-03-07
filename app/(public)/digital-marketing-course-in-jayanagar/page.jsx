import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Digital Marketing Course in Jayanagar',
  description:
    'Join Acadvizen in Jayanagar for hands-on digital marketing training with live projects, internship, and career support.',
  path: '/digital-marketing-course-in-jayanagar',
})

export default function Page() {
  return <HomeClientPage />
}

