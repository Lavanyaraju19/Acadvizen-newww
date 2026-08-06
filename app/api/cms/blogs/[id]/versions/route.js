import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../../_utils'

export const dynamic = 'force-dynamic'

// GET all versions for a blog
export async function GET(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { id } = await params
  const { data, error } = await supabase
    .from('blog_versions')
    .select('*')
    .eq('blog_id', id)
    .order('version_number', { ascending: false })
    .limit(50)

  if (error) return jsonError(`Failed to fetch blog versions: ${error.message}`, 500, [])
  return jsonOk(data || [])
}

// POST create a new version snapshot of the blog's current state
export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const { id } = await params

  const { data: currentBlog } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentBlog) {
    return jsonError('Blog not found', 404)
  }

  // blog_versions.content is jsonb and blogs has two content fields (`content` text for
  // the simple editor, `content_json` for the block editor) - both are folded into the one
  // jsonb column here so a restore can put both back.
  const { data: versionId, error } = await supabase.rpc('create_blog_version', {
    p_blog_id: id,
    p_title: currentBlog.title,
    p_content: { content: currentBlog.content ?? null, content_json: currentBlog.content_json ?? null },
    p_excerpt: currentBlog.excerpt ?? currentBlog.description ?? null,
    p_seo_title: currentBlog.seo_title,
    p_seo_description: currentBlog.seo_description,
    p_status: currentBlog.status,
    p_notes: body?.notes || null,
    p_change_summary: body?.change_summary || 'Manual save',
  })

  if (error) return jsonError(`Failed to create blog version: ${error.message}`, 500)
  return jsonOk({ id: versionId })
}
