import nodemailer from 'nodemailer'

let cachedTransporter = null
let cachedTransporterKey = ''

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export function isRecaptchaConfigured() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY)
}

function getTransporter() {
  if (!isSmtpConfigured()) return null
  const key = `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}:${process.env.SMTP_USER}`
  if (cachedTransporter && cachedTransporterKey === key) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  cachedTransporterKey = key
  return cachedTransporter
}

// Never throws - a notification-email failure must not fail the form submission it
// describes. Returns { sent: false, reason } instead so callers can log/report it.
export async function sendMail({ to, subject, html, text, attachments }) {
  if (!to) return { sent: false, reason: 'No recipient address provided.' }
  const transporter = getTransporter()
  if (!transporter) {
    return {
      sent: false,
      reason: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM environment variables to enable outgoing email.',
    }
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: subject || '(no subject)',
      html: html || undefined,
      text: text || (html ? undefined : ' '),
      attachments: Array.isArray(attachments) && attachments.length ? attachments : undefined,
    })
    return { sent: true }
  } catch (error) {
    return { sent: false, reason: error?.message || 'Failed to send email.' }
  }
}

export async function verifyRecaptcha(token, remoteIp) {
  if (!isRecaptchaConfigured()) return { verified: true, skipped: true }
  if (!token) return { verified: false, reason: 'Missing reCAPTCHA token.' }
  try {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    })
    if (remoteIp) params.set('remoteip', remoteIp)
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8000),
    })
    const json = await res.json()
    return json?.success ? { verified: true } : { verified: false, reason: 'reCAPTCHA verification failed.' }
  } catch (error) {
    return { verified: false, reason: error?.message || 'reCAPTCHA verification request failed.' }
  }
}

export async function deliverWebhook(url, payload) {
  if (!url) return { delivered: false, reason: 'No webhook URL configured.' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    return { delivered: res.ok, status: res.status }
  } catch (error) {
    return { delivered: false, reason: error?.message || 'Webhook request failed.' }
  }
}
