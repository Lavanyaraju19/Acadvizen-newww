import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '../../../../lib/supabaseServer'
import { createEventDeduper } from '../../../../lib/wordpress/webhook'
import { handleContentRequest } from '../../../../lib/wordpress/contentApi'
import { publishPage, startPageDraft } from '../../../../lib/pageDrafts'
import { revalidateCmsMutation } from '../../cms/_utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Structured Main content edited in the WordPress central admin (Acadvizen Master Admin → Main
// Website). Signed with WORDPRESS_CMS_WEBHOOK_SECRET; off unless WORDPRESS_CONTENT_API_ENABLED=true.
const deduper = createEventDeduper()

export async function POST(request) {
  const db = getServerSupabaseClient({ preferServiceRole: true })
  const { status, body } = await handleContentRequest({
    rawBody: await request.text(),
    headers: request.headers,
    config: {
      enabled: process.env.WORDPRESS_CONTENT_API_ENABLED === 'true',
      secret: String(process.env.WORDPRESS_CMS_WEBHOOK_SECRET || ''),
    },
    deps: {
      db,
      deduper,
      revalidate: (contentType, options) => revalidateCmsMutation(contentType, options),
      publishPage: (id) => publishPage(db, id),
      startPageDraft: (id) => startPageDraft(db, id),
      audit: async ({ action, entity, id, actor, request_id: requestId, changes }) => {
        await db.from('audit_log').insert({
          user_id: null,
          action: `wordpress:${action}`,
          entity_type: entity,
          entity_id: id || null,
          changes: { ...changes, actor, request_id: requestId, source: 'wordpress-central-admin' },
          ip_address: (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null,
          user_agent: request.headers.get('user-agent') || null,
        })
      },
      log: (level, details) => console.error(`[wordpress-content] ${level}`, details),
    },
  })
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
