import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'
import { moveMissingColumnIntoPayload } from '../../../../lib/leadSchemaFallback.js'

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
  const unauthorized = await ensureAdmin(request, { resource: 'leads', action: 'read' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const limit = parsePositiveInt(searchParams.get('limit'), 500)
  const status = searchParams.get('status')

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit || 500)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return jsonError(`Failed to fetch leads: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  // Public/anonymous submission path - mirrors app/api/cms/forms/[id]/submit/route.js's use of
  // the service role. `leads` intentionally has no anon SELECT policy (visitors must never read
  // other people's submissions), but Postgres RLS also gates the row an `INSERT ... RETURNING`
  // hands back on that same SELECT policy, so an anon-key insert.select().single() call always
  // fails RLS even though the INSERT itself would have succeeded. Server-validated writes to this
  // specific endpoint are the sanctioned exception to "never fall back to service role" below.
  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const payload = normalizeLeadPayload(body)
  if (!payload.full_name && !payload.email && !payload.phone) {
    return jsonError('Please provide at least name, email, or phone.', 400)
  }

  const { data, error } = await insertLeadWithSchemaFallback(supabase, payload)
  if (error) return jsonError(`Failed to save lead: ${error.message}`, 500)
  return jsonOk(data)
}
