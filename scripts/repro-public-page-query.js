require('dotenv').config({ path: '.env.local' })
const { fetchPublishedRecordBySlug } = require('./lib/cmsPublishing')
const { getServerSupabaseClient } = require('./lib/supabaseServer')

;(async () => {
  const supabase = getServerSupabaseClient()
  const row = await fetchPublishedRecordBySlug(supabase, {
    table: 'pages',
    slug: 'dropshipping-course-in-bangalore',
    contentType: 'page',
    requestedRoute: '/dropshipping-course-in-bangalore',
  })
  console.log(JSON.stringify(row, null, 2))
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
