const { createClient } = require('@supabase/supabase-js')
const {
  assertDestructiveCmsTestsAllowed,
  createScopedCmsValue,
} = require('./safety')
const {
  createSupabaseAdminClient,
} = require('./utils')

const ROLE_PERMISSIONS = {
  super_admin: { '*': ['*'] },
  admin: {
    pages: ['create', 'read', 'update', 'delete', 'publish'],
    blogs: ['create', 'read', 'update', 'delete', 'publish'],
    media: ['create', 'read', 'update', 'delete'],
    forms: ['create', 'read', 'update', 'delete'],
    leads: ['read', 'update', 'delete', 'export'],
    redirects: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    menus: ['read', 'update'],
    header: ['read', 'update'],
    footer: ['read', 'update'],
    seo: ['read', 'update'],
  },
  editor: {
    pages: ['create', 'read', 'update', 'publish'],
    blogs: ['create', 'read', 'update', 'publish'],
    media: ['create', 'read', 'update'],
    forms: ['create', 'read', 'update'],
    seo: ['read', 'update'],
  },
  author: {
    pages: ['create', 'read', 'update', 'submit_review'],
    blogs: ['create', 'read', 'update', 'submit_review'],
    media: ['create', 'read'],
  },
  reviewer: {
    pages: ['read', 'approve', 'reject'],
    blogs: ['read', 'approve', 'reject'],
    seo: ['read'],
  },
  viewer: {
    pages: ['read'],
    blogs: ['read'],
    media: ['read'],
    forms: ['read'],
    leads: ['read'],
    redirects: ['read'],
    users: ['read'],
    settings: ['read'],
    menus: ['read'],
    header: ['read'],
    footer: ['read'],
    seo: ['read'],
  },
  seo_manager: {
    pages: ['read', 'update'],
    blogs: ['read', 'update'],
    seo: ['read', 'update'],
  },
  content_writer: {
    pages: ['create', 'read', 'update'],
    blogs: ['create', 'read', 'update'],
    media: ['create', 'read'],
  },
}

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for RBAC E2E verification.')
  }
  return { url, anonKey }
}

function createPublicAuthClient() {
  const { url, anonKey } = getPublicSupabaseConfig()
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function roleDisplayName(roleSlug) {
  return String(roleSlug || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function ensureRoleRecord(supabase, roleSlug) {
  const normalizedRole = String(roleSlug || '').trim().toLowerCase()
  const { data: existing, error: lookupError } = await supabase
    .from('roles')
    .select('id,name,slug,permissions')
    .or(`slug.eq.${normalizedRole},name.eq.${normalizedRole}`)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`Failed to load RBAC role ${normalizedRole}: ${lookupError.message}`)
  }

  if (existing?.id) {
    return existing
  }

  const { data: created, error: createError } = await supabase
    .from('roles')
    .insert({
      name: roleDisplayName(normalizedRole),
      slug: normalizedRole,
      permissions: ROLE_PERMISSIONS[normalizedRole] || { pages: ['read'] },
    })
    .select('id,name,slug,permissions')
    .single()

  if (createError) {
    throw new Error(`Failed to create RBAC role ${normalizedRole}: ${createError.message}`)
  }

  return created
}

async function createDisposableRoleUser(roleSlug, options = {}) {
  assertDestructiveCmsTestsAllowed()

  const normalizedRole = String(roleSlug || '').trim().toLowerCase()
  const supabase = createSupabaseAdminClient()
  const roleRecord = await ensureRoleRecord(supabase, normalizedRole)
  const scopedId = createScopedCmsValue(`${normalizedRole}-user`)
  const email = `${scopedId}@example.com`
  const password = options.password || `Aca!${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  const fullName = options.fullName || `${roleDisplayName(normalizedRole)} ${scopedId}`

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  })

  if (authError || !authData?.user?.id) {
    throw new Error(authError?.message || `Failed to create disposable ${normalizedRole} user.`)
  }

  const userId = authData.user.id
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role: normalizedRole,
      approval_status: 'approved',
    }, { onConflict: 'id' })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId).catch(() => null)
    throw new Error(`Failed to create disposable ${normalizedRole} profile: ${profileError.message}`)
  }

  await supabase.from('user_roles').delete().eq('user_id', userId)

  const { error: assignmentError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleRecord.id,
    })

  if (assignmentError) {
    await deleteDisposableRoleUser(userId).catch(() => null)
    throw new Error(`Failed to assign disposable ${normalizedRole} role: ${assignmentError.message}`)
  }

  return {
    id: userId,
    email,
    password,
    roleSlug: normalizedRole,
    fullName,
    roleRecord,
  }
}

async function deleteDisposableRoleUser(userId) {
  if (!userId) return

  const supabase = createSupabaseAdminClient()
  await supabase.from('user_roles').delete().eq('user_id', userId)
  await supabase.from('form_submissions').delete().eq('user_id', userId)
  await supabase.from('profiles').delete().eq('id', userId)
  await supabase.auth.admin.deleteUser(userId)
}

async function signInDisposableRoleUser(user) {
  const authClient = createPublicAuthClient()
  const { data, error } = await authClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (error || !data?.session?.access_token) {
    throw new Error(error?.message || `Failed to sign in disposable ${user.roleSlug} user.`)
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    session: data.session,
    user: data.user,
  }
}

async function createRoleSession(roleSlug, options = {}) {
  const user = await createDisposableRoleUser(roleSlug, options)
  try {
    const auth = await signInDisposableRoleUser(user)
    return {
      ...user,
      ...auth,
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    }
  } catch (error) {
    await deleteDisposableRoleUser(user.id).catch(() => null)
    throw error
  }
}

async function probeAuthUserProvisioning() {
  assertDestructiveCmsTestsAllowed()

  const supabase = createSupabaseAdminClient()
  const email = `${createScopedCmsValue('auth-probe')}@example.com`
  const password = `Aca!${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  const result = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'RBAC Provisioning Probe',
    },
  })

  if (result.error || !result.data?.user?.id) {
    return {
      ok: false,
      reason: result.error?.message || 'Auth user provisioning failed for disposable RBAC test accounts.',
      errorName: result.error?.name || null,
      errorStatus: result.error?.status || null,
    }
  }

  await deleteDisposableRoleUser(result.data.user.id).catch(() => null)
  return { ok: true, reason: '' }
}

module.exports = {
  createDisposableRoleUser,
  createRoleSession,
  deleteDisposableRoleUser,
  ensureRoleRecord,
  probeAuthUserProvisioning,
  ROLE_PERMISSIONS,
}
