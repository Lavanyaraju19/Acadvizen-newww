import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = params

  // Allowed fields for update
  const allowedFields = [
    'title',
    'content',
    'image_url',
    'trigger_type',
    'trigger_delay',
    'show_once_per_session',
    'is_active',
    'start_date',
    'end_date',
    'button_text',
    'button_link',
    'background_color',
    'text_color'
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const { data, error } = await supabase
    .from('popups')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update popup: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase.from('popups').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete popup: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}