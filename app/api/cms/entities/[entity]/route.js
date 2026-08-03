import { csrfProtection } from '../../../../../lib/csrf'
import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateCmsMutation,
  readJsonBody,
} from '../../_utils'
import { applyEntityOrdering, getEntityConfig, sanitizeEntityPayload } from '../../../../../lib/cmsEntities'
import { validateEntity } from '../../../../../lib/validation'
import { hasProfilePermission } from '../../../../../lib/adminPermissions'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  buildPublishFields,
  buildVisibilityFields,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
  normalizeCmsStatus,
} from '../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

function applyFilters(query, request, config, isAdmin) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const pageId = searchParams.get('page_id')
  const blogId = searchParams.get('blog_id')
  const cityId = searchParams.get('city_id')
  const key = searchParams.get('key')
  const courseSlug = searchParams.get('course_slug')
  const status = searchParams.get('status')
  const active = searchParams.get('is_active')

  let next = query
  if (slug && config.slugField) next = next.eq(config.slugField, normalizeCmsSlug(slug))
  if (id) next = next.eq('id', id)
  if (pageId && config.allowedFields?.includes('page_id')) next = next.eq('page_id', pageId)
  if (blogId && config.allowedFields?.includes('blog_id')) next = next.eq('blog_id', blogId)
  if (cityId && config.allowedFields?.includes('city_id')) next = next.eq('city_id', cityId)
  if (courseSlug && config.allowedFields?.includes('course_slug')) next = next.eq('course_slug', courseSlug)
  if (key && config.slugField) next = next.eq(config.slugField, key)

  if (config.statusField) {
    if (status && isAdmin) {
      next = next.eq(config.statusField, normalizeCmsStatus(status))
    } else if (!isAdmin) {
      next = next.eq(config.statusField, 'published')
    }
  }

  if (config.visibilityField) {
    if (active !== null && active !== undefined && isAdmin) {
      next = next.eq(config.visibilityField, active === '1' || active === 'true')
    } else if (!isAdmin) {
      next = next.eq(config.visibilityField, true)
    }
  }

  return next
}

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('42p01') || msg.includes('could not find the table') || msg.includes('schema cache')
}

export async function GET(request, { params }) {
  try {
    const { entity } = await params
    const config = getEntityConfig(entity)
    if (!config) return jsonError('Unknown CMS entity.', 404, [])

    const { searchParams } = new URL(request.url)
    const limit = parsePositiveInt(searchParams.get('limit'), 250)
    const adminAccess = await getOptionalAdminContext(request)
    if (adminAccess.response) return adminAccess.response
    const isAdmin = Boolean(adminAccess.context)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: isAdmin })
    if (response) return response

    let query = supabase.from(config.table).select('*').limit(limit || 250)
    query = applyEntityOrdering(query, config)
    query = applyFilters(query, request, config, isAdmin)

    const { data, error } = await query
    if (error) {
      if (isTableNotFoundError(error)) return jsonOk([])
      return jsonError(`Database query failed: ${error.message}`, 500, [])
    }
    return jsonOk(data || [])
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500, [])
  }
}

export async function POST(request, { params }) {
  try {
    const csrfError = csrfProtection(request)
    if (csrfError) return csrfError

    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized

    const { entity } = await params
    const config = getEntityConfig(entity)
    if (!config) return jsonError('Unknown CMS entity.', 404)

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

    // Input validation for create/update operations (not for duplicate action)
    const entityType = entity
    if (entityType && !body.action) {
      const validation = validateEntity(entityType, body)
      if (!validation.valid) {
        return jsonError(validation.errors.join('; '), 400)
      }
    }

    if (body.action === 'duplicate' && body.id) {
      const { data: source, error: sourceError } = await supabase.from(config.table).select('*').eq('id', body.id).single()
      if (sourceError || !source) return jsonError('Source record not found.', 404)

      const duplicate = sanitizeEntityPayload(source, config)
      if (config.slugField && duplicate[config.slugField]) {
        duplicate[config.slugField] = normalizeCmsSlug(`${duplicate[config.slugField]}-${Date.now()}`)
      }
      if ('name' in duplicate && duplicate.name) duplicate.name = `${duplicate.name} Copy`
      if ('title' in duplicate && duplicate.title) duplicate.title = `${duplicate.title} Copy`
      if (config.statusField) duplicate[config.statusField] = 'draft'

      const { data, error } = await supabase.from(config.table).insert(duplicate).select('*').single()
      if (error) return jsonError(`Failed to duplicate record: ${error.message}`, 500)
      const contentType = config.contentType || params?.entity
      const revalidation = revalidateCmsMutation(contentType, { slug: data?.[config.slugField] })
      return jsonOk(data, { publication: buildCmsMutationMeta(contentType, data, revalidation) })
    }

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (config.slugField && (payload[config.slugField] || (!body.id && (body.title || body.name)))) {
      const nextSlug = normalizeCmsSlug(payload[config.slugField] || body.title || body.name)
      try {
        await assertSlugAvailable(supabase, {
          table: config.table,
          slug: nextSlug,
          slugField: config.slugField,
          currentId: body.id || '',
          contentType: config.contentType || entity,
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload[config.slugField] = nextSlug
    }

    if (config.statusField && config.statusField in payload) {
      if (normalizeCmsStatus(payload[config.statusField]) === 'published' && !hasProfilePermission(adminContext.profile, entity, 'publish')) {
        return jsonError(`This account does not have permission to publish ${entity}.`, 403)
      }
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload[config.statusField]),
        requestedPublishedAt: body.published_at,
      }))
    }

    if (config.visibilityField && config.visibilityField in payload) {
      Object.assign(payload, buildVisibilityFields({
        isPublished: payload[config.visibilityField],
        field: config.visibilityField,
      }))
      for (const field of config.compatibilityVisibilityFields || []) {
        payload[field] = Boolean(payload[config.visibilityField])
      }
    }

    const upsertPayload = {
      ...payload,
      id: body.id || undefined,
    }

    const { data, error } = await supabase
      .from(config.table)
      .upsert(upsertPayload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) return jsonError(`Failed to save record: ${error.message}`, 500)
    const contentType = config.contentType || entity
    const slugValue = config.slugField ? data?.[config.slugField] : ''
    const revalidation = revalidateCmsMutation(contentType, { slug: slugValue })
    const responseData = slugValue
      ? { ...data, canonical_public_url: getCanonicalPublicUrl(contentType, slugValue) }
      : data
    if (!revalidation.ok) {
      return jsonError('Record saved, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication: buildCmsMutationMeta(contentType, responseData, revalidation) })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
