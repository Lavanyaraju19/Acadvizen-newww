import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFromFile(path.resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const slug = 'mba-vs-digital-marketing-2026'
const fallbackExcerpt =
  'Confused between MBA and Digital Marketing in 2026? Discover which career path offers better ROI, faster growth, AI integration, and long-term opportunities.'
const fallbackMetaDescription =
  'Confused between MBA and Digital Marketing in 2026? Discover the smarter career choice based on ROI, growth, AI integration, and industry demand.'
const fallbackFeatured = '/blog/mba-vs-digital-marketing-2026/featured.jpg'

const content = `<h2>The Career Landscape in 2026</h2>
<p>Choosing between an MBA and a Digital Marketing course in 2026 is no longer just about degree value. It is about speed, relevance, adaptability, and career outcomes in a rapidly evolving, AI-powered market.</p>
<p>Both paths can build successful careers, but they are designed for different goals. This comparison helps you decide based on return on investment, role readiness, growth opportunities, and long-term demand.</p>
<h2>The Digital Marketing Advantage in 2026</h2>
<p>Digital Marketing offers faster skill-to-job conversion because business growth is directly tied to channels like search, paid ads, social platforms, content ecosystems, and conversion optimization.</p>
<img src="/blog/mba-vs-digital-marketing-2026/digital-marketing-types.jpg" alt="Types of Digital Marketing" class="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto" />
<h2>SEO and AI-Powered Marketing Systems</h2>
<p>In 2026, SEO is deeply integrated with AI-driven workflows, intent mapping, technical performance, and content intelligence.</p>
<img src="/blog/mba-vs-digital-marketing-2026/seo-ai.jpg" alt="SEO and AI Marketing" class="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto" />
<h2>Industry Growth and Social Media Strategy</h2>
<p>Social media strategy now directly influences trust, discovery, and revenue. Brands expect marketers to understand platform behavior, creative testing, audience segmentation, and funnel-based campaign planning.</p>
<img src="/blog/mba-vs-digital-marketing-2026/social-media.jpg" alt="Social Media Strategy" class="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto" />
<h2>ROI Comparison: MBA vs Digital Marketing</h2>
<p>Career ROI in 2026 depends on total cost, time to employability, and practical role readiness.</p>
<img src="/blog/mba-vs-digital-marketing-2026/blog-additional.jpg" alt="Digital Marketing Campaign" class="w-full max-w-[800px] h-auto object-cover rounded-xl my-8 mx-auto" />
<h2>Final Decision for a Future-Ready Professional</h2>
<p>Choose MBA if your path is structured leadership in traditional management domains. Choose Digital Marketing if you want practical, technology-integrated skills with strong market demand and measurable business impact.</p>`

const candidateTables = ['posts', 'blog_posts']

async function findExisting(table) {
  const { data, error } = await supabase.from(table).select('*').eq('slug', slug).limit(1).maybeSingle()
  return { data, error }
}

async function upsertInto(table, payload) {
  return supabase.from(table).upsert([payload], { onConflict: 'slug' }).select('slug').maybeSingle()
}

let updatedTable = null
for (const table of candidateTables) {
  const existing = await findExisting(table)
  if (existing.error && /does not exist|relation|schema cache/i.test(String(existing.error.message || ''))) {
    continue
  }

  const row = existing.data || {}
  const payload = {
    ...(row.id ? { id: row.id } : {}),
    title:
      row.title ||
      'MBA vs Digital Marketing Course in 2026: The Smart Career Decision for a Future-Ready Professional',
    slug,
    excerpt: row.excerpt || fallbackExcerpt,
    content,
    featured_image: row.featured_image || fallbackFeatured,
    status: 'published',
    is_published: true,
    published_at: row.published_at || new Date().toISOString(),
    meta_description: row.meta_description || fallbackMetaDescription,
  }

  let result = await upsertInto(table, payload)
  if (result.error) {
    const msg = String(result.error.message || '')
    if (msg.includes('meta_description')) {
      delete payload.meta_description
      result = await upsertInto(table, payload)
    }
  }

  if (result.error && /status/i.test(String(result.error.message || ''))) {
    delete payload.status
    result = await upsertInto(table, payload)
  }

  if (result.error) {
    console.error(`Failed to upsert in table "${table}":`, result.error.message)
    process.exit(1)
  }

  updatedTable = table
  break
}

if (!updatedTable) {
  console.error('Could not find a writable posts table. Tried: posts, blog_posts')
  process.exit(1)
}

console.log(`Success: Updated "${slug}" in table "${updatedTable}".`)
console.log('Success: Blog content/images placement updated and published state preserved.')
