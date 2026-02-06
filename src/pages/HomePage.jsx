import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

const toolItems = [
  'Google Ads',
  'Meta Ads Manager',
  'SEMrush',
  'Ahrefs',
  'HubSpot',
  'Mailchimp',
  'Canva',
  'Adobe',
  'ChatGPT & AI Tools',
  'Zoho CRM',
  'Salesforce',
]

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function HomePage() {
  const [tools, setTools] = useState([])
  const [courses, setCourses] = useState([])

  useEffect(() => {
    loadTools()
    loadCourses()
  }, [])

  async function loadTools() {
    const { data } = await supabase
      .from('tools')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(30)
    if (data) setTools(data)
  }

  async function loadCourses() {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(6)
    if (data) setCourses(data)
  }

  const fallbackCourses = [
    {
      id: 'course-fallback-1',
      slug: 'digital-marketing-foundations',
      title: 'Digital Marketing Foundations',
      short_description: 'Master the fundamentals, channel strategy, and campaign planning.',
      image_url: null,
    },
    {
      id: 'course-fallback-2',
      slug: 'performance-marketing-pro',
      title: 'Performance Marketing Pro',
      short_description: 'Google Ads, Meta Ads, and conversion-focused growth loops.',
      image_url: null,
    },
    {
      id: 'course-fallback-3',
      slug: 'seo-and-content-engine',
      title: 'SEO & Content Engine',
      short_description: 'On-page, off-page, and content systems that rank and convert.',
      image_url: null,
    },
  ]

  const displayCourses = courses.length > 0 ? courses : fallbackCourses

  const fallbackTools = toolItems.map((name) => ({
    id: `fallback-${name}`,
    name,
    slug: slugify(name),
  }))

  const displayTools = (tools.length > 0 ? tools : fallbackTools).map((tool, index) => ({
    ...tool,
    id: tool.id ?? `tool-${index}`,
    name: tool.name ?? 'Tool',
    slug: tool.slug ?? slugify(tool.name ?? 'tool'),
  }))

  const midpoint = Math.ceil(displayTools.length / 2)
  const rowOne = displayTools.slice(0, midpoint)
  const rowTwo = displayTools.slice(midpoint)
  const rowOneMarquee = [...rowOne, ...rowOne]
  const rowTwoMarquee = [...rowTwo, ...rowTwo]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-400/10 blur-[110px]" />
        <div className="absolute top-16 right-0 h-96 w-96 rounded-full bg-sky-400/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-400/10 blur-[120px]" />
      </div>

      <Section className="overflow-hidden">
        <Container>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed">
                Choose your tools, customize your syllabus, and train for real jobs in India &amp; abroad.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/courses"
                  data-cursor="button"
                  className="group inline-flex items-center justify-center rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(0,191,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-teal-200"
                >
                  Explore Courses
                  <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">-&gt;</span>
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
              Why We Are Different
            </motion.h2>
            <p className="mt-2 text-slate-300 max-w-2xl mx-auto">
              Most institutes force a fixed syllabus. At Acadvizen, you build your own learning path.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              'What modules you want',
              'Which tools you want to master',
              'Your pace and career goals',
              'Your specialization (SEO, Ads, Social, Analytics)',
            ].map((item, idx) => (
              <Surface
                key={item}
                className="p-6 md:p-7 transition-transform hover:-translate-y-1"
                motionProps={{
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { delay: idx * 0.08, duration: 0.45 },
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 rounded-2xl border border-white/10 bg-gradient-to-br from-teal-300/20 to-sky-300/10 shadow-[0_18px_50px_rgba(0,191,255,0.10)]" />
                  <p className="text-sm md:text-base leading-relaxed text-slate-200">{item}</p>
                </div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

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
              Choose your career path:
            </motion.h2>
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
                desc: 'Learn marketing tools that grow your business.',
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
          </div>

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
        </Container>
      </Section>

      <Section className="py-12 md:py-20">
        <Container>
          <div className="flex items-center justify-between gap-4 mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45 }}
              className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight"
            >
              Featured Courses
            </motion.h2>
            <Link
              to="/courses"
              data-cursor="hover"
              className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
            >
              View all courses -&gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.05, duration: 0.35 }}
              >
                <Link to={`/courses/${course.slug}`} data-cursor="hover" className="group block h-full">
                  <Surface className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                    {course.image_url && (
                      <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-white/[0.02]">
                        <img
                          src={course.image_url}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-slate-50">{course.title}</h3>
                      {course.short_description && (
                        <p className="mt-2 text-sm text-slate-300 line-clamp-3">
                          {course.short_description}
                        </p>
                      )}
                      <div className="mt-4 text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                        View details -&gt;
                      </div>
                    </div>
                  </Surface>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

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
              Tools You Will Master
            </motion.h2>
          </div>

          <Surface
            className="p-6 md:p-7"
            motionProps={{
              initial: { opacity: 0, y: 14 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: '-80px' },
              transition: { duration: 0.45 },
            }}
          >
            <div className="overflow-hidden space-y-4">
              <div className="advz-marquee gap-10" style={{ '--advz-marquee-duration': '20s', animationDirection: 'reverse' }}>
                {rowOneMarquee.map((tool, i) => (
                  <Link
                    key={`${tool.slug}-row1-${i}`}
                    to={`/tools/${tool.slug}`}
                    data-cursor="hover"
                    className="flex items-center gap-3 text-sm text-slate-200 hover:text-slate-100 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-teal-200 font-semibold">
                      {tool.name.charAt(0)}
                    </div>
                    <span className="whitespace-nowrap">{tool.name}</span>
                  </Link>
                ))}
              </div>
              <div className="advz-marquee gap-10" style={{ '--advz-marquee-duration': '20s', animationDirection: 'reverse' }}>
                {rowTwoMarquee.map((tool, i) => (
                  <Link
                    key={`${tool.slug}-row2-${i}`}
                    to={`/tools/${tool.slug}`}
                    data-cursor="hover"
                    className="flex items-center gap-3 text-sm text-slate-200 hover:text-slate-100 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-teal-200 font-semibold">
                      {tool.name.charAt(0)}
                    </div>
                    <span className="whitespace-nowrap">{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </Surface>
        </Container>
      </Section>

      <Section className="py-12 md:py-20">
        <Container>
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
              <h3 className="text-lg font-semibold text-slate-50">Real Projects</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Work on real campaigns and get hands-on experience.
            </p>
          </Surface>
        </Container>
      </Section>

      <Section className="py-12 md:py-20">
        <Container>
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
              <h3 className="text-lg font-semibold text-slate-50">Placement Support</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {[
                'Resume building',
                'LinkedIn optimization',
                'Mock interviews',
                'Hiring partners',
                'Internships & job opportunities',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal-300/80 shadow-[0_0_12px_rgba(0,191,255,0.45)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}
