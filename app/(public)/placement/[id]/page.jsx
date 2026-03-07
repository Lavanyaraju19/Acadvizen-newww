export const revalidate = 1;

import { PlacementDetailClientPage } from '../../../client-pages'
import { buildMetadata } from '../../../lib/seo'
import { fetchPlacementById } from '../../../lib/contentMeta'

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }) {
  const id = params?.id || ''
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
