import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    )

    // Get robots.txt from global_settings
    const { data: settings } = await supabase
      .from('global_settings')
      .select('robots_txt')
      .single()

    const robotsTxt = settings?.robots_txt || getDefaultRobotsTxt()

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Robots.txt error:', error)
    return new NextResponse(getDefaultRobotsTxt(), {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}

function getDefaultRobotsTxt() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/api/cms/sitemap/generate`
}