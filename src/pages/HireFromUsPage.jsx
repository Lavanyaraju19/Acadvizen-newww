import { Container, Section } from '../components/ui/Section'

const readinessBlocks = [
  {
    title: 'Career Advice',
    points: [
      'Personalized guidance from dedicated learning advisors.',
      'Tailored career roadmaps to match industry demand.',
      'Pre-enrollment 1:1 mentoring session to align learning goals.',
    ],
  },
  {
    title: 'Guide Program',
    points: [
      'A structured walkthrough of the program from our experts.',
      'Free certification-equivalent masterclass to experience our teaching quality.',
      'Smooth onboarding, documentation, and payment process for learners.',
    ],
  },
  {
    title: 'Specialisation',
    points: [
      'Access to niche-focused modules in SEO, SEM, SMM, Analytics, and more.',
      'Hands-on learning with advanced tools and frameworks.',
      'Masterclasses designed in collaboration with industry leaders.',
    ],
  },
  {
    title: 'Practicals',
    points: [
      'Real-world projects, simulations, and case studies.',
      'Practical assignments that mirror live business challenges.',
      'Portfolio-ready work to showcase to employers.',
    ],
  },
  {
    title: 'Placements',
    points: [
      'Dedicated placement cell with mock interviews and resume building.',
      '1,000+ hiring partners across industries.',
      '93% average placement rate with competitive salary packages.',
    ],
  },
  {
    title: 'Resource & Forums',
    points: [
      'Lifetime access to LMS, recorded sessions, and cheat sheets.',
      'Active peer and alumni forums for knowledge sharing.',
      'Expert-led communities for continuous learning and networking.',
    ],
  },
]

export function HireFromUsPage() {
  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-16 pb-6">
        <Container className="max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-semibold italic text-slate-50">
              How We Ensure That The Talent Is
              <br />
              Ready To Deliver
            </h1>
            <p className="mt-6 text-slate-300 text-base md:text-lg">
              At ACADVIZEN, we don&apos;t just train. We prepare our learners to step into your workplace and start
              delivering from day one.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="py-8 md:py-14">
        <Container className="max-w-6xl">
          <div className="relative space-y-14 md:space-y-20">
            <div className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l border-white/20 md:block" />
            {readinessBlocks.map((block, idx) => (
              <div key={block.title} className="relative grid gap-8 md:grid-cols-2 md:gap-16">
                <div className={`${idx % 2 ? 'md:order-2' : ''}`}>
                  <h2 className="text-4xl font-medium text-slate-50">{block.title}</h2>
                </div>
                <div className={`${idx % 2 ? 'md:order-1' : ''}`}>
                  <div className="space-y-4">
                    {block.points.map((point) => (
                      <div key={point} className="flex items-start gap-3 text-lg text-slate-100">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-emerald-400">✓</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="absolute left-1/2 top-3 hidden h-5 w-5 -translate-x-1/2 rounded-full border border-white/40 bg-slate-100 md:block" />
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}
