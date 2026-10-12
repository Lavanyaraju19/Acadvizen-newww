// Shared helpers for the browser acceptance tests of the Main Website screens (LOCAL by default;
// the same steps run on production once its connection is on). Prints no credential.
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { signPayload } from '../../lib/wordpress/signature.js'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')

export const WP = process.env.WP_URL || 'http://localhost:8088'
export const MAIN = process.env.MAIN_URL || 'http://localhost:3100'
export const T = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
export const screen = (entity, extra = '') => `${WP}/wp-admin/admin.php?page=acadvizen-cms-main&entity=${entity}${extra}`

export function createRecorder(out) {
  fs.mkdirSync(out, { recursive: true })
  const results = []
  const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`) }
  return { results, check, out }
}

export async function get(p) {
  const r = await fetch(`${MAIN}${p}${p.includes('?') ? '&' : '?'}t=${Date.now()}`, { redirect: 'manual' })
  return { status: r.status, html: r.status === 200 ? await r.text() : '' }
}

/** Signed call to Main's content API (as the WordPress plugin makes it). */
export async function api(body, secret = process.env.WORDPRESS_CMS_WEBHOOK_SECRET) {
  const raw = JSON.stringify({ purpose: 'content', request_id: randomUUID(), actor: { login: 'acceptance-test' }, ...body })
  const ts = Math.floor(Date.now() / 1000)
  const r = await fetch(`${MAIN}/api/wordpress/content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Acadvizen-Timestamp': String(ts), 'X-Acadvizen-Signature': signPayload(raw, ts, secret) }, body: raw })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

export async function shot(page, url, file, width) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide', timeout: 90000 })
  return file
}

/** Share of pixels that differ noticeably (any channel by more than 24 of 255); null when sizes differ. */
export async function diffRatio(a, b) {
  const [x, y] = await Promise.all([sharp(a).raw().ensureAlpha().toBuffer({ resolveWithObject: true }), sharp(b).raw().ensureAlpha().toBuffer({ resolveWithObject: true })])
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return { ratio: null, size: `${x.info.width}x${x.info.height} vs ${y.info.width}x${y.info.height}` }
  let changed = 0
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i] - y.data[i]) > 24 || Math.abs(x.data[i + 1] - y.data[i + 1]) > 24 || Math.abs(x.data[i + 2] - y.data[i + 2]) > 24) changed++
  }
  return { ratio: changed / (x.data.length / 4), size: `${x.info.width}x${x.info.height}` }
}

export async function adminShot(page, file) {
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await page.screenshot({ path: file, animations: 'disabled', timeout: 30000 }).catch((e) => console.log(`(screenshot not taken: ${e.message.split('\n')[0]})`))
}

/**
 * Headless Chromium on Windows sometimes stops painting wp-admin; a normal click then waits forever.
 * Clicks and ticks are tried normally first, then sent as the same DOM event (counted).
 */
export async function launch() {
  const browser = await chromium.launch()
  const counter = { fallbacks: 0 }
  const probe = await (await browser.newContext()).newPage()
  const proto = Object.getPrototypeOf(probe.locator('body'))
  const realClick = proto.click
  proto.click = async function (options = {}) {
    try { return await realClick.call(this, { timeout: 4000, ...options }) } catch (error) { if (options.trial) throw error; counter.fallbacks++; return this.dispatchEvent('click') }
  }
  for (const [name, wanted] of [['check', true], ['uncheck', false]]) {
    const real = proto[name]
    proto[name] = async function (options = {}) {
      try { return await real.call(this, { timeout: 4000, ...options }) } catch (error) {
        counter.fallbacks++
        await this.evaluate((box, on) => { if (box.checked !== on) box.click() }, wanted)
        if ((await this.isChecked()) !== wanted) throw error
      }
    }
  }
  await probe.context().close()
  return { browser, counter }
}

export async function login(browser, user, pass, viewport = { width: 1440, height: 1100 }) {
  const page = await (await browser.newContext({ viewport })).newPage()
  page.on('dialog', (d) => d.accept())
  const goto = page.goto.bind(page)
  page.goto = (url, options = {}) => goto(url, { waitUntil: 'domcontentloaded', ...options })
  await page.goto(`${WP}/wp-login.php`)
  await page.fill('#user_login', user)
  await page.fill('#user_pass', pass)
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('#wp-submit').click()])
  return page
}

export async function viewer(browser) {
  const page = await (await browser.newContext()).newPage()
  // Public pages are checked without third-party tracking (nothing is sent to analytics or ads).
  await page.route('**/*', (r) => (/facebook|google|doubleclick|clarity|hotjar|vercel-insights/.test(new URL(r.request().url()).host) ? r.abort() : r.continue()))
  return page
}

/**
 * Removes a test blog's Enrollment copy for good, through WordPress's own Posts screens: rows whose
 * title is exactly `title` are trashed, then deleted permanently one by one. "Empty Trash" is never
 * used, so posts trashed by anyone else stay untouched. Returns how many copies were deleted.
 */
export async function removeEnrollmentCopies(page, title) {
  const rows = async (status) => {
    await page.goto(`${WP}/wp-admin/edit.php?post_type=post&post_status=${status}&s=${encodeURIComponent(title)}`)
    const found = []
    for (const row of await page.locator('#the-list tr').all()) {
      // Every row carries its exact title in WordPress's hidden quick-edit data (trashed rows have no title link).
      if ((await row.locator('.hidden .post_title').textContent().catch(() => '') || '').trim() !== title) continue
      found.push(await row.locator(status === 'trash' ? '.row-actions .delete a' : '.row-actions .trash a').getAttribute('href'))
    }
    return found.filter(Boolean)
  }
  for (const href of await rows('all')) await page.goto(new URL(href, `${WP}/wp-admin/`).href)
  let deleted = 0
  for (const href of await rows('trash')) {
    await page.goto(new URL(href, `${WP}/wp-admin/`).href)
    deleted++
  }
  return deleted
}

/** How many Enrollment posts titled exactly `title` remain (listed or in the trash). */
export async function enrollmentCopiesLeft(page, title) {
  let left = 0
  for (const status of ['all', 'trash']) {
    await page.goto(`${WP}/wp-admin/edit.php?post_type=post&post_status=${status}&s=${encodeURIComponent(title)}`)
    for (const cell of await page.locator('#the-list tr .hidden .post_title').allTextContents()) if (cell.trim() === title) left++
  }
  return left
}

export const notice = async (page) => (await page.locator('.notice-success p, .notice-error p').first().innerText().catch(() => '')).trim()
export async function saveForm(page) { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('#acv-main-form input[type=submit]').click()]); return notice(page) }
export async function follow(page, locator) { await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), locator.click()]); return notice(page) }
