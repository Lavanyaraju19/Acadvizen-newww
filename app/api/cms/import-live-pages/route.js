import { ensureAdmin, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody } from '../_utils'
import { importCmsTemplates } from '../../../../lib/cmsImportTemplates'
import { buildLivePageTemplates } from '../../../../lib/livePageSync'
import { LIVE_SYNC_TARGETS } from '../../../../lib/livePageTargets'
import { hasValidSupabaseServiceRoleKey } from '../../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const hasBearerToken = Boolean(request?.headers?.get?.('authorization')?.toLowerCase?.().startsWith('bearer '))
  if (!hasBearerToken && !hasValidSupabaseServiceRoleKey()) {
    console.error('[cms-import] import-live-pages aborted: no bearer token and invalid SUPABASE_SERVICE_ROLE_KEY')
    return jsonError(
      'Live page import requires a valid admin session token or a valid SUPABASE_SERVICE_ROLE_KEY. Current server key is missing or mismatched.',
      500
    )
  }

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
    console.info('[cms-import] import-live-pages:start', {
      replaceSections,
      requestedSlugs,
      validSlugs,
    })
    const templates = await buildLivePageTemplates(supabase, validSlugs)
    console.info('[cms-import] import-live-pages:templates-built', {
      count: templates.length,
      slugs: templates.map((template) => template.slug),
    })
    const summary = await importCmsTemplates(supabase, templates, { replaceSections })
    console.info('[cms-import] import-live-pages:done', {
      count: summary.length,
      slugs: summary.map((item) => item.slug),
    })
    return jsonOk({
      imported: summary,
      count: summary.length,
    })
  } catch (error) {
    console.error('[cms-import] import-live-pages:failed', {
      message: error?.message || String(error),
      code: error?.code || null,
      details: error?.details || null,
      hint: error?.hint || null,
      validSlugs,
    })
    return jsonError(error?.message || 'Failed to import live pages.', 500)
  }
}
