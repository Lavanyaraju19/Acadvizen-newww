import path from 'node:path'
import {
  getSupabaseClientOrResponse,
  jsonError,
  jsonOk,
  readJsonBody,
} from '../../../_utils'
import { formSubmitLimiter } from '../../../../../../lib/rateLimiter'
import { sendMail, verifyRecaptcha, deliverWebhook } from '../../../../../../lib/mailer'
import { HONEYPOT_FIELD, evaluateFieldCondition } from '../../../../../../lib/formConditional'

export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // 4MB - safely under typical serverless request body limits
const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function sanitizeBaseName(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'attachment'
}

function isUploadPayload(value) {
  return Boolean(value) && typeof value === 'object' && typeof value.dataBase64 === 'string' && value.dataBase64.length > 0
}

// Public form submissions run as anon, and anon has no storage write access (see
// storage_admin_write in 20260520_admin_cms_storage_alignment.sql). File/image fields
// arrive as base64 in the JSON body instead of multipart, and the server (with the
// service-role client already used for the insert below) uploads them itself - this avoids
// opening up a new public storage-write RLS policy just for form attachments.
async function persistUploadField(supabase, field, payload) {
  const mimeType = String(payload.mimeType || '').toLowerCase()
  if (!ALLOWED_UPLOAD_MIME.has(mimeType)) {
    throw new Error(`"${field.label || field.id}" must be an image, PDF, or Word document.`)
  }

  const base64 = payload.dataBase64.includes(',') ? payload.dataBase64.split(',').pop() : payload.dataBase64
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`"${field.label || field.id}" is too large. Maximum file size is 4MB.`)
  }

  const bucket = field.type === 'image' ? 'images' : 'documents'
  const extension = path.extname(String(payload.fileName || '')).replace('.', '') || (mimeType.split('/')[1] || 'bin')
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const storagePath = `form-submissions/${sanitizeBaseName(payload.fileName)}-${stamp}.${extension}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: false,
  })
  if (uploadError) throw new Error(`Failed to upload "${field.label || field.id}": ${uploadError.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return {
    name: payload.fileName || storagePath,
    url: data?.publicUrl || '',
    type: mimeType,
    size: buffer.byteLength,
  }
}

function submissionValueToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return typeof value.url === 'string' ? (value.name || value.url) : JSON.stringify(value)
  return String(value)
}

function buildNotificationHtml(form, submissionData, fields) {
  const rows = fields
    .filter((f) => f.type !== 'html' && f.type !== 'hidden')
    .map((f) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-weight:600;">${f.label || f.id}</td><td style="padding:4px 0;">${submissionValueToText(submissionData[f.id])}</td></tr>`)
    .join('')
  return `<h2>New submission - ${form.name}</h2><table>${rows}</table>`
}

export async function POST(request, { params }) {
  const { id } = await params
  const clientIp = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1'

  const rateLimit = formSubmitLimiter.check(`form:${id}:${clientIp}`)
  if (!rateLimit.allowed) {
    return jsonError(`Too many submissions. Please try again in ${rateLimit.retryAfter} seconds.`, 429)
  }

  const { supabase, response } = await getSupabaseClientOrResponse(request, { preferServiceRole: true })
  if (response) return response

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id, name, status, store_submissions, success_message, redirect_url, fields, send_email, email_to, email_subject, webhook_enabled, webhook_url, autoresponder_enabled, autoresponder_email_field, autoresponder_subject, autoresponder_body')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (formError || !form) return jsonError('Form not found or not published.', 404)

  const body = await readJsonBody(request)
  const submissionData = body && typeof body === 'object' ? { ...body } : {}

  // Honeypot: bots fill every field including this invisible one. Real visitors never see it.
  if (submissionData[HONEYPOT_FIELD]) {
    return jsonOk({ success: true, stored: false, success_message: form.success_message, redirect_url: form.redirect_url })
  }
  delete submissionData[HONEYPOT_FIELD]

  const recaptchaToken = submissionData.recaptchaToken
  delete submissionData.recaptchaToken
  const recaptcha = await verifyRecaptcha(recaptchaToken, clientIp)
  if (!recaptcha.verified) {
    return jsonError(recaptcha.reason || 'Spam verification failed. Please try again.', 400)
  }

  const fields = Array.isArray(form.fields) ? form.fields : []

  // Fields hidden by conditional logic are cleared server-side too, so a tampered
  // request can't smuggle a value through a field the visitor never actually saw.
  for (const field of fields) {
    if (!evaluateFieldCondition(field.conditional, submissionData)) {
      delete submissionData[field.id]
    }
  }

  const uploadFields = fields.filter((field) => field?.type === 'file' || field?.type === 'image')
  for (const field of uploadFields) {
    const value = submissionData[field.id]
    if (!isUploadPayload(value)) continue
    try {
      submissionData[field.id] = await persistUploadField(supabase, field, value)
    } catch (uploadFieldError) {
      return jsonError(uploadFieldError.message, 400)
    }
  }

  if (form.store_submissions === false) {
    return jsonOk({ success: true, stored: false, success_message: form.success_message, redirect_url: form.redirect_url })
  }

  const record = {
    form_id: id,
    submission_data: submissionData,
    ip_address: clientIp,
    user_agent: request.headers.get('user-agent') || null,
    referrer: request.headers.get('referer') || null,
  }

  const { error } = await supabase.from('form_submissions').insert(record)
  if (error) return jsonError(`Failed to save submission: ${error.message}`, 500)

  // Delivery (email notification, webhook, autoresponder) never blocks or fails the
  // submission itself - a misconfigured mail server or an unreachable webhook endpoint
  // must not stop the visitor's data from being saved.
  const attachments = uploadFields
    .map((field) => submissionData[field.id])
    .filter((value) => value && typeof value === 'object' && value.url)
    .map((value) => ({ filename: value.name, path: value.url }))

  if (form.send_email && form.email_to) {
    const result = await sendMail({
      to: form.email_to,
      subject: form.email_subject || `New submission - ${form.name}`,
      html: buildNotificationHtml(form, submissionData, fields),
      attachments,
    })
    if (!result.sent) console.warn(`[forms] Notification email not sent for form ${id}: ${result.reason}`)
  }

  if (form.webhook_enabled && form.webhook_url) {
    const result = await deliverWebhook(form.webhook_url, {
      form_id: id,
      form_name: form.name,
      submitted_at: new Date().toISOString(),
      data: submissionData,
    })
    if (!result.delivered) console.warn(`[forms] Webhook delivery failed for form ${id}: ${result.reason || result.status}`)
  }

  if (form.autoresponder_enabled && form.autoresponder_email_field) {
    const submitterEmail = submissionData[form.autoresponder_email_field]
    if (typeof submitterEmail === 'string' && submitterEmail.includes('@')) {
      const result = await sendMail({
        to: submitterEmail,
        subject: form.autoresponder_subject || 'Thank you for reaching out',
        html: `<p>${(form.autoresponder_body || 'Thank you for your submission. We will get back to you soon.').replace(/\n/g, '<br/>')}</p>`,
      })
      if (!result.sent) console.warn(`[forms] Autoresponder not sent for form ${id}: ${result.reason}`)
    }
  }

  return jsonOk({ success: true, stored: true, success_message: form.success_message, redirect_url: form.redirect_url })
}
