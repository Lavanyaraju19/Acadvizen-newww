import test from 'node:test'
import assert from 'node:assert/strict'
import { Client } from 'pg'
import { getAllEntityConfigs } from '../../lib/cmsEntities.js'

// Regression test for the production incident where app/api/cms/blogs/route.js wrote
// `created_by` on every new blog, but the deployed database's `blogs` table didn't have that
// column - PostgREST's error ("Could not find the 'created_by' column ... in the schema cache")
// only ever surfaced when a real Admin tried to save. This test catches that whole class of bug
// ahead of time: every field a CMS entity is allowed to write must exist as a real column on its
// table. It runs against the local disposable Supabase Postgres instance (`supabase start`),
// never against staging/production, and skips itself entirely if that instance isn't reachable
// (e.g. CI without Docker) rather than failing the whole suite.
const DB_CONFIG = {
  host: '127.0.0.1',
  port: Number(process.env.SUPABASE_DB_PORT || 55322),
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  connectionTimeoutMillis: 3000,
}

async function tryConnect() {
  const client = new Client(DB_CONFIG)
  try {
    await client.connect()
    return client
  } catch {
    return null
  }
}

test('every CMS entity allowedFields column genuinely exists on its table (schema contract)', async (t) => {
  const client = await tryConnect()
  if (!client) {
    t.skip('Local disposable Supabase Postgres is not reachable on port ' + DB_CONFIG.port + ' - skipping (start it with `supabase start` to run this test).')
    return
  }

  try {
    const configs = getAllEntityConfigs()
    const failures = []

    for (const [entityName, config] of Object.entries(configs)) {
      if (!config.table || !Array.isArray(config.allowedFields) || !config.allowedFields.length) continue

      const { rows } = await client.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`,
        [config.table]
      )

      if (!rows.length) {
        failures.push(`${entityName}: table "${config.table}" does not exist at all`)
        continue
      }

      const actualColumns = new Set(rows.map((r) => r.column_name))
      for (const field of config.allowedFields) {
        if (!actualColumns.has(field)) {
          failures.push(`${entityName}: allowedFields references "${field}" but public.${config.table} has no such column`)
        }
      }
    }

    assert.deepEqual(failures, [], `Schema contract violations found:\n${failures.join('\n')}`)
  } finally {
    await client.end()
  }
})

test('blogs.created_by exists with a type compatible with profiles.id (regression for the reported production incident)', async (t) => {
  const client = await tryConnect()
  if (!client) {
    t.skip('Local disposable Supabase Postgres is not reachable on port ' + DB_CONFIG.port + ' - skipping.')
    return
  }

  try {
    const { rows } = await client.query(
      `select data_type, udt_name from information_schema.columns
       where table_schema = 'public' and table_name = 'blogs' and column_name = 'created_by'`
    )
    assert.equal(rows.length, 1, 'public.blogs.created_by must exist')
    assert.equal(rows[0].udt_name, 'uuid', 'blogs.created_by must be uuid to match profiles.id')
  } finally {
    await client.end()
  }
})
