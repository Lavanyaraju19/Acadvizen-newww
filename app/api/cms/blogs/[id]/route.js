import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'
import { convertPlainTextToBlocks, normalizeInlineImages } from '../../../../../lib/blogContent'

export const dynamic = 'force-dynamic'

function logBlogError(message, error, meta = {}) {
  console.error(`[cms/blogs/:id] ${message}`, {
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
      ? { ...existingContentJson, ...body.content_json }
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

function buildBlogUpdate(body, existingBlog) {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body.' }
  }

  const update = {}
  const shouldAutoGenerateBlocks = body.auto_generate_blocks === true
  const inlineImages =
    'inline_images' in body || shouldAutoGenerateBlocks || Array.isArray(body?.content_json?.inline_images)
      ? normalizeInlineImages(body.inline_images || body?.content_json?.inline_images || [])
      : null
  const normalizedBlocks = shouldAutoGenerateBlocks
    ? normalizeBlocks(convertPlainTextToBlocks(body.content ?? existingBlog?.content ?? '', { inlineImages: inlineImages || [] }))
    : ('blocks' in body || Array.isArray(body?.content_json?.blocks)
      ? normalizeBlocks(body.blocks ?? body.content_json?.blocks ?? [])
      : null)

  if ('title' in body) {
    const nextTitle = String(body.title || '').trim()
    if (!nextTitle) return { error: 'title cannot be empty.' }
    update.title = nextTitle
  }

  if ('slug' in body) {
    const nextSlug = sanitizeSlug(body.slug)
    if (!nextSlug) return { error: 'slug cannot be empty.' }
    update.slug = nextSlug
  }

  if ('description' in body || 'excerpt' in body) update.description = body.description || body.excerpt || null
  if ('content' in body) update.content = body.content || null
  if ('featured_image' in body) update.featured_image = body.featured_image || null
  if ('seo_title' in body) update.seo_title = body.seo_title || null
  if ('seo_description' in body) update.seo_description = body.seo_description || null
  if ('author_id' in body) update.author_id = body.author_id || null
  if ('og_image' in body) update.og_image = body.og_image || null
  if ('noindex' in body) update.noindex = body.noindex === true
  if ('faq_schema' in body) {
    update.faq_schema = body.faq_schema && typeof body.faq_schema === 'object' ? body.faq_schema : null
  }
  if ('tags' in body) update.tags = normalizeList(body.tags)
  if ('categories' in body) update.categories = normalizeList(body.categories)
  if ('status' in body) update.status = body.status === 'published' ? 'published' : 'draft'
  if ('published_at' in body || update.status === 'published') {
    update.published_at =
      update.status === 'published'
        ? body.published_at || existingBlog?.published_at || new Date().toISOString()
        : body.published_at || null
  }

  const mergedContentJson = mergeContentJson(body, {
    existingContentJson: existingBlog?.content_json || null,
    normalizedBlocks,
    inlineImages,
  })
  if (mergedContentJson !== null || 'content_json' in body || normalizedBlocks !== null || inlineImages !== null) {
    update.content_json = mergedContentJson
  }

  return { update, normalizedBlocks }
}

async function ensureUniqueSlug(supabase, slug, excludeId = '') {
  if (!slug) return null
  let query = supabase.from('blogs').select('id,slug').eq('slug', slug).limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()

  if (error) {
    logBlogError('Slug lookup failed.', error, { slug, excludeId })
    throw new Error(`Failed to validate the blog slug: ${error.message}`)
  }

  return data || null
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

export async function PATCH(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Blog id is required.', 400)

  const { data: existingBlog, error: existingBlogError } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (existingBlogError) {
    logBlogError('Existing blog lookup failed.', existingBlogError, { id })
    return jsonError(`Failed to load the existing blog: ${existingBlogError.message}`, 500)
  }
  if (!existingBlog) return jsonError('Blog not found.', 404)

  const body = await readJsonBody(request)
  const writeInput = buildBlogUpdate(body, existingBlog)
  if (writeInput.error) return jsonError(writeInput.error, 400)

  const { update, normalizedBlocks } = writeInput
  const nextSlug = update.slug || existingBlog.slug

  try {
    const conflict = await ensureUniqueSlug(supabase, nextSlug, id)
    if (conflict) {
      return jsonError(`A blog with slug "${nextSlug}" already exists.`, 409)
    }
  } catch (error) {
    return jsonError(error?.message || 'Unable to validate the blog slug.', 500)
  }

  try {
    const { data, error } = await supabase.from('blogs').update(update).eq('id', id).select('*').single()
    if (error) {
      logBlogError('Blog update failed.', error, { id, slug: nextSlug })
      return jsonError(`Failed to update blog: ${error.message}`, 500)
    }

    if (normalizedBlocks !== null) {
      await replaceBlogBlocks(supabase, id, normalizedBlocks)
    }

    const { data: blocks, error: blockError } = await supabase
      .from('blog_content_blocks')
      .select('*')
      .eq('blog_id', id)
      .order('order_index', { ascending: true })

    if (blockError) {
      logBlogError('Updated block lookup failed.', blockError, { id })
    }

    const currentSlug = data?.slug || nextSlug
    revalidateCmsPaths(['/blog', `/blog/${existingBlog.slug}`, `/blog/${currentSlug}`])
    revalidateAllCmsPages(['/blog'])

    return jsonOk({
      ...data,
      blocks: Array.isArray(blocks) && blocks.length
        ? blocks
        : (Array.isArray(data?.content_json?.blocks) ? data.content_json.blocks : []),
    })
  } catch (error) {
    logBlogError('Unhandled blog update failure.', error, { id, slug: nextSlug })
    return jsonError(error?.message || 'Failed to update blog.', 500)
  }
}

export async function DELETE(request, { params }) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Blog id is required.', 400)

  const { data: blog, error: blogLookupError } = await supabase
    .from('blogs')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  if (blogLookupError) {
    logBlogError('Blog lookup before delete failed.', blogLookupError, { id })
    return jsonError(`Failed to load blog before delete: ${blogLookupError.message}`, 500)
  }
  if (!blog?.slug) return jsonError('Blog not found.', 404)

  const { error } = await supabase.from('blogs').delete().eq('id', id)
  if (error) {
    logBlogError('Blog delete failed.', error, { id, slug: blog.slug })
    return jsonError(`Failed to delete blog: ${error.message}`, 500)
  }

  revalidateCmsPaths(['/blog', `/blog/${blog.slug}`])
  revalidateAllCmsPages(['/blog'])
  return jsonOk({ id, deleted: true })
}
