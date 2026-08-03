const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.join(__dirname, '..', '.env.local'), quiet: true })

const slug = process.argv[2] || 'dropshipping-course-in-bangalore'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const knownTables = [
  'pages',
  'sections',
  'redirects',
  'seo_metadata',
  'seo_settings',
  'menus',
  'menu_items',
  'reusable_sections',
  'reusable_blocks',
  'page_templates',
  'page_versions',
  'content_versions',
  'media',
  'media_assets',
  'audit_logs',
  'activity_logs',
  'location_pages',
  'city_pages',
]

function uniqueRows(rows = []) {
  const seen = new Set()
  return rows.filter((row) => {
    const key = row?.id ? `id:${row.id}` : JSON.stringify(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function selectWhere(table, filter) {
  try {
    let query = supabase.from(table).select('*')
    query = filter(query)
    const { data, error } = await query
    if (error) return { rows: [], error: error.message }
    return { rows: Array.isArray(data) ? data : [], error: null }
  } catch (error) {
    return { rows: [], error: error.message || String(error) }
  }
}

async function backupTable(table, page, targetSlug) {
  const pageId = page?.id || ''
  const pathSlug = `/${targetSlug}`
  const attempts = []

  if (table === 'pages') {
    attempts.push(['slug', (query) => query.eq('slug', targetSlug)])
    if (pageId) attempts.push(['id', (query) => query.eq('id', pageId)])
  } else {
    if (pageId) attempts.push(['page_id', (query) => query.eq('page_id', pageId)])
    if (pageId) attempts.push(['entity_id', (query) => query.eq('entity_id', pageId)])
    attempts.push(['slug', (query) => query.eq('slug', targetSlug)])
    attempts.push(['page_slug', (query) => query.eq('page_slug', targetSlug)])
    attempts.push(['from_path', (query) => query.in('from_path', [pathSlug, targetSlug])])
    attempts.push(['to_path', (query) => query.in('to_path', [pathSlug, targetSlug])])
    attempts.push(['path', (query) => query.in('path', [pathSlug, targetSlug])])
  }

  const rows = []
  const errors = []
  for (const [label, filter] of attempts) {
    const result = await selectWhere(table, filter)
    if (result.error) {
      errors.push({ filter: label, error: result.error })
    } else {
      rows.push(...result.rows)
    }
  }

  return {
    rows: uniqueRows(rows),
    errors,
  }
}

async function main() {
  const pageLookup = await selectWhere('pages', (query) => query.eq('slug', slug))
  const page = pageLookup.rows[0] || null
  const backup = {
    created_at: new Date().toISOString(),
    method: 'supabase-rest-service-role',
    slug,
    page_id: page?.id || null,
    tables: {},
    table_errors: {},
  }

  for (const table of knownTables) {
    const result = await backupTable(table, page, slug)
    if (result.rows.length) backup.tables[table] = result.rows
    if (result.errors.length) backup.table_errors[table] = result.errors
  }

  const outDir = path.join(process.cwd(), 'artifacts', 'staging-backups')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `${slug}-rest-backup-${Date.now()}.json`)
  fs.writeFileSync(out, JSON.stringify(backup, null, 2))

  console.log(JSON.stringify({
    backup_path: out,
    page_found: Boolean(page),
    page_id: page?.id || null,
    backed_up_tables: Object.keys(backup.tables),
    tables_with_errors: Object.keys(backup.table_errors),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
