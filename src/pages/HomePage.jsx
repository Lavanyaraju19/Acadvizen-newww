import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function HomePage() {
  const [tools, setTools] = useState([])

  useEffect(() => {
    loadTools()
  }, [])

  async function loadTools() {
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(75)
    if (data) setTools(data)
  }

  const fallbackToolNames = useMemo(
    () => [
      'Google Ads', 'Meta Ads', 'SEMrush', 'Ahrefs', 'HubSpot', 'Mailchimp', 'Canva', 'Adobe', 'ChatGPT',
      'Google Analytics 4', 'Google Tag Manager', 'Zoho CRM', 'Salesforce', 'Hootsuite', 'Buffer', 'Notion',
      'ClickUp', 'Trello', 'Slack', 'Hotjar', 'Crazy Egg', 'Shopify', 'WordPress', 'Webflow',
      'Screaming Frog', 'Moz', 'Ubersuggest', 'SimilarWeb', 'LinkedIn Ads', 'Twitter Ads', 'YouTube Studio',
      'Google Search Console', 'Looker Studio', 'Google Keyword Planner', 'Meta Business Suite', 'TikTok Ads',
      'Snapchat Ads', 'Pinterest Ads', 'Bing Ads', 'Google Optimize', 'VWO', 'Optimizely', 'Unbounce',
      'Instapage', 'Typeform', 'Jotform', 'Klaviyo', 'Sendinblue', 'ActiveCampaign', 'Marketo', 'Asana',
      'Monday.com', 'Airtable', 'Zapier', 'Make (Integromat)', 'Figma', 'FigJam', 'Notion AI', 'ChatGPT Enterprise',
      'Grammarly', 'Surfer SEO', 'Jasper', 'Copy.ai', 'Semrush Listing Management', 'BrightLocal', 'Yext',
      'Sprout Social', 'Later', 'Loom', 'Calendly', 'Stripe', 'Razorpay', 'Freshdesk', 'Intercom', 'Zendesk',
      'Drift', 'Clearbit', 'Hunter', 'Apollo', 'Mailshake', 'Lemlist', 'G2', 'Capterra', 'Meta Pixel',
      'GA Debugger', 'Tag Assistant',
    ],
    [],
  )

  const fallbackTools = useMemo(
    () =>
      fallbackToolNames.map((name, index) => ({
        id: `fallback-${index}`,
        name,
        slug: slugify(name),
        category: 'Digital marketing',
        image_url: null,
      })),
    [fallbackToolNames],
  )

  const displayTools = (tools.length > 0 ? tools : fallbackTools).map((tool, index) => ({
    ...tool,
    id: tool.id ?? `tool-${index}`,
    slug: tool.slug ?? slugify(tool.name || 'tool'),
  }))

  const midpoint = Math.ceil(displayTools.length / 2)
  const rowOne = displayTools.slice(0, midpoint)
  const rowTwo = displayTools.slice(midpoint)
  const rowOneMarquee = rowOne.length > 0 ? [...rowOne, ...rowOne] : []
  const rowTwoMarquee = rowTwo.length > 0 ? [...rowTwo, ...rowTwo] : []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating background accents */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-400/10 blur-[110px]" />
        <div className="absolute top-16 right-0 h-96 w-96 rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-400/10 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <Section className="overflow-hidden">
        <Container>
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-6 h-24 w-24 rounded-full bg-teal-400/20 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute top-10 right-0 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
                Premium digital marketing platform
              </div>

              <h1 className="mt-7 text-4xl md:text-6xl font-semibold tracking-tight text-slate-50">
                Acadvizen - Build Your Own{' '}
                <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  Digital Marketing Course
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
                Acadvizen combines elite courses, an operator-grade tool library, and curated resources to help you
                execute campaigns faster—with clarity and confidence.
                Choose your tools, customize your syllabus, and train for real jobs in India &amp; abroad.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/courses"
                  data-cursor="button"
                  className="group inline-flex items-center justify-center rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,191,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
                >
                  Explore Courses <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
                <Link
                  to="/tools"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  Explore Tools
                </Link>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Tools Marquee */}
      <Section className="py-14 md:py-20">
        <Container>
          <div className="flex items-end justify-between gap-6 mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45 }}
                className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
              >
                75+ Tools, one premium workspace
              </motion.h2>
              <p className="mt-2 text-slate-300">
                Auto-scrolling library. Hover to pause. Click any tool to open details.
              </p>
            </div>
            <Link
              to="/tools"
              data-cursor="hover"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
            >
              Browse all tools <span className="opacity-80">→</span>
            </Link>
          </div>

          <div className="overflow-hidden py-6 flex gap-4">
            {rowOneMarquee.map((tool, i) => (
              <Link
                key={`${tool.id}-${i}`}
                to={`/tools/${tool.slug}`}
                data-cursor="hover"
                className="group relative flex w-[220px] shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur transition-transform hover:-translate-y-0.5"
              >
                <div className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden flex items-center justify-center">
                  {tool.image_url ? (
                    <img src={tool.image_url} alt={tool.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-teal-200 font-semibold">{tool.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="relative min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{tool.name}</div>
                  <div className="text-xs text-slate-400 truncate">{tool.category || 'Digital marketing'}</div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}
