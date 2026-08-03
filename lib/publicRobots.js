import { getServerSupabaseClient, hasValidSupabaseServiceRoleKey } from './supabaseServer'

const DEFAULT_RULES = [
  { userAgent: '*', allow: '/', disallow: ['/admin', '/admin-login', '/admin-dashboard'] },
]

// Admin only ever writes simple `Key: value` lines (via the free-text editor and its
// "Quick Rules" buttons), so a line-based parser round-trips the real directives without
// needing the admin's raw text to conform to any stricter format.
function parseRobotsDirectives(text) {
  const blocks = String(text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')))
    .filter((lines) => lines.length)

  const rules = []
  const sitemaps = []
  let host = null

  for (const lines of blocks) {
    const userAgents = []
    const allow = []
    const disallow = []
    let crawlDelay

    for (const line of lines) {
      const match = line.match(/^([a-zA-Z-]+)\s*:\s*(.*)$/)
      if (!match) continue
      const key = match[1].toLowerCase()
      const value = match[2].trim()
      if (!value) continue
      if (key === 'user-agent') userAgents.push(value)
      else if (key === 'allow') allow.push(value)
      else if (key === 'disallow') disallow.push(value)
      else if (key === 'crawl-delay') crawlDelay = Number(value) || undefined
      else if (key === 'sitemap') sitemaps.push(value)
      else if (key === 'host') host = value
    }

    if (userAgents.length || allow.length || disallow.length || crawlDelay) {
      rules.push({
        userAgent: userAgents.length ? (userAgents.length === 1 ? userAgents[0] : userAgents) : '*',
        ...(allow.length ? { allow: allow.length === 1 ? allow[0] : allow } : {}),
        ...(disallow.length ? { disallow: disallow.length === 1 ? disallow[0] : disallow } : {}),
        ...(crawlDelay ? { crawlDelay } : {}),
      })
    }
  }

  return { rules, sitemaps, host }
}

export async function fetchRobotsTxtSetting() {
  try {
    const supabase = getServerSupabaseClient({ preferServiceRole: hasValidSupabaseServiceRoleKey() })
    if (!supabase) return null
    const { data } = await supabase
      .from('global_settings')
      .select('robots_txt')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.robots_txt || null
  } catch {
    return null
  }
}

export async function getPublicRobotsConfig() {
  const raw = await fetchRobotsTxtSetting()
  if (raw && String(raw).trim()) {
    const parsed = parseRobotsDirectives(raw)
    if (parsed.rules.length) return parsed
  }
  return { rules: DEFAULT_RULES, sitemaps: [], host: null }
}

export function getDefaultRobotsTxt(siteUrl) {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-login
Disallow: /admin-dashboard

Sitemap: ${siteUrl}/sitemap.xml`
}
