<<<<<<< HEAD
import { useEffect, useState } from 'react'
=======
﻿import { useEffect, useMemo, useState } from 'react'
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

<<<<<<< HEAD
=======
function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

>>>>>>> aa93dfa (Initial commit: website ready for deployment)
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

<<<<<<< HEAD
  const marqueeTools = tools.length > 0 ? [...tools, ...tools] : []

  return (
    <div className="min-h-screen">
=======
  const fallbackToolNames = useMemo(
    () => [
      'Google Ads',
      'Meta Ads',
      'SEMrush',
      'Ahrefs',
      'HubSpot',
      'Mailchimp',
      'Canva',
      'Adobe',
      'ChatGPT',
      'Google Analytics 4',
      'Google Tag Manager',
      'Zoho CRM',
      'Salesforce',
      'Hootsuite',
      'Buffer',
      'Notion',
      'ClickUp',
      'Trello',
      'Slack',
      'Hotjar',
      'Crazy Egg',
      'Shopify',
      'WordPress',
      'Webflow',
      'Screaming Frog',
      'Moz',
      'Ubersuggest',
      'SimilarWeb',
      'LinkedIn Ads',
      'Twitter Ads',
      'YouTube Studio',
      'Google Search Console',
      'Looker Studio',
      'Google Keyword Planner',
      'Meta Business Suite',
      'TikTok Ads',
      'Snapchat Ads',
      'Pinterest Ads',
      'Bing Ads',
      'Google Optimize',
      'VWO',
      'Optimizely',
      'Unbounce',
      'Instapage',
      'Typeform',
      'Jotform',
      'Klaviyo',
      'Sendinblue',
      'ActiveCampaign',
      'Marketo',
      'Asana',
      'Monday.com',
      'Airtable',
      'Zapier',
      'Make (Integromat)',
      'Figma',
      'FigJam',
      'Notion AI',
      'ChatGPT Enterprise',
      'Grammarly',
      'Surfer SEO',
      'Jasper',
      'Copy.ai',
      'Semrush Listing Management',
      'BrightLocal',
      'Yext',
      'Sprout Social',
      'Later',
      'Loom',
      'Calendly',
      'Stripe',
      'Razorpay',
      'Freshdesk',
      'Intercom',
      'Zendesk',
      'Drift',
      'Clearbit',
      'Hunter',
      'Apollo',
      'Mailshake',
      'Lemlist',
      'G2',
      'Capterra',
      'Meta Pixel',
      'GA Debugger',
      'Tag Assistant',
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-400/10 blur-[110px]" />
        <div className="absolute top-16 right-0 h-96 w-96 rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-400/10 blur-[120px]" />
      </div>

>>>>>>> aa93dfa (Initial commit: website ready for deployment)
      {/* Hero Section */}
      <Section className="overflow-hidden">
        <Container>
          <div className="relative">
<<<<<<< HEAD
            {/* Floating accents */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-6 h-24 w-24 rounded-full bg-teal-400/20 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute top-10 right-0 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl" />

=======
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
<<<<<<< HEAD
              className="mx-auto max-w-3xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
                Premium digital marketing platform
              </div>

              <h1 className="mt-7 text-4xl md:text-6xl font-semibold tracking-tight text-slate-50">
                Build, scale, and dominate with{' '}
                <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  75+ premium tools
=======
              className="mx-auto max-w-4xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
                Premium, build-your-own syllabus
              </div>

              <h1 className="mt-7 text-4xl md:text-6xl font-semibold tracking-tight text-slate-50">
                Acadvizen - Build Your Own{' '}
                <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  Digital Marketing Course
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
<<<<<<< HEAD
                Acadvizen combines elite courses, an operator-grade tool library, and curated resources to help you
                execute campaigns faster—with clarity and confidence.
=======
                Choose your tools, customize your syllabus, and train for real jobs in India &amp; abroad.
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/courses"
                  data-cursor="button"
                  className="group inline-flex items-center justify-center rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,191,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
                >
<<<<<<< HEAD
                  Explore Courses
                  <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">→</span>
=======
                  Build Your Syllabus
                  <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">-&gt;</span>
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                </Link>
                <Link
                  to="/tools"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
<<<<<<< HEAD
                  Browse Tools
=======
                  Explore Tools
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                </Link>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Tools Marquee */}
<<<<<<< HEAD
      {tools.length > 0 && (
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

            <Surface className="overflow-hidden">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#050b12] to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#050b12] to-transparent z-10" />

                <div className="overflow-hidden py-6">
                  <div className="advz-marquee gap-4 px-6" style={{ '--advz-marquee-duration': '44s' }}>
                    {marqueeTools.map((tool, i) => (
                      <Link
                        key={`${tool.id}-${i}`}
                        to={`/tools/${tool.slug}`}
                        data-cursor="hover"
                        className="group relative flex w-[220px] shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur transition-transform hover:-translate-y-0.5"
                      >
                        <div className="absolute -inset-6 opacity-0 blur-2xl transition-opacity group-hover:opacity-100">
                          <div className="h-full w-full rounded-[24px] bg-gradient-to-r from-teal-400/10 via-sky-400/8 to-indigo-400/10" />
                        </div>
                        <div className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden flex items-center justify-center">
=======
      <Section className="py-14 md:py-20">
        <Container>
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-8 rounded-[32px] bg-gradient-to-r from-teal-400/10 via-sky-400/5 to-indigo-400/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.45 }}
                    className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
                  >
                    75+ Industry-Ready Digital Marketing Tools
                  </motion.h2>
                  <p className="mt-2 text-slate-300">
                    Infinite scrolling marquee with premium tools you can master inside Acadvizen.
                  </p>
                </div>
                <Link
                  to="/tools"
                  data-cursor="hover"
                  className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  Browse all tools <span className="opacity-80">-&gt;</span>
                </Link>
              </div>

              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#050b12] to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#050b12] to-transparent z-10" />

                <div className="overflow-hidden py-6 space-y-6">
                  <div className="advz-marquee gap-10 px-6" style={{ '--advz-marquee-duration': '40s', animationDirection: 'reverse' }}>
                    {rowOneMarquee.map((tool, i) => (
                      <Link
                        key={`${tool.id}-row1-${i}`}
                        to={`/tools/${tool.slug}`}
                        data-cursor="hover"
                        className="group relative flex w-[220px] shrink-0 items-center gap-4 px-2 py-2 transition-transform duration-300 hover:scale-[1.03]"
                      >
                        <div className="relative h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                          {tool.image_url ? (
                            <img src={tool.image_url} alt={tool.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-teal-200 font-semibold">{tool.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="relative min-w-0">
                          <div className="text-sm font-semibold text-slate-100 truncate">{tool.name}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {tool.category || 'Digital marketing'}
                          </div>
                        </div>
<<<<<<< HEAD
=======
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="h-full w-full rounded-2xl bg-gradient-to-r from-teal-400/5 via-sky-400/5 to-indigo-400/5" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="advz-marquee gap-10 px-6" style={{ '--advz-marquee-duration': '44s', animationDirection: 'reverse' }}>
                    {rowTwoMarquee.map((tool, i) => (
                      <Link
                        key={`${tool.id}-row2-${i}`}
                        to={`/tools/${tool.slug}`}
                        data-cursor="hover"
                        className="group relative flex w-[220px] shrink-0 items-center gap-4 px-2 py-2 transition-transform duration-300 hover:scale-[1.03]"
                      >
                        <div className="relative h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
                          {tool.image_url ? (
                            <img src={tool.image_url} alt={tool.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-teal-200 font-semibold">{tool.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="relative min-w-0">
                          <div className="text-sm font-semibold text-slate-100 truncate">{tool.name}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {tool.category || 'Digital marketing'}
                          </div>
                        </div>
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="h-full w-full rounded-2xl bg-gradient-to-r from-teal-400/5 via-sky-400/5 to-indigo-400/5" />
                        </div>
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
<<<<<<< HEAD
            </Surface>

            <div className="mt-6 sm:hidden">
              <Link
                to="/tools"
                data-cursor="hover"
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
              >
                Browse all tools <span className="opacity-80">→</span>
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* Features */}
=======

              <div className="mt-6 sm:hidden">
                <Link
                  to="/tools"
                  data-cursor="hover"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  Browse all tools <span className="opacity-80">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Why Acadvizen */}
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
      <Section className="py-12 md:py-20">
        <Container>
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
            >
<<<<<<< HEAD
              Built for execution, designed to feel premium
            </motion.h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">
              Subtle motion. Glass surfaces. Operator-grade structure. Everything stays fast and readable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: 'Premium tool library', desc: 'A curated collection across SEO, ads, content, automation and more.' },
              { title: 'Course + resource hub', desc: 'Everything you need—videos, PDFs, images and LLM links in one place.' },
              { title: 'Role-based dashboards', desc: 'Admin, student, and sales experiences with secure access boundaries.' },
            ].map((feature, idx) => (
              <Surface
                key={idx}
=======
              Why We Are Different
            </motion.h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">
              Most institutes force a fixed syllabus. At Acadvizen, you build your own learning path.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              'You choose what modules you want',
              'You choose which tools you want to master',
              'Learn at your own pace',
              'Choose your specialization (SEO, Ads, Social, Analytics)',
            ].map((item, idx) => (
              <Surface
                key={item}
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
                className="p-6 md:p-7 transition-transform hover:-translate-y-1"
                motionProps={{
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { delay: idx * 0.08, duration: 0.45 },
                }}
              >
<<<<<<< HEAD
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                  <h3 className="text-lg font-semibold text-slate-50">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.desc}</p>
=======
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                  <p className="text-sm md:text-base leading-relaxed text-slate-200">{item}</p>
                </div>
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

<<<<<<< HEAD
      {/* CTA */}
      <Section className="py-14 md:py-20">
        <Container className="max-w-5xl">
          <Surface className="p-8 md:p-12 overflow-hidden">
            <div aria-hidden="true" className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="relative text-center">
              <h2 className="text-2xl md:text-4xl font-semibold text-slate-50 tracking-tight">
                Ready to build your next campaign with confidence?
              </h2>
              <p className="mt-3 text-slate-300">
                Create your account—then request approval to access the full student workspace.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  data-cursor="button"
                  className="inline-flex items-center justify-center rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </Surface>
=======
      {/* Who Is This For */}
      <Section className="py-12 md:py-20">
        <Container>
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
            >
              Who Is This For?
            </motion.h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">
              A flexible path designed for every stage of your marketing journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Freshers',
                desc: 'Start your career in digital marketing with a customized learning plan.',
              },
              {
                title: 'Working Professionals',
                desc: 'Upskill with tools and modules that match your job requirements.',
              },
              {
                title: 'Business Owners',
                desc: 'Learn marketing tools that help grow your business.',
              },
              {
                title: 'Freelancers',
                desc: 'Build your own skill stack and get more clients.',
              },
            ].map((card, idx) => (
              <Surface
                key={card.title}
                className="p-6 md:p-7 transition-transform hover:-translate-y-1"
                motionProps={{
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { delay: idx * 0.08, duration: 0.45 },
                }}
              >
                <h3 className="text-lg font-semibold text-slate-50">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.desc}</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      {/* Build Your Own Syllabus */}
      <Section className="py-12 md:py-20">
        <Container>
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
            >
              Build Your Own Syllabus
            </motion.h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">
              Combine core modules with the exact tools you want to master.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Surface
              className="p-6 md:p-7"
              motionProps={{
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45 },
              }}
            >
              <h3 className="text-lg font-semibold text-slate-50">Core Modules</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  'Digital Marketing Fundamentals',
                  'Content Marketing',
                  'SEO (On-page & Off-page)',
                  'Social Media Marketing',
                  'Google Ads & Performance Marketing',
                  'Email Marketing & Automation',
                  'Analytics (GA4 & Tag Manager)',
                ].map((module) => (
                  <span
                    key={module}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs md:text-sm text-slate-200 backdrop-blur"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </Surface>

            <Surface
              className="p-6 md:p-7"
              motionProps={{
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45, delay: 0.08 },
              }}
            >
              <h3 className="text-lg font-semibold text-slate-50">Choose Your Tools</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  'Google Ads',
                  'Meta Ads Manager',
                  'SEMrush / Ahrefs',
                  'HubSpot / Mailchimp',
                  'Canva / Adobe',
                  'ChatGPT & AI Tools',
                  'CRM tools (Zoho, Salesforce)',
                ].map((tool) => (
                  <span
                    key={tool}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-4 py-2 text-xs md:text-sm text-slate-200 shadow-[0_12px_40px_rgba(0,191,255,0.06)]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </Surface>
          </div>
        </Container>
      </Section>

      {/* Live Projects & Placement Support */}
      <Section className="py-12 md:py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <Surface
              className="p-6 md:p-8"
              motionProps={{
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45 },
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                <h3 className="text-lg font-semibold text-slate-50">Live Projects</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Work on real campaigns and gain hands-on experience.
              </p>
            </Surface>

            <Surface
              className="p-6 md:p-8"
              motionProps={{
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45, delay: 0.08 },
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                <h3 className="text-lg font-semibold text-slate-50">Placement Support</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {[
                  'Resume building',
                  'LinkedIn profile optimization',
                  'Mock interviews',
                  'Hiring partner network',
                  'Internship & job opportunities (India & abroad)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal-300/80 shadow-[0_0_12px_rgba(0,191,255,0.45)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          </div>
>>>>>>> aa93dfa (Initial commit: website ready for deployment)
        </Container>
      </Section>
    </div>
  )
}
<<<<<<< HEAD
=======

>>>>>>> aa93dfa (Initial commit: website ready for deployment)
