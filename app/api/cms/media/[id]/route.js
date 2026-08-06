import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../_utils'
import { findMediaReferences } from '../../../../../lib/mediaReferenceScanner'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const allowed = ['url', 'bucket', 'path', 'type', 'width', 'height', 'size', 'alt_text', 'caption', 'folder', 'folder_id', 'tags', 'name']
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase.from('media').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update media: ${error.message}`, 500)
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Media id is required.', 400)

  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === '1'

  const { data: existing } = await supabase.from('media').select('url').eq('id', id).maybeSingle()

  if (!force && existing?.url) {
    const references = await findMediaReferences(supabase, existing.url)
    if (references.length) {
      return jsonError(
        `This file is still in use (${references.map((r) => r.label).join(', ')}). Update or remove those references first, or delete again to confirm anyway.`,
        409,
        { references }
      )
    }
  }

  const { error } = await supabase.from('media').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete media metadata: ${error.message}`, 500)
  return jsonOk({ id, deleted: true })
}
