export const revalidate = 1;

import BlogLayout from '../../../../components/BlogLayout'
import { buildMetadata } from '../../../lib/seo'
import { blogs as localBlogs } from '../../../../data/blogs'

export const dynamicParams = true

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

async function fetchSupabaseBlogs() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []
  const tables = ['blog_posts', 'blogs']
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc&limit=50`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 300 },
      })
      if (!res.ok) continue
      const rows = await res.json()
      if (Array.isArray(rows) && rows.length) {
        return rows.map((row) => ({
          ...row,
          featured_image: row.featured_image || row.image,
          published_at: row.published_at || row.created_at,
        }))
      }
    } catch {
      // ignore and fallback
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
    ...(localMatch || {}),
    ...blog,
    title: blog.title || localMatch?.title,
    excerpt: blog.excerpt || localMatch?.excerpt,
    content: blog.content || localMatch?.content,
    featured_image: blog.featured_image || blog.image || localMatch?.image || '/blog-images/image1.jpg',
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

  return <BlogLayout blog={blog} toc={toc} contentSections={sections} relatedBlogs={related} />
}
