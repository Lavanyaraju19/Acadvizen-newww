import { NextResponse } from 'next/server'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = getServerSupabaseClient({
      preferServiceRole: hasValidSupabaseServiceRoleKey(),
    })

    if (!supabase) {
      return new NextResponse(getDefaultRobotsTxt(), {
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
      })
    }

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
