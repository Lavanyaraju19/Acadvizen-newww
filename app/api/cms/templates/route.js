import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody, logAuditEvent } from '../_utils'
import { assertSlugAvailable, normalizeCmsSlug } from '../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'read' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').trim()
  const category = (searchParams.get('category') || '').trim()

  let query = supabase.from('page_templates').select('*').order('updated_at', { ascending: false })
  if (category) query = query.eq('template_type', category)
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return jsonError(`Failed to load templates: ${error.message}`, 500, [])
  void context
  return jsonOk(data || [])
}

export async function POST(request) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'create' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return jsonError('Template name is required.', 400)

  let slug = normalizeCmsSlug(body?.slug || name)
  try {
    await assertSlugAvailable(supabase, { table: 'page_templates', slug, contentType: 'page_template' })
  } catch (error) {
    if (error.status !== 409) return jsonError(error.message, error.status || 500)
    slug = normalizeCmsSlug(`${slug}-${Date.now()}`)
  }

  const templateData = body?.template_data && typeof body.template_data === 'object' ? body.template_data : {}

  const { data, error } = await supabase
    .from('page_templates')
    .insert({
      name,
      slug,
      description: body?.description || null,
      template_type: body?.template_type || 'landing',
      template_data: templateData,
      parent_template_id: body?.parent_template_id || null,
      is_default: Boolean(body?.is_default),
      is_active: true,
      version: 1,
      created_by: context.user.id,
    })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create template: ${error.message}`, 500)

  await supabase.from('page_template_versions').insert({
    template_id: data.id,
    version_number: 1,
    template_data: templateData,
    name: data.name,
    description: data.description,
    created_by: context.user.id,
  })

  await logAuditEvent(supabase, { userId: context.user.id, action: 'create', entityType: 'page_templates', entityId: data.id, changes: { name, template_type: data.template_type }, request })

  return jsonOk(data)
}
