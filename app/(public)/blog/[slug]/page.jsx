export const revalidate = 0
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import BlogLayout from '../../../../components/BlogLayout'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { buildMetadata, siteConfig } from '../../../lib/seo'
import { buildTocFromBlocks, estimateReadingMinutes } from '../../../../lib/blogBlockUtils'
import { convertPlainTextToBlocks, parseBlogContent } from '../../../../lib/blogContent'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { fetchCmsSiteData, fetchRedirectByPath } from '../../../../lib/cmsServer'
import { canonicalizeKnownBlogSlug } from '../../../../lib/blogSlugResolver'
import { fetchPublishedPublicBlogBySlug, fetchRelatedPublishedBlogs } from '../../../../lib/publicBlogData'
import Breadcrumbs from '../../../../components/cms/templates/Breadcrumbs'

function pickFirst(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    return value
  }
  return null
}

async function fetchRemoteBlog(slug) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !slug) return null

  const blog = await fetchPublishedPublicBlogBySlug(slug)
  if (!blog) return null

  const [{ data: blocks }, { data: related }] = await Promise.all([
    supabase.from('blog_content_blocks').select('*').eq('blog_id', blog.id).order('order_index', { ascending: true }),
    fetchRelatedPublishedBlogs(blog, 3),
  ])

  return {
    blog,
    blocks: Array.isArray(blocks) ? blocks : [],
    related: Array.isArray(related) ? related : [],
  }
}

async function getBlogData(slug) {
  const canonicalSlug = canonicalizeKnownBlogSlug(slug)
  const remote =
    (await fetchRemoteBlog(slug)) ||
    (canonicalSlug && canonicalSlug !== slug ? await fetchRemoteBlog(canonicalSlug) : null)

  if (!remote?.blog) {
    return { blog: null, related: [], blocks: [], toc: [], sections: [], readingMinutes: 1 }
  }

  const inlineImages = Array.isArray(remote.blog?.content_json?.inline_images)
    ? remote.blog.content_json.inline_images
    : []
  const parsed = parseBlogContent(remote.blog.content || '', { inlineImages })
  const contentJsonBlocks = Array.isArray(remote.blog?.content_json?.blocks) ? remote.blog.content_json.blocks : []
  const generatedBlocks = Array.isArray(remote.blocks) && remote.blocks.length
    ? remote.blocks
    : contentJsonBlocks.length
      ? contentJsonBlocks
      : convertPlainTextToBlocks(remote.blog.content || '', { inlineImages })
  const tocFromBlocks = buildTocFromBlocks(generatedBlocks)

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
    blocks: generatedBlocks,
    toc: tocFromBlocks.length ? tocFromBlocks : parsed.toc,
    sections: parsed.sections,
    readingMinutes: estimateReadingMinutes({ text: remote.blog.content, blocks: generatedBlocks }),
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await getBlogData(slug)
  const blog = data.blog
  if (!blog) {
    return buildMetadata({
      title: 'Blog',
      description: 'Latest digital marketing insights from Acadvizen.',
      path: `/blog/${slug || ''}`,
    })
  }

  const metadata = buildMetadata({
    title: pickFirst(blog.seo_title, blog.meta_title, blog.title),
    description: pickFirst(
      blog.seo_description,
      blog.meta_description,
      blog.excerpt,
      'Digital marketing insights from Acadvizen.'
    ),
    path: `/blog/${blog.slug}`,
    image: pickFirst(blog.og_image, blog.featured_image, blog.image, '/blog-images/image1.jpg'),
  })

  if (blog.noindex) metadata.robots = { index: false, follow: true }
  return metadata
}

export default async function Page({ params }) {
  const { slug: requestedSlug } = await params
  const redirectRule = await fetchRedirectByPath(`/blog/${requestedSlug}`)
  if (redirectRule?.to_path) {
    if ((redirectRule.status_code || redirectRule.redirect_type) === 301) {
      permanentRedirect(redirectRule.to_path)
    }
    redirect(redirectRule.to_path)
  }

  const canonicalSlug = canonicalizeKnownBlogSlug(requestedSlug)
  if (canonicalSlug && canonicalSlug !== requestedSlug) {
    redirect(`/blog/${canonicalSlug}`)
  }

  const [data, siteData] = await Promise.all([getBlogData(requestedSlug), fetchCmsSiteData()])
  const blog = data.blog
  if (!blog) {
    notFound()
  }

  const companyName = siteData?.settings?.company_name || 'Acadvizen'
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object'
    ? siteData.settings.ui_copy
    : {}

  const canonicalUrl = `${siteConfig.siteUrl}/blog/${blog.slug}`
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: blog.title },
  ]
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteConfig.siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.siteUrl}/blog` },
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
        url: `${siteConfig.siteUrl}/logo.png`,
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
      <Breadcrumbs items={breadcrumbItems} />
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
