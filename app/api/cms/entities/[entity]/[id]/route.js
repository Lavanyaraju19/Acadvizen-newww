import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  readJsonBody,
} from '../../../_utils'
import { getEntityConfig, sanitizeEntityPayload } from '../../../../../../lib/cmsEntities'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const config = getEntityConfig(params?.entity)
  if (!config) return jsonError('Unknown CMS entity.', 404)

  const id = params?.id
  if (!id) return jsonError('Record id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const payload = sanitizeEntityPayload(body, config)
  if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

  const { data, error } = await supabase.from(config.table).update(payload).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update record: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const config = getEntityConfig(params?.entity)
  if (!config) return jsonError('Unknown CMS entity.', 404)

  const id = params?.id
  if (!id) return jsonError('Record id is required.', 400)

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { error } = await supabase.from(config.table).delete().eq('id', id)
  if (error) return jsonError(`Failed to delete record: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk({ id, deleted: true })
}
