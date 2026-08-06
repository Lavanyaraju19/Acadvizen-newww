import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody, logAuditEvent } from '../../_utils'
import { wouldCreateTemplateCycle } from '../../../../../lib/templateResolver'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { response } = await requireAdminContext(request, { resource: 'templates', action: 'read' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const { data, error } = await supabase.from('page_templates').select('*').eq('id', id).maybeSingle()
  if (error) return jsonError(`Failed to load template: ${error.message}`, 500)
  if (!data) return jsonError('Template not found.', 404)
  return jsonOk(data)
}

export async function PATCH(request, { params }) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'update' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const { data: existing, error: existingError } = await supabase.from('page_templates').select('*').eq('id', id).maybeSingle()
  if (existingError) return jsonError(`Failed to load template: ${existingError.message}`, 500)
  if (!existing) return jsonError('Template not found.', 404)

  const update = {}
  if (body.name !== undefined) update.name = String(body.name).trim()
  if (body.description !== undefined) update.description = body.description || null
  if (body.template_type !== undefined) update.template_type = body.template_type
  if (body.is_default !== undefined) update.is_default = Boolean(body.is_default)
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active)

  if ('parent_template_id' in body) {
    const nextParent = body.parent_template_id || null
    if (await wouldCreateTemplateCycle(supabase, id, nextParent)) {
      return jsonError('Cannot set a parent template that would create a circular inheritance chain.', 400)
    }
    update.parent_template_id = nextParent
  }

  let bumpedVersion = existing.version
  const contentChanged = body.template_data !== undefined && JSON.stringify(body.template_data) !== JSON.stringify(existing.template_data)
  if (contentChanged) {
    update.template_data = body.template_data
    bumpedVersion = (existing.version || 1) + 1
    update.version = bumpedVersion
  }

  if (!Object.keys(update).length) return jsonError('Nothing to update.', 400)
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('page_templates').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update template: ${error.message}`, 500)

  if (contentChanged) {
    await supabase.from('page_template_versions').insert({
      template_id: id,
      version_number: bumpedVersion,
      template_data: data.template_data,
      name: data.name,
      description: data.description,
      created_by: context.user.id,
    })
  }

  await logAuditEvent(supabase, { userId: context.user.id, action: 'update', entityType: 'page_templates', entityId: id, changes: update, request })

  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'delete' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const { data: existing } = await supabase.from('page_templates').select('id, name').eq('id', id).maybeSingle()

  // Child templates (parent_template_id = id) fall back to standalone via ON DELETE SET NULL;
  // version history (page_template_versions) is cascade-deleted with the template.
  const { error } = await supabase.from('page_templates').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete template: ${error.message}`, 500)

  await logAuditEvent(supabase, { userId: context.user.id, action: 'delete', entityType: 'page_templates', entityId: id, changes: { deleted_name: existing?.name || null }, request })

  return jsonOk({ id, deleted: true })
}
