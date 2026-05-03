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

function logBlogError(message, error, meta = {}) {
  console.error(`[cms/blogs] ${message}`, {
    error: error?.message || error,
    ...meta,
  })
}

function sanitizeSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
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

function mergeContentJson(body, { existingContentJson = null, normalizedBlocks = null, inlineImages = null } = {}) {
  const next =
    body?.content_json && typeof body.content_json === 'object'
      ? { ...body.content_json }
      : existingContentJson && typeof existingContentJson === 'object'
        ? { ...existingContentJson }
        : {}

  if (normalizedBlocks !== null) {
    if (normalizedBlocks.length) next.blocks = normalizedBlocks
    else delete next.blocks
  }

  if (inlineImages !== null) {
    if (inlineImages.some(Boolean)) next.inline_images = inlineImages
    else delete next.inline_images
  }

  return Object.keys(next).length ? next : null
}

function buildBlogWriteInput(body, { existingContentJson = null } = {}) {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body.' }
  }

  const title = String(body.title || '').trim()
  const slug = sanitizeSlug(body.slug || title)

  if (!title) return { error: 'title is required.' }
  if (!slug) return { error: 'slug is required.' }

  const shouldAutoGenerateBlocks = body.auto_generate_blocks === true
  const inlineImages =
    'inline_images' in body || shouldAutoGenerateBlocks || Array.isArray(body?.content_json?.inline_images)
      ? normalizeInlineImages(body.inline_images || body?.content_json?.inline_images || [])
      : null

  const normalizedBlocks = shouldAutoGenerateBlocks
    ? normalizeBlocks(convertPlainTextToBlocks(body.content || '', { inlineImages: inlineImages || [] }))
    : ('blocks' in body || Array.isArray(body?.content_json?.blocks)
      ? normalizeBlocks(body.blocks ?? body.content_json?.blocks ?? [])
      : null)

  const status = body.status === 'published' ? 'published' : 'draft'
  const contentJson = mergeContentJson(body, {
    existingContentJson,
    normalizedBlocks,
    inlineImages,
  })

  return {
    payload: {
      title,
      slug,
      description: body.description || body.excerpt || null,
      content: body.content || null,
      content_json: contentJson,
      featured_image: body.featured_image || null,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      author_id: body.author_id || null,
      og_image: body.og_image || null,
      noindex: body.noindex === true,
      faq_schema: body.faq_schema && typeof body.faq_schema === 'object' ? body.faq_schema : null,
      tags: normalizeList(body.tags),
      categories: normalizeList(body.categories),
      status,
      published_at: status === 'published' ? body.published_at || new Date().toISOString() : body.published_at || null,
    },
    normalizedBlocks,
  }
}

async function ensureUniqueSlug(supabase, slug, excludeId = '') {
  const nextSlug = sanitizeSlug(slug)
  if (!nextSlug) return null

  let query = supabase.from('blogs').select('id,slug').eq('slug', nextSlug).limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()

  if (error) {
    logBlogError('Slug lookup failed.', error, { slug: nextSlug, excludeId })
    throw new Error(`Failed to validate the blog slug: ${error.message}`)
  }

  return data || null
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
    logBlogError('Block lookup failed.', error, { ids })
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
  const { error: deleteError } = await supabase.from('blog_content_blocks').delete().eq('blog_id', blogId)
  if (deleteError) {
    logBlogError('Failed to clear previous blog blocks.', deleteError, { blogId })
    throw new Error(`Failed to replace blog blocks: ${deleteError.message}`)
  }

  if (!normalized.length) return

  const payload = normalized.map((block) => ({
    blog_id: blogId,
    order_index: block.order_index,
    block_type: block.block_type,
    content_json: block.content_json,
  }))

  const { error: insertError } = await supabase.from('blog_content_blocks').insert(payload)
  if (insertError) {
    logBlogError('Failed to insert blog blocks.', insertError, { blogId, count: payload.length })
    throw new Error(`Failed to save blog blocks: ${insertError.message}`)
  }
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
  if (slug) query = query.eq('slug', sanitizeSlug(slug))
  if (id) query = query.eq('id', id)

  const { data, error } = await query
  if (error) {
    logBlogError('Blog lookup failed.', error, { slug, id, includeDrafts, limit })
    return jsonError(`Database query failed: ${error.message}`, 500, [])
  }

  const withBlocks = await attachBlocks(supabase, data || [], includeBlocks)
  return jsonOk(withBlocks || [])
}

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const body = await readJsonBody(request)
  const existingId = String(body?.id || '').trim()
  const { data: existingBlog, error: existingBlogError } = existingId
    ? await supabase.from('blogs').select('id,slug,content_json').eq('id', existingId).maybeSingle()
    : { data: null, error: null }

  if (existingBlogError) {
    logBlogError('Existing blog lookup failed.', existingBlogError, { id: existingId })
    return jsonError(`Failed to load the existing blog: ${existingBlogError.message}`, 500)
  }
  if (existingId && !existingBlog) {
    return jsonError('The blog you are trying to update no longer exists.', 404)
  }

  const writeInput = buildBlogWriteInput(body, { existingContentJson: existingBlog?.content_json || null })
  if (writeInput.error) return jsonError(writeInput.error, 400)

  const { payload, normalizedBlocks } = writeInput

  try {
    const conflict = await ensureUniqueSlug(supabase, payload.slug, existingId)
    if (conflict) {
      return jsonError(`A blog with slug "${payload.slug}" already exists.`, 409)
    }
  } catch (error) {
    return jsonError(error?.message || 'Unable to validate the blog slug.', 500)
  }

  try {
    const query = existingId
      ? supabase.from('blogs').update(payload).eq('id', existingId).select('*').single()
      : supabase.from('blogs').insert(payload).select('*').single()

    const { data, error } = await query
    if (error) {
      logBlogError('Blog write failed.', error, { id: existingId || null, slug: payload.slug })
      return jsonError(`Failed to save blog: ${error.message}`, 500)
    }

    if (normalizedBlocks !== null) {
      await replaceBlogBlocks(supabase, data.id, normalizedBlocks)
    }

    const [withBlocks] = await attachBlocks(supabase, [data], true)
    revalidateCmsPaths(['/blog', `/blog/${existingBlog?.slug || data.slug}`, `/blog/${data.slug}`])
    revalidateAllCmsPages(['/blog'])
    return jsonOk(withBlocks || data)
  } catch (error) {
    logBlogError('Unhandled blog save failure.', error, {
      id: existingId || null,
      slug: payload.slug,
    })
    return jsonError(error?.message || 'Failed to save blog.', 500)
  }
}
