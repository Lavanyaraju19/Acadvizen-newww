import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

function isTableNotFoundError(error) {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('relation') || msg.includes('42p01') || msg.includes('could not find the table') || msg.includes('schema cache')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDrafts = searchParams.get('include_drafts') === '1'
    const adminAccess = includeDrafts
      ? await getOptionalAdminContext(request, { resource: 'forms', action: 'read' })
      : { context: null, response: null }
    if (adminAccess.response) return adminAccess.response

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: Boolean(adminAccess.context) })
    if (response) return response

    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase.from('forms').select('*').order('updated_at', { ascending: false }).limit(limit)
    if (!includeDrafts) query = query.eq('status', 'published')

    const { data, error } = await query
    if (error) {
      if (isTableNotFoundError(error)) return jsonOk([])
      return jsonError(`Database query failed: ${error.message}`, 500, [])
    }

    return jsonOk(data || [])
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500, [])
  }
}

export async function POST(request) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body?.name) {
      return jsonError('Form name is required.', 400)
    }

    const payload = {
      id: body.id || undefined,
      name: String(body.name).trim(),
      description: body.description || null,
      fields: body.fields || [],
      success_message: body.successMessage || 'Thank you for your submission!',
      error_message: body.errorMessage || 'Please fix the errors and try again.',
      redirect_url: body.redirectUrl || null,
      send_email: body.sendEmail || false,
      email_to: body.emailTo || null,
      email_subject: body.emailSubject || null,
      webhook_enabled: body.webhookEnabled || false,
      webhook_url: body.webhookUrl || null,
      autoresponder_enabled: body.autoresponderEnabled || false,
      autoresponder_email_field: body.autoresponderEmailField || null,
      autoresponder_subject: body.autoresponderSubject || null,
      autoresponder_body: body.autoresponderBody || null,
      store_submissions: body.storeSubmissions !== false,
      status: body.status === 'published' ? 'published' : 'draft',
    }

    const { data, error } = await supabase
      .from('forms')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      if (isTableNotFoundError(error)) return jsonError('Database table not yet created. Run migrations first.', 503)
      return jsonError(`Failed to save form: ${error.message}`, 500)
    }
    revalidateAllCmsPages()
    return jsonOk(data)
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500)
  }
}
