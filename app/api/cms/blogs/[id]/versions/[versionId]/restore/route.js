import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateCmsMutation,
} from '../../../../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id, versionId } = params

  const { data: version, error: versionError } = await supabase
    .from('blog_versions')
    .select('*')
    .eq('id', versionId)
    .eq('blog_id', id)
    .single()

  if (versionError || !version) {
    return jsonError('Version not found', 404)
  }

  // version.content is the { content, content_json } object written by the versions POST
  // route - restore both fields back onto the live blogs row. Older rows created before that
  // shape existed may just be a raw content_json blob instead; treat that as content_json.
  const storedContent = version.content && typeof version.content === 'object' ? version.content : {}
  const hasShapedContent = 'content' in storedContent || 'content_json' in storedContent

  const { data: restoredBlog, error: restoreError } = await supabase
    .from('blogs')
    .update({
      title: version.title,
      content: hasShapedContent ? storedContent.content ?? null : null,
      content_json: hasShapedContent ? storedContent.content_json ?? null : version.content,
      excerpt: version.excerpt,
      seo_title: version.seo_title,
      seo_description: version.seo_description,
      status: version.status,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (restoreError) {
    return jsonError(`Failed to restore blog version: ${restoreError.message}`, 500)
  }

  const revalidation = revalidateCmsMutation('blog', { slug: restoredBlog?.slug || '' })
  return jsonOk({
    success: true,
    blog: restoredBlog,
    message: 'Blog restored to version successfully',
  }, { revalidation })
}
