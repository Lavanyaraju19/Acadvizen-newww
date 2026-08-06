import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function submissionValueToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    // File/image fields are stored as { name, url, type, size } by the submit route.
    if (typeof value.url === 'string') return value.url
    return JSON.stringify(value)
  }
  return String(value)
}

export async function GET(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'forms', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const wantsCsv = searchParams.get('format') === 'csv'

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, name, fields')
    .eq('id', id)
    .maybeSingle()
  if (formError) return jsonError(`Failed to load form: ${formError.message}`, 500)
  if (!form) return jsonError('Form not found.', 404)

  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', id)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return jsonError(`Failed to load submissions: ${error.message}`, 500)

  if (!wantsCsv) return jsonOk(submissions || [])

  const fields = Array.isArray(form.fields) ? form.fields.filter((f) => f.type !== 'html') : []
  const headers = ['Submitted At', 'Status', ...fields.map((f) => f.label || f.id), 'IP Address']
  const rows = (submissions || []).map((submission) => {
    const data = submission.submission_data && typeof submission.submission_data === 'object' ? submission.submission_data : {}
    return [
      submission.created_at,
      submission.status,
      ...fields.map((f) => submissionValueToText(data[f.id])),
      submission.ip_address,
    ]
  })

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  return jsonOk(csv)
}
