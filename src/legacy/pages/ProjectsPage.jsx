import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Container, Section } from '../../components/ui/Section'
import { courseCaseStudies, courseProjects } from '../../lib/sitePageContent'
import { solidPublicPanelClass, techGridPanelStyle, wavePanelStyle } from '../../lib/publicVisualStyles'
import ShowcaseWideCard from '../../components/marketing/ShowcaseWideCard'

const pageBackground = {
  backgroundColor: '#071A2F',
}

const projectTabs = ['Projects', 'AI Search', 'Performance Ads', 'Analytics']
const caseStudyTabs = ['Case Studies', 'SEO', 'Performance', 'Content']

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


export function ProjectsPage() {
  const projectSliderRef = useRef(null)
  const caseStudySliderRef = useRef(null)

  return (
    <div className="min-h-screen" style={pageBackground}>
      <Section className="pt-12 pb-10 md:pt-16 md:pb-12">
        <Container className="max-w-6xl">
          <div className={`${solidPublicPanelClass} relative overflow-hidden px-6 py-11 text-center md:px-10 md:py-14`} style={wavePanelStyle}>
            <div className="absolute inset-0 bg-[#04110d]/36 backdrop-blur-[2px]" />
            <div className="relative z-10 mx-auto max-w-5xl rounded-[2.2rem] border border-white/18 bg-[linear-gradient(135deg,rgba(8,43,35,0.74),rgba(15,88,74,0.34))] px-6 py-8 shadow-[0_26px_60px_rgba(0,0,0,0.24)] backdrop-blur-[18px] md:px-8 md:py-10">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100/80">Projects</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                Next-Gen Search &amp; Performance: 15+ AI-Led Projects
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                Expert in AI Search &amp; Performance: Proven Mastery in AIO and Semantic Logic.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="project-library">
        <Container className="max-w-[1500px]">
          <div className="relative overflow-hidden px-6 py-9 md:px-8 md:py-10">
            <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-white/12 bg-[#08120e]/62 px-6 py-6 text-center shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur-md">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100/80">Projects</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">Solving Digital Growth in 2026</h2>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {projectTabs.map((tab) => (
                  <span
                    key={tab}
                    className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100"
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            <div ref={projectSliderRef} className="mt-9 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {courseProjects.map((project) => (
                <ShowcaseWideCard
                  key={`${project.projectLabel}-${project.title}`}
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

            <SliderArrows onPrev={() => sliderScroll(projectSliderRef, -1)} onNext={() => sliderScroll(projectSliderRef, 1)} dark />

            <div className="mt-8 flex justify-center">
              <Link
                to="/contact"
                className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-white/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:-translate-y-0.5"
              >
                Download Projects
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="case-studies">
        <Container className="max-w-[1500px]">
          <div className={`${solidPublicPanelClass} relative overflow-hidden px-6 py-10 md:px-8 md:py-12`} style={wavePanelStyle}>
            <div className="absolute inset-0 bg-[#04110d]/36 backdrop-blur-[2px]" />
            <div className="relative z-10 mx-auto max-w-5xl rounded-[2.2rem] border border-white/18 bg-[linear-gradient(135deg,rgba(8,43,35,0.74),rgba(15,88,74,0.34))] px-6 py-8 text-left shadow-[0_26px_60px_rgba(0,0,0,0.24)] backdrop-blur-[18px] md:px-8 md:py-10">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-100/80">Case Studies</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                The 4.5x ROAS Standard: Training the Next Generation of AI Marketers
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-200">
                Five data-backed deep dives into the future of search. Master the AIO frameworks and Performance 3.0 strategies designed to outperform the competition and drive measurable, high-scale ROI in the Indian market.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {caseStudyTabs.map((tab) => (
                  <span
                    key={tab}
                    className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100"
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-9">
              <div ref={caseStudySliderRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {courseCaseStudies.map((item) => (
                  <ShowcaseWideCard
                    key={`${item.caseStudyLabel}-${item.title}`}
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

            <div className="relative z-10 mt-8 flex justify-center">
              <Link
                to="/contact"
                className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-white/10 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:-translate-y-0.5"
              >
                Get Information
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default ProjectsPage
