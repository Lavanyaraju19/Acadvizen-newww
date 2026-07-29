import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  normalizePagePath,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'
import { createSlugRedirectRecord } from '../../../../../lib/redirects'
import { generateSlug, validateSlug } from '../../../../../lib/slugUtils'

export const dynamic = 'force-dynamic'

const OPTIONAL_PAGE_COLUMNS = ['canonical_url', 'published_at']

function getMissingColumnName(error) {
  const message = String(error?.message || '')
  const match = message.match(/'([^']+)' column/i)
  return match?.[1] || ''
}

async function updatePageRecord(supabase, id, payload) {
  let candidatePayload = { ...payload }

  while (true) {
    const attempt = await supabase.from('pages').update(candidatePayload).eq('id', id).select('*').single()
    if (!attempt.error) {
      return attempt
    }

    const missingColumn = getMissingColumnName(attempt.error)
    if (!missingColumn || !OPTIONAL_PAGE_COLUMNS.includes(missingColumn) || !(missingColumn in candidatePayload)) {
      return attempt
    }

    delete candidatePayload[missingColumn]
  }
}

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Page id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const { data: existingPage, error: existingPageError } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
  if (existingPageError) return jsonError(`Failed to load page: ${existingPageError.message}`, 500)
  if (!existingPage) return jsonError('Page not found.', 404)

  const update = {}
  const allowed = ['title', 'description', 'seo_title', 'seo_description', 'canonical_url', 'status']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('slug' in body || !existingPage.slug) {
    const nextSlug = generateSlug(body.slug || body.title || existingPage.title)
    const slugValidation = validateSlug(nextSlug)
    if (!slugValidation.valid) {
      return jsonError(slugValidation.error, 400)
    }

    const { data: existingSlug, error: slugLookupError } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', nextSlug)
      .neq('id', id)
      .maybeSingle()

    if (slugLookupError) return jsonError(`Failed to validate page slug: ${slugLookupError.message}`, 500)
    if (existingSlug) return jsonError('A page with this slug already exists', 400)
    update.slug = nextSlug
  }
  if ('status' in update) {
    update.status = update.status === 'published' ? 'published' : 'draft'
    update.published_at = update.status === 'published' ? (existingPage.published_at || new Date().toISOString()) : null
  }

  const { data, error } = await updatePageRecord(supabase, id, update)
  if (error) return jsonError(`Failed to update page: ${error.message}`, 500)

  let warning = null
  if (
    existingPage?.slug &&
    existingPage.slug !== data?.slug &&
    (existingPage.status === 'published' || data?.status === 'published')
  ) {
    try {
      await createSlugRedirectRecord(supabase, {
        fromPath: normalizePagePath(existingPage.slug),
        toPath: normalizePagePath(data?.slug),
        statusCode: 301,
      })
    } catch (redirectError) {
      warning = `Page updated, but the slug redirect could not be created: ${redirectError.message}`
    }
  }

  revalidateCmsPaths([normalizePagePath(existingPage?.slug), normalizePagePath(data?.slug), '/sitemap.xml'])
  revalidateAllCmsPages()
  return jsonOk(data, warning ? { warning } : {})
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Page id is required.', 400)

  const { data: page } = await supabase.from('pages').select('slug').eq('id', id).maybeSingle()
  const { error } = await supabase.from('pages').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete page: ${error.message}`, 500)
  revalidateCmsPaths([normalizePagePath(page?.slug), '/sitemap.xml'])
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
