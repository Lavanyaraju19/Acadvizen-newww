import { LIVE_SYNC_TARGETS } from '../../../lib/livePageTargets'

export const CORE_PAGE_TEMPLATES = LIVE_SYNC_TARGETS

export function findCorePageTemplateBySlug(slug = '') {
  return CORE_PAGE_TEMPLATES.find((template) => template.slug === slug) || null
}
