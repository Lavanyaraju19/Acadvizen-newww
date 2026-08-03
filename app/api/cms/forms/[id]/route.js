import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

// GET single form by ID
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1'
  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const { id } = await params
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return jsonError(`Database query failed: ${error.message}`, 404)
  if (!data) return jsonError('Form not found', 404)

  return jsonOk(data)
}

// PATCH/UPDATE form by ID
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
    'description', 
    'fields',
    'success_message',
    'error_message',
    'redirect_url',
    'send_email',
    'email_to',
    'email_subject',
    'store_submissions',
    'status'
  ]

  const updateData = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  // Trim name if provided
  if (updateData.name) {
    updateData.name = String(updateData.name).trim()
  }

  const { data, error } = await supabase
    .from('forms')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update form: ${error.message}`, 500)
  if (!data) return jsonError('Form not found', 404)

  revalidateAllCmsPages()
  return jsonOk(data)
}

// DELETE form by ID
export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params

  // First check if form exists
  const { data: existingForm } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingForm) {
    return jsonError('Form not found', 404)
  }

  // Delete form submissions if store_submissions was enabled
  if (existingForm.store_submissions) {
    await supabase
      .from('form_submissions')
      .delete()
      .eq('form_id', id)
  }

  // Delete the form
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id)

  if (error) return jsonError(`Failed to delete form: ${error.message}`, 500)

  revalidateAllCmsPages()
  return jsonOk({ success: true, message: 'Form deleted successfully' })
}