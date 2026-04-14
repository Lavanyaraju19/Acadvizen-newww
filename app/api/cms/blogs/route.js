import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  isAdminRequest,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  parsePositiveInt,
  readJsonBody,
} from '../_utils'
import { convertPlainTextToBlocks, normalizeInlineImages } from '../../../../lib/blogContent'

export const dynamic = 'force-dynamic'

function normalizeList(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function normalizeBlocks(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((block, index) => ({
      order_index: Number.isFinite(Number(block?.order_index)) ? Number(block.order_index) : index,
      block_type: String(block?.block_type || block?.type || 'paragraph'),
      content_json: block?.content_json && typeof block.content_json === 'object' ? block.content_json : {},
    }))
    .filter((block) => block.block_type)
}

async function attachBlocks(supabase, blogs, includeBlocks) {
  if (!includeBlocks || !Array.isArray(blogs) || !blogs.length) return blogs
  const ids = blogs.map((blog) => blog.id).filter(Boolean)
  if (!ids.length) return blogs

  const { data: blocks, error } = await supabase
    .from('blog_content_blocks')
    .select('*')
    .in('blog_id', ids)
    .order('order_index', { ascending: true })

  if (error) {
    return blogs.map((blog) => ({
      ...blog,
      blocks: Array.isArray(blog?.content_json?.blocks) ? blog.content_json.blocks : [],
    }))
  }

  const grouped = (blocks || []).reduce((acc, block) => {
    if (!acc[block.blog_id]) acc[block.blog_id] = []
    acc[block.blog_id].push(block)
    return acc
  }, {})

  return blogs.map((blog) => ({
    ...blog,
    blocks: grouped[blog.id] || (Array.isArray(blog?.content_json?.blocks) ? blog.content_json.blocks : []),
  }))
}

async function replaceBlogBlocks(supabase, blogId, blocks) {
  const normalized = normalizeBlocks(blocks)
  await supabase.from('blog_content_blocks').delete().eq('blog_id', blogId)
  if (!normalized.length) return
  const payload = normalized.map((block) => ({
    blog_id: blogId,
    order_index: block.order_index,
    block_type: block.block_type,
    content_json: block.content_json,
  }))
  await supabase.from('blog_content_blocks').insert(payload)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const includeDrafts = searchParams.get('include_drafts') === '1' && isAdminRequest(request)
  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: includeDrafts })
  if (response) return response

  const slug = searchParams.get('slug')
  const id = searchParams.get('id')
  const includeBlocks = searchParams.get('include_blocks') === '1' || Boolean(slug || id)
  const limit = parsePositiveInt(searchParams.get('limit'), 100)

  let query = supabase.from('blogs').select('*').order('updated_at', { ascending: false }).limit(limit || 100)
  if (!includeDrafts) query = query.eq('status', 'published')
  if (slug) query = query.eq('slug', slug)
  if (id) query = query.eq('id', id)

  const { data, error } = await query
  if (error) return jsonError(`Database query failed: ${error.message}`, 200, [])

  const withBlocks = await attachBlocks(supabase, data || [], includeBlocks)
  return jsonOk(withBlocks || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  if (!body?.title || !body?.slug) return jsonError('title and slug are required.', 400)

  const shouldAutoGenerateBlocks = body.auto_generate_blocks === true
  const inlineImages = normalizeInlineImages(body.inline_images || [])
  const normalizedBlocks = shouldAutoGenerateBlocks
    ? normalizeBlocks(convertPlainTextToBlocks(body.content || '', { inlineImages }))
    : normalizeBlocks(body.blocks)
  const status = body.status === 'published' ? 'published' : 'draft'
  const contentJson =
    body.content_json && typeof body.content_json === 'object'
      ? { ...body.content_json }
      : {}

  if (inlineImages.some(Boolean)) {
    contentJson.inline_images = inlineImages
  } else if ('inline_images' in contentJson) {
    delete contentJson.inline_images
  }

  if (normalizedBlocks.length) {
    contentJson.blocks = normalizedBlocks
  } else if ('blocks' in contentJson) {
    delete contentJson.blocks
  }

  const payload = {
    id: body.id || undefined,
    title: String(body.title).trim(),
    slug: String(body.slug).trim(),
    description: body.description || body.excerpt || null,
    content: body.content || null,
    content_json: Object.keys(contentJson).length ? contentJson : null,
    featured_image: body.featured_image || null,
    seo_title: body.seo_title || null,
    seo_description: body.seo_description || null,
    author_id: body.author_id || null,
    og_image: body.og_image || null,
    noindex: body.noindex === true,
    faq_schema: body.faq_schema && typeof body.faq_schema === 'object' ? body.faq_schema : null,
    tags: normalizeList(body.tags || []),
    categories: normalizeList(body.categories || []),
    status,
    published_at: status === 'published' ? body.published_at || new Date().toISOString() : body.published_at || null,
  }

  const { data, error } = await supabase
    .from('blogs')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return jsonError(`Failed to save blog: ${error.message}`, 200)
  if (Array.isArray(body.blocks) || shouldAutoGenerateBlocks) {
    await replaceBlogBlocks(supabase, data.id, normalizedBlocks)
  }
  const [withBlocks] = await attachBlocks(supabase, [data], true)
  revalidateCmsPaths(['/blog', `/blog/${data?.slug || payload.slug}`])
  revalidateAllCmsPages(['/blog'])
  return jsonOk(withBlocks || data)
}
