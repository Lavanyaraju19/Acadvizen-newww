const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.join(__dirname, '..', '.env.local'), quiet: true })

const slug = 'dropshipping-course-in-bangalore'
const updatedSlug = 'dropshipping-course-in-bangalore-updated-e2e'
const marker = 'ACADVIZEN_DROPSHIPPING_ADMIN_E2E'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackOriginal = {
  id: '4d1cdfb3-10ab-40f1-831a-5b6308f93887',
  title: 'Dropshipping Course In Bangalore',
  slug,
  description: "Acadvizen's Dropshipping course in Bangalore teaches you how to build and scale a profitable online store from scratch — covering niche and product research, Shopify store setup, supplier sourcing, Meta & Google ads for dropshipping, order fulfillment, and store optimization with real-time practical training.\n",
  seo_title: 'Best Dropshipping Course In Bangalore | Acadvizen',
  seo_description: 'Learn Dropshipping in Bangalore with Acadvizen. Master Shopify store setup, product research, supplier sourcing, and ad campaigns to build a profitable online business.\n',
  status: 'published',
  created_at: '2026-07-09T06:56:31.370166+00:00',
  updated_at: '2026-08-01T09:36:27.48849+00:00',
}

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function latestBackup() {
  const backupDir = path.join(process.cwd(), 'artifacts', 'staging-backups')
  if (!fs.existsSync(backupDir)) return ''
  const files = fs
    .readdirSync(backupDir)
    .filter((name) => name.startsWith(`${slug}-rest-backup-`) && name.endsWith('.json'))
    .sort()
  if (!files.length) return ''
  return path.join(backupDir, files[files.length - 1])
}

async function main() {
  const backupPath = latestBackup()
  const backup = backupPath ? JSON.parse(fs.readFileSync(backupPath, 'utf8')) : null
  const original = backup?.tables?.pages?.[0] || fallbackOriginal
  if (!original?.id) throw new Error(`Backup does not contain the original page row: ${backupPath}`)

  const { data: candidates, error } = await supabase
    .from('pages')
    .select('*')
    .or(`slug.eq.${slug},slug.eq.${updatedSlug},slug.like.${slug}-original-backup-%`)
  if (error) throw error

  const deleted = []
  for (const page of candidates || []) {
    if (page.id === original.id) continue
    if (!JSON.stringify(page).includes(marker)) {
      throw new Error(`Refusing to delete non-E2E page ${page.id} at ${page.slug}`)
    }
    await supabase.from('sections').delete().eq('page_id', page.id)
    const deleteResult = await supabase.from('pages').delete().eq('id', page.id)
    if (deleteResult.error) throw deleteResult.error
    deleted.push(page.id)
  }

  const restorePayload = {}
  for (const keyName of ['title', 'slug', 'description', 'seo_title', 'seo_description', 'status', 'created_at', 'updated_at']) {
    if (keyName in original) restorePayload[keyName] = original[keyName]
  }

  const restoredResult = await supabase
    .from('pages')
    .update(restorePayload)
    .eq('id', original.id)
    .select('*')
    .single()
  if (restoredResult.error) throw restoredResult.error

  const redirects = await Promise.all([
    supabase.from('redirects').delete().in('from_path', [`/${slug}`, `/${updatedSlug}`]),
    supabase.from('redirects').delete().in('to_path', [`/${slug}`, `/${updatedSlug}`]),
  ])
  for (const result of redirects) {
    if (result.error) throw result.error
  }

  console.log(JSON.stringify({
    backup_path: backupPath || null,
    used_fallback_backup: !backupPath,
    deleted_e2e_pages: deleted,
    restored: {
      id: restoredResult.data.id,
      title: restoredResult.data.title,
      slug: restoredResult.data.slug,
      status: restoredResult.data.status,
      updated_at: restoredResult.data.updated_at,
      e2e_marker_present: JSON.stringify(restoredResult.data).includes(marker),
    },
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
