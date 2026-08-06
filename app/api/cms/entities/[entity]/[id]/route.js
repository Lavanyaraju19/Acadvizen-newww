import { csrfProtection } from '../../../../../../lib/csrf'
import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
  requireAdminContext,
  revalidateCmsMutation,
  readJsonBody,
} from '../../../_utils'
import { getEntityConfig, sanitizeEntityPayload } from '../../../../../../lib/cmsEntities'
import { createSlugRedirectRecord } from '../../../../../../lib/redirects'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  buildPublishFields,
  getCanonicalPath,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
  normalizeCmsStatus,
} from '../../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized

    const { entity, id } = await params
    const config = getEntityConfig(entity)
    if (!config) return jsonError('Unknown CMS entity.', 404, [])

    if (!id) return jsonError('Record id is required.', 400, [])

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data, error } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
    if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
    return jsonOk(data)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500, [])
  }
}

export async function PATCH(request, { params }) {
  try {
    const csrfError = csrfProtection(request)
    if (csrfError) return csrfError

    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized

    const { entity, id } = await params
    const config = getEntityConfig(entity)
    if (!config) return jsonError('Unknown CMS entity.', 404)

    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

    const { data: existingRecord, error: existingError } = await supabase
      .from(config.table)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (existingError) return jsonError(`Failed to load record: ${existingError.message}`, 500)
    if (!existingRecord) return jsonError('Record not found.', 404)

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (config.slugField && (payload[config.slugField] || body.title || body.name)) {
      const nextSlug = normalizeCmsSlug(payload[config.slugField] || body.title || body.name)
      try {
        await assertSlugAvailable(supabase, {
          table: config.table,
          slug: nextSlug,
          slugField: config.slugField,
          currentId: id,
          contentType: config.contentType || entity,
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload[config.slugField] = nextSlug
    }

    if (config.statusField && config.statusField in payload) {
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload[config.statusField]),
        existing: existingRecord,
        requestedPublishedAt: body.published_at,
      }))
    }

    if (config.visibilityField && config.visibilityField in payload) {
      payload[config.visibilityField] = Boolean(payload[config.visibilityField])
      for (const field of config.compatibilityVisibilityFields || []) {
        payload[field] = payload[config.visibilityField]
      }
    }

    const { data, error } = await supabase.from(config.table).update(payload).eq('id', id).select('*').single()
    if (error) return jsonError(`Failed to update record: ${error.message}`, 500)
    await logAuditEvent(supabase, { userId: adminContext.user.id, action: 'update', entityType: entity, entityId: id, changes: payload, request })

    const contentType = config.contentType || entity
    const previousSlug = config.slugField ? existingRecord?.[config.slugField] : ''
    const currentSlug = config.slugField ? data?.[config.slugField] : ''
    let warning = null
    if (previousSlug && currentSlug && previousSlug !== currentSlug) {
      try {
        await createSlugRedirectRecord(supabase, {
          fromPath: getCanonicalPath(contentType, previousSlug),
          toPath: getCanonicalPath(contentType, currentSlug),
          statusCode: 301,
        })
      } catch (redirectError) {
        warning = `Record updated, but the slug redirect could not be created: ${redirectError.message}`
      }
    }

    const revalidation = revalidateCmsMutation(contentType, { slug: currentSlug, previousSlug })
    const responseData = currentSlug
      ? { ...data, canonical_public_url: getCanonicalPublicUrl(contentType, currentSlug) }
      : data
    if (!revalidation.ok) {
      return jsonError('Record updated, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication: buildCmsMutationMeta(contentType, responseData, revalidation), ...(warning ? { warning } : {}) })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const csrfError = csrfProtection(request)
    if (csrfError) return csrfError

    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized

    const { entity, id } = await params
    const config = getEntityConfig(entity)
    if (!config) return jsonError('Unknown CMS entity.', 404)

    if (!id) return jsonError('Record id is required.', 400)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const { data: existingRecord } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle()
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) return jsonError(`Failed to delete record: ${error.message}`, 500)
    await logAuditEvent(supabase, {
      userId: adminContext.user.id,
      action: 'delete',
      entityType: entity,
      entityId: id,
      changes: existingRecord ? { deleted_record_summary: existingRecord[config.slugField] || existingRecord.title || existingRecord.name || null } : null,
      request,
    })
    const contentType = config.contentType || entity
    const revalidation = revalidateCmsMutation(contentType, {
      previousSlug: config.slugField ? existingRecord?.[config.slugField] : '',
    })
    if (!revalidation.ok) {
      return jsonError('Record deleted, but cache revalidation failed. Please retry.', 500, { id, deleted: true })
    }
    return jsonOk({ id, deleted: true }, { revalidation })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
