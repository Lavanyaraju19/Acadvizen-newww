export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { fetchPublishedRecordBySlug } from '../../../../lib/cmsPublishing'
import { buildMetadata } from '../../../lib/seo'
import Breadcrumbs from '../../../../components/cms/templates/Breadcrumbs'
import JsonLd from '../../../../components/cms/templates/JsonLd'
import { buildBreadcrumbSchema, buildJobPostingSchema } from '../../../../lib/structuredData'

export const dynamicParams = true

async function fetchInternship(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null
  return fetchPublishedRecordBySlug(supabase, {
    table: 'internships',
    slug,
    visibilityField: 'is_active',
    statusField: '',
    contentType: 'internship',
    requestedRoute: `/internships/${slug}`,
  })
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const role = await fetchInternship(slug)
  if (!role) {
    return buildMetadata({ title: 'Internship', description: 'Internship listing.', path: `/internships/${slug}` })
  }
  return buildMetadata({
    title: `${role.role || 'Internship'} at ${role.company_name || ''}`.trim(),
    description: role.description || `Internship opportunity with ${role.company_name || 'our hiring partner'}.`,
    path: `/internships/${role.slug}`,
    image: role.logo || undefined,
  })
}

export default async function InternshipDetailPage({ params }) {
  const { slug } = await params
  const role = await fetchInternship(slug)
  if (!role) notFound()

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Internships', href: '/internships' },
    { label: role.role || 'Internship' },
  ]

  return (
    <div className="pb-12">
      <JsonLd id="internship-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        id="internship-job"
        data={buildJobPostingSchema({
          title: role.role,
          description: role.description,
          hiringOrganizationName: role.company_name || 'Acadvizen',
          validThrough: role.deadline,
          location: role.location,
          applyUrl: role.apply_link,
        })}
      />
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-center gap-4">
          {role.logo ? (
            <img src={role.logo} alt={role.company_name || ''} className="h-14 w-14 rounded-xl bg-white object-contain p-2" />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">{role.role || 'Internship'}</h1>
            <p className="text-sm text-slate-400">{role.company_name}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
          {role.location ? <span className="rounded-full border border-white/10 px-3 py-1">{role.location}</span> : null}
          {role.duration ? <span className="rounded-full border border-white/10 px-3 py-1">{role.duration}</span> : null}
          {role.salary ? <span className="rounded-full border border-white/10 px-3 py-1">{role.salary}</span> : null}
          {role.deadline ? (
            <span className="rounded-full border border-amber-400/30 px-3 py-1 text-amber-300">
              Apply by {new Date(role.deadline).toLocaleDateString()}
            </span>
          ) : null}
        </div>

        {role.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-300 sm:text-base">{role.description}</p>
        ) : null}

        {role.eligibility ? (
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Eligibility</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{role.eligibility}</p>
          </div>
        ) : null}

        {role.apply_link ? (
          <a
            href={role.apply_link}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Apply now
          </a>
        ) : null}
      </div>
      <div className="mt-8 text-center">
        <Link href="/internships" className="text-sm text-slate-400 hover:text-slate-200">&larr; Back to all internships</Link>
      </div>
      </div>
    </div>
  )
}
