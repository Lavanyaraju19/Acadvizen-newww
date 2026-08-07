import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { buildInternalLinks } from '../../../lib/internalLinker'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import TabbedFaqAccordion from '../../components/faq/TabbedFaqAccordion'
import ShowcaseWideCard from '../../components/marketing/ShowcaseWideCard'
import {
  courseModules,
  programHighlights,
  programOverview,
} from '../../lib/marketingProgramContent'
import { courseCaseStudies, courseProjects, coursesFaqExact } from '../../lib/sitePageContent'

const faqTabs = []

function sliderScroll(ref, direction) {
  if (!ref.current) return
  const amount = Math.max(ref.current.clientWidth * 0.7, 320)
  ref.current.scrollBy({ left: direction * amount, behavior: 'smooth' })
}

function SliderArrows({ onPrev, onNext, dark = false }) {
  const buttonClass = dark
    ? 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18'
    : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 transition hover:bg-slate-50'

  return (
    <div className="mt-7 flex items-center justify-center gap-3">
      <button type="button" onClick={onPrev} className={buttonClass} aria-label="Scroll left">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={onNext} className={buttonClass} aria-label="Scroll right">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

const courseHighlights = [
  {
    icon: CalendarDays,
    iconClass: 'text-[#9ff0c0]',
    label: 'Course Duration',
    value: '6 Months',
  },
  {
    icon: CirclePlay,
    iconClass: 'text-[#ff7b7b]',
    label: 'Learning Mode',
    value: 'Online / Classroom',
  },
  {
    icon: SwatchBook,
    iconClass: 'text-[#ffd76d]',
    label: 'Industry-Relevant Modules',
    value: '12+',
  },
  {
    icon: ClipboardList,
    iconClass: 'text-[#ffde59]',
    label: 'Template and Blueprint',
    value: '08',
  },
  {
    icon: Layers3,
    iconClass: 'text-[#85b7ff]',
    label: 'AI Learning Tools',
    value: '25+',
  },
  {
    icon: TimerReset,
    iconClass: 'text-[#d8f7ff]',
    label: 'Hours of Practical Learning',
    value: '240+',
  },
  {
    icon: BookOpen,
    iconClass: 'text-[#ffcf8a]',
    label: 'Case Studies',
    value: '20+',
  },
  {
    icon: FileStack,
    iconClass: 'text-[#ffafcc]',
    label: 'Number of Individual Courses',
    value: '15',
  },
  {
    icon: FolderOpen,
    iconClass: 'text-[#ffa8a8]',
    label: 'Capstone Projects',
    value: '5+',
  },
  {
    icon: FileBadge2,
    iconClass: 'text-[#95f2ac]',
    label: 'Global Certifications',
    value: '15+',
  },
  {
    icon: MonitorCog,
    iconClass: 'text-[#9ed0ff]',
    label: 'Specialisation',
    value: '4',
  },
  {
    icon: Medal,
    iconClass: 'text-[#ffd38a]',
    label: 'Domain Specialist Trainer',
    value: '07',
  },
]

export function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSections, setPageSections] = useState({})
  const [internalLinks, setInternalLinks] = useState({
    blogs: [],
    tools: [],
    placements: [],
  })
  const [testimonials, setTestimonials] = useState([])
  const projectSliderRef = useRef(null)
  const caseStudySliderRef = useRef(null)

  useEffect(() => {
    void loadCourses()
    void loadPageSections()
    void loadTestimonials()
  }, [])

  async function loadTestimonials() {
    try {
      const { data } = await fetchPublicData('testimonials', { limit: 3 })
      const safeTestimonials = Array.isArray(data)
        ? data.filter((item) => item && typeof item === 'object' && item.name && item.quote)
        : []
      setTestimonials(safeTestimonials)
    } catch (error) {
      console.error('Failed to load testimonials:', error)
      setTestimonials([])
    }
  }

  async function loadCourses() {
    setLoading(true)

    try {
      const { data } = await fetchPublicData('courses')

      const safeCourses = Array.isArray(data)
        ? data.filter(
            (course) =>
              course &&
              typeof course === 'object' &&
              course.id &&
              course.slug &&
              course.title
          )
        : []

      setCourses(safeCourses)
      await loadInternalLinks(safeCourses)
    } catch (error) {
      console.error('Failed to load courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  async function loadPageSections() {
    try {
      const { data } = await fetchPublicData('page-sections', {
        page: 'courses',
      })

      if (!Array.isArray(data)) {
        return
      }

      const next = {}

      data.forEach((section) => {
        if (section?.section_key) {
          next[section.section_key] = section
        }
      })

      setPageSections(next)
    } catch (error) {
      console.error('Failed to load Courses page sections:', error)
    }
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')

  async function loadInternalLinks(courseData) {
    try {
      const [blogRes, toolRes, placementRes] = await Promise.all([
        fetchPublicData('blog-posts', { limit: 8 }),
        fetchPublicData('tools-extended', { limit: 8 }),
        fetchPublicData('placements', { limit: 6 }),
      ])

      const blogs = Array.isArray(blogRes?.data)
        ? blogRes.data.filter(
            (item) => item && typeof item === 'object' && item.slug
          )
        : []

      const tools = Array.isArray(toolRes?.data)
        ? toolRes.data.filter(
            (item) => item && typeof item === 'object' && item.slug
          )
        : []

      const placements = Array.isArray(placementRes?.data)
        ? placementRes.data.filter(
            (item) => item && typeof item === 'object'
          )
        : []

      const links = buildInternalLinks(
        {
          title: heroSection.title || 'Courses',
        },
        {
          blogs: blogs.map((item) => ({
            title: item.title || 'Blog guide',
            slug: item.slug,
            type: 'blog',
          })),
          courses: courseData.map((item) => ({
            title: item.title,
            slug: item.slug,
            type: 'course',
          })),
          tools: tools.map((item) => ({
            title: item.name || item.title || 'Marketing tool',
            slug: item.slug,
            type: 'tool',
          })),
        },
        4
      )

      setInternalLinks({
        blogs: Array.isArray(links?.blogs) ? links.blogs : [],
        tools: Array.isArray(links?.tools) ? links.tools : [],
        placements: placements.slice(0, 4),
      })
    } catch (error) {
      console.error('Failed to load related Courses links:', error)

      setInternalLinks({
        blogs: [],
        tools: [],
        placements: [],
      })
    }
  }

  return (
    <div className="min-h-screen">
      <Section
        className="pb-6 pt-10 md:pb-10 md:pt-14"
        id="overview"
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-center"
          >
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              {heroSection.title || 'Digital Marketing Courses'}
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              {heroSection.subtitle ||
                'Build practical skills across digital marketing, SEO, paid advertising, analytics, content and AI-powered marketing.'}
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section
        className="py-6 md:py-10"
        id="course-highlights"
      >
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
              <h2 className="text-3xl font-bold italic tracking-tight text-white md:text-4xl">
                Course Highlights
              </h2>

              <p className="mt-2 text-sm italic text-slate-200 md:text-base">
                A Snapshot of What Makes Our E-Commerce Marketing
                Course a Game-Changer
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {courseHighlights.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[0.8rem] border border-white/5 bg-[#141414] px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#222222]">
                        <item.icon
                          className={`h-5 w-5 ${item.iconClass}`}
                          strokeWidth={2.2}
                        />
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

      <Section
        className="py-10 md:py-12"
        id="ai-marketing-architect"
      >
        <Container>
          <div className="rounded-[2rem] border border-emerald-700/30 bg-[linear-gradient(135deg,#050b12_0%,#0d1724_55%,#1c2d16_100%)] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-12">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-200">
                Course Program
              </p>

              <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">
                {programOverview.title}
              </h2>

              <p className="mt-4 text-lg font-semibold text-slate-100 md:text-2xl">
                Total Program Duration:{' '}
                <span className="text-amber-300">
                  {programOverview.durationLabel}
                </span>{' '}
                |{' '}
                <span className="text-emerald-300">
                  {programOverview.toolsLabel}
                </span>{' '}
                |{' '}
                <span className="text-amber-200">
                  {programOverview.casesLabel}
                </span>
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {programHighlights.map((item, idx) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        idx % 2 === 0
                          ? 'bg-amber-300'
                          : 'bg-emerald-300'
                      }`}
                    />

                    <p className="text-sm leading-7 md:text-base">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section
        className="py-10 md:py-12"
        id="course-modules"
      >
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-slate-50 md:text-5xl">
              Course Modules Built for Modern Marketing Execution
            </h2>

            <p className="mt-3 text-base text-slate-300 md:text-lg">
              Each module is designed to build practical depth across
              AI, search, paid campaigns, content systems and
              analytics.
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

                <h3 className="mt-4 text-2xl font-bold text-slate-50">
                  {module.title}
                </h3>

                <div className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  Duration: {module.duration}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-slate-100">
                    Focus:
                  </span>{' '}
                  {module.focus}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">
                    Key Pillars
                  </p>

                  <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                    {module.pillars.map((pillar, pillarIndex) => (
                      <li
                        key={`${module.title}-${pillar}`}
                        className="flex gap-3"
                      >
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

      <Section
        className="py-6 md:py-10"
        id="curriculum"
      >
        <Container>
          {loading ? (
            <div className="py-16 text-center">
              <div
                className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-teal-300/70"
                role="status"
                aria-label="Loading courses"
              />
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <h2 className="text-2xl font-semibold text-slate-50">
                Courses are being updated
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-slate-300">
                New course information will appear here when it is
                published from the Admin Dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{
                    once: true,
                    margin: '-80px',
                  }}
                  transition={{
                    delay: idx * 0.05,
                    duration: 0.35,
                  }}
                >
                  <Link
                    to={`/courses/${course.slug}`}
                    data-cursor="hover"
                    className="group block h-full"
                  >
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
                        <h3 className="text-lg font-semibold tracking-tight text-slate-50 md:text-xl">
                          {course.title}
                        </h3>

                        {(course.short_description ||
                          course.description) && (
                          <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                            {course.short_description ||
                              course.description}
                          </p>
                        )}

                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Course
                          </span>

                          <span className="text-xs font-semibold text-teal-300 transition-colors group-hover:text-teal-200">
                            Open →
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

      {testimonials.length > 0 && (
        <Section
          className="py-10 md:py-12"
          id="success-stories"
        >
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-semibold text-slate-50">
                Success Stories
              </h2>

              <p className="mt-3 text-slate-300">
                Learners turned campaigns into real opportunities at
                growth-focused teams.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((story) => (
                <Surface
                  key={story.id || story.name}
                  className="p-5"
                >
                  {story.quote && (
                    <p className="text-sm leading-relaxed text-slate-300">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  )}

                  <div className="mt-4 text-base font-semibold text-slate-50">
                    {story.name}
                  </div>

                  {story.role && (
                    <p className="mt-2 text-sm text-slate-300">
                      {story.role}
                    </p>
                  )}

                  {story.company && (
                    <div className="mt-3 text-xs text-teal-300">
                      {story.company}
                    </div>
                  )}
                </Surface>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section
        className="py-10 md:py-12"
        id="about-us"
      >
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-slate-50">
              About Our Trainers
            </h2>

            <p className="mt-3 text-slate-300">
              Learn from mentors, reviewers and practitioners with
              real industry experience.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'SEO Mentor',
              'Ads Mentor',
              'Analytics Mentor',
              'Content Mentor',
            ].map((person) => (
              <Surface
                key={person}
                className="p-5 text-center"
              >
                <div className="mx-auto h-14 w-14 rounded-full border border-white/10 bg-white/[0.05]" />

                <div className="mt-4 text-sm font-semibold text-slate-100">
                  {person}
                </div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section
        className="py-10 md:py-12"
        id="projects"
      >
        <Container className="max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071326] px-6 py-8 shadow-[0_22px_60px_rgba(0,0,0,0.35)] md:px-8 md:py-10">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.28em] text-teal-200">
                Projects
              </p>
              <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">
                Solving Digital Growth in 2026
              </h2>
              <p className="mt-3 text-slate-300">
                Master AI Overview (AIO), Semantic Search, and Performance Ads through hands-on execution.
              </p>
            </div>

            <div
              ref={projectSliderRef}
              className="relative z-10 mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              tabIndex={0}
              role="region"
              aria-label="Projects carousel"
            >
              {courseProjects.slice(0, 5).map((project) => (
                <ShowcaseWideCard
                  key={project.title}
                  type="project"
                  label={project.projectLabel}
                  title={project.title}
                  duration={project.weeks}
                  problem={project.problem}
                  learn={Array.isArray(project.learnLines) ? project.learnLines.join(' ') : project.learnLines}
                  solutions={project.solutions}
                />
              ))}
            </div>

            <SliderArrows onPrev={() => sliderScroll(projectSliderRef, -1)} onNext={() => sliderScroll(projectSliderRef, 1)} dark />
          </div>
        </Container>
      </Section>

      <Section
        className="py-10 md:py-12"
        id="case-studies"
      >
        <Container className="max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#050b12_0%,#0d1724_55%,#1c2d16_100%)] px-6 py-8 shadow-[0_22px_60px_rgba(0,0,0,0.35)] md:px-8 md:py-10">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.28em] text-amber-200">
                Case Studies
              </p>
              <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">
                Explore Our Performance Case Studies
              </h2>
              <p className="mt-3 text-slate-300">
                Real, illustrative case studies showing the AI-driven strategies and measurable outcomes taught in the program.
              </p>
            </div>

            <div
              ref={caseStudySliderRef}
              className="relative z-10 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              tabIndex={0}
              role="region"
              aria-label="Case studies carousel"
            >
              {courseCaseStudies.slice(0, 3).map((item) => (
                <ShowcaseWideCard
                  key={item.title}
                  type="case-study"
                  label={item.caseStudyLabel}
                  title={item.title}
                  problem={item.problem}
                  keywords={item.keywordsText}
                  result={item.result}
                  skills={item.skills}
                />
              ))}
            </div>

            <SliderArrows onPrev={() => sliderScroll(caseStudySliderRef, -1)} onNext={() => sliderScroll(caseStudySliderRef, 1)} dark />
          </div>
        </Container>
      </Section>

      <Section
        className="py-10 md:py-12"
        id="faq"
      >
        <Container className="max-w-6xl">
          <TabbedFaqAccordion
            title="Course FAQs"
            intro="These course FAQs cover the program structure, AI-search methods, no-code execution, content systems, fees, and core search differences."
            tabs={faqTabs}
            items={coursesFaqExact}
            tabInactiveClassName="border-white/15 bg-transparent text-slate-100"
            cardClassName="rounded-[1.7rem] border border-white/10 bg-[#0b1526] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            answerClassName="mt-4 text-base leading-8 text-slate-300"
          />
        </Container>
      </Section>

      <Section
        className="py-10 md:py-12"
        id="related-links"
      >
        <Container>
          <Surface className="p-6">
            <h2 className="text-xl font-semibold text-slate-50">
              Explore More
            </h2>

            <div className="mt-5 grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Blog Guides
                </div>

                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {internalLinks.blogs.length > 0 ? (
                    internalLinks.blogs.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/blog/${item.slug}`}
                        className="text-teal-300 hover:text-teal-200"
                      >
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      New guides coming soon.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Tools
                </div>

                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {internalLinks.tools.length > 0 ? (
                    internalLinks.tools.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/tools/${item.slug}`}
                        className="text-teal-300 hover:text-teal-200"
                      >
                        {item.title}
                      </Link>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      Tools will appear here.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Placements
                </div>

                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
                  {internalLinks.placements.length > 0 ? (
                    internalLinks.placements.map((item) => (
                      <div key={item.id}>
                        {item.company_name ||
                          item.company ||
                          'Placement partner'}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-400">
                      Placement updates coming soon.
                    </span>
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