import { BlogClientPage } from '../../client-pages'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Digital Marketing Insights, Trends & Career Guide 2026',
  description:
    'Whether you are a student, working professional, entrepreneur, or aspiring marketer, our blogs are designed to keep you informed, future-ready, and ahead of the competition.',
  path: '/blog',
})

export default function Page() {
  return <BlogClientPage />
}
