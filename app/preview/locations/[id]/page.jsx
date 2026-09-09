import { redirect, notFound } from 'next/navigation'
import { resolveAdminContext } from '../../../api/cms/_utils'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import LocationPageRenderer from '../../../../components/cms/LocationPageRenderer'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: { index: false, follow: false },
}

// Same contract as app/preview/pages/[id]/page.jsx, for locations. LocationPageRenderer takes a
// raw record (not a slug lookup) and independently loads its own location_sections by
// locationRecord.id, so passing the draft's own id here automatically pulls the draft's own
// designed sections with no changes needed to that component.
export default async function PreviewLocationPage({ params }) {
  const { id } = await params
  if (!id) notFound()

  const adminAccess = await resolveAdminContext()
  if (!adminAccess.ok) redirect('/admin-login')

  const supabase = getServerSupabaseClient({ preferServiceRole: true })
  if (!supabase) notFound()

  const { data: location } = await supabase.from('locations').select('*').eq('id', id).maybeSingle()
  if (!location) notFound()

  return (
    <div className="min-h-screen">
      <div className="bg-amber-500/90 px-4 py-2 text-center text-sm font-semibold text-slate-950">
        Preview only - not published{location.draft_of_id ? ' (draft of an already-live location)' : ''}
      </div>
      <LocationPageRenderer locationRecord={location} locationSlug={location.slug} />
    </div>
  )
}
