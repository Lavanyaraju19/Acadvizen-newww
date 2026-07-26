import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../_utils'
import { getEntityConfig } from '../../../../lib/cmsEntities'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const unauthorized = await ensureAdmin(request)
    if (unauthorized) return unauthorized

    const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
    if (response) return response

    const body = await readJsonBody(request)
    const { entity, action, ids, status, data } = body || {}

    if (!entity || !action) {
      return jsonError('Missing required fields: entity, action', 400)
    }

    const config = getEntityConfig(entity)
    if (!config) {
      return jsonError(`Unknown entity: ${entity}`, 404)
    }

    const validIds = Array.isArray(ids) ? ids.filter(Boolean) : []
    if (validIds.length === 0) {
      return jsonError('No valid IDs provided', 400)
    }

    switch (action) {
      case 'publish': {
        if (config.statusField) {
          const { data: result, error } = await supabase
            .from(config.table)
            .update({ [config.statusField]: 'published' })
            .in('id', validIds)
            .select('id')
          if (error) return jsonError(`Bulk publish failed: ${error.message}`, 500)
          revalidateAllCmsPages()
          return jsonOk({ affected: result?.length || 0, action: 'published' })
        }
        if (config.visibilityField) {
          const { data: result, error } = await supabase
            .from(config.table)
            .update({ [config.visibilityField]: true })
            .in('id', validIds)
            .select('id')
          if (error) return jsonError(`Bulk publish failed: ${error.message}`, 500)
          revalidateAllCmsPages()
          return jsonOk({ affected: result?.length || 0, action: 'published' })
        }
        return jsonError(`Entity ${entity} does not support publish/unpublish`, 400)
      }

      case 'unpublish':
      case 'draft': {
        if (config.statusField) {
          const { data: result, error } = await supabase
            .from(config.table)
            .update({ [config.statusField]: 'draft' })
            .in('id', validIds)
            .select('id')
          if (error) return jsonError(`Bulk ${action} failed: ${error.message}`, 500)
          revalidateAllCmsPages()
          return jsonOk({ affected: result?.length || 0, action })
        }
        if (config.visibilityField) {
          const { data: result, error } = await supabase
            .from(config.table)
            .update({ [config.visibilityField]: false })
            .in('id', validIds)
            .select('id')
          if (error) return jsonError(`Bulk ${action} failed: ${error.message}`, 500)
          revalidateAllCmsPages()
          return jsonOk({ affected: result?.length || 0, action })
        }
        return jsonError(`Entity ${entity} does not support publish/unpublish`, 400)
      }

      case 'delete': {
        const { data: result, error } = await supabase
          .from(config.table)
          .delete()
          .in('id', validIds)
          .select('id')
        if (error) return jsonError(`Bulk delete failed: ${error.message}`, 500)
        revalidateAllCmsPages()
        return jsonOk({ affected: result?.length || 0, action: 'deleted' })
      }

      case 'duplicate': {
        const { data: sources, error: fetchError } = await supabase
          .from(config.table)
          .select('*')
          .in('id', validIds)
        if (fetchError) return jsonError(`Failed to fetch source records: ${fetchError.message}`, 500)

        const results = []
        for (const source of sources || []) {
          const duplicate = { ...source, id: undefined }
          delete duplicate.id
          delete duplicate.created_at
          delete duplicate.updated_at

          if (config.slugField && duplicate[config.slugField]) {
            duplicate[config.slugField] = `${duplicate[config.slugField]}-copy-${Date.now()}`
          }
          if (duplicate.name) duplicate.name = `${duplicate.name} Copy`
          if (duplicate.title) duplicate.title = `${duplicate.title} Copy`
          if (config.statusField) duplicate[config.statusField] = 'draft'

          const { data: newRecord, error: insertError } = await supabase
            .from(config.table)
            .insert(duplicate)
            .select('id')
            .single()
          if (!insertError && newRecord) results.push(newRecord)
        }

        revalidateAllCmsPages()
        return jsonOk({ affected: results.length, action: 'duplicated' })
      }

      case 'update': {
        if (!data || typeof data !== 'object') {
          return jsonError('Missing data for bulk update', 400)
        }
        const { data: result, error } = await supabase
          .from(config.table)
          .update(data)
          .in('id', validIds)
          .select('id')
        if (error) return jsonError(`Bulk update failed: ${error.message}`, 500)
        revalidateAllCmsPages()
        return jsonOk({ affected: result?.length || 0, action: 'updated' })
      }

      default:
        return jsonError(`Unknown bulk action: ${action}. Supported: publish, unpublish, draft, delete, duplicate, update`, 400)
    }
  } catch (error) {
    return jsonError(`Bulk operation failed: ${error.message}`, 500)
  }
}
