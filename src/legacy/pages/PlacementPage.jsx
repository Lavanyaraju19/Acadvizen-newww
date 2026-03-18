import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import WorldCareerMap from '../../../components/WorldCareerMap'
import { assetUrl } from '../../lib/assetUrl'
import AdaptiveImage from '../../../components/media/AdaptiveImage'

const hiringPartnerLogos = [
  { name: 'Accenture', file: 'accenture.png' },
  { name: 'Adobe', file: 'adobe.png' },
  { name: 'Amazon', file: 'amazon.png' },
  { name: 'Capgemini', file: 'capgemini.png' },
  { name: 'Cognizant', file: 'cognizant.png' },
  { name: 'Deloitte', file: 'deloitte.png' },
  { name: 'Google', file: 'google.png' },
  { name: 'IBM', file: 'ibm.png' },
  { name: 'Mastercard', file: 'mastercard.png' },
  { name: 'PayPal', file: 'paypal.png' },
  { name: 'TCS', file: 'tcs.png' },
  { name: 'Uber', file: 'uber.png' },
]
const careerPathSteps = [
  {
    title: 'Join Your Course',
    desc: 'Begin your journey by enrolling in a role-focused track tailored to your career goals.',
  },
  {
    title: 'Skill-Building Projects & Certifications',
    desc: 'Gain hands-on experience through real projects and certifications that validate your skills.',
  },
  {
    title: 'Portfolio & Resume Workshops',
    desc: 'Craft a standout resume and portfolio with expert guidance to impress potential employers.',
  },
  {
    title: 'Mock Interviews + HR Training',
    desc: 'Prepare for real interviews with mock sessions, HR best practices, and communication tips.',
  },
  {
    title: 'Placement Drives with Top Recruiters',
    desc: 'Get access to placement drives and job opportunities with top companies hiring actively.',
  },
  {
    title: 'Offer Letters + Joining Support',
    desc: 'Receive offer letters and complete post-placement support from documentation to onboarding.',
  },
]
const placementStories = [
  {
    name: 'Acadvizen Learner',
    role: 'Placed at Accenture',
    quote: 'Hands-on project training helped me transition confidently into a digital marketing role.',
    image_url: '/images/success/success2.jpg',
  },
  {
    name: 'Acadvizen Learner',
    role: 'Placed at TCS',
    quote: 'The structured curriculum and interview preparation made placement conversion much easier.',
    image_url: '/images/success/success1.jpg',
  },
  {
    name: 'Acadvizen Learner',
    role: 'Placed at IBM',
    quote: 'Tool-based learning and live campaigns gave me practical confidence from day one.',
    image_url: '/images/success/success.jpg',
  },
]
export function PlacementPage() {
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSections, setPageSections] = useState({})

  useEffect(() => {
    void loadPlacements()
    void loadPageSections()
  }, [])

  async function loadPlacements() {
    setLoading(true)
    const { data } = await fetchPublicData('placements')
    if (data) setPlacements(data)
    setLoading(false)
  }

  async function loadPageSections() {
    const { data } = await fetchPublicData('page-sections', { page: 'placement' })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')
  const heroTitle = heroSection.title || 'Acadvizen Placement'
  const heroSubtitle =
    heroSection.subtitle ||
    'Placement support helps candidates stand out, get noticed by top recruiters, and unlock real career opportunities.'

  const opportunityBubbles = [
    { region: 'North America', growth: '+10%', left: '18%', top: '36%', size: 'h-32 w-32' },
    { region: 'Europe', growth: '+10%', left: '50%', top: '33%', size: 'h-28 w-28' },
    { region: 'Asia', growth: '+13%', left: '81%', top: '35%', size: 'h-40 w-40' },
    { region: 'South America', growth: '+15%', left: '18%', top: '76%', size: 'h-32 w-32' },
    { region: 'Africa', growth: '+9%', left: '50%', top: '74%', size: 'h-28 w-28' },
    { region: 'Australia', growth: '+8%', left: '81%', top: '73%', size: 'h-28 w-28' },
  ]

  const floatingLights = [
    { id: 'light-1', left: '8%', top: '92%', delay: '0s', size: 'h-4 w-4' },
    { id: 'light-2', left: '62%', top: '14%', delay: '1s', size: 'h-3 w-3' },
    { id: 'light-3', left: '90%', top: '56%', delay: '0.6s', size: 'h-4 w-4' },
  ]
  return (
    <div className="min-h-screen">
      <Section className="py-10 md:py-12" id="placement-acadvizen">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-50">{heroTitle}</h1>
            <p className="mt-3 text-lg text-slate-300">
              {heroSubtitle}
            </p>
          </motion.div>
        </Container>
      </Section>

      <Section className="py-8 md:py-10" id="global-career-opportunities">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Global Learner Growth Map</h2>
            <p className="mt-3 text-slate-300">
              Night-theme world view with learner points and regional growth percentages.
            </p>
          </div>
          <div className="mt-8">
            <WorldCareerMap />
          </div>
        </Container>
      </Section>

      <Section className="py-8 md:py-10" id="career-opportunities">
        <Container>
          <div className="relative mt-2 overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[radial-gradient(circle_at_16%_22%,rgba(14,116,144,0.24),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(67,56,202,0.26),transparent_35%),linear-gradient(120deg,rgba(2,10,27,0.98),rgba(5,18,45,0.96)_46%,rgba(14,23,56,0.95))] p-7 md:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
              <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-blue-500/12 blur-3xl" />
              {floatingLights.map((bubble) => (
                <div
                  key={bubble.id}
                  className="absolute"
                  style={{ left: bubble.left, top: bubble.top }}
                >
                  <span
                    className={`absolute ${bubble.size} -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/45 animate-ping`}
                    style={{ animationDelay: bubble.delay }}
                  />
                  <span
                    className={`absolute ${bubble.size} -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80 shadow-[0_0_24px_rgba(34,211,238,0.65)] advz-float`}
                    style={{ animationDelay: bubble.delay }}
                  />
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-slate-50 md:text-5xl">Career Opportunities Across the World</h2>
                <p className="mt-3 text-slate-300 md:text-2xl">
                  Digital Marketing opens doors to career opportunities across the world.
                </p>
              </div>

              <div className="relative mt-8 hidden h-[360px] md:block">
                {opportunityBubbles.map((item, idx) => (
                  <div
                    key={item.region}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: item.left, top: item.top }}
                  >
                    <div
                      className={`${item.size} rounded-full border border-cyan-200/25 bg-gradient-to-br from-cyan-400/28 via-blue-500/24 to-indigo-500/22 shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),0_16px_32px_rgba(2,10,27,0.45)] flex flex-col items-center justify-center text-center advz-float`}
                      style={{ animationDelay: `${idx * 0.35}s` }}
                    >
                      <div className="text-3xl font-semibold text-slate-100 md:text-5xl">{item.growth}</div>
                      <div className="mt-1 max-w-[90%] text-base leading-tight text-slate-200 md:text-xl">
                        {item.region}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 md:hidden">
                {opportunityBubbles.map((item, idx) => (
                  <div
                    key={`${item.region}-mobile`}
                    className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-center advz-float"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <div className="text-2xl font-semibold text-cyan-200">{item.growth}</div>
                    <div className="mt-1 text-sm text-slate-200">{item.region}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-14" id="digital-marketing-career-path">
        <Container className="max-w-6xl">
          <h2 className="text-4xl md:text-6xl font-semibold italic text-slate-50 text-center md:text-left">
            Digital Marketing Career Path
          </h2>
          <div className="relative mt-10 md:mt-14 space-y-14 md:space-y-16">
            <div className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 border-l border-white/25 md:block" />
            {careerPathSteps.map((step, idx) => (
              <div key={step.title} className="relative grid gap-6 md:grid-cols-2 md:gap-16">
                <div className={`${idx % 2 ? 'md:order-2' : ''}`}>
                  <h3 className="text-3xl md:text-5xl font-medium text-slate-50">{step.title}</h3>
                </div>
                <div className={`${idx % 2 ? 'md:order-1' : ''}`}>
                  <p className="text-lg md:text-2xl leading-relaxed text-slate-100">{step.desc}</p>
                </div>
                <span className="absolute left-1/2 top-2 hidden h-5 w-5 -translate-x-1/2 rounded-full border border-white/40 bg-slate-100 md:block" />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {(loading || placements.length > 0) && (
        <Section className="py-6 md:py-10">
          <Container>
            {loading ? (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {placements.map((placement, idx) => (
                  <motion.div
                    key={placement.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                  >
                    <Link to={`/placement/${placement.id}`} className="group block h-full">
                      <Surface className="h-full overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
                        {placement.featured_image && (
                          <AdaptiveImage
                            src={assetUrl(placement.featured_image)}
                            fallbackSrcs={[assetUrl('/images/success/success1.jpg')]}
                            alt={placement.title}
                            variant="card"
                            aspectRatio="16 / 10"
                            sizes="(max-width: 768px) 100vw, 420px"
                            wrapperClassName="w-full border-b border-white/10"
                            borderClassName=""
                            roundedClassName=""
                          />
                        )}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-slate-50">{placement.role}</h3>
                          <div className="mt-2 text-sm text-slate-300">
                            {placement.company_name} · {placement.location}
                          </div>
                          <div className="mt-3 text-xs text-slate-400">
                            Package: {placement.package || 'TBA'}
                          </div>
                          {placement.description && (
                            <p className="mt-3 text-sm text-slate-300 line-clamp-3">{placement.description}</p>
                          )}
                          <div className="mt-4 text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                            View details -&gt;
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
      )}

      <Section className="py-12 md:py-16" id="success-stories">
        <Container>
          <h2 className="text-3xl font-semibold text-slate-50 text-center">Success Stories</h2>
          <p className="mt-3 text-center text-slate-300 max-w-4xl mx-auto">
            Our students come from different backgrounds — graduates, working professionals, career switchers, and
            entrepreneurs. What connects them is one decision: to upgrade their skills and become future-ready digital
            marketers.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {placementStories.map((story) => (
              <Surface key={`${story.name}-${story.role}`} className="p-0 overflow-hidden tilt-card">
                <AdaptiveImage
                  src={assetUrl(story.image_url)}
                  fallbackSrcs={[assetUrl('/images/success/success.jpg')]}
                  alt={story.name}
                  variant="content"
                  aspectRatio="4 / 3"
                  sizes="(max-width: 768px) 100vw, 320px"
                  loading="lazy"
                  wrapperClassName="w-full border-b border-white/10"
                  borderClassName=""
                  roundedClassName=""
                />
                <div className="p-5">
                  <div className="text-sm font-semibold text-slate-50">{story.name}</div>
                  <div className="text-xs text-slate-400">{story.role}</div>
                  <p className="mt-3 text-sm text-slate-300">"{story.quote}"</p>
                </div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-8 md:py-12" id="placement-support-acadvizen">
        <Container>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50 text-center">Placement Support</h2>
            <p className="mt-3 text-center text-slate-300">
              Our placement cell ensures students are industry-ready through resume building, mock interviews,
              portfolio development, and recruiter connections.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Surface className="p-6">
                <h3 className="text-xl font-semibold text-slate-50">Placement Process</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {[
                    'Step 1 - Resume & Portfolio Preparation',
                    'Step 2 - Mock Interviews',
                    'Step 3 - Industry Referrals',
                    'Step 4 - Job Interviews',
                  ].map((step) => (
                    <div key={step} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                      {step}
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface className="p-6">
                <h3 className="text-xl font-semibold text-slate-50">Our Hiring Partners</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {hiringPartnerLogos.map((partner) => (
                    <div
                      key={partner.name}
                      className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4"
                    >
                      <AdaptiveImage
                        src={assetUrl(`/logos/${partner.file}`)}
                        fallbackSrcs={[assetUrl('/logo-mark.png'), '/logo-mark.png']}
                        alt={partner.name}
                        variant="logo"
                        aspectRatio="3 / 1"
                        sizes="120px"
                        loading="lazy"
                        wrapperClassName="h-10 w-full"
                        borderClassName=""
                        roundedClassName="rounded-none"
                      />
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}

export default PlacementPage
