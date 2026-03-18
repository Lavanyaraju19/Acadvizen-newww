import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  CirclePlay,
  ClipboardList,
  FileBadge2,
  FileStack,
  FolderKanban,
  FolderOpen,
  Layers3,
  Medal,
  MonitorCog,
  NotebookPen,
  SwatchBook,
  TimerReset,
} from 'lucide-react'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { buildInternalLinks } from '../../../lib/internalLinker'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import { courseModules, programHighlights, programOverview } from '../../lib/marketingProgramContent'

const courseHighlights = [
  { icon: CalendarDays, iconClass: 'text-[#9ff0c0]', label: 'Course Duration', value: '6 Months' },
  { icon: CirclePlay, iconClass: 'text-[#ff7b7b]', label: 'Learning Mode', value: 'Online / Classroom' },
  { icon: SwatchBook, iconClass: 'text-[#ffd76d]', label: 'Industry-Relevant Modules', value: '12+' },
  { icon: ClipboardList, iconClass: 'text-[#ffde59]', label: 'Template and Blueprint', value: '08' },
  { icon: Layers3, iconClass: 'text-[#85b7ff]', label: 'AI Learning Tools', value: '25+' },
  { icon: TimerReset, iconClass: 'text-[#d8f7ff]', label: 'Hours of Practical Learning', value: '240+' },
  { icon: BookOpen, iconClass: 'text-[#ffcf8a]', label: 'Case Studies', value: '20+' },
  { icon: FileStack, iconClass: 'text-[#ffafcc]', label: 'Number of Individual Courses', value: '15' },
  { icon: FolderOpen, iconClass: 'text-[#ffa8a8]', label: 'Capstone Projects', value: '5+' },
  { icon: FileBadge2, iconClass: 'text-[#95f2ac]', label: 'Global Certifications', value: '15+' },
  { icon: MonitorCog, iconClass: 'text-[#9ed0ff]', label: 'Specialisation', value: '4' },
  { icon: Medal, iconClass: 'text-[#ffd38a]', label: 'Domain Specialist Trainer', value: '07' },
]

export function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSections, setPageSections] = useState({})
  const [internalLinks, setInternalLinks] = useState({ blogs: [], tools: [], placements: [] })

  useEffect(() => {
    void loadCourses()
    void loadPageSections()
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await fetchPublicData('courses')
    if (data) setCourses(data)
    if (data) await loadInternalLinks(data)
    setLoading(false)
  }

  async function loadPageSections() {
    const { data } = await fetchPublicData('page-sections', { page: 'courses' })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')

  async function loadInternalLinks(courseData) {
    const [blogRes, toolRes, placementRes] = await Promise.all([
      fetchPublicData('blog-posts', { limit: 8 }),
      fetchPublicData('tools-extended', { limit: 8 }),
      fetchPublicData('placements', { limit: 6 }),
    ])

    const blogs = Array.isArray(blogRes.data) ? blogRes.data : []
    const tools = Array.isArray(toolRes.data) ? toolRes.data : []
    const placements = Array.isArray(placementRes.data) ? placementRes.data : []

    const links = buildInternalLinks(
      { title: heroSection.title || 'Courses' },
      {
        blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
        courses: (courseData || []).map((item) => ({ title: item.title, slug: item.slug, type: 'course' })),
        tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
      },
      4
    )

    setInternalLinks({
      blogs: links.blogs,
      tools: links.tools,
      placements: placements.slice(0, 4),
    })
  }

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
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#071326] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.35)] md:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-95"
              style={{
                background: `
                  linear-gradient(145deg, rgba(2,10,28,0.98) 0%, rgba(2,10,28,0.98) 28%, transparent 28.2%),
                  linear-gradient(208deg, transparent 0%, transparent 51%, rgba(20,197,197,0.55) 51.4%, rgba(6,36,53,0.0) 76%),
                  linear-gradient(122deg, transparent 0%, transparent 63%, rgba(23,174,179,0.72) 63.4%, rgba(3,14,31,0.0) 88%),
                  linear-gradient(332deg, rgba(8,18,39,0.98) 0%, rgba(8,18,39,0.98) 36%, transparent 36.2%),
                  linear-gradient(18deg, transparent 0%, transparent 72%, rgba(37,219,217,0.62) 72.4%, rgba(4,17,35,0.0) 88%),
                  linear-gradient(180deg, #071326 0%, #071326 100%)
                `,
              }}
            />
            <div className="relative">
            <h2 className="text-3xl font-bold italic tracking-tight text-white md:text-4xl">Course Highlights</h2>
            <p className="mt-2 text-sm italic text-slate-200 md:text-base">
              A Snapshot of What Makes Our E-Commerce Marketing Course a Game-Changer
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {courseHighlights.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[0.8rem] border border-white/5 bg-[#141414] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#222222]">
                      <item.icon className={`h-5 w-5 ${item.iconClass}`} strokeWidth={2.2} />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold leading-4 text-white">
                        {item.label}
                      </div>
                      <div className="mt-2 text-xl font-bold leading-none text-slate-100 md:text-2xl">
                        {item.value}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 h-px w-full bg-white/10" />
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="ai-marketing-architect">
        <Container>
          <div className="rounded-[2rem] border border-emerald-700/30 bg-[linear-gradient(135deg,#050b12_0%,#0d1724_55%,#1c2d16_100%)] p-8 md:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-200">Course Program</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold text-slate-50">{programOverview.title}</h2>
              <h4 className="mt-4 text-lg md:text-2xl font-semibold text-slate-100">
                Total Program Duration: <span className="text-amber-300">{programOverview.durationLabel}</span> | <span className="text-emerald-300">{programOverview.toolsLabel}</span> |{' '}
                <span className="text-amber-200">{programOverview.casesLabel}</span>
              </h4>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {programHighlights.map((item, idx) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                    <p className="text-sm md:text-base leading-7">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="course-modules">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50">Course Modules Built for Modern Marketing Execution</h2>
            <p className="mt-3 text-base md:text-lg text-slate-300">
              Each module is designed to build practical depth across AI, search, paid campaigns, content systems, and analytics.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {courseModules.map((module, idx) => (
              <div
                key={module.title}
                id={`module-${idx + 1}`}
                className="scroll-mt-32 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-6 shadow-[0_20px_45px_rgba(2,6,23,0.28)]"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Module {idx + 1}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-50">{module.title}</h3>
                <div className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  Duration: {module.duration}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-slate-100">Focus:</span> {module.focus}
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">7 Key Pillars</p>
                  <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                    {module.pillars.map((pillar, pillarIndex) => (
                      <li key={`${module.title}-${pillar}`} className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-emerald-200">
                          {pillarIndex + 1}
                        </span>
                        <span>{pillar}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10" id="curriculum">
        <Container>
          {loading ? (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
            </div>
          ) : courses.length === 0 ? null : (
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
                        <AdaptiveImage
                          src={course.image_url}
                          alt={course.title}
                          variant="card"
                          aspectRatio="16 / 10"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          wrapperClassName="w-full border-b border-white/10"
                          borderClassName=""
                          roundedClassName=""
                        />
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

      <Section className="py-10 md:py-12" id="about-us">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-slate-50">About Us</h2>
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

      <Section className="py-10 md:py-12" id="related-links">
        <Container>
          <Surface className="p-6">
            <h2 className="text-xl font-semibold text-slate-50">Explore More</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Blog Guides</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {internalLinks.blogs.length ? (
                    internalLinks.blogs.map((item) => (
                      <Link key={item.slug} to={`/blog/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">New guides coming soon.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tools</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {internalLinks.tools.length ? (
                    internalLinks.tools.map((item) => (
                      <Link key={item.slug} to={`/tools/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">Tools will appear here.</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Placements</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
                  {internalLinks.placements.length ? (
                    internalLinks.placements.map((item) => (
                      <div key={item.id}>{item.company_name || item.company || 'Placement partner'}</div>
                    ))
                  ) : (
                    <span className="text-slate-400">Placement updates coming soon.</span>
                  )}
                </div>
              </div>
            </div>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}


export default CoursesPage


