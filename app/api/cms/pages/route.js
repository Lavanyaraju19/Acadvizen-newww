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
import { createSlugRedirectRecord } from '../../../../lib/redirects'

export const dynamic = 'force-dynamic'

const ENTITY = 'pages'
const config = getEntityConfig(ENTITY)
const OPTIONAL_PAGE_COLUMNS = new Set([
  'canonical_url',
  'og_image',
  'noindex',
  'content',
  'sections_json',
  'page_template_id',
  'parent_id',
  'order_index',
  'is_active',
  'is_published',
  'published_at',
  'scheduled_publish_at',
  'scheduled_unpublish_at',
])

function getMissingPageColumn(error) {
  const message = String(error?.message || '')
  const quotedMatch = message.match(/'([^']+)' column/i)
  if (quotedMatch?.[1]) return quotedMatch[1]
  const dottedMatch = message.match(/pages\.([a-zA-Z0-9_]+)/)
  if (dottedMatch?.[1]) return dottedMatch[1]
  return ''
}

async function savePageRecord(supabase, payload) {
  let nextPayload = { ...payload }
  const strippedColumns = []

  while (true) {
    const result = await supabase
      .from('pages')
      .upsert(nextPayload, { onConflict: 'id' })
      .select('*')
      .single()

    if (!result.error) {
      return { ...result, strippedColumns }
    }

    const missingColumn = getMissingPageColumn(result.error)
    if (!missingColumn || !OPTIONAL_PAGE_COLUMNS.has(missingColumn) || !(missingColumn in nextPayload)) {
      return { ...result, strippedColumns }
    }

    strippedColumns.push(missingColumn)
    const { [missingColumn]: _removed, ...remainingPayload } = nextPayload
    nextPayload = remainingPayload
  }
}

async function attachSections(supabase, pages = []) {
  const pageIds = pages.map((page) => page?.id).filter(Boolean)
  if (!pageIds.length) return pages.map((page) => ({ ...page, sections: [] }))

  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .in('page_id', pageIds)
    .order('order_index', { ascending: true })

  if (error) throw new Error(`Sections query failed: ${error.message}`)

  const grouped = (data || []).reduce((acc, section) => {
    if (!acc[section.page_id]) acc[section.page_id] = []
    acc[section.page_id].push(section)
    return acc
  }, {})

  return pages.map((page) => ({ ...page, sections: grouped[page.id] || [] }))
}

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
    const includeSections = searchParams.get('include_sections') === '1'

    let query = supabase.from('pages').select('*').limit(limit || 250).order('updated_at', { ascending: false })
    if (slug) query = query.eq('slug', normalizeCmsSlug(slug))
    if (status && isAdmin) query = query.eq('status', normalizeCmsStatus(status))
    if (!isAdmin) query = query.eq('status', 'published')

    const { data, error } = await query
    if (error) return jsonError(`Database query failed: ${error.message}`, 500, [])
    if (!includeSections) return jsonOk(data || [])
    try {
      return jsonOk(await attachSections(supabase, data || []))
    } catch (sectionsError) {
      return jsonError(sectionsError.message, 500, data || [])
    }
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

    const validation = validateEntity('pages', body)
    if (!validation.valid) return jsonError(validation.errors.join('; '), 400)

    const payload = sanitizeEntityPayload(body, config)
    if (!Object.keys(payload).length) return jsonError('No writable fields provided.', 400)

    if (!body.id && adminContext?.user?.id) {
      payload.created_by = adminContext.user.id
    }

    if (normalizeCmsStatus(payload.status) === 'published' && !hasProfilePermission(adminContext.profile, 'pages', 'publish')) {
      return jsonError('This account does not have permission to publish pages.', 403)
    }

    let existingRecord = null
    if (body.id) {
      const { data: existing, error: existingError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', body.id)
        .maybeSingle()
      if (existingError) return jsonError(`Failed to load existing page: ${existingError.message}`, 500)
      existingRecord = existing || null
    }

    if (payload.slug || (!body.id && body.title)) {
      const nextSlug = normalizeCmsSlug(payload.slug || body.title)
      try {
        await assertSlugAvailable(supabase, {
          table: 'pages',
          slug: nextSlug,
          slugField: 'slug',
          currentId: body.id || '',
          contentType: 'page',
        })
      } catch (error) {
        return jsonError(error.message, error.status || 500)
      }
      payload.slug = nextSlug
    }

    if ('status' in payload) {
      Object.assign(payload, buildPublishFields({
        nextStatus: normalizeCmsStatus(payload.status),
        existing: existingRecord || {},
        requestedPublishedAt: body.published_at,
      }))
    }

    const upsertPayload = { ...payload, id: body.id || undefined }
    const { data, error, strippedColumns } = await savePageRecord(supabase, upsertPayload)
    if (error) return jsonError(`Failed to save page: ${error.message}`, 500)

    const previousSlug = existingRecord?.slug || ''
    const slugValue = data?.slug || ''
    let warning = null
    if (previousSlug && slugValue && previousSlug !== slugValue) {
      try {
        await createSlugRedirectRecord(supabase, {
          fromPath: `/${previousSlug}`,
          toPath: `/${slugValue}`,
          statusCode: 301,
        })
      } catch (redirectError) {
        warning = `Page saved, but slug redirect could not be created: ${redirectError.message}`
      }
    }

    const revalidation = revalidateCmsMutation('page', { slug: slugValue, previousSlug })
    const responseData = slugValue ? { ...data, canonical_public_url: getCanonicalPublicUrl('page', slugValue) } : data
    if (!revalidation.ok) {
      return jsonError('Page saved, but cache revalidation failed. Please retry publishing.', 500, responseData)
    }
    return jsonOk(responseData, {
      publication: buildCmsMutationMeta('page', responseData, revalidation),
      ...(strippedColumns?.length ? { schema_compatibility: { stripped_optional_columns: strippedColumns } } : {}),
      ...(warning ? { warning } : {}),
    })
  } catch (error) {
    return jsonError(`Internal server error: ${error.message}`, 500)
  }
}
