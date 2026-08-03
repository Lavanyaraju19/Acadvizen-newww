import {
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const { id } = await params
  const { supabase, response } = await getSupabaseClientOrResponse(request)
  if (response) return response

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, status, store_submissions, success_message, redirect_url')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (formError || !form) return jsonError('Form not found or not published.', 404)

  const body = await readJsonBody(request)
  const submissionData = body && typeof body === 'object' ? body : {}

  if (form.store_submissions === false) {
    return jsonOk({ success: true, stored: false, success_message: form.success_message, redirect_url: form.redirect_url })
  }

  const record = {
    form_id: id,
    submission_data: submissionData,
    ip_address: (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null,
    user_agent: request.headers.get('user-agent') || null,
    referrer: request.headers.get('referer') || null,
  }

  const { error } = await supabase.from('form_submissions').insert(record)
  if (error) return jsonError(`Failed to save submission: ${error.message}`, 500)

  return jsonOk({ success: true, stored: true, success_message: form.success_message, redirect_url: form.redirect_url })
}
