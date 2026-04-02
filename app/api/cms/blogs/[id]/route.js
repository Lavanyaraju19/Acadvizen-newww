import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  revalidateAllCmsPages,
  revalidateCmsPaths,
  readJsonBody,
} from '../../_utils'

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

export async function PATCH(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Blog id is required.', 400)

  const body = await readJsonBody(request)
  if (!body) return jsonError('Invalid request body.', 400)

  const update = {}
  const normalizedBlocks = Array.isArray(body?.blocks) ? normalizeBlocks(body.blocks) : null
  const allowed = [
    'title',
    'slug',
    'description',
    'content',
    'content_json',
    'featured_image',
    'seo_title',
    'seo_description',
    'author_id',
    'og_image',
    'noindex',
    'faq_schema',
    'status',
    'published_at',
  ]
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if ('status' in update) update.status = update.status === 'published' ? 'published' : 'draft'
  if ('content_json' in update && (!update.content_json || typeof update.content_json !== 'object')) {
    update.content_json = null
  }
  if ('faq_schema' in update && (!update.faq_schema || typeof update.faq_schema !== 'object')) {
    update.faq_schema = null
  }
  if ('noindex' in update) update.noindex = Boolean(update.noindex)
  if ('tags' in body) update.tags = normalizeList(body.tags)
  if ('categories' in body) update.categories = normalizeList(body.categories)
  if (normalizedBlocks) update.content_json = { blocks: normalizedBlocks }

  const { data, error } = await supabase.from('blogs').update(update).eq('id', id).select('*').single()
  if (error) return jsonError(`Failed to update blog: ${error.message}`, 200)

  if (normalizedBlocks) {
    await replaceBlogBlocks(supabase, id, normalizedBlocks)
  }
  const { data: blocks } = await supabase
    .from('blog_content_blocks')
    .select('*')
    .eq('blog_id', id)
    .order('order_index', { ascending: true })

  revalidateCmsPaths(['/blog', `/blog/${data?.slug || ''}`])
  revalidateAllCmsPages(['/blog'])
  return jsonOk({ ...data, blocks: blocks || [] })
}

export async function DELETE(request, { params }) {
  const unauthorized = ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse()
  if (response) return response

  const id = params?.id
  if (!id) return jsonError('Blog id is required.', 400)

  const { data: blog } = await supabase.from('blogs').select('slug').eq('id', id).maybeSingle()
  const { error } = await supabase.from('blogs').delete().eq('id', id)
  if (error) return jsonError(`Failed to delete blog: ${error.message}`, 200)
  revalidateCmsPaths(['/blog', `/blog/${blog?.slug || ''}`])
  revalidateAllCmsPages(['/blog'])
  return jsonOk({ id, deleted: true })
}
