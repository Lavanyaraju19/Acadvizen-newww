export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { permanentRedirect, redirect } from 'next/navigation'
import DynamicPageRenderer from '../../../components/cms/DynamicPageRenderer'
import CityPageRenderer from '../../../components/cms/CityPageRenderer'
import CityCoursePageRenderer from '../../../components/cms/CityCoursePageRenderer'
import LocationPageRenderer from '../../../components/cms/LocationPageRenderer'
import ServicePageRenderer from '../../../components/cms/ServicePageRenderer'
import { fetchCmsPageBySlug, fetchRedirectByPath, fetchSeoBySlug } from '../../../lib/cmsServer'
import { buildMetadata } from '../../lib/seo'
import { isPublicCmsEnabled } from '../../lib/publicCms'

function ensureRenderableSections(page) {
  if (!page) return page
  if (Array.isArray(page.sections) && page.sections.some((section) => section?.visibility !== false)) return page
  const text = page.description || page.seo_description || page.title
  if (!text) return page
  return {
    ...page,
    sections: [
      {
        id: `fallback-${page.id || page.slug}`,
        page_id: page.id,
        type: 'custom_rich_text',
        order_index: 0,
        visibility: true,
        content_json: {
          heading: page.title,
          text,
        },
        style_json: {},
      },
    ],
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  if (!slug) return buildMetadata({ title: 'Page', description: 'Acadvizen dynamic page.', path: '/' })

  if (!isPublicCmsEnabled()) {
    return buildMetadata({
      title: 'Page Not Found',
      description: 'This page does not exist.',
      path: `/${slug}`,
    })
  }

  const [page, seo] = await Promise.all([fetchCmsPageBySlug(slug), fetchSeoBySlug(slug)])
  const resolved = page
  if (!resolved) {
    notFound()
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
  const { slug } = await params
  const pathname = slug ? `/${slug}` : '/'
  const redirectRule = await fetchRedirectByPath(pathname)
  if (redirectRule?.to_path) {
    if ((redirectRule.status_code || redirectRule.redirect_type) === 301) {
      permanentRedirect(redirectRule.to_path)
    }
    redirect(redirectRule.to_path)
  }

  if (!isPublicCmsEnabled()) {
    notFound()
  }

  const [page, seo] = await Promise.all([
    fetchCmsPageBySlug(slug),
    fetchSeoBySlug(slug),
  ])

  if (!page) notFound()

  if (page.source === 'city_page') {
    return <CityPageRenderer cityPage={page.raw} />
  }

  if (page.source === 'location') {
    return <LocationPageRenderer locationRecord={page.raw.id ? page.raw : null} locationSlug={page.raw.locationSlug} />
  }

  if (page.source === 'city_course') {
    return <CityCoursePageRenderer cityRecord={page.raw.id ? page.raw : null} citySlug={page.raw.citySlug} />
  }

  if (page.source === 'service_page') {
    return <ServicePageRenderer servicePage={page.raw} />
  }

  const resolved = ensureRenderableSections(page)
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
