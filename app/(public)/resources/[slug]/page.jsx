export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { fetchPublishedRecordBySlug } from '../../../../lib/cmsPublishing'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { buildMetadata } from '../../../lib/seo'
import PageHero from '../../../../components/cms/templates/PageHero'
import PageSection from '../../../../components/cms/templates/PageSection'
import PageCTA from '../../../../components/cms/templates/PageCTA'
import JsonLd from '../../../../components/cms/templates/JsonLd'
import { buildBreadcrumbSchema } from '../../../../lib/structuredData'

export const dynamicParams = true

async function fetchResource(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null
  return fetchPublishedRecordBySlug(supabase, {
    table: 'resources',
    slug,
    visibilityField: 'is_active',
    statusField: '',
    contentType: 'resource',
    requestedRoute: `/resources/${slug}`,
  })
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const resource = await fetchResource(slug)
  if (!resource) {
    return buildMetadata({ title: 'Resource', description: 'Digital marketing resource.', path: `/resources/${slug}` })
  }
  return buildMetadata({
    title: resource.seo_title || resource.title,
    description: resource.seo_description || resource.description || `${resource.title} - a free resource from Acadvizen.`,
    path: `/resources/${resource.slug}`,
  })
}

export default async function ResourceDetailPage({ params }) {
  const { slug } = await params
  const resource = await fetchResource(slug)
  if (!resource) notFound()

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Resources', href: '/resources' },
    { label: resource.title },
  ]
  const downloadUrl = resource.file_url || resource.external_url

  return (
    <div>
      <JsonLd id="resource-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />

      <PageHero
        eyebrow="Resource"
        title={resource.title}
        subtitle={resource.description}
        breadcrumbs={breadcrumbItems}
        primaryCta={downloadUrl ? { label: resource.file_url ? 'Download' : 'Open Resource', href: downloadUrl } : undefined}
        secondaryCta={{ label: 'Browse all resources', href: '/resources' }}
      />

      {resource.content ? (
        <PageSection muted>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300 sm:text-base">{resource.content}</p>
        </PageSection>
      ) : null}

      <PageCTA
        title="Want personalised guidance?"
        subtitle="Talk to our admissions team about the right course for your goals."
      />
    </div>
  )
}
