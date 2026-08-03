export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { buildMetadata } from '../../lib/seo'
import Breadcrumbs from '../../../components/cms/templates/Breadcrumbs'

export async function generateMetadata() {
  return buildMetadata({
    title: 'Resources',
    description: 'Free digital marketing resources, guides, and downloads from Acadvizen.',
    path: '/resources',
  })
}

async function fetchResources() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return []
  return Array.isArray(data) ? data : []
}

const TYPE_LABELS = {
  pdf: 'PDF',
  video: 'Video',
  image: 'Image',
  brochure: 'Brochure',
  llm_link: 'AI Tool',
}

export default async function ResourcesPage() {
  const resources = await fetchResources()
  const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Resources' }]

  return (
    <div className="pb-12">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Resources</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">Free digital marketing resources</h1>
          <p className="mt-4 text-sm text-slate-300 sm:text-base">
            Guides, templates, brochures, and tools to help you learn and practice digital marketing.
          </p>
        </div>

        {resources.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.id}
                href={resource.slug ? `/resources/${resource.slug}` : '#'}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-300/40 hover:bg-white/[0.05]"
              >
                {resource.resource_type ? (
                  <span className="w-fit rounded-full border border-teal-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-200">
                    {TYPE_LABELS[resource.resource_type] || resource.resource_type}
                  </span>
                ) : null}
                <p className="mt-4 text-base font-semibold text-slate-100 group-hover:text-teal-200">{resource.title}</p>
                {resource.description ? (
                  <p className="mt-2 text-sm text-slate-400 line-clamp-3">{resource.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-slate-400">Resources are being added. Check back soon.</p>
        )}
      </div>
    </div>
  )
}
