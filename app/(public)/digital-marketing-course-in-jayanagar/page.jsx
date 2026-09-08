import { permanentRedirect } from 'next/navigation'

// This legacy static route pre-dates the locations-table-driven system and had no matching CMS
// page record, so it silently rendered the generic homepage fallback instead of Jayanagar-specific
// content. /digital-marketing-courses-jayanagar (plural) is the real, admin-managed city page - this
// route now permanently redirects there so an old bookmark/backlink lands on real content.
export default function Page() {
  permanentRedirect('/digital-marketing-courses-jayanagar')
}
