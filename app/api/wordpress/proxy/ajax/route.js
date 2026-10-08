import { forwardToWordPress } from '../../../../../lib/wordpress/proxy'
import { isAllowedAjaxAction } from '../../../../../lib/wordpress/proxyPolicy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// /wp-admin/admin-ajax.php on the Main Website is rewritten here (next.config.mjs). Only
// allowlisted actions (lib/wordpress/proxyPolicy.js) are forwarded to WordPress.
async function readAction(request, body) {
  const fromQuery = new URL(request.url).searchParams.get('action')
  if (fromQuery || !body) return fromQuery
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return new URLSearchParams(new TextDecoder().decode(body)).get('action')
    }
    if (contentType.includes('multipart/form-data')) {
      const form = await new Response(body, { headers: { 'content-type': contentType } }).formData()
      return form.get('action')
    }
  } catch {
    return null
  }
  return null
}

async function handle(request) {
  const body = request.method === 'POST' ? await request.arrayBuffer() : undefined
  const action = await readAction(request, body)
  if (!isAllowedAjaxAction(action)) {
    return new Response('0', { status: 400, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
  }
  return forwardToWordPress(request, '/wp-admin/admin-ajax.php', body)
}

export const GET = handle
export const POST = handle
