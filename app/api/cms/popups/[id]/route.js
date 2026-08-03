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
  const { id } = params

  // Allowed fields for update - this list previously referenced columns that don't exist on
  // popups at all (trigger_delay, show_once_per_session, button_text, button_link, background_
  // color, text_color) while omitting real ones (name, type, status, show_frequency,
  // target_pages, exclude_pages, html_content, custom_frequency_days, close_button, overlay,
  // mobile/tablet/desktop_enabled) - so most of a real edit was silently dropped on every save.
  const allowedFields = [
    'name',
    'type',
    'trigger_type',
    'trigger_value',
    'content',
    'html_content',
    'image_url',
    'close_button',
    'overlay',
    'mobile_enabled',
    'tablet_enabled',
    'desktop_enabled',
    'show_frequency',
    'custom_frequency_days',
    'start_date',
    'end_date',
    'target_pages',
    'exclude_pages',
    'is_active',
    'status',
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // start_date/end_date are timestamptz columns - an empty date picker sends '', which
      // Postgres rejects outright ("invalid input syntax for type timestamp").
      if ((field === 'start_date' || field === 'end_date') && body[field] === '') {
        updateData[field] = null
      } else {
        updateData[field] = body[field]
      }
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

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase.from('popups').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete popup: ${error.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}