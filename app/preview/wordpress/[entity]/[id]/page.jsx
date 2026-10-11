import { notFound } from 'next/navigation'
import { getServerSupabaseClient } from '../../../../../lib/supabaseServer'
import { verifyPreview } from '../../../../../lib/wordpress/previewToken'
import { ensureRenderableSections } from '../../../../../lib/cmsPageRender'
import DynamicPageRenderer from '../../../../../components/cms/DynamicPageRenderer'
import BlogLayout from '../../../../../components/BlogLayout'
import { buildTocFromBlocks, estimateReadingMinutes } from '../../../../../lib/blogBlockUtils'
import { convertPlainTextToBlocks, parseBlogContent } from '../../../../../lib/blogContent'
import { fetchCmsSiteData } from '../../../../../lib/cmsServer'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

// Preview of a record edited in the WordPress central admin, before or after publishing, drawn
// with the same components as the public page (DynamicPageRenderer for pages, BlogLayout for
// blogs). Reachable only through a signed link that WordPress makes for a logged-in editor.
function Banner({ status }) {
  return (
    <div className="bg-amber-500/90 px-4 py-2 text-center text-sm font-semibold text-slate-950">
      Preview from WordPress, not necessarily published (status: {status || 'draft'})
    </div>
  )
}

export default async function WordPressPreviewPage({ params, searchParams }) {
  const { entity, id } = await params
  const { exp, sig } = await searchParams
  if (!verifyPreview({ entity, id, exp, sig }, String(process.env.WORDPRESS_CMS_WEBHOOK_SECRET || '')).ok) notFound()

  const supabase = getServerSupabaseClient({ preferServiceRole: true })
  if (!supabase) notFound()

  if (entity === 'pages') {
    const { data: page } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
    if (!page) notFound()
    const { data: sections } = await supabase.from('sections').select('*').eq('page_id', id).eq('visibility', true).order('order_index', { ascending: true })
    return (
      <div className="min-h-screen">
        <Banner status={page.status} />
        <DynamicPageRenderer page={ensureRenderableSections({ ...page, sections: sections || [] })} />
      </div>
    )
  }

  const { data: blog } = await supabase.from('blogs').select('*').eq('id', id).maybeSingle()
  if (!blog) notFound()
  const { data: legacy } = await supabase.from('blog_content_blocks').select('*').eq('blog_id', id).order('order_index', { ascending: true })
  const inlineImages = Array.isArray(blog.content_json?.inline_images) ? blog.content_json.inline_images : []
  const parsed = parseBlogContent(blog.content || '', { inlineImages })
  const contentJsonBlocks = Array.isArray(blog.content_json?.blocks) ? blog.content_json.blocks : []
  const blocks = Array.isArray(legacy) && legacy.length ? legacy : contentJsonBlocks.length ? contentJsonBlocks : convertPlainTextToBlocks(blog.content || '', { inlineImages })
  const toc = buildTocFromBlocks(blocks)
  const siteData = await fetchCmsSiteData()
  const uiCopy = siteData?.settings?.ui_copy && typeof siteData.settings.ui_copy === 'object' ? siteData.settings.ui_copy : {}
  return (
    <div className="min-h-screen">
      <Banner status={blog.status} />
      <BlogLayout
        blog={{ ...blog, excerpt: blog.description || '', image: blog.featured_image || '/blog-images/image1.jpg' }}
        toc={toc.length ? toc : parsed.toc}
        contentBlocks={blocks}
        contentSections={parsed.sections}
        relatedBlogs={[]}
        readingMinutes={estimateReadingMinutes({ text: blog.content, blocks })}
        labels={{
          shareLabel: uiCopy.blog_share_label,
          tocTitle: uiCopy.blog_toc_title,
          relatedTitle: uiCopy.blog_related_title,
          readMoreLabel: uiCopy.blog_read_more_label,
          readTimeSuffix: uiCopy.blog_read_time_suffix,
          shareTitle: blog.title,
        }}
      />
    </div>
  )
}
