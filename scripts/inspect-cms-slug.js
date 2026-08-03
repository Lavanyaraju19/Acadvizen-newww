require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function check(table, slug) {
  const { data, error } = await supabase.from(table).select('*').eq('slug', slug).maybeSingle()
  console.log(`\nTABLE ${table}`)
  console.log('error=', error?.message || 'none')
  console.log(JSON.stringify(data, null, 2))
}

;(async () => {
  await check('pages', 'dropshipping-course-in-bangalore')
  await check('location_pages', 'dropshipping-course-in-bangalore')
  await check('city_pages', 'dropshipping-course-in-bangalore')
  await check('pages', 'digital-marketing-course-in-bangalore')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
