import { ensureAdmin, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody } from '../_utils'
import { importCmsTemplates } from '../../../../lib/cmsImportTemplates'
import { buildLivePageTemplates } from '../../../../lib/livePageSync'
import { LIVE_SYNC_TARGETS } from '../../../../lib/livePageTargets'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request)
  if (response) return response

  const body = await readJsonBody(request)
  const replaceSections = body?.replace_sections !== false
  const requestedSlugs = Array.isArray(body?.slugs) ? body.slugs : []

  const validSlugs = requestedSlugs.length
    ? LIVE_SYNC_TARGETS.map((target) => target.slug).filter((slug) => requestedSlugs.includes(slug))
    : LIVE_SYNC_TARGETS.map((target) => target.slug)

  if (!validSlugs.length) {
    return jsonError('No matching live page targets found for sync.', 400)
  }

  try {
    const templates = await buildLivePageTemplates(supabase, validSlugs)
    const summary = await importCmsTemplates(supabase, templates, { replaceSections })
    return jsonOk({
      imported: summary,
      count: summary.length,
    })
  } catch (error) {
    return jsonError(error?.message || 'Failed to import live pages.', 500)
  }
}
