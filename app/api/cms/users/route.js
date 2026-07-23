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

  if (error) return jsonError(`Failed to fetch users: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  
  if (!body?.email) {
    return jsonError('Email is required', 400)
  }

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', body.email)
    .single()

  if (existingUser) {
    return jsonError('User with this email already exists', 400)
  }

  // Create user (this would typically be done through auth, but for admin creation we'll use auth.admin)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password || 'TempPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name || '',
    }
  })

  if (authError) return jsonError(`Failed to create user: ${authError.message}`, 200)

  // Update profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: body.full_name || '',
      role: body.role || 'viewer',
    })
    .eq('id', authData.user.id)
    .select('*')
    .single()

  if (profileError) return jsonError(`Failed to update profile: ${profileError.message}`, 200)

  // Assign role if provided
  if (body.role_id) {
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role_id: body.role_id,
      assigned_by: (await supabase.auth.getUser()).data.user?.id,
    })
  }

  revalidateAllCmsPages()
  return jsonOk(profile)
}