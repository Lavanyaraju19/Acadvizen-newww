import { getEntityConfig, sanitizeEntityPayload } from '../../../../../lib/cmsEntities'
import {
  ensureAdmin,
  requireAdminContext,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  logAuditEvent,
  revalidateCmsMutation,
  readJsonBody,
} from '../../_utils'
import { hasProfilePermission } from '../../../../../lib/adminPermissions'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  buildPublishFields,
  getCanonicalPath,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
  normalizeCmsStatus,
} from '../../../../../lib/cmsPublishing'
import { createSlugRedirectRecord } from '../../../../../lib/redirects'

export const dynamic = 'force-dynamic'

const config = getEntityConfig('blogs')

export async function GET(request, { params }) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const { data, error } = await supabase.from('blogs').select('*').eq('id', id).maybeSingle()
    if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
    if (!data) return jsonError('Blog not found.', 404)
    return jsonOk(data)
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500, [])
  }
}

export async function PATCH(request, { params }) {
  try {
    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

    const { data: existingRecord, error: existingError } = await supabase
      .from('blogs').select('*').eq('id', id).maybeSingle()
    if (existingError) return jsonError(`Failed to load record: ${existingError.message}`, 500)
    if (!existingRecord) return jsonError('Record not found.', 404)

    const canEditAnyBlog = hasProfilePermission(adminContext.profile, 'blogs', 'publish')
    if (!canEditAnyBlog && existingRecord.created_by && existingRecord.created_by !== adminContext.user.id) {
      return jsonError('This account can only edit its own drafts.', 403)
    }

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (normalizeCmsStatus(payload.status) === 'published' && !canEditAnyBlog) {
      return jsonError('This account does not have permission to publish blogs.', 403)
    }

    if (payload.slug) {
      const nextSlug = normalizeCmsSlug(payload.slug)
      try {
        await assertSlugAvailable(supabase, {
          table: 'blogs', slug: nextSlug, slugField: 'slug', currentId: id, contentType: 'blog',
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload.slug = nextSlug
    }

    if ('status' in payload) {
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload.status),
        existing: existingRecord,
        requestedPublishedAt: body.published_at,
      }))
    }

    const { data, error } = await supabase.from('blogs').update(payload).eq('id', id).select('*').single()
    if (error) return jsonError(`Failed to update blog: ${error.message}`, 500)

    // Snapshot the post-edit state into blog_versions on every save, same as the pages route -
    // see app/api/cms/pages/[id]/route.js for why this needs to be automatic rather than
    // relying on something explicitly POSTing to /versions.
    const { error: versionError } = await supabase.rpc('create_blog_version', {
      p_blog_id: id,
      p_title: data.title,
      p_content: { content: data.content ?? null, content_json: data.content_json ?? null },
      p_excerpt: data.excerpt ?? data.description ?? null,
      p_seo_title: data.seo_title,
      p_seo_description: data.seo_description,
      p_status: data.status,
      p_notes: null,
      p_change_summary: 'Saved from editor',
    })
    if (versionError) console.error('[cms] Failed to snapshot blog version', versionError)
    await logAuditEvent(supabase, { userId: adminContext.user.id, action: 'update', entityType: 'blogs', entityId: id, changes: payload, request })

    const previousSlug = existingRecord?.slug || ''
    const currentSlug = data?.slug || ''
    let warning = null
    if (previousSlug && currentSlug && previousSlug !== currentSlug) {
      try {
        await createSlugRedirectRecord(supabase, {
          fromPath: `/blog/${previousSlug}`, toPath: `/blog/${currentSlug}`, statusCode: 301,
        })
      } catch (redirectError) {
        warning = `Blog updated, but slug redirect could not be created: ${redirectError.message}`
      }
    }

    const revalidation = revalidateCmsMutation('blog', { slug: currentSlug, previousSlug })
    const responseData = currentSlug
      ? { ...data, canonical_public_url: getCanonicalPublicUrl('blog', currentSlug) }
      : data
    if (!revalidation.ok) {
      return jsonError('Blog updated, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication: buildCmsMutationMeta('blog', responseData, revalidation), ...(warning ? { warning } : {}) })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized
    const { id } = await params
    if (!id) return jsonError('Record id is required.', 400)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response
    const { data: existingRecord } = await supabase.from('blogs').select('*').eq('id', id).maybeSingle()
    if (existingRecord && existingRecord.created_by && existingRecord.created_by !== adminContext.user.id && !hasProfilePermission(adminContext.profile, 'blogs', 'publish')) {
      return jsonError('This account can only delete its own drafts.', 403)
    }
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (error) return jsonError(`Failed to delete blog: ${error.message}`, 500)
    await logAuditEvent(supabase, { userId: adminContext.user.id, action: 'delete', entityType: 'blogs', entityId: id, changes: { deleted_slug: existingRecord?.slug || null }, request })
    const revalidation = revalidateCmsMutation('blog', { previousSlug: existingRecord?.slug || '' })
    if (!revalidation.ok) {
      return jsonError('Blog deleted, but cache revalidation failed. Please retry.', 500, { id, deleted: true })
    }
    return jsonOk({ id, deleted: true }, { revalidation })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
