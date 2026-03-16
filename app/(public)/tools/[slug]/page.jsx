export const revalidate = 0
export const dynamic = 'force-dynamic'

import { ToolDetailClientPage } from '../../../client-pages'
import DynamicPageRenderer from '../../../../components/cms/DynamicPageRenderer'
import { buildMetadata } from '../../../lib/seo'
import { fetchToolBySlug } from '../../../lib/contentMeta'
import { isPublicCmsEnabled } from '../../../lib/publicCms'
import { fetchCmsPageByAnySlug } from '../../../../lib/cmsServer'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }) {
  const slug = params?.slug || ''
  const cmsPage = await fetchCmsPageByAnySlug([`tool-${slug}`, `tools-${slug}`])
  if (cmsPage) {
    return buildMetadata({
      title: cmsPage.seo_title || cmsPage.title || 'Tool Details',
      description: cmsPage.seo_description || cmsPage.description || 'Tool details at Acadvizen.',
      path: `/tools/${slug}`,
    })
  }

  const tool = slug ? await fetchToolBySlug(slug) : null

  return buildMetadata({
    title: tool?.name || 'Tool Details',
    description:
      tool?.description || 'Tool-specific insights, use cases, and learning resources for digital marketing workflows.',
    path: `/tools/${slug}`,
  })
}

export default async function Page({ params }) {
  const slug = params?.slug || ''
  if (!isPublicCmsEnabled()) return <ToolDetailClientPage />
  const cmsPage = await fetchCmsPageByAnySlug([`tool-${slug}`, `tools-${slug}`])
  if (cmsPage) return <DynamicPageRenderer page={cmsPage} />
  return <ToolDetailClientPage />
}
