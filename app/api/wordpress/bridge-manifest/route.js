import { NextResponse } from 'next/server'
import { getWordPressConfig } from '../../../../lib/wordpress/config'
import { fetchBridgeManifest } from '../../../../lib/wordpress/bridge'
import { isInternalRequest } from '../../../../lib/wordpress/internalToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Read by src/middleware.js (Edge) to know which addresses are WordPress-rendered pages. The
// manifest itself is cached in the Next.js data cache and refreshed by the signed webhook.
export async function GET(request) {
  const config = getWordPressConfig()
  if (!config.enabled || !(await isInternalRequest(request, config.secret))) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
  const manifest = await fetchBridgeManifest()
  return NextResponse.json({ ok: Boolean(manifest), manifest }, { headers: { 'Cache-Control': 'no-store' } })
}
