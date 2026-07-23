import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = params

  const { data, error } = await supabase
    .from('banners')
    .update(body)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return jsonError(`Failed to update banner: ${error.message}`, 200)
  revalidateAllCmsPages()
  return jsonOk(data)
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = params

  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete banner: ${error.message}`, 200)
  
  revalidateAllCmsPages()
  return jsonOk({ deleted: true })
}