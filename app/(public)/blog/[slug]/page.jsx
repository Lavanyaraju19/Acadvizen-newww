export const revalidate = 0
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import BlogLayout from '../../../../components/BlogLayout'
import { buildTocFromBlocks, estimateReadingMinutes } from '../../../../components/blog/BlogBlocksRenderer'
import { redirect } from 'next/navigation'
import { buildMetadata } from '../../../lib/seo'
import { parseBlogContent } from '../../../../lib/blogContent'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { fetchCmsSiteData, fetchRedirectByPath } from '../../../../lib/cmsServer'
import { blogs as localBlogs } from '../../../../data/blogs'
import { findLocalBlogBySlug, resolveBlogSlug } from '../../../../lib/blogSlugResolver'

function pickFirst(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    return value
  }
  return null
}

function shouldPreferLocalBlog(remote, local) {
  if (!remote?.blog || !local) return false
  const remoteBlockCount = Array.isArray(remote.blocks) ? remote.blocks.length : 0
  if (remoteBlockCount > 0) return false

  const remoteLength = String(remote.blog.content || '').trim().length
  const localLength = String(local.content || '').trim().length

  if (!remoteLength && localLength) return true
  if (!localLength) return false

  return localLength > remoteLength + 500
}

async function fetchRemoteBlog(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null

  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !blog) return null

  const [{ data: blocks }, { data: related }] = await Promise.all([
    supabase.from('blog_content_blocks').select('*').eq('blog_id', blog.id).order('order_index', { ascending: true }),
    supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .neq('id', blog.id)
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  return {
    blog,
    blocks: Array.isArray(blocks) ? blocks : [],
    related: Array.isArray(related) ? related : [],
  }
}

async function getBlogData(slug) {
  const resolvedSlug = resolveBlogSlug(slug, localBlogs)
  const remote = (await fetchRemoteBlog(slug)) || (resolvedSlug && resolvedSlug !== slug ? await fetchRemoteBlog(resolvedSlug) : null)
  const local = findLocalBlogBySlug(slug, localBlogs)

  if (shouldPreferLocalBlog(remote, local)) {
    const parsed = parseBlogContent(local.content || '')
    const related = localBlogs
      .filter((entry) => entry.slug !== slug)
      .slice(0, 3)
      .map((entry) => ({ ...entry, featured_image: entry.image || entry.featured_image || '/blog-images/image1.jpg' }))
    return {
      blog: {
        ...local,
        featured_image: local.image || local.featured_image || '/blog-images/image1.jpg',
        excerpt: local.excerpt || local.description || '',
        seo_title: local.meta_title || local.title,
        seo_description: local.meta_description || local.excerpt || '',
        published_at: local.created_at,
      },
      related,
      blocks: [],
      toc: parsed.toc,
      sections: parsed.sections,
      readingMinutes: estimateReadingMinutes({ text: local.content }),
    }
  }

  if (remote?.blog) {
    const parsed = parseBlogContent(remote.blog.content || '')
    const tocFromBlocks = buildTocFromBlocks(remote.blocks)
    return {
      blog: {
        ...remote.blog,
        excerpt: remote.blog.description || '',
        image: remote.blog.featured_image || '/blog-images/image1.jpg',
      },
      related: (remote.related || []).map((entry) => ({
        ...entry,
        featured_image: entry.featured_image || '/blog-images/image1.jpg',
      })),
      blocks: remote.blocks || [],
      toc: tocFromBlocks.length ? tocFromBlocks : parsed.toc,
      sections: parsed.sections,
      readingMinutes: estimateReadingMinutes({ text: remote.blog.content, blocks: remote.blocks || [] }),
    }
  }

  if (!local) return { blog: null, related: [], blocks: [], toc: [], sections: [], readingMinutes: 1 }
  const parsed = parseBlogContent(local.content || '')
  const related = localBlogs
    .filter((entry) => entry.slug !== slug)
    .slice(0, 3)
    .map((entry) => ({ ...entry, featured_image: entry.image || entry.featured_image || '/blog-images/image1.jpg' }))
  return {
    blog: {
      ...local,
      featured_image: local.image || local.featured_image || '/blog-images/image1.jpg',
      excerpt: local.excerpt || local.description || '',
      seo_title: local.meta_title || local.title,
      seo_description: local.meta_description || local.excerpt || '',
      published_at: local.created_at,
    },
    related,
    blocks: [],
    toc: parsed.toc,
    sections: parsed.sections,
    readingMinutes: estimateReadingMinutes({ text: local.content }),
  }
}

export async function generateStaticParams() {
  return localBlogs.map((blog) => ({ slug: blog.slug })).filter((entry) => entry.slug)
}

export async function generateMetadata({ params }) {
  const resolvedSlug = resolveBlogSlug(params?.slug, localBlogs)
  const data = await getBlogData(resolvedSlug || params?.slug)
  const blog = data.blog
  if (!blog) {
    return buildMetadata({
      title: 'Blog',
      description: 'Latest digital marketing insights from Acadvizen.',
      path: `/blog/${params?.slug || ''}`,
    })
  }

  const metadata = buildMetadata({
    title: pickFirst(blog.seo_title, blog.meta_title, blog.title),
    description: pickFirst(blog.seo_description, blog.meta_description, blog.excerpt, 'Digital marketing insights from Acadvizen.'),
    path: `/blog/${blog.slug}`,
    image: pickFirst(blog.og_image, blog.featured_image, blog.image, '/blog-images/image1.jpg'),
  })

  if (blog.noindex) metadata.robots = { index: false, follow: true }
  return metadata
}

export default async function Page({ params }) {
  const requestedSlug = params?.slug || ''
  const redirectRule = await fetchRedirectByPath(`/blog/${requestedSlug}`)
  if (redirectRule?.to_path) {
    redirect(redirectRule.to_path)
  }

  const resolvedSlug = resolveBlogSlug(requestedSlug, localBlogs)
  if (resolvedSlug && resolvedSlug !== requestedSlug) {
    redirect(`/blog/${resolvedSlug}`)
  }

  const [data, siteData] = await Promise.all([getBlogData(requestedSlug), fetchCmsSiteData()])
  const blog = data.blog
  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-300">Blog not found.</div>
      </div>
    )
  }
  const companyName = siteData?.settings?.company_name || 'Acadvizen'
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}

  const canonicalUrl = `https://acadvizen.com/blog/${blog.slug}`
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://acadvizen.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://acadvizen.com/blog' },
      { '@type': 'ListItem', position: 3, name: blog.title, item: canonicalUrl },
    ],
  }
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.seo_description || blog.meta_description || blog.excerpt,
    image: blog.og_image || blog.featured_image || blog.image || '/blog-images/image1.jpg',
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at || blog.published_at || blog.created_at,
    author: {
      '@type': 'Organization',
      name: companyName,
    },
    publisher: {
      '@type': 'Organization',
      name: companyName,
      logo: {
        '@type': 'ImageObject',
        url: 'https://acadvizen.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  const faqSchema = blog.faq_schema && typeof blog.faq_schema === 'object' ? blog.faq_schema : null

  return (
    <>
      <script id="schema-blog-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="schema-blogposting" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {faqSchema ? (
        <script id="schema-blog-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      ) : null}
      <BlogLayout
        blog={blog}
        toc={data.toc}
        contentBlocks={data.blocks}
        contentSections={data.sections}
        relatedBlogs={data.related}
        readingMinutes={data.readingMinutes}
        labels={{
          shareLabel: uiCopy.blog_share_label,
          tocTitle: uiCopy.blog_toc_title,
          relatedTitle: uiCopy.blog_related_title,
          readMoreLabel: uiCopy.blog_read_more_label,
          readTimeSuffix: uiCopy.blog_read_time_suffix,
          shareTitle: blog.title,
        }}
      />
    </>
  )
}
