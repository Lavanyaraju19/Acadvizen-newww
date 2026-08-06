import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
} from '../../../../_utils'

export const dynamic = 'force-dynamic'

// Restoring is append-only, not time travel: it overwrites the live menu with the snapshot's
// rows, removes any row created after the snapshot was taken, and then records the
// post-restore state as a brand new version - the same "restore = new version going forward"
// pattern already used for page/blog/template version history.
export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Version id is required.', 400)

  const { data: version, error: versionError } = await supabase
    .from('menu_versions')
    .select('*')
    .eq('id', id)
    .single()
  if (versionError || !version) return jsonError('Menu version not found.', 404)

  const snapshotRows = Array.isArray(version.snapshot) ? version.snapshot : []
  const snapshotIds = new Set(snapshotRows.map((row) => row.id))

  const { data: currentRows, error: currentError } = await supabase
    .from('menus')
    .select('id')
    .eq('menu_location', version.menu_location)
  if (currentError) return jsonError(`Failed to load current menu: ${currentError.message}`, 500)

  const idsToDelete = (currentRows || [])
    .map((row) => row.id)
    .filter((rowId) => !snapshotIds.has(rowId))

  if (idsToDelete.length) {
    const { error: deleteError } = await supabase.from('menus').delete().in('id', idsToDelete)
    if (deleteError) return jsonError(`Failed to restore menu: ${deleteError.message}`, 500)
  }

  if (snapshotRows.length) {
    const restorePayload = snapshotRows.map(({ created_at, updated_at, ...row }) => row)
    const { error: upsertError } = await supabase.from('menus').upsert(restorePayload, { onConflict: 'id' })
    if (upsertError) return jsonError(`Failed to restore menu: ${upsertError.message}`, 500)
  }

  const { data: restoredRows, error: restoredError } = await supabase
    .from('menus')
    .select('*')
    .eq('menu_location', version.menu_location)
    .order('order_index', { ascending: true })
  if (restoredError) return jsonError(`Restore applied, but failed to reload menu: ${restoredError.message}`, 500)

  await supabase.from('menu_versions').insert({
    menu_location: version.menu_location,
    snapshot: restoredRows || [],
    label: `Restored from ${new Date(version.created_at).toLocaleString()}`,
  })

  revalidateAllCmsPages()
  return jsonOk({ menu_location: version.menu_location, restored_count: restoredRows?.length || 0 })
}
