import { Link } from 'react-router-dom'
import WorldCareerMap from '../../../components/WorldCareerMap'
import AlumniShowcaseSection from '../../components/placement/AlumniShowcaseSection'
import TabbedFaqAccordion from '../../components/faq/TabbedFaqAccordion'
import { Container, Section } from '../../components/ui/Section'
import {
  alumniShowcase,
  placementFaqExact,
  placementOutcomeRows,
  placementStats,
  placementStories,
} from '../../lib/sitePageContent'

const faqTabs = []

const solidPanel = 'rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-[0_20px_50px_rgba(0,0,0,0.32)]'

const faqBackground = {
  backgroundColor: '#071326',
  backgroundImage:
    'radial-gradient(circle at 18% 22%, rgba(39,186,197,0.22) 0, rgba(39,186,197,0.02) 20%), linear-gradient(138deg, rgba(7,19,38,0.98) 0%, rgba(13,40,63,0.96) 48%, rgba(31,171,184,0.16) 48.2%, rgba(7,19,38,0.98) 100%)',
}

function StoryCard({ story }) {
  return (
    <article className="rounded-[1.8rem] border border-white/10 bg-[#0d1424] p-6 shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
      <div className="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
        {story.tag}
      </div>
      <h3 className="mt-5 text-2xl font-bold text-slate-50">{story.name}</h3>
      <p className="mt-2 text-sm font-medium text-slate-300">
        {story.company} | {story.role}
      </p>
      <p className="mt-5 text-sm leading-7 text-slate-300">
        <span className="font-semibold text-slate-100">Challenge:</span> {story.challenge}
      </p>
      <p className="mt-4 text-sm leading-7 text-slate-300">
        <span className="font-semibold text-slate-100">Story:</span> {story.story}
      </p>
    </article>
  )
}

function CtaBanner() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#0f1830_0%,#132340_45%,#18355a_100%)] px-6 py-8 text-center shadow-[0_18px_42px_rgba(0,0,0,0.3)]">
      <h3 className="text-2xl font-bold text-slate-50 md:text-3xl">Ready to be our next Success Story?</h3>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-300">
        Join Acadvizen to learn digital marketing in Bangalore with hands-on tool exposure, live project execution,
        portfolio development, and placement support designed for stronger 2026 career outcomes.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/contact"
          className="rounded-full border-2 border-[#0b0b0f] bg-[#f3263f] px-7 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(243,38,63,0.28)]"
        >
          Book a Free Demo Class
        </Link>
        <Link
          to="/testimonials"
          className="rounded-full border border-white/15 bg-white px-6 py-4 text-base font-bold text-slate-950"
        >
          View All Testimonials
        </Link>
      </div>
    </div>
  )
}

export function PlacementPage() {
  const featuredStories = placementStories.slice(0, 4)
  const extendedStories = placementStories.slice(4)

  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-10" id="success-stories">
        <Container className="max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-50 md:text-6xl">Career Switchers Success Stories</h1>
            <p className="mt-4 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2 text-sm font-semibold text-amber-200">
              Digital Marketing Career Success Stories: How Our Students Mastered the 2026 Industry Standards
            </p>
            <p className="mx-auto mt-5 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
              Explore real-world transformations from our digital marketing course in Bangalore. From career switchers to
              fresh graduates, see how our alumni mastered AI-driven SEO, Performance Marketing, and Data Analytics to
              land high-growth roles in the city&apos;s top tech parks. These stories represent the journey from beginner
              to industry-ready professional.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {placementStats.map((item, index) => (
              <div
                key={item.label}
                className={`${solidPanel} px-6 py-7 text-center`}
                style={{
                  boxShadow:
                    index === 0
                      ? '0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(89,200,255,0.12)'
                      : undefined,
                }}
              >
                <div className="text-4xl font-extrabold text-slate-50">{item.value}</div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{item.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <AlumniShowcaseSection
        eyebrow="ALUMNI TESTIMONIALS"
        title="Alumni Placed at Top Companies"
        description="One unified showcase of Acadvizen student outcomes using real local student images. The section keeps all eleven cards together in one finished premium block instead of splitting them into smaller fragments."
        students={alumniShowcase}
        primaryCta={{ to: '/courses', label: 'Explore Programs' }}
        secondaryCta={{ to: '/contact', label: 'Book a Free Demo Class' }}
      />

      <Section className="py-10 md:py-12">
        <Container className="max-w-6xl">
          <div className="max-w-4xl">
            <h2 className="text-4xl font-bold text-slate-50 md:text-5xl">
              From Training to Transformation: Digital Marketing Success Stories and Career Milestones
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              What does it take to succeed in digital marketing in 2026? Our alumni share their experiences of mastering
              Generative AI, Search Engine Optimization, and Social Media Strategy. Learn how they used their classroom
              knowledge to solve real business challenges and build sustainable careers in the marketing industry.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {featuredStories.map((story) => (
              <StoryCard key={`${story.name}-${story.company}`} story={story} />
            ))}
          </div>

          <div className="mt-8">
            <CtaBanner />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {extendedStories.map((story) => (
              <StoryCard key={`${story.name}-${story.company}`} story={story} />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="placement-outcomes">
        <Container className="max-w-7xl">
          <div className="max-w-5xl">
            <h2 className="text-4xl font-bold text-slate-50 md:text-5xl">
              Acadvizen Placements 2026: National &amp; Global Career Outcomes
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Our 2026 placement drive achieved a 95% success rate with 500+ recruiters. Graduates secured high-growth
              roles across India&apos;s Tier-1 tech hubs and expanded into international pathways aligned with AI-led and
              digital-first functions.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-300">
              The highest-value opportunities continue to come from performance, search, analytics, automation, and
              content systems roles where practical proof of work matters more than generic theory.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
            <div className="hidden grid-cols-4 border-b border-white/10 bg-white/[0.04] md:grid">
              {['Career Path', 'Top Recruiters (Entities)', 'Average Entry Salary (2026)', 'Key Skill Focus'].map((label) => (
                <div key={label} className="px-4 py-4 text-sm font-bold text-slate-100">
                  {label}
                </div>
              ))}
            </div>
            <div className="divide-y divide-white/10">
              {placementOutcomeRows.map((row) => (
                <div key={row[0]} className="grid gap-0 md:grid-cols-4">
                  {row.map((cell, index) => (
                    <div key={`${row[0]}-${index}`} className="px-4 py-5 text-sm leading-7">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 md:hidden">
                        {['Career Path', 'Top Recruiters', 'Average Entry Salary', 'Key Skill Focus'][index]}
                      </div>
                      <div className={index === 0 ? 'font-semibold text-slate-100' : 'text-slate-300'}>{cell}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-300">
            Our curriculum is updated for Generative Engine Optimization (GEO), ensuring our students are prepared for
            roles that did not exist two years ago.
          </p>
          <Link
            to="/courses#course-program"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-teal-300/30 bg-teal-300 px-5 py-3 text-sm font-bold text-slate-950"
          >
            View Course Syllabus Alignment
          </Link>
        </Container>
      </Section>

      <Section className="py-8 md:py-10" id="global-career-opportunities">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-50">Global Learner Growth Map</h2>
            <p className="mt-3 text-slate-300">
              Explore how portfolio-led digital marketing growth can expand learner confidence, visibility, and career
              reach across local and international pathways.
            </p>
          </div>
          <div className="mt-8">
            <WorldCareerMap />
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="faq">
        <Container className="max-w-6xl">
          <div
            className="overflow-hidden rounded-[2rem] border border-cyan-300/20 px-6 py-8 shadow-[0_18px_50px_rgba(2,10,27,0.35)]"
            style={faqBackground}
          >
            <TabbedFaqAccordion
              title="FAQ"
              intro="Questions below cover placements, career switching, project execution, AI-led marketing skills, and the kind of support learners can expect while moving from training to real hiring conversations."
              tabs={faqTabs}
              items={placementFaqExact}
              panelClassName=""
            />
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default PlacementPage
