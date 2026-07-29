import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../_utils'
import { listRedirectRecords, saveRedirectRecord } from '../../../../lib/redirects'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit')) || 100

  try {
    const redirects = await listRedirectRecords(supabase, { search, limit })
    return jsonOk(redirects)
  } catch (error) {
    return jsonError(`Failed to fetch redirects: ${error.message}`, 500, [])
  }
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  
  const fromPath = body.from_path || body.old_url
  const toPath = body.to_path || body.new_url

  if (!fromPath || !toPath) {
    return jsonError('old_url/new_url (or from_path/to_path) are required', 400)
  }

  // Validate URL format
  const urlRegex = /^(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)$|^https?:\/\/[^\s/$.?#].[^\s]*$/
  if (!urlRegex.test(fromPath) || !urlRegex.test(toPath)) {
    return jsonError('Invalid URL format. URLs must start with / or http:// or https://', 400)
  }

  // Check for redirect loops
  if (fromPath === toPath) {
    return jsonError('Cannot redirect to the same URL', 400)
  }

  try {
    const redirect = await saveRedirectRecord(supabase, {
      from_path: fromPath,
      to_path: toPath,
      status_code: body.status_code || body.redirect_type || 301,
      is_active: body.is_active !== false,
    })
    return jsonOk(redirect)
  } catch (error) {
    return jsonError(error?.message || 'Failed to create redirect.', error?.status || 500)
  }
}
