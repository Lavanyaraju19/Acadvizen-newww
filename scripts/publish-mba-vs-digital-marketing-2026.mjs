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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
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

const post = {
  title:
    'MBA vs Digital Marketing Course in 2026: The Smart Career Decision for a Future-Ready Professional',
  slug: 'mba-vs-digital-marketing-2026',
  excerpt:
    'Confused between MBA and Digital Marketing in 2026? Discover which career path offers better ROI, faster growth, AI integration, and long-term opportunities.',
  content: `<h1>MBA vs Digital Marketing Course in 2026: The Smart Career Decision for a Future-Ready Professional</h1>
<p>Choosing the right career path in 2026 is not only about prestige, it is about adaptability, employability, and return on investment. For many students and working professionals, the core question is clear: should you pursue a traditional MBA or build a modern skill stack through a Digital Marketing course?</p>
<p>Both paths can lead to strong careers, but they serve different goals. This guide compares them through practical lenses: cost, speed, AI readiness, growth potential, and long-term career outcomes.</p>

<h2>The Career Landscape in 2026</h2>
<p>Businesses are now digital-first by default. Marketing, sales, analytics, and customer engagement are all powered by online platforms and data systems. At the same time, management roles still carry value in strategy, operations, and leadership. The difference is how quickly each path helps you become job-ready in a changing market.</p>
<p>MBA programs are broad and management-focused. Digital Marketing programs are execution-focused and typically aligned with current tools, campaigns, and measurable business results.</p>

<h2>MBA in 2026: Strengths and Limitations</h2>
<p>An MBA can be a strong choice if your long-term goal is corporate leadership, consulting, or specialized business functions. It builds strong fundamentals in finance, operations, organizational behavior, and business strategy.</p>
<p>However, many MBA paths require significant time and financial investment. In a market where hiring cycles move quickly, professionals often need faster skill deployment and demonstrable portfolio outcomes.</p>

<h2>The Digital Marketing Advantage in 2026</h2>
<p>Digital Marketing has become one of the most practical and high-demand career tracks because companies of all sizes depend on online growth. From startups to global enterprises, every business needs performance marketing, content systems, SEO, paid media, and social media conversion strategies.</p>
<p>Compared to many MBA tracks, digital marketing often offers faster entry into paid roles, lower learning cost, and clearer performance metrics. You can prove value through campaign results, analytics dashboards, lead generation, and conversion optimization.</p>
<img src="/blog/mba-vs-digital-marketing-2026/digital-marketing-types.jpg" alt="Different digital marketing specializations in 2026" class="w-full rounded-xl my-8" />

<h2>SEO and AI-Powered Marketing Systems</h2>
<p>In 2026, SEO is no longer just keyword placement. It includes search intent mapping, topical authority, technical performance, and AI-assisted content workflows. Marketers now use AI to accelerate research, automate repetitive tasks, and optimize strategy with real-time signals.</p>
<p>This creates an advantage for professionals trained in modern digital systems. Employers are looking for people who can combine human strategy with AI tools to scale visibility and revenue responsibly.</p>
<img src="/blog/mba-vs-digital-marketing-2026/seo-ai.jpg" alt="SEO and AI-powered marketing workflow" class="w-full rounded-xl my-8" />

<h2>Industry Growth and Social Media Strategy</h2>
<p>Social platforms continue to influence discovery, trust, and purchase decisions across industries. Brands now require specialists who understand platform behavior, audience segmentation, creative testing, short-form content strategy, and performance analytics.</p>
<p>From D2C brands to B2B services, social strategy is directly tied to pipeline and revenue. This is one reason digital marketing roles continue to expand in both in-house and agency teams.</p>
<img src="/blog/mba-vs-digital-marketing-2026/social-media.jpg" alt="Social media growth strategy and industry demand" class="w-full rounded-xl my-8" />

<h2>ROI Comparison: MBA vs Digital Marketing</h2>
<p>For many learners, ROI depends on three factors: total cost, time to employability, and salary growth trajectory. MBA programs may provide a strong long-term brand signal, but they often come with higher tuition and a longer payoff period.</p>
<p>Digital Marketing courses, when practical and project-based, can produce faster outcomes because the hiring market rewards proven execution and measurable results.</p>

<h2>Who Should Choose Which Path?</h2>
<p>Choose MBA if you are targeting structured management pathways, leadership tracks in large organizations, or business functions that explicitly require formal management credentials.</p>
<p>Choose Digital Marketing if you want fast skill-to-job conversion, high adaptability to AI-led changes, and direct involvement in growth roles such as SEO specialist, performance marketer, content strategist, social media manager, or growth analyst.</p>

<h2>The Smart Career Decision for a Future-Ready Professional</h2>
<p>In 2026, the smartest decision is the one aligned to where the market is moving. Digital Marketing offers speed, relevance, and future-facing capability, especially for professionals who want practical outcomes in a technology-accelerated economy.</p>
<p>If your goal is to build a resilient, high-growth career with AI integration and real business impact, Digital Marketing is increasingly the stronger and more agile path.</p>`,
  featured_image: '/blog/mba-vs-digital-marketing-2026/featured.jpg',
  category: 'Career',
  status: 'published',
  is_published: true,
  meta_description:
    'Confused between MBA and Digital Marketing in 2026? Discover the smarter career choice based on ROI, growth, AI integration, and industry demand.',
  published_at: new Date().toISOString(),
}

const optionalCols = new Set(['category', 'status', 'meta_description'])

async function upsertPost(payload) {
  const { data, error } = await supabase.from('blog_posts').upsert([payload], { onConflict: 'slug' }).select('id,slug')
  return { data, error }
}

let attempt = { ...post }
let res

while (true) {
  res = await upsertPost(attempt)
  if (!res.error) break

  const message = String(res.error.message || '')
  const missingColMatch = message.match(/'([^']+)'/)
  const missingCol = missingColMatch?.[1]

  if (missingCol && optionalCols.has(missingCol) && Object.hasOwn(attempt, missingCol)) {
    delete attempt[missingCol]
    continue
  }

  break
}

if (res.error) {
  console.error('Failed to publish blog post:', res.error.message)
  process.exit(1)
}

console.log('Published blog post:', res.data?.[0]?.slug || post.slug)
console.log('http://localhost:5173/blog/mba-vs-digital-marketing-2026')
