const fs = require('node:fs')
const path = require('node:path')
const { Client } = require('pg')

const slug = process.argv[2] || 'dropshipping-course-in-bangalore'
const action = process.argv[3] || 'backup'
const connectionString = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!connectionString) {
  console.error('Set STAGING_DATABASE_URL, DATABASE_URL, or SUPABASE_DB_URL before running this script.')
  process.exit(1)
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

async function query(text, params = []) {
  return client.query(text, params)
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

async function getColumns(table) {
  const result = await query(
    `select column_name, data_type
     from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [table]
  )
  return result.rows
}

async function getTables() {
  const result = await query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`
  )
  return result.rows.map((row) => row.table_name)
}

async function getPageBackup(targetSlug) {
  const backup = {
    created_at: new Date().toISOString(),
    slug: targetSlug,
    tables: {},
    schema: {},
    related_table_scan: [],
  }

  const pageResult = await query('select to_jsonb(p) as row from public.pages p where slug = $1', [targetSlug])
  const page = pageResult.rows[0]?.row || null
  backup.tables.pages = page ? [page] : []
  const pageId = page?.id || null
  const tables = await getTables()

  for (const table of tables) {
    const columnRows = await getColumns(table)
    const columns = columnRows.map((row) => row.column_name)
    backup.schema[table] = columnRows

    const clauses = []
    const params = []
    function add(clause, value) {
      params.push(value)
      clauses.push(clause.replace('?', `$${params.length}`))
    }

    if (pageId && columns.includes('page_id')) add('page_id = ?', pageId)
    if (pageId && columns.includes('entity_id')) add('entity_id::text = ?', String(pageId))
    if (columns.includes('slug')) add('slug = ?', targetSlug)
    if (columns.includes('page_slug')) add('page_slug = ?', targetSlug)
    if (columns.includes('from_path')) {
      add('from_path = ?', `/${targetSlug}`)
      add('from_path = ?', targetSlug)
    }
    if (columns.includes('to_path')) {
      add('to_path = ?', `/${targetSlug}`)
      add('to_path = ?', targetSlug)
    }
    if (columns.includes('path')) {
      add('path = ?', `/${targetSlug}`)
      add('path = ?', targetSlug)
    }
    if (columns.includes('canonical_url')) add('canonical_url like ?', `%/${targetSlug}`)

    if (!clauses.length) continue

    try {
      const sql = `select to_jsonb(t) as row from public.${quoteIdent(table)} t where ${clauses.map((clause) => `(${clause})`).join(' or ')}`
      const rows = await query(sql, params)
      if (rows.rows.length) {
        backup.tables[table] = rows.rows.map((row) => row.row)
        backup.related_table_scan.push({
          table,
          rows: rows.rows.length,
          matched_columns: columns.filter((column) =>
            ['page_id', 'entity_id', 'slug', 'page_slug', 'from_path', 'to_path', 'path', 'canonical_url'].includes(column)
          ),
        })
      }
    } catch (error) {
      backup.related_table_scan.push({ table, error: error.message })
    }
  }

  return backup
}

async function backupPage(targetSlug) {
  const backup = await getPageBackup(targetSlug)
  const outDir = path.join(process.cwd(), 'artifacts', 'staging-backups')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `${targetSlug}-backup-${Date.now()}.json`)
  fs.writeFileSync(out, JSON.stringify(backup, null, 2))
  console.log(JSON.stringify({
    backup_path: out,
    page_id: backup.tables.pages?.[0]?.id || null,
    page_found: Boolean(backup.tables.pages?.length),
    related_tables: backup.related_table_scan.filter((item) => item.rows).length,
    backed_up_tables: Object.keys(backup.tables),
  }, null, 2))
}

async function inspectSchema() {
  const tables = await getTables()
  const output = {}
  for (const table of tables) {
    output[table] = (await getColumns(table)).map((row) => row.column_name)
  }
  console.log(JSON.stringify(output, null, 2))
}

async function main() {
  await client.connect()
  if (action === 'backup') await backupPage(slug)
  else if (action === 'schema') await inspectSchema()
  else throw new Error(`Unknown action: ${action}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await client.end()
    } catch {
      // noop
    }
  })
