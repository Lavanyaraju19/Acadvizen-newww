// This route reads through getServerSupabaseClient(), which forces every fetch to
// `cache: 'no-store'` (see lib/supabaseServer.ts). Static/ISR generation
// (`revalidate` + `generateStaticParams`) is incompatible with a no-store fetch happening
// mid-render - Next.js detects the conflict at runtime and throws "Page changed from
// static to dynamic at runtime", which surfaced as a slow, failing 500 on every placement
// id that wasn't in the (empty) static params list, i.e. every placement id. Every sibling
// public route in this app already runs force-dynamic for the same underlying reason -
// this route just hadn't been updated to match.
export const dynamic = 'force-dynamic'

import { PlacementDetailClientPage } from '../../../client-pages'
import { buildMetadata } from '../../../lib/seo'
import { fetchPlacementById } from '../../../lib/contentMeta'

export async function generateMetadata({ params }) {
  const { id } = await params
  const placement = id ? await fetchPlacementById(id) : null

  return buildMetadata({
    title: placement?.title || placement?.role || 'Placement Details',
    description:
      placement?.description ||
      `Placement case details${placement?.company_name ? ` with ${placement.company_name}` : ''} including role, company, package, and learner outcomes.`,
    path: `/placement/${id}`,
  })
}

export default function Page() {
  return <PlacementDetailClientPage />
}
