import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getDefaultSitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
}

export async function GET(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse(getDefaultSitemap(), {
        headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
      })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get sitemap settings
    const { data: settings } = await supabase
      .from('sitemap_settings')
      .select('*')
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'
    const sitemapItems = []

    // Add static pages
    sitemapItems.push({ loc: `${baseUrl}`, changefreq: 'weekly', priority: 1.0 })

    // Add pages
    if (settings?.include_pages !== false) {
      const { data: pages } = await supabase
        .from('pages')
        .select('slug, updated_at')
        .eq('status', 'published')
        .neq('exclude_from_sitemap', true)

      if (pages) {
        pages.forEach(page => {
          sitemapItems.push({
            loc: `${baseUrl}/${page.slug}`,
            lastmod: page.updated_at,
            changefreq: settings.changefreq_pages || 'weekly',
            priority: settings.priority_pages || 0.8,
          })
        })
      }
    }

    // Add blogs
    if (settings?.include_blogs !== false) {
      const { data: blogs } = await supabase
        .from('blogs')
        .select('slug, updated_at')
        .eq('status', 'published')
        .neq('exclude_from_sitemap', true)

      if (blogs) {
        blogs.forEach(blog => {
          sitemapItems.push({
            loc: `${baseUrl}/blog/${blog.slug}`,
            lastmod: blog.updated_at,
            changefreq: settings.changefreq_blogs || 'weekly',
            priority: settings.priority_blogs || 0.6,
          })
        })
      }
    }

    // Add courses
    if (settings?.include_courses !== false) {
      const { data: courses } = await supabase
        .from('courses')
        .select('slug, updated_at')
        .eq('is_active', true)
        .neq('exclude_from_sitemap', true)

      if (courses) {
        courses.forEach(course => {
          sitemapItems.push({
            loc: `${baseUrl}/courses/${course.slug}`,
            lastmod: course.updated_at,
            changefreq: settings.changefreq_courses || 'monthly',
            priority: settings.priority_courses || 0.7,
          })
        })
      }
    }

    // Add city pages
    if (settings?.include_cities !== false) {
      const { data: cities } = await supabase
        .from('city_pages')
        .select('slug, updated_at')
        .eq('is_active', true)
        .neq('exclude_from_sitemap', true)

      if (cities) {
        cities.forEach(city => {
          sitemapItems.push({
            loc: `${baseUrl}/cities/${city.slug}`,
            lastmod: city.updated_at,
            changefreq: settings.changefreq_cities || 'monthly',
            priority: settings.priority_cities || 0.5,
          })
          sitemapItems.push({
            loc: `${baseUrl}/digital-marketing-course-in-${city.slug}`,
            lastmod: city.updated_at,
            changefreq: settings.changefreq_cities || 'monthly',
            priority: settings.priority_cities || 0.6,
          })
        })
      }
    }

    // Add tools
    if (settings?.include_tools !== false) {
      const { data: tools } = await supabase
        .from('tools_extended')
        .select('slug, updated_at')
        .eq('is_active', true)
        .neq('exclude_from_sitemap', true)

      if (tools) {
        tools.forEach(tool => {
          sitemapItems.push({
            loc: `${baseUrl}/tools/${tool.slug}`,
            lastmod: tool.updated_at,
            changefreq: 'monthly',
            priority: 0.5,
          })
        })
      }
    }

    // Add landing pages
    if (settings?.include_landing_pages !== false) {
      const { data: landingPages } = await supabase
        .from('location_pages')
        .select('slug, updated_at')
        .eq('status', 'published')
        .neq('exclude_from_sitemap', true)

      if (landingPages) {
        landingPages.forEach(landing => {
          sitemapItems.push({
            loc: `${baseUrl}/${landing.slug}`,
            lastmod: landing.updated_at,
            changefreq: settings.changefreq_landing_pages || 'weekly',
            priority: settings.priority_landing_pages || 0.7,
          })
        })
      }
    }

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems.map(item => `  <url>
    <loc>${item.loc}</loc>
    ${item.lastmod ? `<lastmod>${new Date(item.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Try to update last_generated timestamp (non-critical)
    try {
      await supabase
        .from('sitemap_settings')
        .update({ last_generated: new Date().toISOString() })
    } catch {
      // ignore
    }

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new NextResponse(getDefaultSitemap(), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
