import { ensureAdmin, jsonOk } from '../../_utils'
import { isSmtpConfigured, isRecaptchaConfigured } from '../../../../../lib/mailer'

export const dynamic = 'force-dynamic'

// Lets the Form Builder UI show an honest "SMTP is/isn't configured" status instead of a
// static disclaimer, without ever exposing the actual credentials to the client.
export async function GET(request) {
  const unauthorized = await ensureAdmin(request, { resource: 'forms', action: 'read' })
  if (unauthorized) return unauthorized

  return jsonOk({
    smtpConfigured: isSmtpConfigured(),
    recaptchaConfigured: isRecaptchaConfigured(),
  })
}
