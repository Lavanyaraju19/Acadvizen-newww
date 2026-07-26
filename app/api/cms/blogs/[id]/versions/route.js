import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
  revalidateAllCmsPages,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

// GET all versions for a blog
export async function GET(request, { params }) {
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { data, error } = await supabase
    .from('blog_versions')
    .select('*')
    .eq('blog_id', params.id)
    .order('created_at', { ascending: false })

  if (error) return jsonError(`Failed to fetch blog versions: ${error.message}`, 500)
  return jsonOk(data || [])
}

// POST create a new version
export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)

  // Get current blog state
  const { data: currentBlog } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!currentBlog) {
    return jsonError('Blog not found', 404)
  }

  // Create version snapshot
  const { data, error } = await supabase
    .from('blog_versions')
    .insert({
      blog_id: params.id,
      title: currentBlog.title,
      slug: currentBlog.slug,
      content: currentBlog.content,
      excerpt: currentBlog.excerpt,
      featured_image: currentBlog.featured_image,
      category_id: currentBlog.category_id,
      author_id: currentBlog.author_id,
      tags: currentBlog.tags,
      meta_title: currentBlog.meta_title,
      meta_description: currentBlog.meta_description,
      status: currentBlog.status,
      version_note: body.version_note || 'Manual save',
    })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to create blog version: ${error.message}`, 500)
  return jsonOk(data)
}