import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
} from '../_utils'
import {
  assertSlugAvailable,
  buildCmsMutationMeta,
  normalizeCmsSlug,
} from '../../../../lib/cmsPublishing'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await request.json()
  const { type, id } = body

  if (!type || !id) {
    return jsonError('type and id are required', 400)
  }

  try {
    let table = ''
    let newSlug = ''

    switch (type) {
      case 'page':
        table = 'pages'
        break
      case 'city':
        table = 'city_pages'
        break
      case 'blog':
        table = 'blogs'
        break
      case 'course':
        table = 'courses'
        break
      default:
        return jsonError('Invalid type', 400)
    }

    // Get original item
    const { data: original } = await supabase.from(table).select('*').eq('id', id).single()
    if (!original) throw new Error('Original item not found')

    // Generate new slug
    newSlug = normalizeCmsSlug(`${original.slug || original.title || original.name}-copy`)
    
    // Check if slug exists, if so add timestamp
    try {
      await assertSlugAvailable(supabase, {
        table,
        slug: newSlug,
        contentType: type,
      })
    } catch (error) {
      if (error.status !== 409) throw error
      newSlug = normalizeCmsSlug(`${original.slug || original.title || original.name}-copy-${Date.now()}`)
      await assertSlugAvailable(supabase, {
        table,
        slug: newSlug,
        contentType: type,
      })
    }

    // Remove id and create new record
    const { id: originalId, created_at, updated_at, ...itemData } = original
    itemData.slug = newSlug
    itemData.status = 'draft'
    itemData.title = `${itemData.title || itemData.name} (Copy)`

    const { data: newItem, error } = await supabase.from(table).insert(itemData).select('*').single()
    if (error) throw error

    // Pages store their content in a separate `sections` table keyed by page_id - copying
    // only the `pages` row (as this route did before) produced a "duplicate" with zero
    // sections. Clone every section row the same way the section-level duplicate action does
    // (app/api/cms/sections/route.js), just re-pointed at the new page.
    if (type === 'page') {
      const { data: sourceSections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('page_id', originalId)
        .order('order_index', { ascending: true })
      if (sectionsError) throw sectionsError

      if (sourceSections?.length) {
        const clonedSections = sourceSections.map((section) => ({
          page_id: newItem.id,
          type: section.type,
          order_index: section.order_index,
          content_json: section.content_json || {},
          style_json: section.style_json || {},
          visibility: section.visibility !== false,
        }))
        const { error: insertSectionsError } = await supabase.from('sections').insert(clonedSections)
        if (insertSectionsError) throw insertSectionsError
      }
    }

    const contentType = type === 'city' ? 'city_page' : type
    const revalidation = revalidateCmsMutation(contentType, { slug: newItem?.slug })
    return jsonOk(newItem, { publication: buildCmsMutationMeta(contentType, newItem, revalidation) })
  } catch (error) {
    return jsonError(`Duplication failed: ${error.message}`, error.status || 500)
  }
}
