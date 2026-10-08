import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getWordPressConfig } from '../../../../lib/wordpress/config'
import { createEventDeduper, handleRevalidateRequest } from '../../../../lib/wordpress/webhook'
import { checkMainBlogSlug } from '../../../../lib/wordpress/mainBlogSlugs'
import { checkMainPagePath } from '../../../../lib/wordpress/mainPagePaths'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Called by the Acadvizen Master Admin WordPress plugin (signed with WORDPRESS_CMS_WEBHOOK_SECRET)
// whenever a Main Blog or a WordPress-rendered page is published, updated, unpublished or deleted.
const deduper = createEventDeduper()

export async function POST(request) {
  const { status, body } = await handleRevalidateRequest({
    rawBody: await request.text(),
    headers: request.headers,
    config: getWordPressConfig(),
    deduper,
    revalidateTag,
    revalidatePath,
    checkSlug: checkMainBlogSlug,
    checkPagePath: checkMainPagePath,
    log: (event, details) => {
      const write = event === 'rejected' ? console.warn : console.info
      write(`[wordpress-webhook] ${event}`, details)
    },
  })
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
