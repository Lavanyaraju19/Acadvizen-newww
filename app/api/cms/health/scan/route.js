import {
  ensureAdmin,
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
} from '../../_utils'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Run health checks
  const healthResults = await runHealthChecks(supabase)

  // Save scan results
  const { error } = await supabase.from('health_scans').insert({
    ...healthResults,
    scanned_by: user?.id,
  })

  if (error) return jsonError(`Failed to save health scan: ${error.message}`, 200)
  return jsonOk(healthResults)
}

export async function GET(request) {
  const unauthorized = await ensureAdmin(request)
  if (unauthorized) return unauthorized

  const { supabase, response } = getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  // Get latest health scan
  const { data, error } = await supabase
    .from('health_scans')
    .select('*')
    .order('scan_date', { ascending: false })
    .limit(1)
    .single()

  if (error) return jsonError(`Failed to fetch health scan: ${error.message}`, 200, null)
  return jsonOk(data)
}

async function runHealthChecks(supabase) {
  const results = {
    seo_missing_meta_titles: 0,
    seo_missing_meta_descriptions: 0,
    seo_missing_h1: 0,
    seo_missing_alt_text: 0,
    seo_missing_canonical: 0,
    seo_missing_og_image: 0,
    seo_missing_focus_keyword: 0,
    seo_duplicate_titles: 0,
    seo_duplicate_descriptions: 0,
    content_draft_pages: 0,
    content_scheduled_content: 0,
    content_unpublished_pages: 0,
    content_empty_pages: 0,
    content_broken_images: 0,
    content_missing_featured: 0,
    link_broken_internal: 0,
    link_broken_external: 0,
    link_redirect_chains: 0,
    link_missing_redirects: 0,
    link_404_pages: 0,
    media_large_images: 0,
    media_duplicate_images: 0,
    media_unused_images: 0,
    media_missing_alt: 0,
    media_unsupported_formats: 0,
    perf_slow_pages: 0,
    perf_large_assets: 0,
    perf_slow_images: 0,
    perf_cache_status: 'unknown',
  }

  // Check pages
  const { data: pages } = await supabase.from('pages').select('id, seo_title, seo_description, meta_title, meta_description, canonical_url, og_image_url, focus_keyword, status, sections')
  
  if (pages) {
    const titles = []
    const descriptions = []
    
    pages.forEach(page => {
      const title = page.seo_title || page.meta_title
      const description = page.seo_description || page.meta_description
      
      if (!title) results.seo_missing_meta_titles++
      if (!description) results.seo_missing_meta_descriptions++
      if (!page.canonical_url) results.seo_missing_canonical++
      if (!page.og_image_url) results.seo_missing_og_image++
      if (!page.focus_keyword) results.seo_missing_focus_keyword++
      if (page.status === 'draft') results.content_draft_pages++
      if (page.status === 'unpublished') results.content_unpublished_pages++
      
      if (title) titles.push(title)
      if (description) descriptions.push(description)
      
      if (!page.sections || page.sections.length === 0) results.content_empty_pages++
    })
    
    // Check duplicates
    const titleCounts = {}
    const descCounts = {}
    titles.forEach(t => titleCounts[t] = (titleCounts[t] || 0) + 1)
    descriptions.forEach(d => descCounts[d] = (descCounts[d] || 0) + 1)
    
    Object.values(titleCounts).forEach(count => { if (count > 1) results.seo_duplicate_titles++ })
    Object.values(descCounts).forEach(count => { if (count > 1) results.seo_duplicate_descriptions++ })
  }

  // Check blogs
  const { data: blogs } = await supabase.from('blogs').select('id, meta_title, meta_description, canonical_url, og_image_url, focus_keyword, status')
  
  if (blogs) {
    blogs.forEach(blog => {
      if (!blog.meta_title) results.seo_missing_meta_titles++
      if (!blog.meta_description) results.seo_missing_meta_descriptions++
      if (!blog.canonical_url) results.seo_missing_canonical++
      if (!blog.og_image_url) results.seo_missing_og_image++
      if (!blog.focus_keyword) results.seo_missing_focus_keyword++
      if (blog.status === 'draft') results.content_draft_pages++
    })
  }

  // Check media
  const { data: media } = await supabase.from('media').select('id, alt_text, type, size')
  
  if (media) {
    media.forEach(item => {
      if (!item.alt_text) results.media_missing_alt++
      if (item.size > 2 * 1024 * 1024) results.media_large_images++ // > 2MB
    })
  }

  // Calculate scores
  const seoTotal = 9
  const seoIssues = results.seo_missing_meta_titles + results.seo_missing_meta_descriptions + results.seo_missing_canonical + results.seo_missing_og_image + results.seo_missing_focus_keyword + results.seo_duplicate_titles + results.seo_duplicate_descriptions
  results.seo_score = Math.max(0, Math.round(100 - (seoIssues / seoTotal) * 100))

  const contentTotal = 6
  const contentIssues = results.content_draft_pages + results.content_empty_pages + results.content_broken_images
  results.content_score = Math.max(0, Math.round(100 - (contentIssues / contentTotal) * 100))

  const mediaTotal = 5
  const mediaIssues = results.media_large_images + results.media_missing_alt
  results.media_score = Math.max(0, Math.round(100 - (mediaIssues / mediaTotal) * 100))

  const linkTotal = 5
  const linkIssues = results.link_broken_internal + results.link_broken_external + results.link_404_pages
  results.link_score = Math.max(0, Math.round(100 - (linkIssues / linkTotal) * 100))

  const perfTotal = 4
  const perfIssues = results.perf_slow_pages + results.perf_large_assets + results.perf_slow_images
  results.perf_score = Math.max(0, Math.round(100 - (perfIssues / perfTotal) * 100))

  // Overall score
  const overallScore = Math.round((results.seo_score + results.content_score + results.media_score + results.link_score + results.perf_score) / 5)
  results.overall_score = overallScore
  
  if (overallScore >= 80) {
    results.overall_status = 'healthy'
  } else if (overallScore >= 60) {
    results.overall_status = 'warning'
  } else {
    results.overall_status = 'critical'
  }

  return results
}