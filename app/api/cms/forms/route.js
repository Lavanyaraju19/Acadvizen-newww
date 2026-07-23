import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1'
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const limit = parseInt(searchParams.get('limit') || '100')

  let query = supabase.from('forms').select('*').order('updated_at', { ascending: false }).limit(limit)
  if (!includeDrafts) query = query.eq('status', 'published')

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])

  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
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
    store_submissions: body.storeSubmissions !== false,
    status: body.status === 'published' ? 'published' : 'draft',
  }

  const { data, error } = await supabase
    .from('forms')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save form: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}