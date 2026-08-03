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

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = await params

  // Allowed fields for update
  const allowedFields = [
    'name',
    'type',
    'title',
    'description',
    'desktop_image',
    'tablet_image',
    'mobile_image',
    'link_url',
    'alt_text',
    'start_date',
    'end_date',
    'priority',
    'is_active',
    'show_button',
    'button_text',
    'button_color',
    'text_color',
    'background_color',
    'device_targeting',
    'page_targeting',
    'status',
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // start_date/end_date are timestamptz columns - the admin form sends '' when a date
      // picker is left empty, which Postgres rejects outright ("invalid input syntax for type
      // timestamp"). The create route already normalizes this; the update path never did.
      if ((field === 'start_date' || field === 'end_date') && body[field] === '') {
        updateData[field] = null
      } else {
        updateData[field] = body[field]
      }
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

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params

  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete banner: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}