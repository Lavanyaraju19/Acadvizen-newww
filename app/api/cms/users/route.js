import {
  ensureAdmin,
  getSupabaseClientOrResponse,
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
    const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const limit = parseInt(searchParams.get('limit') || '100')

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          role_id,
          roles (
            id,
            name,
            slug,
            permissions
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (isTableNotFoundError(error)) return jsonOk([])
      return jsonError(`Failed to fetch users: ${error.message}`, 500, [])
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

    const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    
    if (!body?.email) {
      return jsonError('Email is required', 400)
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return jsonError('User with this email already exists', 400)
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name || '',
      }
    })

    if (authError) return jsonError(`Failed to create user: ${authError.message}`, 500)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: body.full_name || '',
        role: body.role || 'viewer',
      })
      .eq('id', authData.user.id)
      .select('*')
      .single()

    if (profileError) return jsonError(`Failed to update profile: ${profileError.message}`, 500)

    if (body.role_id) {
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role_id: body.role_id,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
      })
    }

    revalidateAllCmsPages()
    return jsonOk(profile)
  } catch (err) {
    return jsonError(`Internal server error: ${err.message}`, 500)
  }
}
