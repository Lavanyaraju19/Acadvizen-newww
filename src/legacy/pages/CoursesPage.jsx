import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CirclePlay,
  ClipboardList,
  FileBadge2,
  FileStack,
  FolderOpen,
  Layers3,
  Medal,
  MonitorCog,
  SwatchBook,
  TimerReset,
} from 'lucide-react'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import TabbedFaqAccordion from '../../components/faq/TabbedFaqAccordion'
import { courseModules, programHighlights, programOverview } from '../../lib/marketingProgramContent'
import { courseCaseStudies, courseProjects, coursesFaqExact } from '../../lib/sitePageContent'

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

const faqTabs = []

export function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAccordion, setActiveAccordion] = useState('overview')

  useEffect(() => {
    void loadCourses()
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await fetchPublicData('courses')
    if (Array.isArray(data)) setCourses(data)
    setLoading(false)
  }

  const accordionItems = [
    {
      key: 'overview',
      title: programOverview.title,
      summary: `${programOverview.durationLabel} | ${programOverview.toolsLabel} | ${programOverview.casesLabel}`,
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          {programHighlights.map((item, idx) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-sm leading-7 text-slate-200"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    ...courseModules.map((module) => ({
      key: module.anchor,
      title: module.title,
      summary: `${module.duration} | Focus: ${module.focus}`,
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-300">
            <span className="font-bold text-slate-100">Focus:</span> {module.focus}
          </p>
          <div className="space-y-3">
            {module.pillars.map((pillar, index) => (
              <div key={`${module.anchor}-${pillar}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-200">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-semibold text-emerald-200">
                  {index + 1}
                </span>
                <span>{pillar}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    })),
  ]

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10" id="overview">
        <Container className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              Digital Marketing Mastery: The Complete 2026 Guide from Beginner to Expert
            </h1>
            <p className="mt-3 text-slate-300 max-w-3xl mx-auto">
              Explore all the modules, practical tutorials, and hands-on exercises designed to build your confidence and technical expertise from day one.
            </p>
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
                  <article key={item.label} className="rounded-[0.8rem] border border-white/5 bg-[#141414] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#222222]">
                        <item.icon className={`h-5 w-5 ${item.iconClass}`} strokeWidth={2.2} />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold leading-4 text-white">{item.label}</div>
                        <div className="mt-2 text-xl font-bold leading-none text-slate-100 md:text-2xl">{item.value}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="course-program">
        <Container className="max-w-6xl">
          <div className="rounded-[2rem] border border-emerald-700/30 bg-[linear-gradient(135deg,#050b12_0%,#0d1724_55%,#1c2d16_100%)] p-8 md:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-200">Course Program</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold text-slate-50">{programOverview.title}</h2>
              <p className="mt-4 text-lg font-semibold text-slate-100 md:text-2xl">
                <span className="text-amber-300">{programOverview.durationLabel}</span> |{' '}
                <span className="text-emerald-300">{programOverview.toolsLabel}</span> |{' '}
                <span className="text-amber-200">{programOverview.casesLabel}</span>
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {accordionItems.map((item) => {
                const isOpen = activeAccordion === item.key
                return (
                  <div key={item.key} className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-slate-950/50">
                    <button
                      type="button"
                      onClick={() => setActiveAccordion(isOpen ? null : item.key)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-slate-50 md:text-2xl">{item.title}</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-300">{item.summary}</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && <div className="border-t border-white/10 px-5 py-5">{item.content}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10" id="curriculum">
        <Container>
          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-teal-300/70" />
            </div>
          ) : courses.length === 0 ? null : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                >
                  <Link to={`/courses/${course.slug}`} className="group block h-full">
                    <Surface className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                      {course.image_url && (
                        <AdaptiveImage
                          src={course.image_url}
                          alt={course.title}
                          variant="card"
                          aspectRatio="16 / 10"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          wrapperClassName="w-full border-b border-white/10"
                          borderClassName=""
                          roundedClassName=""
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-50 md:text-xl">{course.title}</h3>
                        {course.short_description && (
                          <p className="mt-2 line-clamp-3 text-sm text-slate-300">{course.short_description}</p>
                        )}
                      </div>
                    </Surface>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="projects">
        <Container className="max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.28em] text-teal-200">Projects</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">Solving Digital Growth in 2026</h2>
            <h3 className="mt-3 text-2xl font-semibold text-slate-100">15+ Projects in AI-Search &amp; Performance Ads</h3>
            <p className="mt-3 text-slate-300">
              Master AIO (AI Overview), Semantic Search, and Performance Ads through hands-on execution.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {courseProjects.slice(0, 5).map((project) => (
              <Surface key={project.title} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-50">{project.title}</h3>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {project.weeks}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-bold text-slate-100">The Problem:</span> {project.problem}
                </p>
                <div className="mt-4 space-y-2">
                  {project.solutions.map((solution) => (
                    <div key={solution} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                      {solution}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-bold text-slate-100">What You Learn:</span> {project.learn}
                </p>
              </Surface>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              Explore Real-Time Projects <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="case-studies">
        <Container className="max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.28em] text-amber-200">Case Studies</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">Explore Our Performance Case Studies</h2>
            <h3 className="mt-3 text-2xl font-semibold text-slate-100">
              35+ AI-Driven Case Studies &amp; 4.5x ROAS Mastery Beyond Traditional SEO
            </h3>
            <p className="mt-3 text-slate-300">
              Our portfolio of detailed case studies focuses on measurable growth. Master the AIO frameworks and Performance Marketing 3.0 strategies that consistently deliver high-scale ROI in the Indian landscape.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {courseCaseStudies.slice(0, 3).map((item) => (
              <Surface key={item.title} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{item.focus}</p>
                <h3 className="mt-3 text-xl font-bold text-slate-50">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-bold text-slate-100">The Problem:</span> {item.problem}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-bold text-slate-100">SEO Keywords:</span> {item.keywords.join(', ')}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-bold text-slate-100">The Result:</span> {item.result}
                </p>
              </Surface>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/projects#case-studies"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Get More Details <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="faq">
        <Container className="max-w-6xl">
          <TabbedFaqAccordion
            title="Course FAQs"
            intro="These course FAQs cover the program structure, AI-search methods, no-code execution, content systems, fees, and core search differences."
            tabs={faqTabs}
            items={coursesFaqExact}
            tabInactiveClassName="border-white/15 bg-transparent text-slate-100"
            cardClassName="rounded-[1.7rem] border border-white/10 bg-[#102039] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            answerClassName="mt-4 text-base leading-8 text-slate-300"
          />
        </Container>
      </Section>
    </div>
  )
}

export default CoursesPage
