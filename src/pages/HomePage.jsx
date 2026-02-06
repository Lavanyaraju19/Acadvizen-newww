import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

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

  const marqueeTools = tools.length > 0 ? [...tools, ...tools] : []

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section className="overflow-hidden">
        <Container>
          <div className="relative">
            {/* Floating accents */}
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
                Build, scale, and dominate with{' '}
                <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  75+ premium tools
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
                Acadvizen combines elite courses, an operator-grade tool library, and curated resources to help you
                execute campaigns faster—with clarity and confidence.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/courses"
                  data-cursor="button"
                  className="group inline-flex items-center justify-center rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,191,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
                >
                  Explore Courses
                  <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
                <Link
                  to="/tools"
                  data-cursor="hover"
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  Browse Tools
                </Link>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Tools Marquee */}
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
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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
                className="p-6 md:p-7 transition-transform hover:-translate-y-1"
                motionProps={{
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { delay: idx * 0.08, duration: 0.45 },
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                  <h3 className="text-lg font-semibold text-slate-50">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.desc}</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

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
        </Container>
      </Section>
    </div>
  )
}
