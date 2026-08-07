import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { CMS_CONTENT_TYPES } from '../../lib/cmsPublishing'
import { normalizeContent, sectionPaddingClass, sectionVisibilityClass, sectionInlineStyle, normalizeStyle } from './sectionUtils'
import LocationExplorerView from './LocationExplorerView'

// Server-fetched (like DataFeedSection) so the destination URLs and area/city names are always
// current at request time; only search/expand interactivity lives client-side in
// LocationExplorerView. Every link resolved here is a real published location page, a real course
// page, or an explicit admin-entered custom_url - never a fabricated path.
async function loadGroup(groupId) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !groupId) return null

  const { data: group } = await supabase
    .from('location_explorer_groups')
    .select('*')
    .eq('id', groupId)
    .eq('is_active', true)
    .maybeSingle()
  if (!group) return null

  const { data: items } = await supabase
    .from('location_explorer_items')
    .select('*, locations(id, name, slug, city_id), courses(id, title, slug)')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  if (!items?.length) return { group, cityGroups: [] }

  const cityIds = Array.from(new Set(items.map((i) => i.locations?.city_id).filter(Boolean)))
  const { data: cities } = cityIds.length
    ? await supabase.from('cities').select('id, name').in('id', cityIds)
    : { data: [] }
  const cityNameById = new Map((cities || []).map((c) => [c.id, c.name]))

  const byCity = new Map()
  for (const item of items) {
    const location = item.locations
    const label = item.custom_label || location?.name || 'Location'
    const href = item.custom_url
      || (item.courses?.slug ? CMS_CONTENT_TYPES.course.canonicalPath(item.courses.slug) : null)
      || (location?.slug ? CMS_CONTENT_TYPES.location.canonicalPath(location.slug) : null)
    if (!href) continue

    const cityId = location?.city_id || 'unassigned'
    const cityName = cityNameById.get(location?.city_id) || (group.city_id ? '' : 'Other Areas')
    if (!byCity.has(cityId)) byCity.set(cityId, { cityId, cityName: cityName || 'Areas', items: [] })
    byCity.get(cityId).items.push({ id: item.id, label, href })
  }

  return { group, cityGroups: Array.from(byCity.values()) }
}

export default async function LocationExplorerSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const groupId = content.group_id || content.groupId
  if (!groupId) return null

  const result = await loadGroup(groupId)
  if (!result || !result.cityGroups.length) return null

  const { group, cityGroups } = result

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LocationExplorerView
          variant={group.variant || 'explorer'}
          cityGroups={cityGroups}
          heading={content.heading || group.heading || 'Explore Programs Near You'}
          subheading={content.subheading || group.subheading || ''}
          ctaLabel={content.cta_label || group.cta_label}
          ctaUrl={content.cta_url || group.cta_url}
        />
      </div>
    </section>
  )
}
