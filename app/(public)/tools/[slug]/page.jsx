import { ToolDetailClientPage } from '../../../client-pages'
import { buildMetadata } from '../../../lib/seo'
import { fetchToolBySlug } from '../../../lib/contentMeta'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || ''
  const tool = slug ? await fetchToolBySlug(slug) : null

  return buildMetadata({
    title: tool?.name || 'Tool Details',
    description:
      tool?.description || 'Tool-specific insights, use cases, and learning resources for digital marketing workflows.',
    path: `/tools/${slug}`,
  })
}

export default function Page() {
  return <ToolDetailClientPage />
}
