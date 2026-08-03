import { getEntityConfig, sanitizeEntityPayload } from '../../../../../lib/cmsEntities'
import {
  ensureAdmin,
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
  readJsonBody,
} from '../../_utils'
import { hasProfilePermission } from '../../../../../lib/adminPermissions'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  buildPublishFields,
  getCanonicalPath,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
  normalizeCmsStatus,
} from '../../../../../lib/cmsPublishing'
import { createSlugRedirectRecord } from '../../../../../lib/redirects'
import { reassignSeoMetadataSlug, clearSeoMetadataForSlug } from '../../../../../lib/cmsServer'

export const dynamic = 'force-dynamic'

const config = getEntityConfig('pages')

export async function GET(request, { params }) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const { data, error } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
    if (!data) return jsonError('Page not found.', 404)
    return jsonOk(data)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500, [])
  }
}

export async function PATCH(request, { params }) {
  try {
    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

    const { data: existingRecord, error: existingError } = await supabase
      .from('pages').select('*').eq('id', id).maybeSingle()
    if (existingError) return jsonError(`Failed to load record: ${existingError.message}`, 500)
    if (!existingRecord) return jsonError('Record not found.', 404)

    const canEditAnyPage = hasProfilePermission(adminContext.profile, 'pages', 'publish')
    if (!canEditAnyPage && existingRecord.created_by && existingRecord.created_by !== adminContext.user.id) {
      return jsonError('This account can only edit its own drafts.', 403)
    }

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (normalizeCmsStatus(payload.status) === 'published' && !canEditAnyPage) {
      return jsonError('This account does not have permission to publish pages.', 403)
    }

    if (payload.slug) {
      const nextSlug = normalizeCmsSlug(payload.slug)
      try {
        await assertSlugAvailable(supabase, {
          table: 'pages', slug: nextSlug, slugField: 'slug', currentId: id, contentType: 'page',
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload.slug = nextSlug
    }

    if ('status' in payload) {
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload.status),
        existing: existingRecord,
        requestedPublishedAt: body.published_at,
      }))
    }

    const { data, error } = await supabase.from('pages').update(payload).eq('id', id).select('*').single()
    if (error) return jsonError(`Failed to update page: ${error.message}`, 500)

    const previousSlug = existingRecord?.slug || ''
    const currentSlug = data?.slug || ''
    let warning = null
    if (previousSlug && currentSlug && previousSlug !== currentSlug) {
      try {
        await createSlugRedirectRecord(supabase, {
          fromPath: `/${previousSlug}`, toPath: `/${currentSlug}`, statusCode: 301,
        })
      } catch (redirectError) {
        warning = `Page updated, but slug redirect could not be created: ${redirectError.message}`
      }
      await reassignSeoMetadataSlug(supabase, { fromSlug: previousSlug, toSlug: currentSlug }).catch(() => {})
    }

    const revalidation = revalidateCmsMutation('page', { slug: currentSlug, previousSlug })
    const responseData = currentSlug
      ? { ...data, canonical_public_url: getCanonicalPublicUrl('page', currentSlug) }
      : data
    if (!revalidation.ok) {
      return jsonError('Page updated, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication: buildCmsMutationMeta('page', responseData, revalidation), ...(warning ? { warning } : {}) })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const { data: existingRecord } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (existingRecord && existingRecord.created_by && existingRecord.created_by !== adminContext.user.id && !hasProfilePermission(adminContext.profile, 'pages', 'publish')) {
      return jsonError('This account can only delete its own drafts.', 403)
    }
    const { error } = await supabase.from('pages').delete().eq('id', id)
    if (error) return jsonError(`Failed to delete page: ${error.message}`, 500)
    if (existingRecord?.slug) {
      await clearSeoMetadataForSlug(supabase, existingRecord.slug).catch(() => {})
    }
    const revalidation = revalidateCmsMutation('page', { previousSlug: existingRecord?.slug || '' })
    if (!revalidation.ok) {
      return jsonError('Page deleted, but cache revalidation failed. Please retry.', 500, { id, deleted: true })
    }
    return jsonOk({ id, deleted: true }, { revalidation })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
