export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import { fetchCmsPageBySlug, fetchLocationPageBySlug, fetchRedirectByPath, fetchSeoBySlug } from '../../../lib/cmsServer'
import { buildMetadata } from '../../lib/seo'
import { isPublicCmsEnabled } from '../../lib/publicCms'

export async function generateMetadata({ params }) {
  const slug = params?.slug
  if (!slug) return buildMetadata({ title: 'Page', description: 'Acadvizen dynamic page.', path: '/' })

  const [page, locationPage, seo] = await Promise.all([fetchCmsPageBySlug(slug), fetchLocationPageBySlug(slug), fetchSeoBySlug(slug)])
  const resolved = page || locationPage
  if (!resolved) {
    return buildMetadata({
      title: 'Page Not Found',
      description: 'This page does not exist.',
      path: `/${slug}`,
    })
  }

  const metadata = buildMetadata({
    title: seo?.meta_title || resolved.seo_title || resolved.title || 'Acadvizen',
    description: seo?.meta_description || resolved.seo_description || resolved.description || 'Acadvizen dynamic page.',
    path: `/${slug}`,
    image: seo?.og_image || resolved.og_image || null,
  })
  if (resolved.noindex || seo?.noindex) metadata.robots = { index: false, follow: true }
  if (resolved.canonical_url || seo?.canonical_url) metadata.alternates = { canonical: resolved.canonical_url || seo?.canonical_url }
  return metadata
}

export default async function Page({ params }) {
  const slug = params?.slug
  if (!isPublicCmsEnabled()) notFound()
  const pathname = slug ? `/${slug}` : '/'
  const [redirectRule, page, locationPage, seo] = await Promise.all([
    fetchRedirectByPath(pathname),
    fetchCmsPageBySlug(slug),
    fetchLocationPageBySlug(slug),
    fetchSeoBySlug(slug),
  ])
  if (redirectRule?.to_path) {
    redirect(redirectRule.to_path)
  }

  const resolved = page || locationPage
  if (!resolved) notFound()
  return (
    <>
      {seo?.schema_json && typeof seo.schema_json === 'object' ? (
        <script id={`schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schema_json) }} />
      ) : null}
      <DynamicPageRenderer page={resolved} />
    </>
  )
}
