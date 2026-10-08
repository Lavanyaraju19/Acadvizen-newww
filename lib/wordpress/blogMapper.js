/**
 * Maps acadvizen-cms/v1 blog responses into the same shape as Supabase `blogs` rows, so the
 * existing blog pages and components render them unchanged.
 *
 * Content arrives as structured blocks (never HTML). Every field is re-validated here, because
 * the Main Website must not trust a remote system blindly.
 */
import { isValidPublicBlogSlug } from '../blogVisibility.js'

const MAX_TEXT = 10000
const MAX_BLOCKS = 400
const MAX_LIST_ITEMS = 100
const VIDEO_EMBED_PATTERN = /^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)[\w\-?=&/.%]+$/i

function text(value, max = MAX_TEXT) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function validDate(value) {
  const date = typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null
}

/**
 * Only images served by the configured WordPress host are allowed, so next/image and the CSP
 * only need to trust that one extra origin.
 */
export function safeImageUrl(value, allowedHostname) {
  if (typeof value !== 'string' || !allowedHostname) return null
  try {
    const url = new URL(value)
    if (url.hostname !== allowedHostname) return null
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null
    return url.toString()
  } catch {
    return null
  }
}

export function sanitizeBlocks(blocks, { imageHostname } = {}) {
  if (!Array.isArray(blocks)) return []
  const safe = []
  for (const block of blocks.slice(0, MAX_BLOCKS)) {
    const type = block?.block_type
    const content = block?.content_json && typeof block.content_json === 'object' ? block.content_json : {}

    if (type === 'heading') {
      const value = text(content.text, 300)
      const level = [2, 3, 4].includes(Number(content.level)) ? Number(content.level) : 2
      if (value) safe.push({ block_type: 'heading', content_json: { text: value, level } })
    } else if (type === 'paragraph') {
      const value = text(content.text)
      if (value) safe.push({ block_type: 'paragraph', content_json: { text: value } })
    } else if (type === 'list') {
      const items = Array.isArray(content.items)
        ? content.items.slice(0, MAX_LIST_ITEMS).map((item) => text(item, 2000)).filter(Boolean)
        : []
      if (items.length) safe.push({ block_type: 'list', content_json: { items } })
    } else if (type === 'quote') {
      const value = text(content.text)
      if (value) safe.push({ block_type: 'quote', content_json: { text: value, author: text(content.author, 200) } })
    } else if (type === 'image') {
      const src = safeImageUrl(content.src, imageHostname)
      if (src) safe.push({ block_type: 'image', content_json: { src, alt: text(content.alt, 300), caption: text(content.caption, 500) } })
    } else if (type === 'video') {
      const embedUrl = text(content.embed_url, 500)
      if (VIDEO_EMBED_PATTERN.test(embedUrl)) {
        safe.push({ block_type: 'video', content_json: { embed_url: embedUrl, title: text(content.title, 200) } })
      }
    }
  }
  return safe
}

/**
 * Returns a Supabase-blog-shaped object, or null when the item is not safe/complete enough to show.
 */
export function mapWordPressBlog(item, { imageHostname } = {}) {
  if (!item || typeof item !== 'object') return null
  const slug = text(item.slug, 200)
  const title = text(item.title, 300)
  const publishedAt = validDate(item.published_at)
  if (!isValidPublicBlogSlug(slug) || !title || !publishedAt) return null
  if (!['main', 'both'].includes(item.publish_to)) return null

  const image = safeImageUrl(item.featured_image?.url, imageHostname)
  const excerpt = text(item.excerpt, 1000)
  const categories = (Array.isArray(item.categories) ? item.categories : [item.category])
    .map((value) => text(value, 100))
    .filter(Boolean)
    .slice(0, 10)
  const authorName = text(item.author_name, 100)
  const seo = item.seo && typeof item.seo === 'object' ? item.seo : {}

  return {
    id: `wordpress-${Number(item.id) || slug}`,
    source: 'wordpress',
    wordpress_id: Number(item.id) || null,
    slug,
    title,
    description: excerpt,
    excerpt,
    content: '',
    featured_image: image,
    image,
    published_at: publishedAt,
    created_at: publishedAt,
    updated_at: validDate(item.modified_at) || publishedAt,
    status: 'published',
    categories,
    tags: [],
    author: authorName ? { name: authorName } : null,
    seo_title: text(seo.title, 200) || null,
    seo_description: text(seo.description, 500) || null,
    og_image: image,
    noindex: item.noindex === true,
    content_json: Array.isArray(item.blocks) ? { blocks: sanitizeBlocks(item.blocks, { imageHostname }) } : null,
  }
}
