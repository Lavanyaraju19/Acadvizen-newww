import {
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
  readJsonBody,
  requireAdminContext,
} from '../../_utils'

export const dynamic = 'force-dynamic'

const ALLOWED_APPROVALS = new Set(['pending', 'approved', 'rejected'])

function normalizeRoleSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function isMissingTableError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('42p01') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  )
}

async function findRoleRecord(supabase, roleSlug) {
  if (!roleSlug) return { data: null, error: null }

  return supabase
    .from('roles')
    .select('id,name,slug,permissions')
    .or(`slug.eq.${roleSlug},name.eq.${roleSlug}`)
    .maybeSingle()
}

async function readProfileRoleSummary(supabase, userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { data: null, error: profileError }
  }

  let assignments = []
  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', userId)

  if (!userRolesError) {
    assignments = Array.isArray(userRoles) ? userRoles : []
  } else if (!isMissingTableError(userRolesError)) {
    return { data: null, error: userRolesError }
  }

  const roleSlugs = new Set()
  const directRole = normalizeRoleSlug(profile?.role)
  if (directRole) {
    roleSlugs.add(directRole)
  }

  assignments.forEach((assignment) => {
    const roles = Array.isArray(assignment?.roles) ? assignment.roles : [assignment?.roles]
    roles.forEach((role) => {
      const slug = normalizeRoleSlug(role?.slug || role?.name)
      if (slug) {
        roleSlugs.add(slug)
      }
    })
  })

  return {
    data: {
      profile,
      assignments,
      roleSlugs: Array.from(roleSlugs),
      isSuperAdmin: roleSlugs.has('super_admin'),
    },
    error: null,
  }
}

async function countActiveSuperAdmins(supabase) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id,role')

  if (error) {
    return { count: 0, error }
  }

  const profileIds = Array.isArray(profiles) ? profiles.map((profile) => profile.id).filter(Boolean) : []
  const directSuperAdmins = new Set(
    (profiles || [])
      .filter((profile) => normalizeRoleSlug(profile?.role) === 'super_admin')
      .map((profile) => profile.id)
  )

  if (!profileIds.length) {
    return { count: directSuperAdmins.size, error: null }
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      roles (
        slug,
        name
      )
    `)
    .in('user_id', profileIds)

  if (assignmentsError && !isMissingTableError(assignmentsError)) {
    return { count: 0, error: assignmentsError }
  }

  const superAdminIds = new Set(directSuperAdmins)
  ;(assignments || []).forEach((assignment) => {
    const roles = Array.isArray(assignment?.roles) ? assignment.roles : [assignment?.roles]
    roles.forEach((role) => {
      const slug = normalizeRoleSlug(role?.slug || role?.name)
      if (slug === 'super_admin' && assignment?.user_id) {
        superAdminIds.add(assignment.user_id)
      }
    })
  })

  return { count: superAdminIds.size, error: null }
}

async function ensureSuperAdminRemovalIsSafe(supabase, userId, { nextRole = null, deleting = false } = {}) {
  const { data: summary, error: summaryError } = await readProfileRoleSummary(supabase, userId)
  if (summaryError) {
    return jsonError(`Failed to verify the current user role assignments: ${summaryError.message}`, 500)
  }

  if (!summary?.profile) {
    return jsonError('User not found', 404)
  }

  const losingSuperAdmin = summary.isSuperAdmin && (deleting || normalizeRoleSlug(nextRole) !== 'super_admin')
  if (!losingSuperAdmin) {
    return null
  }

  const { count, error: countError } = await countActiveSuperAdmins(supabase)
  if (countError) {
    return jsonError(`Failed to verify Super Admin protection: ${countError.message}`, 500)
  }

  if (count <= 1) {
    return jsonError('Cannot remove, delete, or demote the last active Super Admin.', 400)
  }

  return null
}

export async function PATCH(request, { params }) {
  const { context: adminContext, response: unauthorized } = await requireAdminContext(request, { resource: 'users', action: 'update' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('User id is required.', 400)

  const body = await readJsonBody(request)
  if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

  const update = {}
  let targetRole = null

  if ('full_name' in body) update.full_name = body.full_name || null
  if ('role' in body) {
    targetRole = normalizeRoleSlug(body.role)
    if (!targetRole) return jsonError('Invalid role value.', 400)
    update.role = targetRole
  }
  if ('approval_status' in body) {
    if (!ALLOWED_APPROVALS.has(String(body.approval_status || ''))) return jsonError('Invalid approval status.', 400)
    update.approval_status = body.approval_status
  }

  if (!Object.keys(update).length) return jsonError('No valid user fields provided.', 400)

  const superAdminSafety = targetRole
    ? await ensureSuperAdminRemovalIsSafe(supabase, id, { nextRole: targetRole })
    : null
  if (superAdminSafety) return superAdminSafety

  if (targetRole) {
    const { data: roleRecord, error: roleError } = await findRoleRecord(supabase, targetRole)
    if (roleError) {
      return jsonError(`Failed to load the requested role: ${roleError.message}`, 500)
    }
    if (!roleRecord) {
      return jsonError(`The role "${targetRole}" does not exist. Create it first under Manage Roles.`, 400)
    }

    const { error: deleteAssignmentsError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', id)

    if (deleteAssignmentsError && !isMissingTableError(deleteAssignmentsError)) {
      return jsonError(`Failed to reset role assignments: ${deleteAssignmentsError.message}`, 500)
    }

    const { error: insertAssignmentError } = await supabase
      .from('user_roles')
      .insert({
        user_id: id,
        role_id: roleRecord.id,
      })

    if (insertAssignmentError && !isMissingTableError(insertAssignmentError)) {
      return jsonError(`Failed to update role assignments: ${insertAssignmentError.message}`, 500)
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('id,email,full_name,role,approval_status,student_id,created_at,updated_at')
    .single()

  if (error) return jsonError(`Failed to update user: ${error.message}`, 500)
  await logAuditEvent(supabase, { userId: adminContext.user.id, action: 'update', entityType: 'users', entityId: id, changes: update, request })
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const { context: adminContext, response: unauthorized } = await requireAdminContext(request, { resource: 'users', action: 'delete' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('User id is required.', 400)

  const superAdminSafety = await ensureSuperAdminRemovalIsSafe(supabase, id, { deleting: true })
  if (superAdminSafety) return superAdminSafety

  const { data: existingUser, error: existingUserError } = await supabase
    .from('profiles')
    .select('id,email,role')
    .eq('id', id)
    .single()

  if (existingUserError) {
    return jsonError(`Failed to load the user: ${existingUserError.message}`, 500)
  }

  if (!existingUser) {
    return jsonError('User not found', 404)
  }

  await supabase
    .from('form_submissions')
    .delete()
    .eq('user_id', id)

  const { error: deleteRoleAssignmentsError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', id)

  if (deleteRoleAssignmentsError && !isMissingTableError(deleteRoleAssignmentsError)) {
    return jsonError(`Failed to remove user role assignments: ${deleteRoleAssignmentsError.message}`, 500)
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) return jsonError(`Failed to delete user: ${error.message}`, 500)
  await logAuditEvent(supabase, {
    userId: adminContext.user.id,
    action: 'delete',
    entityType: 'users',
    entityId: id,
    changes: { deleted_email: existingUser.email },
    request,
  })

  return jsonOk({ success: true, message: 'User deleted successfully' })
}
