import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '../../lib/supabaseClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { assetUrl } from '../../lib/assetUrl'

export function AboutPage() {
  const [pageSections, setPageSections] = useState({})

  useEffect(() => {
    loadPageSections()
    const pageChannel = supabase
      .channel('public-page-about')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadPageSections)
      .subscribe()
    return () => {
      supabase.removeChannel(pageChannel)
    }
  }, [])

  async function loadPageSections() {
    const { data } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_slug', 'about')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const parseJson = (value, fallback) => {
    if (!value) return fallback
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (err) {
        return fallback
      }
    }
    return value
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')
  const heroCta = parseJson(heroSection.cta_json, {})
  const storySection = getSection('story')
  const storyItems = parseJson(storySection.items_json, [
    'Acadvizen was founded to make digital marketing education flexible and outcome-driven. We believe every learner should be able to build a learning path that matches their goals, tools, and pace.',
    'Our programs are designed around real projects, career support, and industry-grade tools so that students and professionals can transition confidently into real-world roles.',
  ])
  const statsSection = getSection('stats')
  const statsItems = parseJson(statsSection.items_json, [])
  const highlightsSection = getSection('highlights')
  const highlightsItems = parseJson(highlightsSection.items_json, [])
  const highlightsCta = parseJson(highlightsSection.cta_json, {})
  const missionSection = getSection('mission')
  const missionItems = parseJson(missionSection.items_json, [])
  const foundersSection = getSection('founders')
  const founders = parseJson(foundersSection.items_json, [
    {
      name: 'Harika Gamireddy',
      image: '/about/harika.jpg',
    },
  ])
  const sanitizedFounders = founders
    .filter((person) => {
      const name = String(person?.name || '').toLowerCase()
      return !name.includes('jyoti') && !name.includes('chandar')
    })
    .map((person) => ({
      ...person,
      image: person?.image || '/about/chandar.jpg',
    }))
  const trainerPalette = ['#2A9D3A', '#1D4ED8', '#EAB308']

  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-12">
        <Container className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {heroCta?.badge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
                {heroCta.badge}
              </div>
            )}
            <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              {heroSection.title}
            </h1>
            {heroSection.subtitle && (
              <p className="mt-4 text-slate-300 max-w-2xl mx-auto">{heroSection.subtitle}</p>
            )}
          </motion.div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-7xl">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50 text-center">About ACADVIZEN</h2>
            <p className="mt-3 text-center text-slate-300">
              ACADVIZEN stands as the best digital marketing training institute in Bangalore, delivering practical,
              career-driven education. As a top-rated digital marketing institute in Bangalore, we combine live
              projects, expert mentorship, and real-time tools.
            </p>
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1.65fr] items-stretch">
              <Surface className="p-5">
                <div className="relative h-[500px] lg:h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                  <Image
                    src={assetUrl('/about/tharii.jpg')}
                    alt="Tharika Chakrapani Raju - Co-Founder"
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = assetUrl('/about/chandar.jpg')
                    }}
                  />
                </div>
              </Surface>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Surface className="p-7">
                  <h3 className="text-3xl font-bold text-slate-50">Our Mission</h3>
                  <p className="mt-3 text-lg text-slate-300">
                    To combine creativity, data, and AI to train the next generation of digital marketers.
                  </p>
                </Surface>
                <Surface className="p-7">
                  <h3 className="text-3xl font-bold text-slate-50">Our Vision</h3>
                  <p className="mt-3 text-lg text-slate-300">
                    To shape future marketers using AI-driven strategies for tomorrow&apos;s digital economy.
                  </p>
                </Surface>
                <Surface className="p-7">
                  <h3 className="text-3xl font-bold text-slate-50">Why Choose Us</h3>
                  <div className="mt-3 space-y-2 text-lg text-slate-300">
                    {[
                      'Industry mentors',
                      'Live projects',
                      'Placement assistance',
                      'Soft skills training',
                      'Tool-based learning',
                    ].map((item) => (
                      <div key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
                        {item}
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-8 md:py-14">
        <Container className="max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <Surface
              className="p-7 md:p-10"
              motionProps={{
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45 },
              }}
            >
              <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">
                {storySection.title || 'Our Story'}
              </h2>
              {storyItems.map((paragraph, idx) => (
                <p key={`${paragraph}-${idx}`} className="mt-4 text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {statsItems.map((s, idx) => (
                  <div
                    key={`${s.v}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center"
                  >
                    <div className="text-lg font-semibold text-slate-50">{s.k}</div>
                    <div className="mt-1 text-xs text-slate-400">{s.v}</div>
                  </div>
                ))}
              </div>
            </Surface>

            {highlightsItems.length > 0 && (
              <Surface
                className="p-6 md:p-8 overflow-hidden"
                motionProps={{
                  initial: { opacity: 0, y: 12 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { duration: 0.45, delay: 0.05 },
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-50">{highlightsSection.title}</h3>
                  {highlightsCta?.scroll_label && (
                    <span className="text-xs text-slate-400">{highlightsCta.scroll_label}</span>
                  )}
                </div>
                <div className="mt-5 -mx-2 overflow-x-auto">
                  <div className="flex gap-4 px-2 pb-2 min-w-max">
                    {highlightsItems.map((card, idx) => (
                      <motion.div
                        key={`${card.title}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.35, delay: idx * 0.06 }}
                        className="w-[280px] sm:w-[320px] shrink-0"
                      >
                        <div className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${card.bg || ''}`} />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute -inset-12 rounded-full bg-teal-400/10 blur-3xl" />
                          </div>
                          <div className="relative">
                            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04]" />
                            <div className="mt-4 text-sm font-semibold text-slate-50">{card.title}</div>
                            <div className="mt-2 text-sm text-slate-300">{card.desc}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Surface>
            )}
          </div>
        </Container>
      </Section>

      {(missionSection.title || missionSection.subtitle || missionItems.length > 0) && (
        <Section className="py-10 md:py-16">
          <Container className="max-w-5xl">
            <Surface
              className="p-8 md:p-12"
              motionProps={{
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45 },
              }}
            >
              {missionSection.title && (
                <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">{missionSection.title}</h2>
              )}
              {missionSection.subtitle && (
                <p className="mt-4 text-slate-300 leading-relaxed">{missionSection.subtitle}</p>
              )}
              {missionItems.length > 0 && (
                <div className="mt-8 grid md:grid-cols-3 gap-4">
                  {missionItems.map((x) => (
                    <div
                      key={x.t}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="text-sm font-semibold text-slate-50">{x.t}</div>
                      <div className="mt-2 text-sm text-slate-300">{x.d}</div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </Container>
        </Section>
      )}

      <Section className="py-8 md:py-14">
        <Container className="max-w-6xl">
          <Surface className="p-8 md:p-12">
            <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">
              {foundersSection.title || 'Our Trainers'}
            </h2>
            {foundersSection.subtitle && (
              <p className="mt-3 text-slate-300">{foundersSection.subtitle}</p>
            )}
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sanitizedFounders.map((person, idx) => (
                <div
                  key={person.name}
                  className="rounded-2xl border border-white/10 p-6 text-center"
                  style={{ backgroundColor: trainerPalette[idx % trainerPalette.length] }}
                >
                  <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-2xl border border-white/20 bg-white/20">
                    <Image
                      src={assetUrl(person.image)}
                      alt={person.name}
                      fill
                      sizes="208px"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = assetUrl('/about/tharii.jpg')
                      }}
                    />
                  </div>
                  <div className="mt-4 text-3xl font-bold text-slate-50">{person.name}</div>
                </div>
              ))}
            </div>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}

export default AboutPage


