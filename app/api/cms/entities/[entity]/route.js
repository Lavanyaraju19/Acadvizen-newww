import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateAllCmsPages,
  readJsonBody,
} from '../../_utils'
import { applyEntityOrdering, getEntityConfig, sanitizeEntityPayload } from '../../../../../lib/cmsEntities'

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
  if (slug && config.slugField) next = next.eq(config.slugField, slug)
  if (id) next = next.eq('id', id)
  if (pageId && config.allowedFields?.includes('page_id')) next = next.eq('page_id', pageId)
  if (blogId && config.allowedFields?.includes('blog_id')) next = next.eq('blog_id', blogId)
  if (cityId && config.allowedFields?.includes('city_id')) next = next.eq('city_id', cityId)
  if (courseSlug && config.allowedFields?.includes('course_slug')) next = next.eq('course_slug', courseSlug)
  if (key && config.slugField) next = next.eq(config.slugField, key)

  if (config.statusField) {
    if (status && isAdmin) {
      next = next.eq(config.statusField, status === 'published' ? 'published' : 'draft')
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

export async function GET(request, { params }) {
  const config = getEntityConfig(params?.entity)
  if (!config) return jsonError('Unknown CMS entity.', 404, [])

  const { searchParams } = new URL(request.url)
  const limit = parsePositiveInt(searchParams.get('limit'), 250)
  const isAdmin = isAdminRequest(request)
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: isAdmin })
  if (response) return response

  let query = supabase.from(config.table).select('*').limit(limit || 250)
  query = applyEntityOrdering(query, config)
  query = applyFilters(query, request, config, isAdmin)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const config = getEntityConfig(params?.entity)
  if (!config) return jsonError('Unknown CMS entity.', 404)

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  if (body.action === 'duplicate' && body.id) {
    const { data: source, error: sourceError } = await supabase.from(config.table).select('*').eq('id', body.id).single()
    if (sourceError || !source) return jsonError('Source record not found.', 404)

    const duplicate = sanitizeEntityPayload(source, config)
    if (config.slugField && duplicate[config.slugField]) {
      duplicate[config.slugField] = `${duplicate[config.slugField]}-${Date.now()}`
    }
    if ('name' in duplicate && duplicate.name) duplicate.name = `${duplicate.name} Copy`
    if ('title' in duplicate && duplicate.title) duplicate.title = `${duplicate.title} Copy`
    if (config.statusField) duplicate[config.statusField] = 'draft'

    const { data, error } = await supabase.from(config.table).insert(duplicate).select('*').single()
    if (error) return jsonError(`Failed to duplicate record: ${error.message}`, 200)
    revalidateAllCmsPages()
    return jsonOk(data)
  }

  const payload = sanitizeEntityPayload(body, config)
  if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

  const upsertPayload = {
    ...payload,
    id: body.id || undefined,
  }

  const { data, error } = await supabase
    .from(config.table)
    .upsert(upsertPayload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save record: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}
