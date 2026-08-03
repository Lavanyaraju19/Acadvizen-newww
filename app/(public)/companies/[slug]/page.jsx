export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { fetchPublishedRecordBySlug } from '../../../../lib/cmsPublishing'
import { buildMetadata } from '../../../lib/seo'
import Breadcrumbs from '../../../../components/cms/templates/Breadcrumbs'
import JsonLd from '../../../../components/cms/templates/JsonLd'
import { buildBreadcrumbSchema, buildOrganizationSchema } from '../../../../lib/structuredData'

export const dynamicParams = true

async function fetchCompany(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null
  return fetchPublishedRecordBySlug(supabase, {
    table: 'companies',
    slug,
    visibilityField: 'is_active',
    statusField: '',
    contentType: 'company',
    requestedRoute: `/companies/${slug}`,
  })
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const company = await fetchCompany(slug)
  if (!company) {
    return buildMetadata({ title: 'Hiring Partner', description: 'Hiring partner profile.', path: `/companies/${slug}` })
  }
  return buildMetadata({
    title: company.company_name,
    description: company.description || `${company.company_name} is a hiring partner of Acadvizen.`,
    path: `/companies/${company.slug}`,
    image: company.logo || undefined,
  })
}

export default async function CompanyDetailPage({ params }) {
  const { slug } = await params
  const company = await fetchCompany(slug)
  if (!company) notFound()

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Hiring Partners', href: '/companies' },
    { label: company.company_name },
  ]

  return (
    <div className="pb-12">
      <JsonLd id="company-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        id="company-org"
        data={buildOrganizationSchema({
          name: company.company_name,
          description: company.description,
          url: company.website_url,
          logo: company.logo,
        })}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.company_name}
            className="h-20 w-20 rounded-2xl bg-white object-contain p-3"
          />
        ) : null}
        <h1 className="mt-5 text-2xl font-bold text-slate-50 sm:text-3xl">{company.company_name}</h1>
        {company.hiring_status ? (
          <span className="mt-3 rounded-full border border-teal-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-200">
            {company.hiring_status}
          </span>
        ) : null}
        {company.description ? (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-300 sm:text-base">
            {company.description}
          </p>
        ) : null}
        {company.website_url ? (
          <a
            href={company.website_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Visit website
          </a>
        ) : null}
      </div>
      <div className="mt-8 text-center">
        <Link href="/companies" className="text-sm text-slate-400 hover:text-slate-200">&larr; Back to all hiring partners</Link>
      </div>
      </div>
    </div>
  )
}
