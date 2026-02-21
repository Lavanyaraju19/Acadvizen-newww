import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

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
const careerOpportunities = [
  { region: 'South America', growth: '+15%' },
  { region: 'Asia', growth: '+13%' },
  { region: 'Europe', growth: '+10%' },
  { region: 'North America', growth: '+10%' },
  { region: 'Africa', growth: '+9%' },
  { region: 'Australia', growth: '+8%' },
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
    loadPlacements()
    loadPageSections()
    const channel = supabase
      .channel('public-placements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, loadPlacements)
      .subscribe()
    const pageChannel = supabase
      .channel('public-page-placement')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadPageSections)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(pageChannel)
    }
  }, [])

  async function loadPlacements() {
    setLoading(true)
    const { data } = await supabase
      .from('placements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) setPlacements(data)
    setLoading(false)
  }

  async function loadPageSections() {
    const { data } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_slug', 'placement')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')
  const emptySection = getSection('empty')

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{heroSection.title}</h1>
            {heroSection.subtitle && (
              <p className="mt-3 text-slate-300 max-w-2xl mx-auto">{heroSection.subtitle}</p>
            )}
          </motion.div>
        </Container>
      </Section>

      <Section className="py-8 md:py-10" id="career-opportunities">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Career Opportunities in Digital Marketing</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {careerOpportunities.map((item) => (
              <Surface key={item.region} className="p-4 text-center">
                <div className="text-lg font-semibold text-teal-200">{item.growth}</div>
                <div className="mt-1 text-xs text-slate-300">{item.region}</div>
              </Surface>
            ))}
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

      <Section className="py-6 md:py-10">
        <Container>
          {loading ? (
            <div className="text-center py-16">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
            </div>
          ) : placements.length === 0 ? (
            <></>
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
                        <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-white/[0.02]">
                          <img
                            src={placement.featured_image}
                            alt={placement.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
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

      <Section className="py-12 md:py-16" id="success-stories">
        <Container>
          <h2 className="text-3xl font-semibold text-slate-50 text-center">Success Stories</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {placementStories.map((story) => (
              <Surface key={`${story.name}-${story.role}`} className="p-0 overflow-hidden tilt-card">
                <div className="aspect-[4/3] overflow-hidden border-b border-white/10 bg-white/[0.02]">
                  <img src={story.image_url} alt={story.name} className="w-full h-[220px] object-cover rounded-xl" loading="lazy" />
                </div>
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
            <h2 className="text-3xl font-semibold text-slate-50 text-center">Placement Support at ACADVIZEN</h2>
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
                      <img
                        src={`/logos/${partner.file}`}
                        alt={partner.name}
                        className="h-10 w-auto object-contain"
                        loading="lazy"
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
