import { NextResponse } from 'next/server'
import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from '../../../../../lib/supabaseServer'
import { buildPublicSitemapEntries, entriesToXml, markSitemapGenerated } from '../../../../../lib/publicSitemap'

export const dynamic = 'force-dynamic'

// Delegates to the same builder as the public /sitemap.xml route so the admin
// "Generate/Download" preview can never drift from what is actually being served live.
export async function GET() {
  try {
    const entries = await buildPublicSitemapEntries()
    const xml = entriesToXml(entries)

    const supabase = getServerSupabaseClient({ preferServiceRole: hasValidSupabaseServiceRoleKey() })
    if (supabase) await markSitemapGenerated(supabase)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new NextResponse(entriesToXml([]), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
