import { createClient } from '@supabase/supabase-js'
import { blogs as legacyBlogs } from '../data/blogs.js'
import { additionalBlogs } from '../content/blogImports/additionalBlogs.js'
import { convertPlainTextToBlocks } from '../lib/blogContent.js'

const BLOG_SLUG_ALIASES = {
  'ai-digital-marketing-career-guide': 'ai-digital-marketing-career-2026',
  'digital-marketing-career-guide': 'career-in-digital-marketing-2026',
  'digital-marketing-career-roadmap': 'career-in-digital-marketing-2026',
  'google-ads-career-guide': 'seo-vs-paid-ads-career-growth',
  'mba-vs-digital-marketing-2026': 'mba-vs-digital-marketing-course-2026',
  'new-age-seo-in-2026': 'new-age-seo-2026-marketing-strategy',
  'next-generation-digital-marketing-ai-era': 'digital-marketing-skills-next-generation-ai-era',
}

function decodeJwtPayload(token = '') {
  try {
    const parts = String(token || '').split('.')
    if (parts.length < 2) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function extractProjectRef(url = '') {
  try {
    return new URL(url).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function keyMatchesProject(url = '', key = '') {
  const projectRef = extractProjectRef(url)
  if (!projectRef || !key) return false
  return decodeJwtPayload(key)?.ref === projectRef
}

function sanitizeSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function inverseAliasMap() {
  const next = {}
  for (const [from, to] of Object.entries(BLOG_SLUG_ALIASES || {})) {
    if (!next[to]) next[to] = []
    next[to].push(from)
  }
  return next
}

function buildImageBlocks(images = [], title = '') {
  return images
    .filter(Boolean)
    .map((src, index) => ({
      block_type: 'image',
      content_json: {
        src,
        alt: `${title} image ${index + 1}`.trim(),
        caption: '',
      },
    }))
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function normalizeLegacyBlog(entry, aliasMap) {
  if (!entry || typeof entry !== 'object') return null
  const slug = sanitizeSlug(entry.slug || entry.id || entry.title)
  if (!slug) return null

  return {
    slug,
    lookupSlugs: Array.from(new Set([slug, ...(aliasMap[slug] || [])])),
    title: String(entry.title || '').trim(),
    description: String(entry.excerpt || entry.description || '').trim(),
    content: String(entry.content || '').trim(),
    featured_image: String(entry.image || entry.featured_image || '').trim() || null,
    seo_title: String(entry.meta_title || entry.seo_title || entry.title || '').trim() || null,
    seo_description: String(entry.meta_description || entry.seo_description || entry.excerpt || '').trim() || null,
    og_image: String(entry.image || entry.featured_image || '').trim() || null,
    tags: normalizeArray(entry.tags),
    categories: normalizeArray(entry.categories),
    status: 'published',
    published_at: entry.created_at || new Date().toISOString(),
    blocks: convertPlainTextToBlocks(entry.content || ''),
    overwritePublished: false,
  }
}

function normalizeAdditionalBlog(entry) {
  if (!entry || typeof entry !== 'object') return null
  const slug = sanitizeSlug(entry.slug || entry.title)
  if (!slug) return null
  const content = String(entry.content || '').trim()
  const blocks = [
    ...convertPlainTextToBlocks(content, { inlineImages: [] }),
    ...buildImageBlocks(entry.galleryImages || [], entry.title || ''),
  ]

  return {
    slug,
    lookupSlugs: Array.from(new Set([slug, ...(Array.isArray(entry.aliases) ? entry.aliases.map(sanitizeSlug) : [])])).filter(Boolean),
    title: String(entry.title || '').trim(),
    description: String(entry.description || '').trim(),
    content,
    featured_image: String(entry.featuredImage || '').trim() || null,
    seo_title: String(entry.seoTitle || entry.title || '').trim() || null,
    seo_description: String(entry.seoDescription || entry.description || '').trim() || null,
    og_image: String(entry.featuredImage || '').trim() || null,
    tags: normalizeArray(entry.tags),
    categories: normalizeArray(entry.categories),
    status: 'published',
    published_at: entry.publishedAt || new Date().toISOString(),
    blocks,
    overwritePublished: true,
  }
}

async function getClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anon key in the environment.')
  }

  if (keyMatchesProject(url, serviceRoleKey)) {
    return createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  const adminEmail = process.env.CMS_ADMIN_EMAIL || ''
  const adminPassword = process.env.CMS_ADMIN_PASSWORD || ''
  if (!adminEmail || !adminPassword) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is invalid for this project, and CMS admin credentials were not provided.')
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })

  if (error) {
    throw new Error(`Admin sign-in failed: ${error.message}`)
  }

  return client
}

async function findExistingBlog(client, post) {
  const slugList = Array.from(new Set(post.lookupSlugs || [])).filter(Boolean)
  if (slugList.length) {
    const { data, error } = await client
      .from('blogs')
      .select('id,slug,title,status,published_at')
      .in('slug', slugList)

    if (error) throw new Error(`Blog lookup by slug failed for "${post.slug}": ${error.message}`)
    if (Array.isArray(data) && data.length) {
      return data.find((row) => row.slug === post.slug) || data[0]
    }
  }

  const { data, error } = await client
    .from('blogs')
    .select('id,slug,title,status,published_at')
    .eq('title', post.title)
    .limit(1)

  if (error) throw new Error(`Blog lookup by title failed for "${post.title}": ${error.message}`)
  return Array.isArray(data) && data.length ? data[0] : null
}

async function replaceBlogBlocks(client, blogId, blocks = []) {
  const normalizedBlocks = Array.isArray(blocks)
    ? blocks
        .filter((block) => block && block.block_type)
        .map((block, index) => ({
          blog_id: blogId,
          order_index: index,
          block_type: block.block_type,
          content_json: block.content_json && typeof block.content_json === 'object' ? block.content_json : {},
        }))
    : []

  const { error: deleteError } = await client.from('blog_content_blocks').delete().eq('blog_id', blogId)
  if (deleteError) throw new Error(`Failed to clear blocks for blog ${blogId}: ${deleteError.message}`)

  if (!normalizedBlocks.length) return

  const { error: insertError } = await client.from('blog_content_blocks').insert(normalizedBlocks)
  if (insertError) throw new Error(`Failed to insert blocks for blog ${blogId}: ${insertError.message}`)
}

async function upsertBlog(client, post) {
  const existing = await findExistingBlog(client, post)
  if (existing?.status === 'published' && !post.overwritePublished) {
    return { action: 'skipped', slug: existing.slug || post.slug, id: existing.id }
  }

  const payload = {
    title: post.title,
    slug: post.slug,
    description: post.description || null,
    content: post.content || null,
    content_json: post.blocks?.length ? { blocks: post.blocks } : null,
    featured_image: post.featured_image || null,
    seo_title: post.seo_title || null,
    seo_description: post.seo_description || null,
    og_image: post.og_image || null,
    tags: normalizeArray(post.tags),
    categories: normalizeArray(post.categories),
    status: 'published',
    published_at: post.published_at || existing?.published_at || new Date().toISOString(),
    noindex: false,
  }

  const query = existing?.id
    ? client.from('blogs').update(payload).eq('id', existing.id).select('id,slug').single()
    : client.from('blogs').insert(payload).select('id,slug').single()

  const { data, error } = await query
  if (error) throw new Error(`Failed to save "${post.title}": ${error.message}`)

  await replaceBlogBlocks(client, data.id, post.blocks)
  return { action: existing?.id ? 'updated' : 'created', slug: data.slug, id: data.id }
}

async function main() {
  const client = await getClient()
  const aliasMap = inverseAliasMap()

  const posts = [
    ...legacyBlogs.map((entry) => normalizeLegacyBlog(entry, aliasMap)).filter(Boolean),
    ...additionalBlogs.map(normalizeAdditionalBlog).filter(Boolean),
  ]

  const results = []
  for (const post of posts) {
    const result = await upsertBlog(client, post)
    results.push(result)
  }

  const { count, error } = await client
    .from('blogs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  if (error) throw new Error(`Failed to count published blogs: ${error.message}`)

  console.log(JSON.stringify({ synced: results, publishedCount: count || 0 }, null, 2))
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
