import { PublicLayout } from '../../src/components/Layout/PublicLayout'
import { fetchSiteCmsData } from '../../lib/siteCmsServer'

export default async function SiteLayout({ children }) {
  const siteCmsData = await fetchSiteCmsData()
  return <PublicLayout initialSiteCmsData={siteCmsData}>{children}</PublicLayout>
}
