import { HomeClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'AI Digital Marketing Course',
  description:
    'Learn AI-powered digital marketing workflows across SEO, ads, content, analytics, and automation with expert guidance.',
  path: '/ai-digital-marketing-course',
})

export default function Page() {
  return <HomeClientPage />
}

