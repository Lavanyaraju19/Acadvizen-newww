import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk, logAuditEvent } from '../../../../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'update' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id, versionId } = await params

  const { data: version, error: versionError } = await supabase
    .from('page_template_versions')
    .select('*')
    .eq('id', versionId)
    .eq('template_id', id)
    .maybeSingle()
  if (versionError) return jsonError(`Failed to load version: ${versionError.message}`, 500)
  if (!version) return jsonError('Version not found.', 404)

  const { data: existing, error: existingError } = await supabase.from('page_templates').select('version').eq('id', id).maybeSingle()
  if (existingError) return jsonError(`Failed to load template: ${existingError.message}`, 500)
  if (!existing) return jsonError('Template not found.', 404)

  // Restoring is itself a new version going forward, not a rewind - keeps version history
  // strictly append-only and matches the restore semantics used for pages/blogs.
  const nextVersion = (existing.version || 1) + 1

  const { data, error } = await supabase
    .from('page_templates')
    .update({
      template_data: version.template_data,
      name: version.name || undefined,
      description: version.description,
      version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) return jsonError(`Failed to restore version: ${error.message}`, 500)

  await supabase.from('page_template_versions').insert({
    template_id: id,
    version_number: nextVersion,
    template_data: data.template_data,
    name: data.name,
    description: data.description,
    created_by: context.user.id,
  })

  await logAuditEvent(supabase, { userId: context.user.id, action: 'restore_version', entityType: 'page_templates', entityId: id, changes: { restored_from_version: version.version_number }, request })

  return jsonOk(data)
}
