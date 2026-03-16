import Link from 'next/link'
import { getServerSupabaseClient } from '../../lib/supabaseServer'
import {
  bodyClass,
  headingClass,
  normalizeContent,
  normalizeStyle,
  safeString,
  sectionAlignClass,
  sectionInlineStyle,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

const TYPE_MAP = {
  testimonials_feed: { table: 'testimonials', activeField: 'is_active', orderField: 'order_index' },
  placement_feed: { table: 'placements', activeField: 'is_active', orderField: 'created_at', ascending: false },
  recruiters_feed: { table: 'recruiters', activeField: 'is_active', orderField: 'order_index' },
  instructors_feed: { table: 'instructors', activeField: 'is_active', orderField: 'order_index' },
  certifications_feed: { table: 'certifications', activeField: 'is_active', orderField: 'order_index' },
  success_stories_feed: { table: 'success_stories', activeField: 'is_active', orderField: 'order_index' },
  metrics_counters: { table: 'student_metrics', activeField: 'is_active', orderField: 'order_index' },
  trust_badges_feed: { table: 'trust_badges', activeField: 'is_active', orderField: 'order_index' },
  community_events_feed: { table: 'community_events', activeField: 'is_active', orderField: 'event_date', ascending: false },
}

async function fetchFeedRows(type, limit = 8) {
  const cfg = TYPE_MAP[type]
  if (!cfg) return []
  const supabase = getServerSupabaseClient()
  if (!supabase) return []

  let query = supabase.from(cfg.table).select('*').limit(limit || 8)
  if (cfg.activeField) query = query.eq(cfg.activeField, true)
  query = query.order(cfg.orderField, { ascending: cfg.ascending !== false })
  const { data, error } = await query
  if (error) return []
  return Array.isArray(data) ? data : []
}

async function fetchCtaBlock(key) {
  if (!key) return null
  const supabase = getServerSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.from('cta_blocks').select('*').eq('key', key).eq('is_active', true).maybeSingle()
  return data || null
}

function renderItem(type, item) {
  if (type === 'metrics_counters') {
    return (
      <div key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5 text-center">
        <div className="text-3xl font-bold text-teal-200">{`${item.value || ''}${item.suffix || ''}`}</div>
        <div className="mt-2 text-sm text-slate-300">{item.label}</div>
      </div>
    )
  }

  if (type === 'recruiters_feed') {
    return (
      <div key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-4 text-center">
        <p className="text-base font-semibold text-slate-100">{item.name}</p>
      </div>
    )
  }

  if (type === 'testimonials_feed') {
    return (
      <article key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
        <p className="text-sm leading-relaxed text-slate-300">"{item.quote || item.message || ''}"</p>
        <p className="mt-4 text-sm font-semibold text-slate-100">{item.name || 'Learner'}</p>
        {item.role ? <p className="text-xs text-slate-400">{item.role}</p> : null}
      </article>
    )
  }

  if (type === 'placement_feed') {
    return (
      <article key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
        <p className="text-base font-semibold text-slate-100">{item.company_name || item.company || 'Hiring Partner'}</p>
        <p className="mt-2 text-sm text-slate-300">{item.role || item.title || 'Placement Opportunity'}</p>
        {item.salary ? <p className="mt-1 text-xs text-teal-200">{item.salary}</p> : null}
      </article>
    )
  }

  if (type === 'trust_badges_feed') {
    return (
      <div key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
        <p className="text-base font-semibold text-slate-100">{item.label}</p>
        {item.description ? <p className="mt-2 text-sm text-slate-300">{item.description}</p> : null}
      </div>
    )
  }

  if (type === 'community_events_feed') {
    return (
      <article key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
        <p className="text-base font-semibold text-slate-100">{item.title}</p>
        {item.event_date ? <p className="mt-1 text-xs text-teal-200">{new Date(item.event_date).toLocaleDateString()}</p> : null}
        {item.description ? <p className="mt-2 text-sm text-slate-300">{item.description}</p> : null}
      </article>
    )
  }

  return (
    <article key={item.id} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5">
      <p className="text-base font-semibold text-slate-100">{item.name || item.title || item.label || 'Item'}</p>
      {item.description || item.summary || item.bio ? (
        <p className="mt-2 text-sm text-slate-300">{item.description || item.summary || item.bio}</p>
      ) : null}
    </article>
  )
}

export default async function DataFeedSection({ section }) {
  const type = String(section?.type || '').trim().toLowerCase()
  const content = normalizeContent(section)
  const style = normalizeStyle(section)

  if (type === 'cta_block_ref') {
    const cta = await fetchCtaBlock(content.cta_key || content.key)
    if (!cta) return null
    return (
      <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
        <div className={`mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] px-6 py-8 sm:px-8 ${sectionAlignClass(content, style)}`}>
          <h2 className={`font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(cta.title, 'Talk to Our Team')}</h2>
          {cta.description ? <p className={`mt-3 whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{cta.description}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {cta.button_url ? (
              <Link href={cta.button_url} className="rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,transparent)] bg-[var(--section-btn-bg,#5eead4)] px-5 py-3 text-sm font-semibold text-[var(--section-btn-text,#020617)]">
                {safeString(cta.button_label, 'Get Started')}
              </Link>
            ) : null}
            {cta.secondary_url ? (
              <Link href={cta.secondary_url} className="rounded-[var(--section-btn-radius,0.75rem)] border border-[var(--section-btn-border,rgba(255,255,255,0.2))] px-5 py-3 text-sm font-semibold text-slate-100">
                {safeString(cta.secondary_label, 'Learn More')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  const rows = await fetchFeedRows(type, Number(content.limit) || 8)
  if (!rows.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-4 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.text ? <p className={`mb-6 whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.text)}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((item) => renderItem(type, item))}</div>
      </div>
    </section>
  )
}
