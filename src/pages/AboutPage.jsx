import { motion } from 'framer-motion'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function AboutPage() {
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
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(0,191,255,0.45)]" />
              Our story
            </div>
            <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
              A premium platform built for marketers who ship
            </h1>
            <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
              Acadvizen is designed to remove friction from learning and execution—so you can move from strategy to
              results with speed, clarity, and confidence.
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section className="py-8 md:py-14">
        <Container className="max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <Surface
              className="p-7 md:p-10"
              motionProps={{
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45 },
              }}
            >
              <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Our Story</h2>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Digital marketing moves fast. Tools change weekly. Playbooks get outdated. Teams waste time stitching
                together tabs, notes, and scattered assets.
              </p>
              <p className="mt-4 text-slate-300 leading-relaxed">
                Acadvizen brings everything into one premium environment: a curated tool library, structured courses,
                and a resource hub that supports real execution—not just theory.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { k: '75+', v: 'Tools' },
                  { k: 'Courses', v: 'Structured' },
                  { k: 'RLS', v: 'Secure' },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center"
                  >
                    <div className="text-lg font-semibold text-slate-50">{s.k}</div>
                    <div className="mt-1 text-xs text-slate-400">{s.v}</div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface
              className="p-6 md:p-8 overflow-hidden"
              motionProps={{
                initial: { opacity: 0, y: 12 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-80px' },
                transition: { duration: 0.45, delay: 0.05 },
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-50">Crafted for premium outcomes</h3>
                <span className="text-xs text-slate-400">Scroll -&gt;</span>
              </div>
              <div className="mt-5 -mx-2 overflow-x-auto">
                <div className="flex gap-4 px-2 pb-2 min-w-max">
                  {[
                    {
                      title: 'Strategy to execution',
                      desc: 'Structure that speeds decisions.',
                      bg: 'from-teal-400/25 via-sky-400/10 to-transparent',
                    },
                    {
                      title: 'Operator-grade tools',
                      desc: 'Curated for real workflows.',
                      bg: 'from-indigo-400/25 via-teal-400/10 to-transparent',
                    },
                    {
                      title: 'Premium learning',
                      desc: 'Courses + resources together.',
                      bg: 'from-sky-400/25 via-indigo-400/10 to-transparent',
                    },
                    {
                      title: 'Secure access',
                      desc: 'Roles, approvals, and RLS.',
                      bg: 'from-teal-400/25 via-indigo-400/10 to-transparent',
                    },
                  ].map((card, idx) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.35, delay: idx * 0.06 }}
                      className="w-[280px] sm:w-[320px] shrink-0"
                    >
                      <div className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.bg}`} />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute -inset-12 rounded-full bg-teal-400/10 blur-3xl" />
                        </div>
                        <div className="relative">
                          <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04]" />
                          <div className="mt-4 text-sm font-semibold text-slate-50">{card.title}</div>
                          <div className="mt-2 text-sm text-slate-300">{card.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-16">
        <Container className="max-w-5xl">
          <Surface
            className="p-8 md:p-12"
            motionProps={{
              initial: { opacity: 0, y: 12 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: '-80px' },
              transition: { duration: 0.45 },
            }}
          >
            <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">Mission</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              To democratize access to premium digital marketing resources and education—so teams and individuals can
              build better campaigns, faster, with less guesswork.
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                {
                  t: 'Premium by default',
                  d: 'Dark, elegant UI with subtle motion and depth.',
                },
                {
                  t: 'Clarity > complexity',
                  d: 'Information architecture that stays clean at scale.',
                },
                {
                  t: 'Built for trust',
                  d: 'Roles, approvals, and secure data boundaries.',
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="text-sm font-semibold text-slate-50">{x.t}</div>
                  <div className="mt-2 text-sm text-slate-300">{x.d}</div>
                </div>
              ))}
            </div>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}
