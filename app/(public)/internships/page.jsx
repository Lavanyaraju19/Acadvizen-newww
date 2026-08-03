export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSupabaseClient } from '../../../lib/supabaseServer'
import { buildMetadata } from '../../lib/seo'

export async function generateMetadata() {
  return buildMetadata({
    title: 'Internships',
    description: 'Live internship openings for Acadvizen learners across digital marketing roles.',
    path: '/internships',
  })
}

async function fetchInternships() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return []
  return Array.isArray(data) ? data : []
}

export default async function InternshipsPage() {
  const internships = await fetchInternships()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Internships</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-50 sm:text-4xl">Open internships</h1>
        <p className="mt-4 text-sm text-slate-300 sm:text-base">
          Hands-on internship opportunities with our hiring partners for learners ready to apply their skills.
        </p>
      </div>

      {internships.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {internships.map((role) => (
            <Link
              key={role.id}
              href={`/internships/${role.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-300/40 hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-3">
                {role.logo ? (
                  <img src={role.logo} alt={role.company_name || ''} loading="lazy" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
                ) : null}
                <div>
                  <p className="text-base font-semibold text-slate-100 group-hover:text-teal-200">{role.role || 'Internship'}</p>
                  <p className="text-xs text-slate-400">{role.company_name}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                {role.location ? <span className="rounded-full border border-white/10 px-2 py-1">{role.location}</span> : null}
                {role.duration ? <span className="rounded-full border border-white/10 px-2 py-1">{role.duration}</span> : null}
                {role.salary ? <span className="rounded-full border border-white/10 px-2 py-1">{role.salary}</span> : null}
              </div>
              {role.deadline ? (
                <p className="mt-3 text-xs text-amber-300">
                  Apply by {new Date(role.deadline).toLocaleDateString()}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-slate-400">No open internships right now. Check back soon.</p>
      )}
    </div>
  )
}
