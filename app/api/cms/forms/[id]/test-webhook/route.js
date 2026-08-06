import { ensureAdmin, jsonError, jsonOk, readJsonBody } from '../../../_utils'
import { deliverWebhook } from '../../../../../../lib/mailer'

export const dynamic = 'force-dynamic'

// Fires a real HTTP POST at the admin-configured webhook URL with a sample payload so the
// "Test Webhook" button in the Form Builder gives a genuine pass/fail, not a simulated one.
export async function POST(request, { params }) {
  const unauthorized = await ensureAdmin(request, { resource: 'forms', action: 'update' })
  if (unauthorized) return unauthorized

  const { id } = await params
  const body = await readJsonBody(request)
  const url = body?.webhookUrl
  if (!url) return jsonError('Enter a webhook URL first.', 400)

  const result = await deliverWebhook(url, {
    form_id: id,
    form_name: body?.formName || 'Test form',
    submitted_at: new Date().toISOString(),
    data: { test: true, message: 'This is a test delivery from the Acadvizen Form Builder.' },
  })

  if (!result.delivered) {
    return jsonError(result.reason || `Webhook endpoint responded with status ${result.status}.`, 502)
  }
  return jsonOk({ delivered: true, status: result.status })
}
