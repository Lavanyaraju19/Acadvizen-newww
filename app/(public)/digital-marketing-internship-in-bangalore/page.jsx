import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Digital Marketing Internship in Bangalore',
  description:
    'Get internship-driven digital marketing training in Bangalore with hands-on campaign execution and placement-focused mentoring.',
  path: '/digital-marketing-internship-in-bangalore',
})

export default function Page() {
  return <HomeClientPage />
}
