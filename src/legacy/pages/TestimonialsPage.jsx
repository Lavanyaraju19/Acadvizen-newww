import { Section, Container } from '../../components/ui/Section'
import { alumniShowcase, placementStats } from '../../lib/sitePageContent'
import AlumniShowcaseSection from '../../components/placement/AlumniShowcaseSection'

export function TestimonialsPage() {
  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-10">
        <Container className="max-w-5xl text-center">
          <h1 className="text-4xl font-bold text-slate-50 md:text-6xl">Testimonials & Alumni Outcomes</h1>
          <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-slate-300 md:text-lg">
            Explore the learner journeys that define Acadvizen&apos;s placement ecosystem. This page highlights real student images, stronger career transitions, and the kind of portfolio-led execution that turns training into industry-ready outcomes.
          </p>
        </Container>
      </Section>

      <Section className="py-0">
        <Container className="max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {placementStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.8rem] border border-white/10 bg-[#0b1020] px-6 py-7 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
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
        description="A premium view of Acadvizen student outcomes using only real local student assets. Each card below is presented in one unified showcase instead of fragmented blocks so the page feels complete, clear, and production-ready."
        students={alumniShowcase}
        primaryCta={{ to: '/placement', label: 'View Placement Page' }}
        secondaryCta={{ to: '/contact', label: 'Book a Free Demo Class' }}
      />
    </div>
  )
}

export default TestimonialsPage
