import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    )

    // Get sitemap settings
    const { data: settings } = await supabase
      .from('sitemap_settings')
      .select('*')
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'
    const sitemapItems = []

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
        .eq('status', 'published')
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
        .eq('status', 'published')
        .neq('exclude_from_sitemap', true)

      if (cities) {
        cities.forEach(city => {
          sitemapItems.push({
            loc: `${baseUrl}/cities/${city.slug}`,
            lastmod: city.updated_at,
            changefreq: settings.changefreq_cities || 'monthly',
            priority: settings.priority_cities || 0.5,
          })
        })
      }
    }

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems.map(item => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Update last_generated timestamp
    await supabase
      .from('sitemap_settings')
      .update({ last_generated: new Date().toISOString() })

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}