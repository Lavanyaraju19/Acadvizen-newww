import { forwardToWordPress } from '../../../../../../lib/wordpress/proxy'
import { isAllowedRestRoute } from '../../../../../../lib/wordpress/proxyPolicy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// /wp-json/* on the Main Website is rewritten here (next.config.mjs). Only allowlisted form
// endpoints (lib/wordpress/proxyPolicy.js) are forwarded to WordPress; everything else is 404.
async function handle(request, { params }) {
  const { route = [] } = await params
  const routePath = route.map((segment) => decodeURIComponent(segment)).join('/')
  if (!isAllowedRestRoute(request.method, routePath)) {
    return new Response(JSON.stringify({ code: 'rest_no_route', message: 'No route was found matching the URL and request method.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    })
  }
  const body = request.method === 'POST' ? await request.arrayBuffer() : undefined
  return forwardToWordPress(request, `/wp-json/${routePath}`, body)
}

export const GET = handle
export const POST = handle
