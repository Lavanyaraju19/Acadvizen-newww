import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Target,
  Wrench,
  Rocket,
  Clock,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Laptop,
  BookOpen,
  FileText,
  Linkedin,
  MessageCircle,
  Users,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'
import { BlogSection } from '../components/BlogSection'

export default function HomePage() {
  const metaTitle = 'Best Digital Marketing Institute in Bangalore | ACADVIZEN'
  const metaDescription =
    'ACADVIZEN is the best digital marketing training institute in Bangalore offering live projects, 50+ tools, placement assistance, and industry-ready skills.'
  const metaKeywords =
    'best digital marketing training institute in bangalore, digital marketing institute in bangalore, digital marketing course with placement, digital marketing training institute in bangalore'
  const digitalMarketingTopics = [
    'Content Creation',
    'SEO',
    'Blogging',
    'Google Ads',
    'Meta Ads',
    'Copywriting',
    'E-Commerce',
    'Performance Marketing',
    'Social Media Marketing',
    'UI-UX Designing',
    'Website Design',
  ]
  const coursePrograms = [
    {
      name: 'Basic',
      features: ['45 Days', '15 Tools', '7 Live Projects', 'Placement Assistance'],
    },
    {
      name: 'Advanced',
      features: ['65 Days', '20+ Tools', '15+ Live Projects', 'Placement Assistance'],
    },
    {
      name: 'Master',
      features: ['95 Days', '65+ Tools', '25+ Live Projects', 'Internship + Placement', 'Guest Lectures'],
    },
  ]
  const chooseToolItems = [
    { name: 'Google Analytics', logo: 'analytics.png' },
    { name: 'Google Tag Manager', logo: 'tagmanager.png' },
    { name: 'ChatGPT', logo: 'chatgpt.png' },
    { name: 'SEMrush', logo: 'semrush.png' },
    { name: 'Ahrefs', logo: 'ahrefs.png' },
    { name: 'Google Ads', logo: 'googleads.png' },
    { name: 'Meta Ads', logo: 'metaads.png' },
    { name: 'Canva', logo: 'canva.png' },
    { name: 'WordPress', logo: null },
    { name: 'Hootsuite', logo: 'hootsuite.png' },
    { name: 'Buffer', logo: 'buffer.png' },
    { name: 'Jasper', logo: 'jasper.png' },
    { name: 'LinkedIn', logo: null },
    { name: 'Google My Business', logo: null },
  ]
  const learningValues = [
    { label: 'Tools', value: '50+' },
    { label: 'Live Projects', value: '15+' },
    { label: 'Duration', value: '3 Months' },
    { label: 'Jobs Worldwide', value: '5M+' },
  ]
  const careerOpportunities = [
    { region: 'South America', growth: '+15%' },
    { region: 'Asia', growth: '+13%' },
    { region: 'Europe', growth: '+10%' },
    { region: 'North America', growth: '+10%' },
    { region: 'Africa', growth: '+9%' },
    { region: 'Australia', growth: '+8%' },
  ]
  const faqItems = [
    {
      question: 'What is course duration?',
      answer: 'The program options are 45 days, 65 days, and 95 days based on Basic, Advanced, and Master tracks.',
    },
    {
      question: 'Do you provide placement support?',
      answer: 'Yes. We provide resume support, portfolio guidance, mock interviews, and recruiter assistance.',
    },
    {
      question: 'Is internship included?',
      answer: 'Internship support is included in the Master track with placement assistance.',
    },
    {
      question: 'What tools will I learn?',
      answer: 'You learn practical tools across SEO, ads, analytics, content, automation, and AI workflows.',
    },
    {
      question: 'Is this beginner friendly?',
      answer: 'Yes. The curriculum is beginner friendly and progresses toward industry-ready execution.',
    },
  ]
  const [tools, setTools] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [homeSections, setHomeSections] = useState({})
  const [blogPosts, setBlogPosts] = useState([])
  const [partners, setPartners] = useState([])
  const [partnersError, setPartnersError] = useState('')
  const [toolsError, setToolsError] = useState('')
  const [toolsCount, setToolsCount] = useState(null)
  const [partnersCount, setPartnersCount] = useState(null)
  const [activeFaq, setActiveFaq] = useState(0)
  const [toolsFallback] = useState([
    { name: 'Google Ads', slug: 'google-ads', brand_color: '#4285F4' },
    { name: 'Meta Ads', slug: 'meta-ads', brand_color: '#1877F2' },
    { name: 'SEMrush', slug: 'semrush', brand_color: '#FF642D' },
    { name: 'Ahrefs', slug: 'ahrefs', brand_color: '#0B1F2A' },
    { name: 'Canva', slug: 'canva', brand_color: '#00C4CC' },
    { name: 'ChatGPT', slug: 'chatgpt', brand_color: '#10A37F' },
  ])
  const [partnersFallback] = useState([
    { name: 'Google', logo_url: 'https://logo.clearbit.com/google.com', row_group: 'row_a' },
    { name: 'Amazon', logo_url: 'https://logo.clearbit.com/amazon.com', row_group: 'row_a' },
    { name: 'Microsoft', logo_url: 'https://logo.clearbit.com/microsoft.com', row_group: 'row_a' },
    { name: 'Adobe', logo_url: 'https://logo.clearbit.com/adobe.com', row_group: 'row_a' },
    { name: 'TCS', logo_url: 'https://logo.clearbit.com/tcs.com', row_group: 'row_a' },
    { name: 'Infosys', logo_url: 'https://logo.clearbit.com/infosys.com', row_group: 'row_a' },
    { name: 'Accenture', logo_url: 'https://logo.clearbit.com/accenture.com', row_group: 'row_b' },
    { name: 'Dentsu', logo_url: 'https://logo.clearbit.com/dentsu.com', row_group: 'row_b' },
    { name: 'Flipkart', logo_url: 'https://logo.clearbit.com/flipkart.com', row_group: 'row_b' },
    { name: 'Yahoo', logo_url: 'https://logo.clearbit.com/yahoo.com', row_group: 'row_b' },
  ])
  const [testimonialShowcase] = useState([
    {
      id: 'showcase-accenture',
      name: 'Acadvizen Learner',
      role: 'Placed at Accenture',
      quote: 'Hands-on project training helped me transition confidently into a digital marketing role.',
      image_url: '/images/success/success2.jpg',
    },
    {
      id: 'showcase-tcs',
      name: 'Acadvizen Learner',
      role: 'Placed at TCS',
      quote: 'The structured curriculum and interview preparation made placement conversion much easier.',
      image_url: '/images/success/success1.jpg',
    },
    {
      id: 'showcase-ibm',
      name: 'Acadvizen Learner',
      role: 'Placed at IBM',
      quote: 'Tool-based learning and live campaigns gave me practical confidence from day one.',
      image_url: '/images/success/success.jpg',
    },
    {
      id: 'showcase-cognizant',
      name: 'Acadvizen Learner',
      role: 'Placed at Cognizant',
      quote: 'Portfolio guidance and mock interviews directly improved my hiring outcomes.',
      image_url: '/images/success/success3.jpg',
    },
  ])
  const [statCounts, setStatCounts] = useState({
    careers: 0,
    placed: 0,
    partners: 0,
  })
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    mode: 'online',
    consent: false,
  })

  useEffect(() => {
    loadTools()
    loadTestimonials()
    loadBlogPosts()
    loadHomeSections()
    loadPartners()
    loadCounts()
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    const timer = setTimeout(() => {
      setScrollY(window.scrollY)
      setShowPopup(true)
    }, 90000)

    const toolsChannel = supabase
      .channel('public-tools-extended-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tools_extended' }, loadTools)
      .subscribe()
    const testimonialsChannel = supabase
      .channel('public-testimonials-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, loadTestimonials)
      .subscribe()
    const blogChannel = supabase
      .channel('public-blog-posts-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, loadBlogPosts)
      .subscribe()
    const homeSectionsChannel = supabase
      .channel('public-home-sections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_sections' }, loadHomeSections)
      .subscribe()
    const partnersChannel = supabase
      .channel('public-hiring-partners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hiring_partners' }, loadPartners)
      .subscribe()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
      supabase.removeChannel(toolsChannel)
      supabase.removeChannel(testimonialsChannel)
      supabase.removeChannel(blogChannel)
      supabase.removeChannel(homeSectionsChannel)
      supabase.removeChannel(partnersChannel)
    }
  }, [])

  useEffect(() => {
    const targets = { careers: 1000, placed: 625, partners: 250 }
    const duration = 1400
    const start = performance.now()
    let raf

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setStatCounts({
        careers: Math.round(targets.careers * progress),
        placed: Math.round(targets.placed * progress),
        partners: Math.round(targets.partners * progress),
      })
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  async function loadTools() {
    const { data, error } = await supabase
      .from('tools_extended')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[home] tools fetch error', error)
      const message = error.message || ''
      if (error?.name === 'AbortError' || message.includes('signal is aborted')) {
        setToolsError('')
        setTools(toolsFallback)
      } else {
        setToolsError(message)
        setTools([])
      }
      return
    }
    if (!data || data.length === 0) {
      setToolsError('No tools found. Showing fallback list.')
      setTools(toolsFallback)
      return
    }
    setToolsError('')
    if (data) setTools(data)
  }

  async function loadTestimonials() {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (data) setTestimonials(data)
  }

  async function loadBlogPosts() {
    let { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4)

    // Backward compatibility: some environments still use is_published without status.
    if (error && String(error.message || '').toLowerCase().includes('status')) {
      const fallbackRes = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(4)
      data = fallbackRes.data
      error = fallbackRes.error
    }

    if (error || !data || data.length === 0) {
      setBlogPosts([])
      return
    }

    const hydrated = data.map((post, idx) => ({
      ...post,
      featured_image:
        post.featured_image || (idx === 0 ? '/blog-images/image1.jpg' : `/blog-images/image${idx + 1}.jpg`),
    }))
    setBlogPosts(hydrated)
  }

  async function loadPartners() {
    const { data, error } = await supabase
      .from('hiring_partners')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (error) {
      console.error('[home] partners fetch error', error)
      const message = error.message || ''
      if (error?.name === 'AbortError' || message.includes('signal is aborted')) {
        setPartnersError('')
        setPartners(partnersFallback)
      } else {
        setPartnersError(message)
        setPartners([])
      }
      return
    }
    if (!data || data.length === 0) {
      setPartnersError('')
      setPartners(partnersFallback)
      return
    }
    setPartnersError('')
    if (data) setPartners(data)
  }

  async function loadCounts() {
    const { count: toolTotal, error: toolCountError } = await supabase
      .from('tools_extended')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
    if (!toolCountError) setToolsCount(toolTotal ?? 0)

    const { count: partnerTotal, error: partnerCountError } = await supabase
      .from('hiring_partners')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
    if (!partnerCountError) setPartnersCount(partnerTotal ?? 0)
  }
  async function loadHomeSections() {
    const { data } = await supabase
      .from('home_sections')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setHomeSections(next)
  }

  const parseJson = (value, fallback) => {
    if (!value) return fallback
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (err) {
        return fallback
      }
    }
    return value
  }

  const getSection = (key, fallback = {}) => homeSections[key] || fallback
  const heroSection = getSection('hero', {
    title: 'Acadvizen - Build Your Own Digital Marketing Course',
    subtitle: 'Choose your tools, customize your syllabus, and train for real jobs in India.',
  })
  const whySection = getSection('why_acadvizen', {
    title: 'Why We Are Different',
    subtitle: 'Most institutes force a fixed syllabus. At Acadvizen, you build your own learning path.',
    items_json: [
      'What modules you want',
      'Which tools you want to master',
      'Your pace and career goals',
      'Your specialization (SEO, Ads, Social, Analytics)',
    ],
  })
  const whyItems = parseJson(whySection.items_json, [])
  const whoSection = getSection('who_for', {
    title: 'Who Is This For?',
    items_json: [
      {
        title: 'Freshers',
        desc: 'Start your career in digital marketing with a customized learning plan.',
      },
      {
        title: 'Working Professionals',
        desc: 'Upskill with tools and modules that match your job requirements.',
      },
      {
        title: 'Business Owners',
        desc: 'Learn marketing tools that grow your business.',
      },
      {
        title: 'Freelancers',
        desc: 'Build your own skill stack and get more clients.',
      },
    ],
  })
  const whoItems = parseJson(whoSection.items_json, [])
  const syllabusSection = getSection('syllabus', {
    title: 'Build Your Own Syllabus',
    items_json: [
      'Digital Marketing Fundamentals',
      'Content Marketing',
      'SEO (On-page & Off-page)',
      'Social Media Marketing',
      'Google Ads & Performance Marketing',
      'Email Marketing & Automation',
      'Analytics (GA4 & Tag Manager)',
    ],
    cta_json: [
      'Google Ads',
      'Meta Ads Manager',
      'SEMrush / Ahrefs',
      'HubSpot / Mailchimp',
      'Canva / Adobe',
      'ChatGPT & AI Tools',
      'CRM tools (Zoho, Salesforce)',
    ],
  })
  const moduleItems = parseJson(syllabusSection.items_json, [])
  const toolItems = parseJson(syllabusSection.cta_json, [])
  const liveProjectsSection = getSection('live_projects', {
    title: 'Live Projects & Placement Support',
    body: 'Work on real campaigns and get hands-on experience.',
  })
  const liveBody = liveProjectsSection.body || ''
  const placementSection = getSection('placement_support', {
    subtitle: 'Placement Support',
    items_json: [
      'Resume building',
      'LinkedIn profile optimization',
      'Mock interviews',
      'Hiring partner network',
      'Internship & job opportunities in India & abroad',
    ],
  })
  const placementItems = parseJson(placementSection.items_json, [])
  const blogSection = getSection('blog_section', {
    title: 'From the Blog',
    subtitle: 'Latest insights from Acadvizen.',
    body: 'No blog posts yet.',
  })
  const partnersSection = getSection('hiring_partners', {
    title: 'Our Alumni Work Across 2,000+ Global Giants',
    subtitle: 'Trusted by leading brands and high-growth companies.',
  })
  const partnersToUse = partners.length ? partners : partnersFallback
  const uniquePartners = Array.from(
    new Map(partnersToUse.map((item) => [item.name?.toLowerCase().trim() || item.id, item])).values()
  )
  const toLogoSlug = (name = '') =>
    name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  const partnerLogoOverrides = {
    'tata consultancy services': 'tcs',
    tcs: 'tcs',
    ibm: 'ibm',
    'international business machines': 'ibm',
    deloitte: 'deloitte',
    cognizant: 'cognizant',
    capgemini: 'capgemini',
    accenture: 'accenture',
    genesys: 'genesys',
    redington: 'redington',
    upstox: 'upstox',
    boat: 'boat',
    samsung: 'samsung',
    paypal: 'paypal',
    adobe: 'adobe',
    uber: 'uber',
    mastercard: 'mastercard',
    instagram: 'instagram',
    google: 'google',
    amazon: 'amazon',
    zomato: 'zomato',
  }
  const partnerDomainOverrides = {
    tcs: 'tcs.com',
    adobe: 'adobe.com',
    google: 'google.com',
    deloitte: 'deloitte.com',
    capgemini: 'capgemini.com',
    cognizant: 'cognizant.com',
    ibm: 'ibm.com',
    infosys: 'infosys.com',
    atlassian: 'atlassian.com',
    oracle: 'oracle.com',
    zoho: 'zoho.com',
    salesforce: 'salesforce.com',
    hubspot: 'hubspot.com',
    flipkart: 'flipkart.com',
    wipro: 'wipro.com',
    kpmg: 'kpmg.com',
    yahoo: 'yahoo.com',
    ey: 'ey.com',
    sap: 'sap.com',
    intel: 'intel.com',
    nvidia: 'nvidia.com',
    reddit: 'reddit.com',
    replicon: 'replicon.com',
    'jungle square': 'junglesquare.com',
    continental: 'continental.com',
    develop: 'develop.com',
    ktm: 'ktm.com',
    lakme: 'lakmeindia.com',
    axa: 'axa.com',
    dentsu: 'dentsu.com',
  }
  const localPartnerFile = (name = '') => {
    const key = name.toLowerCase().trim()
    if (partnerLogoOverrides[key]) return partnerLogoOverrides[key]
    for (const [match, file] of Object.entries(partnerLogoOverrides)) {
      if (key.includes(match)) return file
    }
    return toLogoSlug(name)
  }
  const fallbackPartnerLogo = (name = '') => {
    const key = name.toLowerCase().trim()
    if (partnerDomainOverrides[key]) return `https://logo.clearbit.com/${partnerDomainOverrides[key]}`
    for (const [match, domain] of Object.entries(partnerDomainOverrides)) {
      if (key.includes(match)) return `https://logo.clearbit.com/${domain}`
    }
    const slug = toLogoSlug(name)
    return slug ? `https://logo.clearbit.com/${slug}.com` : null
  }
  const withLocalLogo = (partner) => ({
    ...partner,
    logoSrc: `/logos/${localPartnerFile(partner.name)}.png`,
    fallbackLogo: fallbackPartnerLogo(partner.name),
  })
  const partnerLogos = uniquePartners.map(withLocalLogo)
  const companyLogos = Array.from({ length: 21 }, (_, idx) => `/logos/company-${String(idx + 1).padStart(2, '0')}.png`)
  const companyRowA = companyLogos.filter((_, idx) => idx % 2 === 0)
  const companyRowB = companyLogos.filter((_, idx) => idx % 2 === 1)

  const actionsSection = getSection('actions')
  const actionsCta = parseJson(actionsSection.cta_json, {})
  const addressText = actionsSection.body || ''

  const popupSection = getSection('registration_popup', {
    title: 'Quick Registration',
    subtitle: 'Reserve your spot in under 60 seconds.',
    body: 'I agree to the Privacy Policy and allow Acadvizen to contact me.',
  })
  const popupCta = parseJson(popupSection.cta_json, {})

  const toToolSlug = (value = '') =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  const scrollingTools = [
    { name: 'Ahrefs', slug: 'ahrefs', logoSrc: '/tools/ahrefs.png' },
    { name: 'SEMrush', slug: 'semrush', logoSrc: '/tools/semrush.png' },
    { name: 'Screaming Frog', slug: 'screaming-frog', logoSrc: '/tools/screamingfrog.png' },
    { name: 'Webflow', slug: 'webflow', logoSrc: '/tools/webflow.png' },
    { name: 'Jasper', slug: 'jasper', logoSrc: '/tools/jasper.png' },
    { name: 'Canva', slug: 'canva', logoSrc: '/tools/canva.png' },
    { name: 'HubSpot', slug: 'hubspot', logoSrc: '/tools/hubspot.png' },
    { name: 'ActiveCampaign', slug: 'activecampaign', logoSrc: '/tools/activecampaign.png' },
    { name: 'Mailchimp', slug: 'mailchimp', logoSrc: '/tools/mailchimp.png' },
    { name: 'Buffer', slug: 'buffer', logoSrc: '/tools/buffer.png' },
    { name: 'Later', slug: 'later', logoSrc: '/tools/later.png' },
    { name: 'Hootsuite', slug: 'hootsuite', logoSrc: '/tools/hootsuite.png' },
    { name: 'Metricool', slug: 'metricool', logoSrc: '/tools/metricool.png' },
    { name: 'Google Ads', slug: 'google-ads', logoSrc: '/tools/googleads.png' },
    { name: 'Google Analytics', slug: 'google-analytics', logoSrc: '/tools/analytics.png' },
    { name: 'Meta Ads', slug: 'meta-ads', logoSrc: '/tools/metaads.png' },
    { name: 'YouTube Ads', slug: 'youtube-ads', logoSrc: '/tools/youtubeads.png' },
    { name: 'Clarity', slug: 'clarity', logoSrc: '/tools/clarity.png' },
    { name: 'ChatGPT', slug: 'chatgpt', logoSrc: '/tools/chatgpt.png' },
    { name: 'Hotjar', slug: 'hotjar', logoSrc: '/tools/hotjar.png' },
    { name: 'Midjourney', slug: 'midjourney', logoSrc: '/tools/midjourney.png' },
    { name: 'ElevenLabs', slug: 'elevenlabs', logoSrc: '/tools/elevenlabs.png' },
    { name: 'Tag Manager', slug: 'google-tag-manager', logoSrc: '/tools/tagmanager.png' },
    { name: 'Synthesia', slug: 'synthesia', logoSrc: '/tools/synthesia.png' },
  ]

  const marqueeRowA = scrollingTools.filter((_, idx) => idx % 2 === 0)
  const marqueeRowB = scrollingTools.filter((_, idx) => idx % 2 === 1)
  const chooseToolRowA = chooseToolItems.filter((_, idx) => idx % 2 === 0)
  const chooseToolRowB = chooseToolItems.filter((_, idx) => idx % 2 === 1)

  const openPopup = () => {
    setScrollY(window.scrollY)
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
    setSubmitted(false)
    setFormError('')
    setTimeout(() => window.scrollTo(0, scrollY), 0)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError('Please complete all required fields.')
      return
    }
    if (!formData.consent) {
      setFormError('Please accept the Privacy Policy consent.')
      return
    }

    try {
      setSaving(true)
      await supabase.from('registrations').insert([
        {
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          learning_mode: formData.mode,
          page: window.location.pathname,
        },
      ])
      setSubmitted(true)
      setTimeout(() => {
        closePopup()
      }, 900)
    } catch (err) {
      setFormError(err?.message || 'Unable to register right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
      </Helmet>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ transform: `translateY(${scrollY * 0.06}px)` }}
      >
        <div className="absolute -top-20 left-[10%] h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-24 right-[15%] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-10 left-[35%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <Section className="pt-12 md:pt-16" id="hero">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-7xl font-bold wave-text">
              {metaTitle}
            </h1>
            <h3 className="mt-4 text-lg md:text-xl text-slate-200 font-medium">{metaDescription}</h3>
            {heroSection.subtitle && (
              <p className="mt-3 text-sm md:text-base text-slate-300">
                {heroSection.subtitle.replace('abroad', 'India')}
              </p>
            )}
            <div className="mt-10">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Our Learning Community</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 text-left">
                {[
                  {
                    label: 'Careers Transformed',
                    value: statCounts.careers,
                    suffix: '+',
                    icon: Target,
                  },
                  {
                    label: 'Successfully Placed',
                    value: statCounts.placed,
                    suffix: '+',
                    icon: Rocket,
                  },
                  {
                    label: 'Hiring Partners',
                    value: statCounts.partners,
                    suffix: '+',
                    icon: Users,
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-slate-100 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
                          <Icon className="h-5 w-5 float" />
                        </span>
                        <div className="text-2xl font-semibold text-slate-50">
                          {item.value}
                          {item.suffix}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">{item.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="skills-success">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">
              Digital Marketing Institute in Bangalore - Where Skills Meet Success
            </h2>
            <button
              onClick={openPopup}
              className="mt-6 rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200"
            >
              Book a Free Trial Class
            </button>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="what-is-digital-marketing">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">What is Digital Marketing?</h2>
            <p className="mt-3 text-slate-300">
              Digital Marketing is Visibility, Strategy, Presence, Connection, Engagement, Reach, Awareness,
              Results, and Performance.
            </p>
          </div>
          <div className="mt-8 overflow-hidden">
            <div className="logo-scroll gap-4 min-w-max">
              {[...digitalMarketingTopics, ...digitalMarketingTopics].map((topic, idx) => (
                <span
                  key={`${topic}-${idx}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-200"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="course-programs">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Our Course Programs</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {coursePrograms.map((program) => (
              <Surface key={program.name} className="p-6">
                <h3 className="text-xl font-semibold text-slate-50">{program.name}</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  {program.features.map((feature) => (
                    <div key={`${program.name}-${feature}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                      {feature}
                    </div>
                  ))}
                </div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="choose-your-tools-opportunities">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Choose Your Own Tools - Unlock Opportunities</h2>
          </div>
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-6 min-w-max" style={{ '--logo-scroll-duration': '58s' }}>
              {[...chooseToolRowA, ...chooseToolRowA].map((tool, idx) => (
                <div
                  key={`${tool.name}-choice-a-${idx}`}
                  className="flex min-w-[170px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  {tool.logo ? (
                    <img src={`/tools/${tool.logo}`} alt={tool.name} className="h-8 w-auto object-contain" loading="lazy" />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-[10px] font-semibold text-slate-200">
                      {tool.name.charAt(0)}
                    </span>
                  )}
                  <span className="text-xs text-slate-200">{tool.name}</span>
                </div>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-6 min-w-max" style={{ '--logo-scroll-duration': '58s' }}>
              {[...chooseToolRowB, ...chooseToolRowB].map((tool, idx) => (
                <div
                  key={`${tool.name}-choice-b-${idx}`}
                  className="flex min-w-[170px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  {tool.logo ? (
                    <img src={`/tools/${tool.logo}`} alt={tool.name} className="h-8 w-auto object-contain" loading="lazy" />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-[10px] font-semibold text-slate-200">
                      {tool.name.charAt(0)}
                    </span>
                  )}
                  <span className="text-xs text-slate-200">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="learning-values">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Our Learning Values</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningValues.map((item) => (
              <Surface key={item.label} className="p-5 text-center">
                <div className="text-2xl font-semibold text-slate-50">{item.value}</div>
                <div className="mt-2 text-sm text-slate-300">{item.label}</div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="career-opportunities">
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

      <Section className="py-10 md:py-12" id="why-acadvizen-different-structured">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">What Makes ACADVIZEN Different?</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Surface className="p-6">
              <h3 className="text-lg font-semibold text-slate-50">What Most Institutes Teach</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {['Same marketing tools', 'No customization', 'Theory heavy', 'No real projects'].map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </Surface>
            <Surface className="p-6">
              <h3 className="text-lg font-semibold text-slate-50">What Makes ACADVIZEN Different</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                {[
                  'Customize tools',
                  'Real campaign execution',
                  'Career specialization',
                  'Industry workflows',
                  'Placement support',
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="faq">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">FAQ</h2>
          </div>
          <div className="mt-8 max-w-4xl mx-auto space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = activeFaq === idx
              return (
                <Surface key={item.question} className="p-0 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between"
                  >
                    <span className="text-sm font-semibold text-slate-100">{item.question}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-300">{item.answer}</div>}
                </Surface>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="placement-acadvizen">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Placement at ACADVIZEN</h2>
            <p className="mt-3 text-slate-300">
              ACADVIZEN placement drives connect trained candidates with top recruiters through resume support, mock
              interviews, portfolio guidance, and hiring assistance.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="about-acadvizen">
        <Container>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50 text-center">About ACADVIZEN</h2>
            <p className="mt-3 text-center text-slate-300">
              ACADVIZEN is a leading digital marketing training institute in Bangalore focused on practical learning,
              AI-driven strategies, and real-world campaign execution.
            </p>
            <div className="mt-8 flex justify-center">
              <Surface className="p-4 w-full max-w-sm">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                  <img
                    src="/about/tharika-chakrapani-raju.jpg"
                    alt="Tharika Chakrapani Raju - Co-Founder"
                    className="h-[420px] w-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/about/jyoti.jpg'
                    }}
                  />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-50">Tharika Chakrapani Raju</h3>
                  <p className="mt-1 text-sm text-slate-300">Co-Founder</p>
                </div>
              </Surface>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <Surface className="p-6">
                <h3 className="text-lg font-semibold text-slate-50">Our Mission</h3>
                <p className="mt-3 text-sm text-slate-300">
                  To combine creativity, data, and AI to train the next generation of digital marketers.
                </p>
              </Surface>
              <Surface className="p-6">
                <h3 className="text-lg font-semibold text-slate-50">Our Vision</h3>
                <p className="mt-3 text-sm text-slate-300">
                  To shape future marketers using AI-driven strategies for tomorrow&apos;s digital economy.
                </p>
              </Surface>
              <Surface className="p-6">
                <h3 className="text-lg font-semibold text-slate-50">Why Choose Us</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {[
                    'Industry mentors',
                    'Live projects',
                    'Placement assistance',
                    'Soft skills training',
                    'Tool-based learning',
                  ].map((item) => (
                    <div key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="why">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">{whySection.title}</h2>
            {whySection.subtitle && <p className="mt-3 text-slate-300">{whySection.subtitle}</p>}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item, idx) => {
              const icons = [Target, Wrench, Rocket, Clock]
              const Icon = icons[idx % icons.length]
              return (
                <div
                  key={`${item}-${idx}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl tilt-card"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/15 text-teal-200">
                    <Icon className="h-5 w-5 float" />
                  </div>
                  <div className="text-sm text-slate-200">{item}</div>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="who-for">
        <Container>
          <h2 className="text-3xl font-semibold text-slate-50 text-center">{whoSection.title}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whoItems.map((card, idx) => {
              const icons = [GraduationCap, Briefcase, TrendingUp, Laptop]
              const Icon = icons[idx % icons.length]
              return (
                  <div
                    key={`${card.title}-${idx}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:scale-105 hover:shadow-xl tilt-card"
                  >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-400/15 text-sky-200">
                    <Icon className="h-6 w-6 float" />
                  </div>
                  <div className="text-sm font-semibold text-slate-50">{card.title}</div>
                  <p className="mt-2 text-xs text-slate-300">{card.desc}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="syllabus">
        <Container>
          <h2 className="text-3xl font-semibold text-slate-50 text-center">{syllabusSection.title}</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-teal-200 float" />
                <h3 className="text-lg font-semibold text-slate-50">Core Modules</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {moduleItems.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </Surface>
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <Wrench className="h-6 w-6 text-sky-200 float" />
                <h3 className="text-lg font-semibold text-slate-50">Choose Your Tools</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {toolItems.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="tools-marquee">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Tools You Will Master</h2>
            <p className="mt-3 text-sm text-slate-300">
              Explore the tools you will work with. Click any logo to view details.
            </p>
          </div>
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-6 min-w-max">
              {[...marqueeRowA, ...marqueeRowA].map((tool, idx) => (
                <Link
                  key={`${tool.slug || tool.name}-row-a-${idx}`}
                  to={`/tools/${tool.slug || toToolSlug(tool.name || '')}`}
                  className="flex min-w-[170px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 transition hover:-translate-y-1 hover:border-teal-300/60"
                >
                  {tool.logoSrc || tool.logo_url ? (
                    <img
                      src={tool.logoSrc || tool.logo_url}
                      alt={tool.name || tool.slug}
                      className="h-10 w-auto object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const fallback = tool.logo_url || null
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback
                        } else {
                          e.currentTarget.style.display = 'none'
                        }
                      }}
                    />
                  ) : null}
                  <span className="text-xs text-slate-200 whitespace-nowrap">{tool.name || tool.slug}</span>
                </Link>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-6 min-w-max">
              {[...marqueeRowB, ...marqueeRowB].map((tool, idx) => (
                <Link
                  key={`${tool.slug || tool.name}-row-b-${idx}`}
                  to={`/tools/${tool.slug || toToolSlug(tool.name || '')}`}
                  className="flex min-w-[170px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 transition hover:-translate-y-1 hover:border-teal-300/60"
                >
                  {tool.logoSrc || tool.logo_url ? (
                    <img
                      src={tool.logoSrc || tool.logo_url}
                      alt={tool.name || tool.slug}
                      className="h-10 w-auto object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const fallback = tool.logo_url || null
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback
                        } else {
                          e.currentTarget.style.display = 'none'
                        }
                      }}
                    />
                  ) : null}
                  <span className="text-xs text-slate-200 whitespace-nowrap">{tool.name || tool.slug}</span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="hiring-partners">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">{partnersSection.title}</h2>
            {partnersSection.subtitle && <p className="mt-3 text-slate-300">{partnersSection.subtitle}</p>}
          </div>
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-10 min-w-max">
              {[...companyRowA, ...companyRowA].map((logo, idx) => (
                <div key={`company-row-a-${idx}`} className="flex min-w-[180px] items-center justify-center px-4 py-2">
                  <img
                    src={logo}
                    alt={`Company ${idx + 1}`}
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-10 min-w-max">
              {[...companyRowB, ...companyRowB].map((logo, idx) => (
                <div key={`company-row-b-${idx}`} className="flex min-w-[180px] items-center justify-center px-4 py-2">
                  <img
                    src={logo}
                    alt={`Company ${idx + 1}`}
                    className="h-12 w-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="live-projects">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface className="p-6">
              <h3 className="text-xl font-semibold text-slate-50">Real Projects</h3>
              <p className="mt-3 text-sm text-slate-300">{liveBody}</p>
            </Surface>
            <Surface className="p-6">
              <h3 className="text-xl font-semibold text-slate-50">{placementSection.subtitle}</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {placementItems.map((item, idx) => {
                  const icons = [FileText, Linkedin, MessageCircle, Users, Rocket]
                  const Icon = icons[idx % icons.length]
                  return (
                    <div key={`${item}-${idx}`} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-teal-200 float" />
                      <span>{item}</span>
                    </div>
                  )
                })}
              </div>
            </Surface>
          </div>
          <div className="mt-8 flex justify-center">
            <button
              onClick={openPopup}
              className="rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200"
            >
              Enroll Now
            </button>
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="testimonials">
        <Container>
          <h2 className="text-3xl font-semibold text-slate-50 text-center">Success Stories</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...testimonialShowcase, ...testimonials].length === 0 ? (
              <div className="text-sm text-slate-300 text-center">No testimonials yet.</div>
            ) : (
              [...testimonialShowcase, ...testimonials].map((story) => (
                <Surface key={story.id} className="p-0 overflow-hidden tilt-card">
                  {story.image_url && (
                    <div className="aspect-[4/3] overflow-hidden border-b border-white/10 bg-white/[0.02]">
                      <img
                        src={story.image_url}
                        alt={story.name}
                        className="w-full h-[220px] object-cover rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="text-sm font-semibold text-slate-50">{story.name}</div>
                  {story.role && <div className="text-xs text-slate-400">{story.role}</div>}
                  {story.quote && <p className="mt-3 text-sm text-slate-300">"{story.quote}"</p>}
                  </div>
                </Surface>
              ))
            )}
          </div>
        </Container>
      </Section>

      <div id="blog">
        <BlogSection section={blogSection} posts={blogPosts} />
      </div>

      <div className="fixed right-4 bottom-6 z-40 hidden md:block">
        <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 space-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <button
            onClick={openPopup}
            className="w-40 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
          >
            {actionsCta.apply_label || 'Apply Now'}
          </button>
          <a
            href="tel:+917411314848"
            className="block w-40 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            Call
          </a>
          <a
            href="https://wa.me/917411314848"
            target="_blank"
            rel="noreferrer"
            className="block w-40 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            WhatsApp
          </a>
          <button
            onClick={() => setShowAddress(!showAddress)}
            className="w-40 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            {actionsCta.address_label || 'Address'}
          </button>
          {showAddress && addressText && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 whitespace-pre-line">
              {addressText}
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-50">{popupSection.title}</h3>
                {popupSection.subtitle && <p className="text-sm text-slate-400">{popupSection.subtitle}</p>}
              </div>
              <button onClick={closePopup} className="text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  id="quick-full-name"
                  name="full_name"
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100"
                />
                <input
                  id="quick-email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100"
                />
              </div>
              <input
                id="quick-phone"
                name="phone"
                type="tel"
                placeholder="Mobile Number (+91)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100"
              />
              <div className="grid gap-3 md:grid-cols-2">
                {['online', 'classroom'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, mode })}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      formData.mode === mode
                        ? 'border-teal-300 bg-teal-300/20 text-teal-100'
                        : 'border-white/10 bg-white/[0.03] text-slate-300'
                    }`}
                  >
                    {mode === 'online' ? 'Online' : 'Classroom'}
                  </button>
                ))}
              </div>
              <label className="flex items-start gap-3 text-xs text-slate-300">
                <input
                  id="quick-consent"
                  name="consent"
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-1 h-4 w-4"
                />
                {popupSection.body}
              </label>
              {formError && <div className="text-xs text-rose-300">{formError}</div>}
              {submitted ? (
                <div className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
                  Registered! We will contact you soon.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70"
                >
                  {saving ? 'Submitting...' : popupCta.submit_label || 'Register Now'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


