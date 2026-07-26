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
    'description',
    'image_url',
    'mobile_image_url',
    'link_url',
    'alt_text',
    'start_date',
    'end_date',
    'priority',
    'is_active',
    'button_text',
    'button_color',
    'background_color'
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const { data, error } = await supabase
    .from('banners')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update banner: ${error.message}`, 500)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete banner: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}