import { NextResponse } from 'next/server'
import { getSlugCheckConfig } from '../../../../lib/wordpress/config'
import { handleSlugCheckRequest } from '../../../../lib/wordpress/webhook'
import { checkMainBlogSlug } from '../../../../lib/wordpress/mainBlogSlugs'
import { checkMainPagePath } from '../../../../lib/wordpress/mainPagePaths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called (signed) by the Acadvizen Master Admin WordPress plugin when a Main Blog or a page for
// the Main Website is saved, so the editor can warn when the address already belongs to Main, and by
// its "Test connection" button. Answers when either WordPress integration is on (lib/wordpress/config.js).
export async function POST(request) {
  const { status, body } = await handleSlugCheckRequest({
    rawBody: await request.text(),
    headers: request.headers,
    config: getSlugCheckConfig(),
    checkSlug: checkMainBlogSlug,
    checkPagePath: checkMainPagePath,
  })
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
