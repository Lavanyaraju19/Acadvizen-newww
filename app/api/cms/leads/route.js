import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'

export const dynamic = 'force-dynamic'

function normalizeLeadPayload(input = {}) {
  return {
    full_name: input.full_name ? String(input.full_name).trim() : null,
    email: input.email ? String(input.email).trim().toLowerCase() : null,
    phone: input.phone ? String(input.phone).trim() : null,
    page_slug: input.page_slug ? String(input.page_slug).trim() : null,
    source: input.source ? String(input.source).trim() : null,
    form_type: input.form_type ? String(input.form_type).trim() : 'inquiry',
    payload: input.payload && typeof input.payload === 'object' ? input.payload : {},
    status: input.status === 'contacted' || input.status === 'qualified' || input.status === 'closed' ? input.status : 'new',
  }
}

function moveMissingColumnIntoPayload(record, column) {
  if (!column || !(column in record)) return record

  const next = { ...record }
  if (column === 'payload') {
    delete next.payload
    return next
  }

  const payload = next.payload && typeof next.payload === 'object' ? { ...next.payload } : {}

  if (next[column] !== null && next[column] !== undefined && payload[column] === undefined) {
    payload[column] = next[column]
  }

  delete next[column]
  next.payload = payload
  return next
}

async function insertLeadWithSchemaFallback(supabase, record) {
  let nextRecord = { ...record }
  const removedColumns = []
  let lastError = null

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabase.from('leads').insert(nextRecord).select('*').single()
    if (!result.error) {
      return { ...result, removedColumns }
    }

    lastError = result.error
    const missingColumnMatch = result.error.message?.match(/Could not find the '([^']+)' column/i)
    const missingColumn = missingColumnMatch?.[1]

    if (!missingColumn || !(missingColumn in nextRecord)) {
      return { ...result, removedColumns }
    }

    removedColumns.push(missingColumn)
    nextRecord = moveMissingColumnIntoPayload(nextRecord, missingColumn)
  }

  return {
    data: null,
    error: lastError || { message: 'Lead insert failed after schema fallback attempts.' },
    removedColumns,
  }
}

export async function GET(request) {
  if (!isAdminRequest(request)) return jsonError('Unauthorized admin request.', 401, [])

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const limit = parsePositiveInt(searchParams.get('limit'), 500)
  const status = searchParams.get('status')

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit || 500)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return jsonError(`Failed to fetch leads: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const payload = normalizeLeadPayload(body)
  if (!payload.full_name && !payload.email && !payload.phone) {
    return jsonError('Please provide at least name, email, or phone.', 400)
  }

  const { data, error } = await insertLeadWithSchemaFallback(supabase, payload)
  if (error) return jsonError(`Failed to save lead: ${error.message}`, 200)
  return jsonOk(data)
}
