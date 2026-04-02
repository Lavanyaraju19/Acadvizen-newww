import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { neonBlueprintPanelStyle, solidPublicPanelClass, techGridPanelStyle, wavePanelStyle } from '../../lib/publicVisualStyles'
import ShowcaseWideCard from '../../components/marketing/ShowcaseWideCard'

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
const projectTabs = ['Projects', 'AI Search', 'Performance Ads', 'Analytics']

const docsCardStyle = {
  backgroundColor: '#dfeae6',
  backgroundImage:
    'linear-gradient(135deg, rgba(223,234,230,0.98) 0%, rgba(207,221,214,0.98) 70%)',
}

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

export function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAccordion, setActiveAccordion] = useState('overview')
  const projectSliderRef = useRef(null)
  const caseStudySliderRef = useRef(null)

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

      <Section className="scroll-mt-32 pt-0 pb-6 md:pb-10" id="course-highlights">
        <Container>
          <div className={`${solidPublicPanelClass} relative overflow-hidden p-6 md:p-8`} style={wavePanelStyle}>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold italic tracking-tight text-white md:text-4xl">Course Highlights</h2>
              <p className="mt-2 text-sm italic text-slate-200 md:text-base">
                A Snapshot of What Makes Our E-Commerce Marketing Course a Game-Changer
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {courseHighlights.map((item) => (
                  <article key={item.label} className="rounded-[0.8rem] border border-[#1f3650] bg-[#171717] px-4 py-4 shadow-[0_16px_30px_rgba(0,0,0,0.2)]">
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
          <div className={`${solidPublicPanelClass} p-8 md:p-12`} style={wavePanelStyle}>
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
                  <div key={item.key} className="overflow-hidden rounded-[1.7rem] border border-[#1c3550] bg-[#081423]">
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
                    <div
                      className={`${solidPublicPanelClass} h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1`}
                      style={idx % 2 === 0 ? techGridPanelStyle : neonBlueprintPanelStyle}
                    >
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
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="projects">
        <Container className="max-w-6xl">
          <div className={`${solidPublicPanelClass} relative overflow-hidden px-6 py-8 md:px-8 md:py-10`}>
          <div className="relative z-10 max-w-4xl rounded-[1.8rem] border border-white/12 bg-[#08120e]/62 px-5 py-5 shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-6">
            <p className="text-sm uppercase tracking-[0.28em] text-teal-200">Projects</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">Solving Digital Growth in 2026</h2>
            <h3 className="mt-3 text-2xl font-semibold text-slate-100">15+ Projects in AI-Search &amp; Performance Ads</h3>
            <p className="mt-3 text-slate-300">
              Master AIO (AI Overview), Semantic Search, and Performance Ads through hands-on execution.
            </p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2">
            {projectTabs.map((tab) => (
              <span
                key={tab}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100"
              >
                {tab}
              </span>
            ))}
          </div>

          <div
            ref={projectSliderRef}
            className="relative z-10 mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {courseProjects.slice(0, 5).map((project) => (
              <ShowcaseWideCard
                key={project.title}
                type="project"
                label={project.projectLabel}
                title={project.title}
                duration={project.duration}
                problem={project.problem}
                learn={project.learn}
                solutions={project.solutions}
              />
            ))}
          </div>

          <div className="relative z-10">
            <SliderArrows onPrev={() => sliderScroll(projectSliderRef, -1)} onNext={() => sliderScroll(projectSliderRef, 1)} dark />
          </div>
          <div className="relative z-10 mt-9 flex justify-start">
            <Link
              to="/projects"
              className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-full border border-teal-300/35 bg-teal-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              Explore Real-Time Projects <span aria-hidden="true">→</span>
            </Link>
          </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="case-studies">
        <Container className="max-w-6xl">
          <div className={`${solidPublicPanelClass} relative overflow-hidden px-6 py-8 md:px-8 md:py-10`} style={wavePanelStyle}>
          <div className="absolute inset-0 bg-[#04110d]/36 backdrop-blur-[2px]" />
          <div className="relative z-10 max-w-5xl rounded-[2.2rem] border border-white/18 bg-[linear-gradient(135deg,rgba(8,43,35,0.74),rgba(15,88,74,0.34))] px-6 py-8 shadow-[0_26px_60px_rgba(0,0,0,0.24)] backdrop-blur-[18px] md:px-8 md:py-10">
            <p className="text-sm uppercase tracking-[0.28em] text-amber-200">Case Studies</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-50 md:text-5xl">Explore Our Performance Case Studies</h2>
            <h3 className="mt-3 text-2xl font-semibold text-slate-100">
              35+ AI-Driven Case Studies &amp; 4.5x ROAS Mastery Beyond Traditional SEO
            </h3>
            <p className="mt-3 text-slate-300">
              Our portfolio of detailed case studies focuses on measurable growth. Master the AIO frameworks and Performance Marketing 3.0 strategies that consistently deliver high-scale ROI in the Indian landscape.
            </p>
          </div>
          <div className="relative z-10 mt-8 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07120d]/16 px-6 py-7 backdrop-blur-[2px]">
            <div
              ref={caseStudySliderRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            <SliderArrows onPrev={() => sliderScroll(caseStudySliderRef, -1)} onNext={() => sliderScroll(caseStudySliderRef, 1)} />
          </div>
          <div className="relative z-10 mt-9 flex justify-start">
            <Link
              to="/projects#case-studies"
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Get More Details <span aria-hidden="true">→</span>
            </Link>
          </div>
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
            cardClassName="rounded-[1.7rem] border border-[#1b3551] bg-[#091a2d] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            answerClassName="mt-4 text-base leading-8 text-slate-300"
          />
        </Container>
      </Section>
    </div>
  )
}

export default CoursesPage
