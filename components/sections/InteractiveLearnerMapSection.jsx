import Link from 'next/link'
import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { normalizeContent, sectionPaddingClass, sectionVisibilityClass, sectionInlineStyle, normalizeStyle } from './sectionUtils'
import InteractiveLearnerMapLoader from './InteractiveLearnerMapLoader'

// Server-fetched (same pattern as DataFeedSection/LocationExplorerSection) so pins are always
// current at request time. Never fabricates learner_count/growth_percent - both come straight
// from learner_map_points, which starts empty until an admin enters real, verified numbers.
async function loadPoints() {
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('learner_map_points')
    .select('id, label, country, state, latitude, longitude, learner_count, growth_percent, representative_image, cta_label, cta_url, courses(slug, title)')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(500)

  return (data || [])
    .filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude)))
    .map((row) => ({
      id: row.id,
      label: row.label,
      country: row.country,
      state: row.state,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      learnerCount: row.learner_count ?? null,
      growthPercent: row.growth_percent ?? null,
      image: row.representative_image || null,
      ctaLabel: row.cta_label || (row.courses?.title ? `Explore ${row.courses.title}` : null),
      ctaUrl: row.cta_url || (row.courses?.slug ? `/courses/${row.courses.slug}` : null),
    }))
}

export default async function InteractiveLearnerMapSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const points = await loadPoints()
  if (!points.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">{content.heading}</h2> : null}
        {content.description ? <p className="mt-2 max-w-2xl text-sm text-slate-300">{content.description}</p> : null}
        <div className="mt-6">
          <InteractiveLearnerMapLoader
            points={points}
            height={Number(content.height) || 520}
            initialZoom={Number(content.initialZoom) || 4}
            mapStyle={content.mapStyle || 'blue'}
            showSearch={content.showSearch !== false}
            showGrowth={content.showGrowth !== false}
          />
        </div>
        {content.ctaLabel && content.ctaUrl ? (
          <div className="mt-5">
            <Link href={content.ctaUrl} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200">
              {content.ctaLabel} &rarr;
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
