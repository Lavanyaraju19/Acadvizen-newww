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

  // The form builder client sends camelCase keys (sendEmail, successMessage, ...) matching
  // the POST/upsert route's mapping - this must mirror that mapping exactly, not check for
  // snake_case column names on the body, or every field below name/description/fields/status
  // (which happen to be spelled the same in both cases) silently fails to persist on edit.
  const updateData = {}
  if (body.name !== undefined) updateData.name = String(body.name).trim()
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.fields !== undefined) updateData.fields = body.fields || []
  if (body.successMessage !== undefined) updateData.success_message = body.successMessage
  if (body.errorMessage !== undefined) updateData.error_message = body.errorMessage
  if (body.redirectUrl !== undefined) updateData.redirect_url = body.redirectUrl || null
  if (body.sendEmail !== undefined) updateData.send_email = Boolean(body.sendEmail)
  if (body.emailTo !== undefined) updateData.email_to = body.emailTo || null
  if (body.emailSubject !== undefined) updateData.email_subject = body.emailSubject || null
  if (body.webhookEnabled !== undefined) updateData.webhook_enabled = Boolean(body.webhookEnabled)
  if (body.webhookUrl !== undefined) updateData.webhook_url = body.webhookUrl || null
  if (body.autoresponderEnabled !== undefined) updateData.autoresponder_enabled = Boolean(body.autoresponderEnabled)
  if (body.autoresponderEmailField !== undefined) updateData.autoresponder_email_field = body.autoresponderEmailField || null
  if (body.autoresponderSubject !== undefined) updateData.autoresponder_subject = body.autoresponderSubject || null
  if (body.autoresponderBody !== undefined) updateData.autoresponder_body = body.autoresponderBody || null
  if (body.storeSubmissions !== undefined) updateData.store_submissions = body.storeSubmissions !== false
  if (body.status !== undefined) updateData.status = body.status === 'published' ? 'published' : 'draft'

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