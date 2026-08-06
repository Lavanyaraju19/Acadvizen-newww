import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

async function wouldCreateCycle(supabase, folderId, newParentId) {
  if (!newParentId) return false
  if (newParentId === folderId) return true
  let cursor = newParentId
  const seen = new Set()
  while (cursor) {
    if (cursor === folderId) return true
    if (seen.has(cursor)) return true
    seen.add(cursor)
    const { data } = await supabase.from('media_folders').select('parent_id').eq('id', cursor).maybeSingle()
    cursor = data?.parent_id || null
  }
  return false
}

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'update' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Folder id is required.', 400)

  const body = await readJsonBody(request)
  const update = {}

  if ('name' in (body || {})) {
    const name = String(body.name || '').trim()
    if (!name) return jsonError('Folder name cannot be empty.', 400)
    update.name = name
  }

  if ('parent_id' in (body || {})) {
    const nextParent = body.parent_id || null
    if (await wouldCreateCycle(supabase, id, nextParent)) {
      return jsonError('Cannot move a folder into itself or one of its own subfolders.', 400)
    }
    update.parent_id = nextParent
  }

  if (!Object.keys(update).length) return jsonError('Nothing to update.', 400)
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('media_folders')
    .update(update)
    .eq('id', id)
    .select('id, name, parent_id, created_at')
    .single()

  if (error) {
    if (String(error.code) === '23505') {
      return jsonError('A folder with that name already exists in this location.', 409)
    }
    return jsonError(`Failed to update folder: ${error.message}`, 500)
  }
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'media', action: 'delete' })
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Folder id is required.', 400)

  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === '1'

  if (!force) {
    const [{ count: mediaCount }, { count: childCount }] = await Promise.all([
      supabase.from('media').select('id', { count: 'exact', head: true }).eq('folder_id', id),
      supabase.from('media_folders').select('id', { count: 'exact', head: true }).eq('parent_id', id),
    ])
    if ((mediaCount || 0) > 0 || (childCount || 0) > 0) {
      return jsonError(
        `This folder contains ${mediaCount || 0} file(s) and ${childCount || 0} subfolder(s). Files will be moved to "All Files" and subfolders deleted. Delete again to confirm.`,
        409,
        { mediaCount: mediaCount || 0, childCount: childCount || 0 }
      )
    }
  }

  // media.folder_id has ON DELETE SET NULL, so contained files are unfoldered, never deleted.
  // media_folders.parent_id has ON DELETE CASCADE, so subfolders (and their own contents,
  // recursively) are cleaned up the same way.
  const { error } = await supabase.from('media_folders').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete folder: ${error.message}`, 500)
  return jsonOk({ id, deleted: true })
}
