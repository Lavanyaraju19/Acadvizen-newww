import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import TabbedFaqAccordion from '../../components/faq/TabbedFaqAccordion'
import { aboutFaqExact, aboutTrainers, aboutWhyChoose } from '../../lib/sitePageContent'

const faqTabs = []
const trainerPalette = ['#74c7d8', '#f7df59', '#b7e08e', '#ff8f85', '#b884ff', '#8ad8ff']
const trainerBackdrop = {
  backgroundColor: '#070a23',
  backgroundImage:
    'radial-gradient(circle at 18% 24%, rgba(119, 249, 235, 0.18) 0, rgba(119, 249, 235, 0.02) 24%), radial-gradient(circle at 82% 20%, rgba(112, 202, 255, 0.18) 0, rgba(112, 202, 255, 0.02) 20%), radial-gradient(circle at 52% 62%, rgba(98, 255, 234, 0.14) 0, rgba(98, 255, 234, 0.01) 18%), linear-gradient(132deg, rgba(4, 9, 30, 0.98) 0%, rgba(7, 18, 48, 0.98) 42%, rgba(16, 74, 99, 0.76) 63%, rgba(4, 9, 30, 0.98) 100%)',
}

export function AboutPage() {
  const trainerSliderRef = useRef(null)

  const scrollTrainerCards = (direction) => {
    if (!trainerSliderRef.current) return
    const amount = Math.max(trainerSliderRef.current.clientWidth * 0.82, 320)
    trainerSliderRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-12 md:pt-16 pb-8 md:pb-12">
        <Container className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-slate-50">Who We Are</h1>
            <p className="mt-4 text-xl font-semibold text-teal-200">Best Academy for AI Digital Marketing in India</p>
            <p className="mt-4 max-w-3xl mx-auto text-slate-300">
              Acadvizen is rated as the top choice for students and working professionals seeking career growth in 2026.
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] items-center">
            <Surface className="p-5">
              <AdaptiveImage
                src="/about/leadership/ceo-tharika.jpg"
                fallbackSrcs={['/about/tharii.jpg']}
                alt="Tharika Mam"
                variant="content"
                aspectRatio="4 / 5"
                sizes="(max-width: 1024px) 100vw, 520px"
                wrapperClassName="w-full"
                borderClassName=""
                roundedClassName="rounded-[1.6rem]"
              />
            </Surface>
            <Surface className="p-7 md:p-9">
              <h2 className="text-3xl font-bold text-slate-50">Founder&apos;s Note</h2>
              <p className="mt-4 leading-8 text-slate-300">
                With a Master&apos;s in Digital Marketing from Dublin Business School and a Bachelor&apos;s in Commerce from Jain University, I currently lead Acadvizen as its CEO and Founder. Our institute pioneers digital marketing education by designing customized, industry-focused learning pathways. Combining expertise in digital marketing strategy, performance marketing, and brand growth, I am committed to preparing students and professionals with globally relevant skills.
              </p>
              <p className="mt-4 leading-8 text-slate-300">
                At Acadvizen, I collaborate with my team to develop innovative programs that emphasize live projects and tool-based execution. By fostering a culture of strategic thinking and practical learning, we empower learners to transition seamlessly into the digital marketing industry. My goal is to continue shaping the future of education with a focus on measurable outcomes, ensuring that every learner is equipped to thrive in the dynamic digital landscape.
              </p>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface className="p-7 md:p-9">
              <h2 className="text-3xl font-bold text-slate-50">About Acadvizen</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Acadvizen is a premier digital marketing institute specializing in AI-integrated marketing strategies, SEO, and Paid Ads. We offer 100% practical training, 15+ global certifications (Google, Meta, HubSpot), and dedicated placement assistance. Located in Bangalore, Acadvizen is rated as the top choice for students and working professionals seeking career growth in 2026.
              </p>
            </Surface>
            <Surface className="p-7 md:p-9">
              <h2 className="text-3xl font-bold text-slate-50">Our Mission</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Our mission is to bridge the skills gap in India&apos;s tech capital by providing the most advanced digital marketing course in Bangalore. We empower freshers and professionals to master AI-driven marketing strategies, including AEO, GEO, and programmatic advertising. Through 15+ live industry projects, we ensure our students do not just learn theory but execute high-impact campaigns that deliver a documented 4.5x ROAS for real-world brands.
              </p>
            </Surface>
          </div>
          <Surface className="mt-6 p-7 md:p-9">
            <h2 className="text-3xl font-bold text-slate-50">Our Vision</h2>
            <p className="mt-4 leading-8 text-slate-300">
              To become the global benchmark for digital marketing excellence by 2030, transforming Bangalore into a hub for AI-integrated marketing talent. We envision a future where every Acadvizen graduate is a leader in data-driven growth hacking, setting new standards for digital ROI and innovative brand storytelling in an AI-first world.
            </p>
          </Surface>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50">Why Choose Us?</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {aboutWhyChoose.map((item) => (
              <Link key={item.title} to={item.to} className="block">
                <Surface className="h-full p-6 transition-transform duration-200 hover:-translate-y-1">
                  <div className="text-xl font-bold text-slate-50">{item.title}</div>
                  <div className="mt-5 text-sm font-semibold text-teal-200">Explore →</div>
                </Surface>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-7xl">
          <div
            className="overflow-hidden rounded-[2.4rem] border border-cyan-300/15 px-6 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:px-8 md:py-12"
            style={trainerBackdrop}
          >
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl md:text-6xl font-bold italic text-slate-50">Our Trainers</h2>
              <p className="mt-4 text-base leading-8 text-slate-200 md:text-lg">
                Practical, portfolio-first mentoring from a team focused on modern digital marketing execution, live workflows, and industry-facing outcomes.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => scrollTrainerCards(-1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18"
                aria-label="Scroll trainer cards left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTrainerCards(1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18"
                aria-label="Scroll trainer cards right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={trainerSliderRef}
              className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {aboutTrainers.map((trainer, index) => (
                <article
                  key={trainer.name}
                  className="min-w-[290px] snap-start overflow-hidden rounded-[1.8rem] border-[3px] border-black/70 shadow-[0_18px_32px_rgba(0,0,0,0.24)] sm:min-w-[330px] lg:min-w-[360px]"
                  style={{ backgroundColor: trainerPalette[index % trainerPalette.length] }}
                >
                  <div className="relative h-[21rem] overflow-hidden">
                    <div className="absolute inset-0 opacity-90">
                      <div className="absolute -left-12 bottom-[-12%] h-44 w-44 rounded-full bg-black/10 blur-2xl" />
                      <div className="absolute right-[-10%] top-8 h-32 w-32 rounded-full bg-white/12 blur-2xl" />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 via-black/5 to-transparent" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 mx-auto h-[92%] w-[92%]">
                      <Image
                        src={trainer.image}
                        alt={trainer.name}
                        fill
                        sizes="(max-width: 768px) 86vw, 360px"
                        className="object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.26)]"
                        style={{ filter: 'contrast(1.04) saturate(1.03)' }}
                      />
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-4 text-slate-950">
                    <h3 className="text-2xl font-bold text-slate-950">{trainer.name}</h3>
                    <p className="mt-2 text-base text-slate-900/85">{trainer.designation}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12">
        <Container className="max-w-6xl">
          <TabbedFaqAccordion
            title="Frequently Asked Questions"
            intro="These About page FAQs explain what Acadvizen is, how it teaches, why it focuses on AI-driven digital marketing, and how the learning approach is structured."
            tabs={faqTabs}
            items={aboutFaqExact}
            panelClassName=""
            tabInactiveClassName="border-slate-500 text-slate-100 bg-transparent"
            cardClassName="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            answerClassName="mt-4 text-base leading-8 text-slate-300"
          />
        </Container>
      </Section>
    </div>
  )
}

export default AboutPage
