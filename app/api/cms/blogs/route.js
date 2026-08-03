import { NextResponse } from 'next/server'
import { getEntityConfig, sanitizeEntityPayload } from '../../../../lib/cmsEntities'
import { validateEntity } from '../../../../lib/validation'
import {
  requireAdminContext,
  getSupabaseClientOrResponse,
  getOptionalAdminContext,
  jsonError,
  jsonOk,
  parsePositiveInt,
  revalidateCmsMutation,
  readJsonBody,
} from '../_utils'
import { hasProfilePermission } from '../../../../lib/adminPermissions'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  buildPublishFields,
  getCanonicalPublicUrl,
  normalizeCmsSlug,
  normalizeCmsStatus,
} from '../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

const ENTITY = 'blogs'
const config = getEntityConfig(ENTITY)

export async function GET(request) {
  try {
    const adminAccess = await getOptionalAdminContext(request)
    if (adminAccess.response) return adminAccess.response
    const isAdmin = Boolean(adminAccess.context)
    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: isAdmin })
    if (response) return response

    const { searchParams } = new URL(request.url)
    const limit = parsePositiveInt(searchParams.get('limit'), 250)
    const slug = searchParams.get('slug')
    const status = searchParams.get('status')

    let query = supabase.from('blogs').select('*').limit(limit || 250).order('published_at', { ascending: false })
    if (slug) query = query.eq('slug', normalizeCmsSlug(slug))
    if (status && isAdmin) query = query.eq('status', normalizeCmsStatus(status))
    if (!isAdmin) query = query.eq('status', 'published')

    const { data, error } = await query
    if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
    return jsonOk(data || [])
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500, [])
  }
}

export async function POST(request) {
  try {
    const { context: adminContext, response: unauthorized } = await requireAdminContext(request)
    if (unauthorized) return unauthorized

    const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    if (!body || typeof body !== 'object') return jsonError('Invalid request body.', 400)

    const validation = validateEntity('blogs', body)
    if (!validation.valid) return jsonError(validation.errors.join('; '), 400)

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (!body.id && adminContext?.user?.id) {
      payload.created_by = adminContext.user.id
    }

    if (normalizeCmsStatus(payload.status) === 'published' && !hasProfilePermission(adminContext.profile, 'blogs', 'publish')) {
      return jsonError('This account does not have permission to publish blogs.', 403)
    }

    if (payload.slug || (!body.id && body.title)) {
      const nextSlug = normalizeCmsSlug(payload.slug || body.title)
      try {
        await assertSlugAvailable(supabase, {
          table: 'blogs',
          slug: nextSlug,
          slugField: 'slug',
          currentId: body.id || '',
          contentType: 'blog',
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload.slug = nextSlug
    }

    if ('status' in payload) {
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload.status),
        existing: {},
        requestedPublishedAt: body.published_at,
      }))
    }

    const upsertPayload = { ...payload, id: body.id || undefined }
    const { data, error } = await supabase.from('blogs').upsert(upsertPayload, { onConflict: 'id' }).select('*').single()
    if (error) return jsonError(`Failed to save blog: ${error.message}`, 500)

    const slugValue = data?.slug || ''
    const revalidation = revalidateCmsMutation('blog', { slug: slugValue })
    const responseData = slugValue ? { ...data, canonical_public_url: getCanonicalPublicUrl('blog', slugValue) } : data
    if (!revalidation.ok) {
      return jsonError('Blog saved, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, { publication: buildCmsMutationMeta('blog', responseData, revalidation) })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
