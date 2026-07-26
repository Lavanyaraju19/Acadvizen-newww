import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
} from '../../../../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id, versionId } = params

  // Get the version to restore
  const { data: version, error: versionError } = await supabase
    .from('blog_versions')
    .select('*')
    .eq('id', versionId)
    .eq('blog_id', id)
    .single()

  if (versionError || !version) {
    return jsonError('Version not found', 404)
  }

  // Restore the blog to this version
  const { data: restoredBlog, error: restoreError } = await supabase
    .from('blogs')
    .update({
      title: version.title,
      slug: version.slug,
      content: version.content,
      excerpt: version.excerpt,
      featured_image: version.featured_image,
      category_id: version.category_id,
      author_id: version.author_id,
      tags: version.tags,
      meta_title: version.meta_title,
      meta_description: version.meta_description,
      status: version.status,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (restoreError) {
    return jsonError(`Failed to restore blog version: ${restoreError.message}`, 500)
  }

  revalidateAllCmsPages()
  return jsonOk({
    success: true,
    blog: restoredBlog,
    message: 'Blog restored to version successfully'
  })
}