export const revalidate = 1;

import BlogLayout from '../../../../components/BlogLayout'
import { buildMetadata } from '../../../lib/seo'
import { blogs as localBlogs } from '../../../../data/blogs'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'

export const dynamicParams = true

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function stripTags(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function linkifyText(value = '') {
  return value
    .replace(
      /AI Digital Marketing Career Guide 2026/g,
      '<a href="/blog/ai-digital-marketing-career-2026" class="text-teal-300">AI Digital Marketing Career Guide 2026</a>'
    )
    .replace(
      /SEO Career Opportunities in India/g,
      '<a href="/blog/seo-career-india" class="text-teal-300">SEO Career Opportunities in India</a>'
    )
}

function parseBlogContent(content = '') {
  const source = String(content || '').trim()
  if (!source) {
    return {
      toc: [{ id: 'overview', title: 'Overview' }],
      sections: [{ id: 'overview', heading: 'Overview', paragraphs: ['Content will be updated soon.'], image: null }],
    }
  }

  const sections = []
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/gi
  const hasH2 = headingRegex.test(source)

  if (!hasH2) {
    const paragraphs = source
      .split(/\n{2,}/)
      .map((line) => stripTags(line))
      .filter(Boolean)
    return {
      toc: [{ id: 'overview', title: 'Overview' }],
      sections: [{ id: 'overview', heading: 'Overview', paragraphs, image: null }],
    }
  }

  headingRegex.lastIndex = 0
  const matches = [...source.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)]
  matches.forEach((match, index) => {
    const heading = stripTags(match[1]) || `Section ${index + 1}`
    const start = match.index + match[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : source.length
    const block = source.slice(start, end)
    const paragraphs = [...block.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
      .map((entry) => stripTags(linkifyText(entry[1])))
      .filter(Boolean)
    const imageMatch = block.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/i)
    sections.push({
      id: slugify(heading),
      heading,
      paragraphs,
      image: imageMatch ? { src: imageMatch[1], alt: imageMatch[2] } : null,
    })
  })

  const toc = sections.map((section) => ({ id: section.id, title: section.heading }))
  return { toc, sections }
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    return value
  }
  return null
}

async function fetchPublishedBlogs(supabase, table) {
  let query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(50)
  let { data, error } = await query.eq('status', 'published')
  if (error && String(error.message || '').toLowerCase().includes('status')) {
    query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(50)
    ;({ data, error } = await query.eq('is_published', true))
  }
  if (error && String(error.message || '').toLowerCase().includes('is_published')) {
    query = supabase.from(table).select('*').order('created_at', { ascending: false }).limit(50)
    ;({ data, error } = await query)
  }
  if (error) return []
  return Array.isArray(data) ? data : []
}

async function fetchSupabaseBlogs() {
  let supabase
  try {
    supabase = getServerSupabaseClient()
  } catch {
    return []
  }
  if (!supabase) return []
  const tables = ['blog_posts', 'blogs']
  for (const table of tables) {
    const rows = await fetchPublishedBlogs(supabase, table)
    if (rows.length) {
      return rows.map((row) => ({
        ...row,
        featured_image: row.featured_image || row.image,
        published_at: row.published_at || row.created_at,
      }))
    }
  }
  return []
}

async function getBlogData(slug) {
  const remote = await fetchSupabaseBlogs()
  const merged = [...remote]
  for (const local of localBlogs) {
    if (!merged.some((item) => item.slug === local.slug || item.id === local.id)) {
      merged.push({
        ...local,
        featured_image: local.image,
        published_at: local.created_at,
      })
    }
  }
  const blog =
    merged.find((item) => item.slug === slug) ||
    localBlogs.find((item) => item.slug === slug)
  if (!blog) return { blog: null, related: [] }

  const localMatch = localBlogs.find((item) => item.slug === blog.slug || item.id === blog.id)
  const finalBlog = {
    ...blog,
    ...(localMatch || {}),
    title: pickFirstNonEmpty(localMatch?.title, blog.title),
    excerpt: pickFirstNonEmpty(localMatch?.excerpt, blog.excerpt),
    content: pickFirstNonEmpty(localMatch?.content, blog.content),
    meta_title: pickFirstNonEmpty(localMatch?.meta_title, blog.meta_title, blog.title),
    meta_description: pickFirstNonEmpty(localMatch?.meta_description, blog.meta_description, blog.excerpt),
    featured_image: pickFirstNonEmpty(
      localMatch?.image,
      localMatch?.featured_image,
      blog.featured_image,
      blog.image,
      '/blog-images/image1.jpg'
    ),
    image: pickFirstNonEmpty(
      localMatch?.image,
      localMatch?.featured_image,
      blog.image,
      blog.featured_image,
      '/blog-images/image1.jpg'
    ),
  }

  const related = merged
    .filter((item) => item.slug !== finalBlog.slug)
    .slice(0, 3)
    .map((item) => ({
      ...item,
      featured_image: item.featured_image || item.image || '/blog-images/image1.jpg',
    }))

  return { blog: finalBlog, related }
}

export async function generateStaticParams() {
  const remote = await fetchSupabaseBlogs()
  const remoteSlugs = remote.map((blog) => blog.slug).filter(Boolean)
  const localSlugs = localBlogs.map((blog) => blog.slug)
  return Array.from(new Set([...localSlugs, ...remoteSlugs])).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { blog } = await getBlogData(params?.slug)
  if (!blog) {
    return buildMetadata({
      title: 'Blog Article',
      description: 'In-depth article from Acadvizen on digital marketing trends, tools, and career growth.',
      path: `/blog/${params?.slug || ''}`,
    })
  }

  return buildMetadata({
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt,
    path: `/blog/${blog.slug}`,
    image: blog.featured_image || blog.image,
  })
}

export default async function Page({ params }) {
  const { blog, related } = await getBlogData(params?.slug)
  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-300">Blog not found.</div>
      </div>
    )
  }

  const { toc, sections } = parseBlogContent(blog.content || '')
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.meta_description || blog.excerpt,
    image: blog.featured_image || blog.image || '/blog-images/image1.jpg',
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.published_at || blog.created_at,
    author: {
      '@type': 'Organization',
      name: 'Acadvizen',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Acadvizen',
      logo: {
        '@type': 'ImageObject',
        url: 'https://acadvizen.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://acadvizen.com/blog/${blog.slug}`,
    },
  }

  return (
    <>
      <script
        id="schema-blogposting"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <BlogLayout blog={blog} toc={toc} contentSections={sections} relatedBlogs={related} />
    </>
  )
}
