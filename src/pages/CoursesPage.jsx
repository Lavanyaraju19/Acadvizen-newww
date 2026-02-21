import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

const courseHighlights = [
  { icon: '🧠', label: 'Skill Tracks', value: '12' },
  { icon: '⏱️', label: 'Live Practice Hours', value: '220+' },
  { icon: '🧩', label: 'Applied Modules', value: '34' },
  { icon: '🎓', label: 'Mentor Clinics', value: '1:1' },
  { icon: '🧰', label: 'Tool Stack Access', value: '30+' },
  { icon: '📦', label: 'Portfolio Sprints', value: '8' },
  { icon: '🏁', label: 'Capstone Missions', value: '6' },
  { icon: '🌍', label: 'Career Readiness', value: 'Global' },
  { icon: '📈', label: 'Interview Workshops', value: 'Weekly' },
]

export function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSections, setPageSections] = useState({})

  useEffect(() => {
    loadCourses()
    loadPageSections()
    const channel = supabase
      .channel('public-courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, loadCourses)
      .subscribe()
    const pageChannel = supabase
      .channel('public-page-courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadPageSections)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(pageChannel)
    }
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (data) setCourses(data)
    setLoading(false)
  }

  async function loadPageSections() {
    const { data } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_slug', 'courses')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')
  const emptySection = getSection('empty')

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10" id="overview">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{heroSection.title}</h1>
            {heroSection.subtitle && (
              <p className="mt-3 text-slate-300 max-w-2xl mx-auto">{heroSection.subtitle}</p>
            )}
          </motion.div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10" id="course-highlights">
        <Container>
          <div className="course-highlights-wrap">
            <h2 className="course-highlights-title">Course Highlights</h2>
            <p className="course-highlights-subtitle">A practical blueprint designed for high-growth careers.</p>
            <div className="course-highlight-grid">
              {courseHighlights.map((item) => (
                <article key={item.label} className="course-highlight-card">
                  <span className="course-highlight-icon">{item.icon}</span>
                  <div className="course-highlight-label">{item.label}</div>
                  <div className="course-highlight-value">{item.value}</div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10" id="curriculum">
        <Container>
          {loading ? (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
            </div>
          ) : courses.length === 0 ? (
            <Surface className="p-10 text-center text-slate-400">{emptySection.body}</Surface>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <Link to={`/courses/${course.slug}`} data-cursor="hover" className="group block h-full">
                    <Surface className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                      <div className="absolute -inset-8 opacity-0 blur-2xl transition-opacity group-hover:opacity-100">
                        <div className="h-full w-full rounded-[26px] bg-gradient-to-r from-teal-400/10 via-sky-400/8 to-indigo-400/10" />
                      </div>
                      {course.image_url && (
                        <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-white/[0.02]">
                          <img
                            src={course.image_url}
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}
                      <div className="relative p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">
                          {course.title}
                        </h3>
                        {course.short_description && (
                          <p className="mt-2 text-sm text-slate-300 line-clamp-3">
                            {course.short_description}
                          </p>
                        )}
                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Course</span>
                          <span className="text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                            Open -&gt;
                          </span>
                        </div>
                      </div>
                    </Surface>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="success-stories">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-50">Success Stories</h2>
            <p className="mt-3 text-slate-300">Learners turned campaigns into real offers at growth-focused teams.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { name: 'Ritu S', role: 'Performance Marketer', org: 'Infosys' },
              { name: 'Varun K', role: 'SEO Strategist', org: 'Deloitte' },
              { name: 'Megha P', role: 'Growth Analyst', org: 'Amazon' },
            ].map((story) => (
              <Surface key={story.name} className="p-5">
                <div className="text-base font-semibold text-slate-50">{story.name}</div>
                <p className="mt-2 text-sm text-slate-300">{story.role}</p>
                <div className="mt-3 text-xs text-teal-300">{story.org}</div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="our-people">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-50">Our People</h2>
            <p className="mt-3 text-slate-300">Mentors, reviewers, and practitioners from industry teams.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['SEO Mentor', 'Ads Mentor', 'Analytics Mentor', 'Content Mentor'].map((person) => (
              <Surface key={person} className="p-5 text-center">
                <div className="mx-auto h-14 w-14 rounded-full border border-white/10 bg-white/[0.05]" />
                <div className="mt-4 text-sm font-semibold text-slate-100">{person}</div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="projects">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-50">Projects</h2>
            <p className="mt-3 text-slate-300">Portfolio-grade executions across paid, organic, and automation tracks.</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Campaign Build Sprint', 'SEO Growth Case', 'Analytics Dashboard Build'].map((project) => (
              <Surface key={project} className="p-6">
                <div className="text-sm font-semibold text-slate-50">{project}</div>
                <p className="mt-3 text-xs text-slate-300">Real task briefs, deadlines, and mentor review loops.</p>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}
