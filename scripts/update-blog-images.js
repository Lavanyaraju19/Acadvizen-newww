import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, published_at')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Fetch error:', error)
    process.exit(1)
  }

  if (!posts || posts.length === 0) {
    console.log('No blog posts found. Nothing to update.')
    return
  }

  const updates = posts.slice(0, 6).map((post, idx) => ({
    id: post.id,
    featured_image: `/blog-images/image${idx + 1}.jpg`,
  }))

  const { error: updateError } = await supabase
    .from('blog_posts')
    .upsert(updates, { onConflict: 'id' })

  if (updateError) {
    console.error('Update error:', updateError)
    process.exit(1)
  }

  console.log(`Updated ${updates.length} posts with featured images.`)
}

run()
