import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit')) || 100

  let query = supabase
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(`old_url.ilike.%${search}%,new_url.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return jsonError(`Failed to fetch redirects: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  
  if (!body.old_url || !body.new_url) {
    return jsonError('old_url and new_url are required', 400)
  }

  // Check for redirect loops
  if (body.old_url === body.new_url) {
    return jsonError('Cannot redirect to the same URL', 400)
  }

  // Check if old_url already exists
  const { data: existing } = await supabase
    .from('redirects')
    .select('id')
    .eq('old_url', body.old_url)
    .single()

  if (existing) {
    return jsonError('A redirect for this old URL already exists', 400)
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('redirects')
    .insert({
      old_url: body.old_url,
      new_url: body.new_url,
      redirect_type: body.redirect_type || 301,
      is_active: body.is_active !== false,
      created_by: user?.id,
    })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create redirect: ${error.message}`, 200)
  return jsonOk(data)
}