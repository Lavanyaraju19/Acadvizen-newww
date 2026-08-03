import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../../../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id, versionId } = params

  // Get the version to restore
  const { data: version, error: versionError } = await supabase
    .from('page_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (versionError || !version) {
    return jsonError('Version not found', 404)
  }

  // Update the page with version data
  // Note: page_versions stores the snapshot under `content_json`, but the pages
  // table's own jsonb content column is named `content`.
  const { data: page, error: updateError } = await supabase
    .from('pages')
    .update({
      content: version.content_json,
      seo_title: version.seo_title,
      seo_description: version.seo_description,
      status: version.status,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) return jsonError(`Failed to restore version: ${updateError.message}`, 500)
  
  revalidateAllCmsPages()
  return jsonOk({ restored: true, page })
}