import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'
import { deleteRedirectRecord, saveRedirectRecord } from '../../../../../lib/redirects'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  const { id } = params

  // Check for redirect loops
  const fromPath = body.from_path || body.old_url
  const toPath = body.to_path || body.new_url

  if (fromPath === toPath) {
    return jsonError('Cannot redirect to the same URL', 400)
  }

  try {
    const redirect = await saveRedirectRecord(supabase, {
      from_path: fromPath,
      to_path: toPath,
      status_code: body.status_code || body.redirect_type || 301,
      is_active: body.is_active !== false,
    }, { id })
    return jsonOk(redirect)
  } catch (error) {
    return jsonError(error?.message || 'Failed to update redirect.', error?.status || 500)
  }
}

export async function PUT(request, context) {
  return PATCH(request, context)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  try {
    return jsonOk(await deleteRedirectRecord(supabase, id))
  } catch (error) {
    return jsonError(`Failed to delete redirect: ${error.message}`, 500)
  }
}
