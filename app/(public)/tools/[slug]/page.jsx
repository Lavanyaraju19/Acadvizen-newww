export const revalidate = 0
export const dynamic = 'force-dynamic'

import DynamicPageRenderer from '../../../../components/cms/DynamicPageRenderer'
import { permanentRedirect, redirect } from 'next/navigation'
import { buildMetadata } from '../../../lib/seo'
import { fetchToolBySlug } from '../../../lib/contentMeta'
import { fetchCmsPageByAnySlug, fetchRedirectByPath } from '../../../../lib/cmsServer'
import { isPublicCmsEnabled } from '../../../lib/publicCms'
import ToolDetailLegacyClient from '../../../legacy-fallback/ToolDetailLegacyClient'
import Breadcrumbs from '../../../../components/cms/templates/Breadcrumbs'
import JsonLd from '../../../../components/cms/templates/JsonLd'
import { buildBreadcrumbSchema, buildWebPageSchema } from '../../../../lib/structuredData'

export const dynamicParams = true

export async function generateMetadata({ params }) {
  const { slug } = await params
  if (isPublicCmsEnabled()) {
    const cmsPage = await fetchCmsPageByAnySlug([`tool-${slug}`, `tools-${slug}`])
    if (cmsPage) {
      return buildMetadata({
        title: cmsPage.seo_title || cmsPage.title || 'Tool Details',
        description: cmsPage.seo_description || cmsPage.description || 'Tool details at Acadvizen.',
        path: `/tools/${slug}`,
      })
    }
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
  const { slug } = await params
  const redirectRule = await fetchRedirectByPath(`/tools/${slug}`)
  if (redirectRule?.to_path) {
    if ((redirectRule.status_code || redirectRule.redirect_type) === 301) {
      permanentRedirect(redirectRule.to_path)
    }
    redirect(redirectRule.to_path)
  }

  if (isPublicCmsEnabled()) {
    const cmsPage = await fetchCmsPageByAnySlug([`tool-${slug}`, `tools-${slug}`])
    if (cmsPage) {
      return (
        <DynamicPageRenderer
          page={cmsPage}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: cmsPage.title || 'Tool' }]}
        />
      )
    }
  }
  const tool = await fetchToolBySlug(slug)
  const toolName = tool?.name || 'Tool Details'
  const breadcrumbItems = [
    { label: 'Home', href: '/', path: '/' },
    { label: 'Tools', href: '/tools', path: '/tools' },
    { label: toolName, path: `/tools/${slug}` },
  ]

  return (
    <>
      <JsonLd id="tool-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd id="tool-schema" data={buildWebPageSchema({ name: toolName, description: tool?.description, path: `/tools/${slug}` })} />
      <Breadcrumbs items={breadcrumbItems} />
      <ToolDetailLegacyClient />
    </>
  )
}
