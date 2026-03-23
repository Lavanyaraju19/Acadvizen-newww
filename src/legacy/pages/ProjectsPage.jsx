import { Link } from 'react-router-dom'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { courseCaseStudies, courseProjects } from '../../lib/sitePageContent'

export function ProjectsPage() {
  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-12">
        <Container className="max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              Next-Gen Search &amp; Performance: 15+ AI-Led Projects
            </h1>
            <p className="mt-4 text-slate-300 max-w-3xl mx-auto">
              Expert in AI Search &amp; Performance: Proven Mastery in AIO and Semantic Logic.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-teal-300/35 bg-teal-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              Download Projects
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="project-library">
        <Container className="max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-2">
            {courseProjects.map((project) => (
              <Surface key={project.title} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-slate-50">{project.title}</h2>
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
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="case-studies">
        <Container className="max-w-6xl">
          <div className="max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50">
              The 4.5x ROAS Standard: Training the Next Generation of AI Marketers
            </h2>
            <p className="mt-4 text-slate-300">
              Five data-backed deep dives into the future of search. Master the AIO frameworks and Performance 3.0 strategies designed to outperform the competition and drive measurable, high-scale ROI in the Indian market.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {courseCaseStudies.map((item) => (
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
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Get Information
          </Link>
        </Container>
      </Section>
    </div>
  )
}

export default ProjectsPage
