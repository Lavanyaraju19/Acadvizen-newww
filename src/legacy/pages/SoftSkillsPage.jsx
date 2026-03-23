import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'

const softSkills = [
  'Interview communication and confidence building',
  'Resume storytelling and profile positioning',
  'Presentation skills for campaign walkthroughs',
  'Client communication and reporting structure',
  'Team collaboration and workplace etiquette',
  'LinkedIn profile refinement and networking habits',
]

export function SoftSkillsPage() {
  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-12">
        <Container className="max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              Soft Skills Training for Career-Ready Digital Marketers
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-slate-300">
              Along with tool mastery, we train learners to communicate, present, interview, and collaborate with confidence in real workplace environments.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-5xl">
          <div className="grid gap-4 md:grid-cols-2">
            {softSkills.map((item) => (
              <Surface key={item} className="p-6">
                <div className="text-lg font-semibold text-slate-50">{item}</div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default SoftSkillsPage
