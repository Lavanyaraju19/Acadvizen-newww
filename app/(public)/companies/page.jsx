export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { buildMetadata } from '../../lib/seo'

export async function generateMetadata() {
  return buildMetadata({
    title: 'Hiring Partners',
    description: 'Companies that hire and partner with Acadvizen digital marketing graduates.',
    path: '/companies',
  })
}

async function fetchCompanies() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('company_name', { ascending: true })

  if (error) return []
  return Array.isArray(data) ? data : []
}

export default async function CompaniesPage() {
  const companies = await fetchCompanies()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Hiring Partners</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">Companies that hire from Acadvizen</h1>
        <p className="mt-4 text-sm text-slate-300 sm:text-base">
          Our learners go on to work with a growing network of hiring partners across digital marketing, product, and growth teams.
        </p>
      </div>

      {companies.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="group flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:border-teal-300/40 hover:bg-white/[0.05]"
            >
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.company_name || 'Company logo'}
                  loading="lazy"
                  className="h-16 w-16 rounded-xl object-contain bg-white p-2"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-lg font-semibold text-slate-200">
                  {(company.company_name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-base font-semibold text-slate-100 group-hover:text-teal-200">
                {company.company_name}
              </p>
              {company.hiring_status ? (
                <span className="mt-2 rounded-full border border-teal-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-200">
                  {company.hiring_status}
                </span>
              ) : null}
              {company.is_featured ? (
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">Featured</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-slate-400">
          Hiring partner profiles are being updated. Check back soon.
        </p>
      )}
    </div>
  )
}
