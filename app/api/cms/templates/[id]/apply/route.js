import { requireAdminContext, getSupabaseClientOrResponse, jsonError, jsonOk, readJsonBody, logAuditEvent, revalidateCmsMutation } from '../../../_utils'
import { assertSlugAvailable, normalizeCmsSlug, getCanonicalPublicUrl } from '../../../../../../lib/cmsPublishing'
import { resolveTemplateChain } from '../../../../../../lib/templateResolver'

export const dynamic = 'force-dynamic'

// Creates a brand-new draft page pre-populated with the template's (inheritance-resolved)
// sections, the same "start from a template" flow WordPress page builders offer instead of
// starting from a blank canvas.
export async function POST(request, { params }) {
  const { context, response } = await requireAdminContext(request, { resource: 'templates', action: 'read' })
  if (response) return response

  const { supabase, response: clientResponse } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (clientResponse) return clientResponse

  const { id } = await params
  const body = await readJsonBody(request)
  const title = String(body?.title || '').trim()
  if (!title) return jsonError('Page title is required.', 400)

  const resolved = await resolveTemplateChain(supabase, id)
  if (!resolved.chain.length) return jsonError('Template not found.', 404)

  let slug = normalizeCmsSlug(body?.slug || title)
  try {
    await assertSlugAvailable(supabase, { table: 'pages', slug, slugField: 'slug', contentType: 'page' })
  } catch (error) {
    if (error.status !== 409) return jsonError(error.message, error.status || 500)
    slug = normalizeCmsSlug(`${slug}-${Date.now()}`)
  }

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .insert({
      title,
      slug,
      status: 'draft',
      page_template_id: id,
      created_by: context.user.id,
    })
    .select('*')
    .single()
  if (pageError) return jsonError(`Failed to create page from template: ${pageError.message}`, 500)

  const sections = Array.isArray(resolved.data.sections) ? resolved.data.sections : []
  if (sections.length) {
    const rows = sections.map((section, index) => ({
      page_id: page.id,
      type: section.type,
      order_index: Number.isFinite(section.order_index) ? section.order_index : index,
      content_json: section.content_json || {},
      style_json: section.style_json || {},
      visibility: section.visibility !== false,
    }))
    const { error: sectionsError } = await supabase.from('sections').insert(rows)
    if (sectionsError) return jsonError(`Page created, but sections could not be applied: ${sectionsError.message}`, 500, page)
  }

  await logAuditEvent(supabase, {
    userId: context.user.id,
    action: 'apply_template',
    entityType: 'pages',
    entityId: page.id,
    changes: { template_id: id, template_chain: resolved.chain.map((t) => t.name) },
    request,
  })

  const revalidation = revalidateCmsMutation('page', { slug })
  return jsonOk({ ...page, sections_applied: sections.length, canonical_public_url: getCanonicalPublicUrl('page', slug) }, { revalidation })
}
