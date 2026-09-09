import { redirect, notFound } from 'next/navigation'
import { resolveAdminContext } from '../../../api/cms/_utils'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import DynamicPageRenderer from '../../../../components/cms/DynamicPageRenderer'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: { index: false, follow: false },
}

// Admin-only, unindexed preview of a page's DRAFT content - reachable by database id (not slug,
// since a staged draft shares its live counterpart's slug and a slug lookup would be ambiguous
// between the two). Renders through the exact same DynamicPageRenderer the real public /[slug]
// route uses, so what an admin sees here is exactly what goes live on Publish. See
// supabase/migrations/202608130001_staged_editing_shadow_drafts.sql for the staged-editing design.
export default async function PreviewPagePage({ params }) {
  const { id } = await params
  if (!id) notFound()

  const adminAccess = await resolveAdminContext()
  if (!adminAccess.ok) redirect('/admin-login')

  const supabase = getServerSupabaseClient({ preferServiceRole: true })
  if (!supabase) notFound()

  const { data: page } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (!page) notFound()

  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('page_id', id)
    .eq('visibility', true)
    .order('order_index', { ascending: true })

  return (
    <div className="min-h-screen">
      <div className="bg-amber-500/90 px-4 py-2 text-center text-sm font-semibold text-slate-950">
        Preview only - not published{page.draft_of_id ? ' (draft of an already-live page)' : ''}
      </div>
      <DynamicPageRenderer page={{ ...page, sections: sections || [] }} />
    </div>
  )
}
