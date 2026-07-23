import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { data, error } = await supabase
    .from('page_versions')
    .select('*')
    .eq('page_id', id)
    .order('version_number', { ascending: false })
    .limit(50)

  if (error) return jsonError(`Failed to fetch versions: ${error.message}`, 200, [])
  return jsonOk(data || [])
}

export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = params

  // First get current page data
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (!page) {
    return jsonError('Page not found', 404)
  }

  // Create version using the function
  const { data: version, error } = await supabase
    .rpc('create_page_version', {
      p_page_id: id,
      p_content_json: page.content_json,
      p_seo_title: page.seo_title,
      p_seo_description: page.seo_description,
      p_status: page.status,
      p_notes: body.notes || null,
      p_change_summary: body.change_summary || 'Manual save'
    })

  if (error) return jsonError(`Failed to create version: ${error.message}`, 200)
  return jsonOk({ id: version, version_number: body.version_number })
}