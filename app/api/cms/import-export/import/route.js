import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
} from '../../_utils'
import { assertSlugAvailable, getCanonicalPath, normalizeCmsSlug } from '../../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

// Maps an import `type` to the CMS content type revalidateCmsMutation understands, and to
// the column that holds its slug. Bulk-imported rows used to skip the same slug-uniqueness
// check and cache revalidation every other publish path enforces - importing a page whose
// slug collided with an existing one silently inserted a second, unreachable row, and
// importing already-published content never told Next.js anything had changed.
const CONTENT_TYPE_BY_IMPORT_TYPE = {
  pages: { contentType: 'page', slugField: 'slug' },
  cities: { contentType: 'city_page', slugField: 'slug' },
  blogs: { contentType: 'blog', slugField: 'slug' },
  courses: { contentType: 'course', slugField: 'slug' },
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  const { type, format, data } = body

  if (!type || !data || !Array.isArray(data)) {
    return jsonError('Invalid request', 400)
  }

  let table = ''
  let errors = []
  let success = 0
  let failed = 0

  switch (type) {
    case 'pages':
      table = 'pages'
      break
    case 'cities':
      table = 'city_pages'
      break
    case 'blogs':
      table = 'blogs'
      break
    case 'courses':
      table = 'courses'
      break
    case 'forms':
      table = 'forms'
      break
    case 'menus':
      table = 'menus'
      break
    case 'leads':
      table = 'leads'
      break
    case 'users':
      table = 'profiles'
      break
    case 'settings':
      // Settings import is special - update single row
      try {
        const { error } = await supabase.from('global_settings').update(data[0]).eq('id', data[0].id)
        if (error) throw error
        return jsonOk({ success: 1, failed: 0, errors: [] })
      } catch (error) {
        return jsonError(`Settings import failed: ${error.message}`, 200)
      }
    default:
      return jsonError('Invalid type', 400)
  }

  const contentTypeInfo = CONTENT_TYPE_BY_IMPORT_TYPE[type] || null
  const importedSlugs = []

  // Import data
  for (const item of data) {
    try {
      // Validate required fields based on type
      if (type === 'pages' && !item.slug) throw new Error('Missing slug')
      if (type === 'blogs' && !item.slug) throw new Error('Missing slug')
      if (type === 'courses' && !item.slug) throw new Error('Missing slug')
      if (type === 'forms' && !item.name) throw new Error('Missing name')
      if (type === 'menus' && !item.title) throw new Error('Missing title')

      // Remove id to create new records
      const { id, ...itemData } = item

      if (contentTypeInfo) {
        const normalizedSlug = normalizeCmsSlug(itemData[contentTypeInfo.slugField])
        // Every other CMS write path (create/update through the admin UI) rejects a
        // duplicate slug before insert instead of letting Postgres throw a raw constraint
        // error (or, if there's no unique constraint, silently create an unreachable
        // second row) - imports must go through the same check.
        await assertSlugAvailable(supabase, {
          table,
          slug: normalizedSlug,
          slugField: contentTypeInfo.slugField,
          contentType: contentTypeInfo.contentType,
        })
        itemData[contentTypeInfo.slugField] = normalizedSlug
        importedSlugs.push(normalizedSlug)
      }

      const { error } = await supabase.from(table).insert(itemData)
      if (error) throw error
      success++
    } catch (error) {
      failed++
      errors.push(error.message)
    }
  }

  let revalidation = null
  if (contentTypeInfo && importedSlugs.length) {
    // One combined revalidation covering every imported slug plus the content type's list
    // pages (e.g. /blog, /courses, /sitemap.xml) - matches how a normal create/publish
    // revalidates, just batched instead of firing once per row.
    revalidation = revalidateCmsMutation(contentTypeInfo.contentType, {
      extraPaths: importedSlugs.map((slug) => getCanonicalPath(contentTypeInfo.contentType, slug)),
    })
  }

  return jsonOk({ success, failed, errors, ...(revalidation ? { revalidation } : {}) })
}