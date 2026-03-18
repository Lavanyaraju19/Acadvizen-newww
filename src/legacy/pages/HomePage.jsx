import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Target,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { fetchPublicData } from '../../lib/apiClient'
import { assetUrl } from '../../lib/assetUrl'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { BlogSection } from '../../components/BlogSection'
import { blogs as localBlogs } from '../../../data/blogs'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import { resolveToolLogoCandidates } from '../../../lib/toolMedia'
import { trackLead } from '../../../lib/metaPixel'
import { supabase } from '../../lib/supabaseClient'
import { canonicalizeKnownBlogSlug } from '../../../lib/blogSlugResolver'
import {
  programOverview,
  skillBottomPlatforms,
  skillTopPlatforms,
} from '../../lib/marketingProgramContent'

export default function HomePage() {
  const metaTitle = 'Best Digital Marketing Course In Bangalore'
  const metaDescription =
    'Upgrade your career with the best digital marketing training institute in Bangalore - learn practical tools, live campaigns, and industry-ready strategies.'
  const metaKeywords =
    'best digital marketing training institute in bangalore, digital marketing institute in bangalore, digital marketing course with placement, digital marketing training institute in bangalore'
  const coursePrograms = []
  const learningValues = [
    { label: 'Smart Classroom', solid: 'bg-[#1f6378]', border: 'border-[#3fa6c0]', text: 'text-sky-100' },
    { label: '100% Placement Support', solid: 'bg-[#2a7a43]', border: 'border-[#57c173]', text: 'text-emerald-100' },
    { label: 'Paid Internship', solid: 'bg-[#7b7812]', border: 'border-[#d3ca3d]', text: 'text-amber-100' },
    { label: 'Integrated AI', solid: 'bg-[#75607d]', border: 'border-[#b793c4]', text: 'text-fuchsia-100' },
    { label: 'Case Studies', solid: 'bg-[#4b7750]', border: 'border-[#80c18a]', text: 'text-teal-100' },
  ]
  const programHighlights = [
    'AI-ARCHITECT Mastery: Learn to manage 120+ AI tools to automate 80% of manual marketing tasks.',
    'GEO & AEO Implementation: Rank beyond Google by getting your brand cited in ChatGPT, Gemini, and Perplexity answers.',
    'Viral Content Flywheels: Build automated systems that turn one video into 50+ viral assets for Reels and YouTube.',
    'Performance Max Scaling: Master Google’s AI-driven PMax and Meta Advantage+ to scale ad ROI with zero manual bidding.',
    'No-Code Ecosystem Building: Launch high-speed, AI-optimized websites and landing pages in hours using Framer and Elementor.',
    "Marketing Data Science: Use GA4 and Looker Studio to build predictive dashboards that forecast next month's revenue.",
    '25+ Live "Proof-of-Work" Projects: Graduate with a live digital portfolio of real campaigns, not just a paper certificate.',
    '100% Placement via AI-Resume Tech: Get hired using ATS-optimized resumes and interview training for 2026 high-salary roles.',
  ]
  const courseModules = [
    {
      title: 'Course 1: Digital 3.0 & AIO (AI Orchestration)',
      duration: '120 Days',
      focus: 'Moving from manual labor to AI systems.',
      pillars: [
        'AIO Architecture: Setting up your daily marketing workflow using 20+ AI agents.',
        'Marketing Psychology: Understanding the emotional trigger in 2026 buyer journeys.',
        'Prompt Engineering Masterclass: Moving from simple prompts to chain-of-thought logic.',
        'No-Code Web Engineering: Building fast, AI-ready sites using Framer AI and Elementor.',
        'Information Architecture: Structuring sites so AI bots like ChatGPT and Claude can read your brand.',
        'Brand Identity Design: AI-driven color theory, typography, and logo generation with Midjourney.',
        'Automation Flywheels: Connecting website leads to CRM automatically via Zapier and Make.com.',
      ],
    },
    {
      title: 'Course 2: Advanced SEO 5.0 (Search Intelligence)',
      duration: '70 Days',
      focus: 'Ranking on Google, Perplexity, and ChatGPT Search.',
      pillars: [
        'GEO (Generative Engine Optimization): How to get cited as a source in AI answers.',
        'AEO (Answer Engine Optimization): Structuring content to win featured snippets and voice search.',
        'Semantic Keyword Clusters: Moving beyond single words to topic authority.',
        'E-E-A-T Shield: Building deep authority signals that AI trust models require in 2026.',
        'Technical AI Architecture: Schema markup, JSON-LD, and robots.txt for AI crawlers.',
        'Hyperlocal Search: Mastering local discovery in map-based AI results.',
        'AI-Human Content Hybrid: Using SurferSEO and Jasper for high-ranking content.',
      ],
    },
    {
      title: 'Course 3: Viral Ecosystems & Content Intelligence',
      duration: '60 Days',
      focus: 'Mastering the attention economy and viral algorithms.',
      pillars: [
        'Short-Form Viral Loops: The math behind 1M+ views on Reels, Shorts, and TikTok.',
        'YouTube AIO: Optimizing video scripts and metadata for the YouTube AI engine.',
        'LinkedIn Personal Branding: Building all-star authority for B2B lead generation.',
        'AI Video Production: Mastering CapCut AI, HeyGen, and Runway for high-end ads.',
        'Community Flywheels: Building Discord and WhatsApp communities that sell on autopilot.',
        'X (Twitter) Intent Growth: Using AI to find and engage with high-intent conversations.',
        'Content Repurposing Systems: 1 core video to 20 pieces of content using AI automation.',
      ],
    },
    {
      title: 'Course 4: Performance Marketing & Ad-Tech Scaling',
      duration: '90 Days',
      focus: 'High-budget management and profit scaling.',
      pillars: [
        'Meta Advantage+: Leveraging Meta’s AI to find buyers with 0% manual targeting.',
        'Google Performance Max (PMax): Scaling ads across the entire Google ecosystem.',
        'Demand Gen & PLA: Mastering YouTube ads and Merchant Center for e-commerce.',
        'Predictive Ad Copy: Using AI to write and A/B test 100+ ad variations instantly.',
        'App Marketing Scaling: Universal App Campaigns (UAC) for high-growth startups.',
        'Auction & Bidding Science: Mastering CPA vs ROAS bidding for maximum profit.',
        'Ad Compliance & Trust: Avoiding bans and maintaining high quality scores.',
      ],
    },
    {
      title: 'Course 5: Marketing Analytics',
      duration: '45 Days',
      focus: 'Turning raw data into multi-million dollar decisions.',
      pillars: [
        'GA4 Advanced Ecosystem: Custom events, user-ID tracking, and predictive insights.',
        'Google Tag Manager (GTM): Server-side tracking and advanced event triggers.',
        'Looker Studio Dashboards: Building automated, visual ROI reports for clients.',
        'Revenue Attribution: Knowing exactly which ad or post resulted in the final sale.',
        'Heatmap Analysis: Using Hotjar and Microsoft Clarity to watch user behavior live.',
        "E-commerce Funnel Science: Analyzing the drop-off points in a customer's journey.",
        'Marketing Automation ROI: Setting up lead-nurturing loops that convert in the background.',
      ],
    },
  ]
  const comparisonRows = [
    ['Syllabus Design', 'Static/Standardized: One generic syllabus for everyone, usually updated yearly.', 'Personalized AI-Syllabus: Tailored to your specific niche, career goals, and the latest AI tools.'],
    ['Search Strategy', "Legacy SEO: Focuses solely on Google's search result pages and backlinks.", 'SEO + GEO + AEO: Training to rank on Google and get cited by AI tools like ChatGPT and Perplexity.'],
    ['Workflow Method', 'Manual Execution: Teaches how to write, design, and manage ads manually.', 'AI-Orchestration (AIO): Mastery of AI agents to automate 80% of tasks, delivering faster results.'],
    ['Advertising', 'Manual Bidding: Standard training on CPC/CPM and manual budget management.', 'Predictive Ad Scaling: Hands-on mastery of Google PMax and Meta Advantage+ AI-driven ad auctions.'],
    ['Content Engine', 'One-to-One Content: Creating single posts or blogs for individual platforms.', 'Viral Content Flywheels: Learn to turn 1 core video into 50+ viral assets using AI automation.'],
    ['Website Tech', 'Slow Code/Templates: Reliance on heavy coding or standard themes that slow down sites.', 'No-Code Engineering: Ultra-fast, high-converting ecosystems using Framer AI and Elementor.'],
    ['Final Outcome', 'Paper Certificate: Graduates with a generic certificate and a standard resume.', 'Live Digital Portfolio: 25+ real AI projects and an industry-ready portfolio recognized by AI search.'],
  ]
  const faqItems = [
    {
      question: 'Why is Bangalore the best city to start an AI Digital Marketing career in 2026?',
      answer: 'As the Silicon Valley of India, Bangalore is the hub for AI startups and Global Capability Centers. Graduates from AcadVizen Bangalore have stronger access to companies like Swiggy, Flipkart, and Zomato that prioritize marketers who can handle AI-Orchestration.',
    },
    {
      question: 'What is the average salary for a Digital Marketer in Bangalore after the course?',
      answer: 'In 2026, the Bangalore market pays a premium for AI skills. Freshers from our institute typically land roles with packages ranging from Rs 4.5 LPA to Rs 7.5 LPA, while specialists in Performance Marketing or GEO often see significantly higher senior-level opportunities.',
    },
    {
      question: 'Is AcadVizen located near the major tech hubs of Bangalore?',
      answer: 'Yes. Our center is strategically located in Jayanagar, Bangalore, making it easily accessible for learners who also want to stay connected to the city’s startup, tech, and AI-marketing ecosystem.',
    },
    {
      question: 'How does AcadVizen help with placements in Bangalore-based MNCs?',
      answer: 'We support placements through structured portfolio development, interview preparation, resume optimization, LinkedIn branding, and hiring guidance aligned with Bangalore-based startups, agencies, and growth-focused teams.',
    },
    {
      question: "Does the Bangalore course include training on local quick-commerce marketing?",
      answer: 'Yes. We include learning around hyper-local SEO, instant-delivery visibility, and location-driven discovery so students understand how digital growth works for quick-commerce style businesses in Bangalore.',
    },
    {
      question: "What is 'Performance Max' (PMax) training?",
      answer: 'It is Google’s advanced AI ad system. We teach you how to feed data into PMax so the platform can identify high-intent audiences across YouTube, Search, Gmail, and the wider Google ecosystem.',
    },
    {
      question: 'How do I get my brand mentioned by ChatGPT and Gemini?',
      answer: 'This is called GEO or Generative Engine Optimization. We teach you how to structure your brand data so AI models can trust, understand, and recommend you to users.',
    },
    {
      question: "What is 'No-Code Web Engineering' in your course?",
      answer: 'Instead of slow coding, we teach you to build fast, high-converting websites using tools like Framer AI and Elementor so you can launch projects much faster.',
    },
    {
      question: "How do you teach 'Viral Content Loops'?",
      answer: 'We show you how to use AI to turn one single video into multiple content assets for Reels, TikTok, YouTube Shorts, and more so you can build repeatable organic growth systems.',
    },
    {
      question: 'Is the AcadVizen course fee worth the investment?',
      answer: 'With a curriculum covering 120+ tools and 25+ projects, the program is designed to help students build the kind of practical skill stack and portfolio depth that can accelerate early career returns.',
    },
    {
      question: 'What is the best AI-driven digital marketing institute in India?',
      answer: 'AcadVizen is positioned as an AI-orchestrated digital marketing institute with a 2026-ready curriculum covering a wide range of tools, systems, and modern search strategies.',
    },
    {
      question: 'What is the difference between SEO, AEO, and GEO?',
      answer: 'SEO helps you rank on Google, AEO helps your content become the direct answer in voice and answer-driven search, and GEO helps your brand get cited inside AI tools such as ChatGPT.',
    },
    {
      question: 'Do I need coding for AI digital marketing in 2026?',
      answer: 'No coding is required. Modern marketing increasingly uses no-code systems, automation tools, and visual builders, and we teach you how to use those effectively.',
    },
    {
      question: 'Will AI replace digital marketing jobs?',
      answer: "AI will not replace marketers, but marketers who use AI effectively will outperform those who don't. Our course is built to help you become the one orchestrating the tools.",
    },
    {
      question: 'What is the salary of an AI Marketing Architect in India?',
      answer: 'AI-specialized marketers often command stronger compensation than traditional marketers. Freshers can begin with solid growth opportunities, while experienced AI-focused marketers can move into much higher earning roles.',
    },
    {
      question: 'How many tools will I master in the Legend program?',
      answer: 'You will work across 120+ industry-relevant tools, including platforms for ads, analytics, AI content, automation, reporting, and search growth.',
    },
    {
      question: 'Is a 2-month digital marketing course enough?',
      answer: 'In 2026, a short course is often too basic for full-stack marketing readiness. This program is designed as a deeper learning path because AI orchestration and performance marketing require hands-on practice over time.',
    },
    {
      question: 'Does AcadVizen provide 100% placement assistance?',
      answer: 'Yes. We provide 100% placement support, including AI-powered resume building, LinkedIn branding, mock interview preparation, and structured hiring support.',
    },
    {
      question: 'Can I learn Digital Marketing 3.0 while working?',
      answer: 'Yes. We offer flexible hybrid learning for students, working professionals, and entrepreneurs who want to upskill alongside existing responsibilities.',
    },
    {
      question: 'Do I get certifications after the course?',
      answer: 'Yes. You receive program completion recognition along with support toward global certifications including Google, Meta, and AcadVizen’s own advanced program recognition.',
    },
  ]
  const [showPopup, setShowPopup] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [homeSections, setHomeSections] = useState({})
  const [blogPosts, setBlogPosts] = useState(
    localBlogs
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((post) => ({
        ...post,
        featured_image: post.image,
        published_at: post.created_at,
      }))
  )
  const [activeFaq, setActiveFaq] = useState(0)
  const [heroVideoAvailable, setHeroVideoAvailable] = useState(true)
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false)
  const heroVideoRef = useRef(null)
  const partnersFallback = [
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
  ]
  const [partners, setPartners] = useState(partnersFallback)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    mode: 'online',
    consent: false,
  })

  useEffect(() => {
    const runDeferredLoads = () => {
      void loadBlogPosts()
      void loadHomeSections()
      void loadPartners()
    }
    const usingIdleCallback = typeof window.requestIdleCallback === 'function'
    const deferredHandle = usingIdleCallback
      ? window.requestIdleCallback(runDeferredLoads, { timeout: 1200 })
      : window.setTimeout(runDeferredLoads, 250)

    let frameId = null
    const handleScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        frameId = null
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    const timer = setTimeout(() => {
      setScrollY(window.scrollY)
      setShowPopup(true)
    }, 90000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      if (usingIdleCallback && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(deferredHandle)
      } else {
        clearTimeout(deferredHandle)
      }
    }
  }, [])

  async function loadBlogPosts() {
    let { data, error } = await fetchPublicData('blog-posts', { limit: 6 })

    if (error || !data || data.length === 0) {
      const fallbackBlogs = localBlogs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map((post) => ({
          ...post,
          featured_image: post.image,
          published_at: post.created_at,
        }))
      setBlogPosts(fallbackBlogs)
      return
    }

    const pickFirstNonEmpty = (...values) => {
      for (const value of values) {
        if (value === null || value === undefined) continue
        if (typeof value === 'string' && value.trim() === '') continue
        return value
      }
      return null
    }

    const hydrated = data.map((post, idx) => {
      const canonicalSlug = canonicalizeKnownBlogSlug(post.slug)
      const local = localBlogs.find((item) => item.slug === canonicalSlug || item.id === post.id)
      return {
        ...post,
        slug: canonicalSlug || post.slug,
        ...(local || {}),
        title: pickFirstNonEmpty(local?.title, post.title),
        excerpt: pickFirstNonEmpty(local?.excerpt, post.excerpt),
        content: pickFirstNonEmpty(local?.content, post.content),
        featured_image: pickFirstNonEmpty(
          local?.image,
          local?.featured_image,
          post.featured_image,
          post.image,
          idx === 0 ? '/blog-images/image1.jpg' : `/blog-images/image${idx + 1}.jpg`
        ),
        published_at: pickFirstNonEmpty(post.published_at, post.created_at, local?.created_at),
      }
    })
    const localFallback = localBlogs
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((post) => ({
        ...post,
        featured_image: post.image,
        published_at: post.created_at,
      }))
    const merged = [...hydrated]
    for (const post of localFallback) {
      if (!merged.some((item) => (item.slug || item.id) === (post.slug || post.id))) {
        merged.push(post)
      }
    }
    setBlogPosts(merged.slice(0, 6))
  }

  async function loadPartners() {
    const { data, error } = await fetchPublicData('hiring-partners')
    if (error || !data || data.length === 0) {
      setPartners(partnersFallback)
      return
    }
    setPartners(data)
  }
  async function loadHomeSections() {
    const { data } = await fetchPublicData('home-sections')
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

  const preferLongerText = (primary, fallback) => {
    const primaryText = typeof primary === 'string' ? primary.trim() : ''
    const fallbackText = typeof fallback === 'string' ? fallback.trim() : ''
    if (!primaryText) return fallbackText
    if (!fallbackText) return primaryText
    return primaryText.length >= fallbackText.length * 0.7 ? primaryText : fallbackText
  }

  const getSection = (key, fallback = {}) => homeSections[key] || fallback
  const defaultWhoItems = [
    {
      title: 'Freshers',
      desc: 'Kickstart your career with a digital marketing course for freshers designed to help you learn digital marketing from scratch. This job-oriented training program covers SEO, social media marketing, Google Ads, and performance marketing. Gain in-demand skills companies are actively hiring for through a customized learning plan. Work on live projects and real campaigns to become job-ready with practical experience. Start your journey today and build a successful digital marketing career for beginners.',
    },
    {
      title: 'Working Professionals',
      desc: 'Upgrade your professional growth with a digital marketing course for working professionals built around real industry demands. Strengthen your expertise in SEO, performance marketing, paid advertising, and analytics tools to improve your job performance. Learn practical, job-oriented digital marketing skills that help you deliver better results and scale campaigns effectively. Our flexible learning structure allows you to upskill alongside your current job. Stay competitive with advanced digital marketing training designed for career growth.',
    },
    {
      title: 'Business Owners',
      desc: 'Take your business to the next level with a digital marketing program for business owners focused on real growth and measurable results. Learn how to use SEO, paid ads, social media marketing, and lead generation strategies to attract the right audience. Discover online marketing tools for small businesses that help increase brand visibility and conversions. Build and manage high-performing campaigns that drive consistent sales and ROI. Empower your business with practical digital marketing skills for entrepreneurs and scale confidently.',
    },
    {
      title: 'Freelancers',
      desc: 'Turn your skills into a profitable career with a digital marketing course for freelancers designed to help you attract and retain clients. Build a strong skill set in SEO, social media marketing, content creation, and paid ads to offer high-demand services. Learn freelance digital marketing strategies to generate leads, pitch clients, and grow your personal brand. Master tools that help you deliver results, increase client retention, and boost your income. Start your journey as a successful freelance digital marketer and scale your client base confidently.',
    },
  ]
  const whoSection = getSection('who_for', {
    title: 'Who Is This For?',
    items_json: defaultWhoItems,
  })
  const whoItems = parseJson(whoSection.items_json, []).map((item, index) => {
    const fallback = defaultWhoItems[index] || {}
    return {
      title: item?.title || fallback.title || '',
      desc: preferLongerText(item?.desc, fallback.desc),
    }
  })
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
  const whoWorkedTopics = [
    'Digital marketing',
    'Social media',
    'Performance marketing',
    'SEO',
    'GEO',
    'AEO',
    'E-mail marketing',
    'Content marketing',
    'UI/UX',
    'Website design',
    'Paid marketing',
    'Meta',
    'Google Ads',
    'Bing Ads',
    'Keyword research',
    'LinkedIn ads',
    'Gen AI',
    'AI tools',
    'WhatsApp marketing',
    'Graphic designing',
    'Video design',
  ]

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
  const toolLookup = new Map(
    scrollingTools.map((tool) => [tool.slug || toToolSlug(tool.name || ''), tool])
  )
  const marqueeRowA = []
  const marqueeRowB = []
  const toolGroups = [
    {
      title: 'SEO Tools',
      description: 'Learn technical research, audits, ranking analysis, and search intelligence systems.',
      tools: ['ahrefs', 'semrush', 'screaming-frog'],
    },
    {
      title: 'Ads Tools',
      description: 'Work with campaign setup, audience testing, and performance scaling workflows.',
      tools: ['google-ads', 'meta-ads', 'youtube-ads'],
    },
    {
      title: 'AI Tools',
      description: 'Use AI tools to speed up content, research, automation, and creative production.',
      tools: ['chatgpt', 'midjourney', 'jasper'],
    },
    {
      title: 'Analytics Tools',
      description: 'Track data, user journeys, dashboards, and decision-ready reporting.',
      tools: ['google-analytics', 'clarity', 'hotjar'],
    },
    {
      title: 'CRM / Email Tools',
      description: 'Build nurture flows, contact systems, and retention-focused communication.',
      tools: ['hubspot', 'mailchimp', 'activecampaign'],
    },
  ]
  const skillGroups = [
    {
      title: 'Search Engine Optimization (SEO + AEO)',
      items: ['On-Page SEO', 'Technical SEO', 'Off-Page SEO', 'Keyword Research', 'Entity SEO', 'AEO', 'GEO', 'AIO'],
      tools: ['ahrefs', 'semrush', 'screaming-frog'],
    },
    {
      title: 'Paid Advertising & GEO Targeting',
      items: ['Google Ads', 'Meta Ads (Facebook & Instagram Ads)', 'LinkedIn Ads', 'Bing Ads'],
      tools: ['google-ads', 'meta-ads'],
    },
    {
      title: 'Social Media Marketing',
      items: ['Instagram Marketing', 'Facebook Marketing', 'LinkedIn Marketing', 'Twitter (X) Marketing', 'YouTube Marketing', 'Email Marketing', 'WhatsApp Marketing'],
      tools: ['metricool', 'buffer', 'hootsuite'],
    },
    {
      title: 'Content Marketing & Creative',
      items: ['Blog Writing', 'Copywriting', 'Ad Creatives', 'Storytelling', 'Content Strategy'],
      tools: ['canva', 'jasper', 'midjourney'],
    },
    {
      title: 'Performance Marketing & Analytics',
      items: ['Funnel Strategy', 'Lead Generation', 'CRO (Conversion Rate Optimization)', 'ROAS Optimization'],
      tools: ['google-analytics', 'clarity', 'hotjar'],
    },
    {
      title: 'Gen AI & Chatbots',
      items: ['AI Enhance Marketing', 'Smart AI', 'Copy.ai', 'Writesonic', 'Intercom', 'Drift'],
      tools: ['chatgpt', 'synthesia', 'jasper'],
    },
    {
      title: 'Email Marketing Platforms',
      items: ['HubSpot', 'Mailchimp', 'ActiveCampaign'],
      tools: ['hubspot', 'mailchimp', 'activecampaign'],
    },
    {
      title: 'Website & Funnel Building',
      items: ['Wix ADI', 'Framer AI', 'Durable AI', 'Webflow'],
      tools: ['webflow', 'canva'],
    },
  ]

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

  const handleHeroVideoPlay = async () => {
    if (!heroVideoRef.current) return
    try {
      await heroVideoRef.current.play()
      setHeroVideoPlaying(true)
    } catch (error) {
      setHeroVideoAvailable(false)
    }
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
      trackLead(
        {
          content_name: 'Homepage Quick Registration',
          content_category: formData.mode,
          page_path: window.location.pathname,
        },
        `homepage-quick-registration:${formData.email.trim().toLowerCase()}`
      )
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
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.div
                animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-5 inline-flex"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#bfd5ff] bg-white px-5 py-2 text-sm font-semibold text-[#0B6CFF] shadow-[0_12px_30px_rgba(11,108,255,0.18)]">
                  <Target className="h-4 w-4" />
                  100% Job Guaranteed*
                </span>
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold wave-text">Master AI-Powered Digital Marketing Course</h1>
              <p className="mt-4 text-lg md:text-2xl text-slate-100 font-semibold">
                Build Your Own Learning Path with Guidance from Global Industry Experts
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#bfd5ff] bg-white px-4 py-2 text-sm font-semibold text-[#0B6CFF] shadow-sm">
                  6 Months Elite Program
                </span>
                <span className="rounded-full border border-[#bfd5ff] bg-white px-4 py-2 text-sm font-semibold text-[#0B6CFF] shadow-sm">
                  Includes 2 Months Internship
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-white/10 bg-slate-900">
                {heroVideoAvailable ? (
                  <video
                    ref={heroVideoRef}
                    playsInline
                    controls={heroVideoPlaying}
                    className="w-full h-full object-cover rounded-xl"
                    preload="metadata"
                    poster="/hero-poster.webp"
                    onError={() => setHeroVideoAvailable(false)}
                    onPause={() => setHeroVideoPlaying(false)}
                    onPlay={() => setHeroVideoPlaying(true)}
                  >
                    <source src="/videos/acadvizen-video.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-950/70">
                    <Image
                      src="/logo.png"
                      alt="Acadvizen"
                      width={96}
                      height={96}
                      className="h-24 w-auto opacity-80"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                )}
                {heroVideoAvailable && !heroVideoPlaying && (
                  <button
                    type="button"
                    onClick={handleHeroVideoPlay}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/35 hover:bg-slate-950/45 transition"
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-5 py-2 text-sm font-semibold text-white">
                      <span className="text-lg">▶</span> Play Video
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>


      <Section className="py-12 md:py-16" id="learning-values">
        <Container>
          <div className="rounded-3xl border border-emerald-700/50 bg-[#1b4a37] p-8 md:p-12 shadow-[0_18px_48px_rgba(8,15,20,0.3)]">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-200 text-center">A Future-Ready Digital Marketing Institute</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-slate-50 text-center">Our Learning Values</h2>
            <p className="mt-3 max-w-4xl mx-auto text-center text-lg text-emerald-50/90">
              Students will gain practical insights, live case studies, and real-world strategies learned from global industry experts.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {learningValues.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border ${item.border} ${item.solid} px-5 py-8 text-center shadow-[0_12px_24px_rgba(0,0,0,0.18)]`}
                >
                  <div className={`text-lg font-extrabold uppercase tracking-[0.12em] ${item.text}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="ai-marketing-architect">
        <Container>
          <div className="rounded-[2rem] border border-emerald-700/30 bg-[linear-gradient(135deg,#050b12_0%,#0d1724_55%,#1c2d16_100%)] p-8 md:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-200">Course Program</p>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold text-slate-50">{programOverview.title}</h2>
              <h4 className="mt-4 text-lg md:text-2xl font-semibold text-slate-100">
                Total Program Duration: <span className="text-amber-300">{programOverview.durationLabel}</span> | <span className="text-emerald-300">{programOverview.toolsLabel}</span> |{' '}
                <span className="text-amber-200">{programOverview.casesLabel}</span>
              </h4>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {programHighlights.map((item, idx) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-5 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                    <p className="text-sm md:text-base leading-7">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="course-modules">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50">Course Modules Built for Modern Marketing Execution</h2>
            <p className="mt-3 text-base md:text-lg text-slate-300">
              Each module is designed to build practical depth across AI, search, paid campaigns, content systems, and analytics.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {courseModules.map((module, idx) => (
              <Link
                key={module.title}
                to={`/courses#module-${idx + 1}`}
                className="group block"
              >
              <div
                className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-6 shadow-[0_20px_45px_rgba(2,6,23,0.28)] transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-teal-300/50"
              >
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Module {idx + 1}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-50">{module.title}</h3>
                <div className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  Duration: {module.duration}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-slate-100">Focus:</span> {module.focus}
                </p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">7 Key Pillars</p>
                  <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-200">
                    {module.pillars.map((pillar, pillarIndex) => (
                      <li key={`${module.title}-${pillar}`} className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-emerald-200">
                          {pillarIndex + 1}
                        </span>
                        <span>{pillar}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="course-programs">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-slate-50">Our Course Programs</h2>
            <h4 className="mt-3 text-base md:text-lg text-slate-300">
              Upgrade your career with the best digital marketing training institute in Bangalore—learn practical
              tools, live campaigns, and industry-ready strategies.
            </h4>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {coursePrograms.map((program) => (
              <Link key={program.name} to="/courses" className="block">
                <Surface className="p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:border-teal-300/50">
                  <h3 className="text-xl font-semibold text-slate-50">{program.name}</h3>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    {program.features.map((feature) => (
                      <div key={`${program.name}-${feature}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                        {feature}
                      </div>
                    ))}
                  </div>
                </Surface>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="course-highlights-custom">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-50">Personalized Your Syllabus</h2>
            <p className="mt-3 text-slate-300">
              Students will gain practical insights, live case studies, and real-world strategies learned from global
              industry experts.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Course duration',
              'Learning mode - classroom and online',
              'Choose your tools',
              'Personalize syllabus',
              'Case studies 25+',
              'Hands on learning / practical experience',
              'Global experts',
              'Industry experts',
              'Global certifications 35+',
            ].map((item) => (
              <Surface key={item} className="p-4">
                <div className="text-sm font-semibold text-slate-100">{item}</div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="tools-mastery">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-50">Tools You Will Master</h2>
            <p className="mt-3 text-lg font-semibold text-amber-200">Learn 6 tools daily</p>
            <p className="mt-2 text-base md:text-lg text-slate-300">
              Explore the tools you will work with across SEO, ads, AI, analytics, and CRM systems. Every tool card links to its dedicated detail page.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-5">
            {toolGroups.map((group) => (
              <div key={group.title} className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,29,0.95),rgba(3,7,18,0.95))] p-5">
                <h3 className="text-lg font-bold text-slate-50">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{group.description}</p>
                <div className="mt-5 space-y-3">
                  {group.tools.map((slug) => {
                    const tool = toolLookup.get(slug)
                    if (!tool) return null
                    return (
                      <Link
                        key={slug}
                        to={`/tools/${tool.slug || slug}`}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition hover:-translate-y-0.5 hover:border-teal-300/50"
                      >
                        <div className="h-11 w-11 shrink-0">
                          <AdaptiveImage
                            src={tool.logoSrc || resolveToolLogoCandidates(tool)[0]}
                            fallbackSrcs={resolveToolLogoCandidates(tool).slice(tool.logoSrc ? 0 : 1)}
                            alt={tool.name || slug}
                            variant="logo"
                            aspectRatio="1 / 1"
                            wrapperClassName="h-full w-full"
                            borderClassName=""
                            roundedClassName="rounded-2xl"
                            sizes="44px"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-100">{tool.name || slug}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="tools-marquee">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-50">Tools You Will Master</h2>
            <p className="mt-3 text-base md:text-lg text-slate-300">
              Explore the tools you will work with. Click any logo to view details.
            </p>
          </div>
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-6 min-w-max">
              {[...marqueeRowA, ...marqueeRowA].map((tool, idx) => (
                <Link
                  key={`${tool.slug || tool.name}-row-a-${idx}`}
                  to={`/tools/${tool.slug || toToolSlug(tool.name || '')}`}
                  className="tilt-card flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 transition hover:-translate-y-1 hover:border-teal-300/60"
                >
                  <div className="h-12 w-12 shrink-0 float">
                    <AdaptiveImage
                      src={tool.logoSrc || resolveToolLogoCandidates(tool)[0]}
                      fallbackSrcs={resolveToolLogoCandidates(tool).slice(tool.logoSrc ? 0 : 1)}
                      alt={tool.name || tool.slug}
                      variant="logo"
                      aspectRatio="1 / 1"
                      wrapperClassName="h-full w-full"
                      borderClassName=""
                      roundedClassName="rounded-2xl"
                      sizes="48px"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">{tool.name || tool.slug}</span>
                </Link>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-6 min-w-max">
              {[...marqueeRowB, ...marqueeRowB].map((tool, idx) => (
                <Link
                  key={`${tool.slug || tool.name}-row-b-${idx}`}
                  to={`/tools/${tool.slug || toToolSlug(tool.name || '')}`}
                  className="tilt-card flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 transition hover:-translate-y-1 hover:border-teal-300/60"
                >
                  <div className="h-12 w-12 shrink-0 float">
                    <AdaptiveImage
                      src={tool.logoSrc || resolveToolLogoCandidates(tool)[0]}
                      fallbackSrcs={resolveToolLogoCandidates(tool).slice(tool.logoSrc ? 0 : 1)}
                      alt={tool.name || tool.slug}
                      variant="logo"
                      aspectRatio="1 / 1"
                      wrapperClassName="h-full w-full"
                      borderClassName=""
                      roundedClassName="rounded-2xl"
                      sizes="48px"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">{tool.name || tool.slug}</span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>


      <Section className="py-12 md:py-16" id="who-for">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 text-center">{whoSection.title}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {whoItems.map((card, idx) => {
              const whoImages = [
                '/who-for/freshers.png',
                '/who-for/working-professionals.jpg',
                '/who-for/business-owners.png',
                '/who-for/freelancers.webp',
              ]
              const iconSrc = whoImages[idx % whoImages.length]
              return (
                <div
                  key={`${card.title}-${idx}`}
                  className={`group rounded-[2rem] border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl tilt-card ${
                    idx % 4 === 0
                      ? 'border-[#43a8c7] bg-[#14546c]'
                      : idx % 4 === 1
                      ? 'border-[#55c9c0] bg-[#15656a]'
                      : idx % 4 === 2
                      ? 'border-[#d1a55f] bg-[#6a4d32]'
                      : 'border-[#a98de5] bg-[#5a438d]'
                  }`}
                >
                  <div className="mb-5 inline-flex h-28 w-28 items-center justify-center rounded-full bg-[#10263d] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Image
                      src={iconSrc}
                      alt={card.title}
                      width={96}
                      height={96}
                      className="h-24 w-24 object-contain float"
                    />
                  </div>
                  <div className="text-xl font-bold text-slate-50">{card.title}</div>
                  <p className="mt-3 text-base leading-8 text-slate-100/95">{card.desc}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="hiring-partners">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-base md:text-lg font-bold uppercase tracking-[0.18em] text-teal-200">Placements</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-slate-50">{partnersSection.title}</h2>
            {partnersSection.subtitle && <p className="mt-4 text-lg md:text-2xl font-semibold text-sky-100">{partnersSection.subtitle}</p>}
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">Global Partners</p>
            <p className="mt-3 text-base text-slate-200">
              Digital Marketing opens doors to career opportunities across the world 🌍
            </p>
          </div>
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-10 min-w-max">
              {[...companyRowA, ...companyRowA].map((logo, idx) => (
                <div key={`company-row-a-${idx}`} className="flex min-w-[180px] items-center justify-center px-4 py-2">
                  <Image
                    src={assetUrl(logo)}
                    alt={`Company ${idx + 1}`}
                    width={120}
                    height={48}
                    className="h-12 w-auto object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = assetUrl('/logos/google.png')
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-10 min-w-max">
              {[...companyRowB, ...companyRowB].map((logo, idx) => (
                <div key={`company-row-b-${idx}`} className="flex min-w-[180px] items-center justify-center px-4 py-2">
                  <Image
                    src={assetUrl(logo)}
                    alt={`Company ${idx + 1}`}
                    width={120}
                    height={48}
                    className="h-12 w-auto object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = assetUrl('/logos/tcs.png')
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="skills-mastery">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
              Master the Complete Digital Marketing Skill Set with SEO, AI &amp; Performance Marketing
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-200">
              Learn 25+ in-demand digital marketing skills including SEO, AIO, AI tools, paid ads, and analytics to build a high-paying career in digital marketing.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {skillGroups.map((group) => (
              <div key={group.title} className="rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(180deg,#0d1628_0%,#08111f_100%)] p-5 shadow-[0_20px_45px_rgba(3,7,18,0.28)]">
                <h3 className="text-lg font-bold text-slate-50">{group.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={`${group.title}-${item}`} className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.tools.map((slug) => {
                    const tool = toolLookup.get(slug)
                    if (!tool) return null
                    return (
                      <Link
                        key={`${group.title}-${slug}`}
                        to={`/tools/${tool.slug || slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="h-6 w-6 shrink-0">
                          <AdaptiveImage
                            src={tool.logoSrc || resolveToolLogoCandidates(tool)[0]}
                            fallbackSrcs={resolveToolLogoCandidates(tool).slice(tool.logoSrc ? 0 : 1)}
                            alt={tool.name || slug}
                            variant="logo"
                            aspectRatio="1 / 1"
                            wrapperClassName="h-full w-full"
                            borderClassName=""
                            roundedClassName="rounded-full"
                            sizes="24px"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">{tool.name || slug}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="acadvizen-comparison">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-50">What Makes Acadvizen Different</h2>
          </div>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,29,0.96),rgba(3,7,18,0.96))]">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.03]">
              {['Key Feature', 'Traditional Digital Marketing Institutes', 'AcadVizen: The AI-Orchestrated Legend™'].map((label, idx) => (
                <div
                  key={label}
                  className={`px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] ${
                    idx === 2 ? 'text-emerald-200' : 'text-slate-200'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="divide-y divide-white/10">
              {comparisonRows.map(([feature, traditional, acadvizen]) => (
                <div key={feature} className="grid gap-px md:grid-cols-3">
                  <div className="bg-white/[0.02] px-5 py-5 text-sm font-semibold text-slate-100">{feature}</div>
                  <div className="bg-white/[0.01] px-5 py-5 text-sm leading-6 text-slate-300">{traditional}</div>
                  <div className="bg-emerald-400/8 px-5 py-5 text-sm leading-6 text-emerald-100">{acadvizen}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="who-worked">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-50">Who Have All Worked</h2>
            <p className="mt-3 text-slate-300">Expertise delivered across modern digital marketing disciplines.</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {whoWorkedTopics.map((topic) => (
              <Surface key={topic} className="p-4 text-center">
                <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-100">
                  <Sparkles className="h-6 w-6 text-teal-200" />
                  <span>{topic}</span>
                </div>
              </Surface>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="hidden py-10 md:py-12" id="why-acadvizen-different-structured">
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

      <Section className="py-12 md:py-16" id="skills-after-blog">
        <Container>
          <div className="rounded-[2rem] border border-[#7840b8] bg-[#4c226f] px-5 py-8 shadow-[0_25px_70px_rgba(9,15,30,0.45)] md:px-8 md:py-10">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-bold text-white md:text-5xl">
                Master the Complete Digital Marketing Skill Set with SEO, AI &amp; Performance Marketing
              </h2>
              <p className="mt-4 text-base text-slate-200 md:text-lg">
                Learn 25+ in-demand digital marketing skills including SEO, AIO, AI tools, paid ads, and analytics to build a high-paying career in digital marketing.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {skillTopPlatforms.map((label) => (
                  <span key={label} className="rounded-full border border-[#4d678d] bg-[#213962] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {skillGroups.map((group, groupIndex) => (
                <div
                  key={group.title}
                  className={`rounded-[1.7rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                    group.title === 'Search Engine Optimization (SEO + AEO)'
                      ? 'border-[#c77dff]/35 bg-[#3a1360]'
                      : group.title === 'Paid Advertising & GEO Targeting'
                      ? 'border-[#60a5fa]/35 bg-[#1d2b6b]'
                      : group.title === 'Social Media Marketing'
                      ? 'border-[#67e8f9]/35 bg-[#173d5a]'
                      : group.title === 'Content Marketing & Creative'
                      ? 'border-[#fbbf24]/35 bg-[#5b2d11]'
                      : group.title === 'Performance Marketing & Analytics'
                      ? 'border-[#5eead4]/35 bg-[#0f3c3a]'
                      : group.title === 'Gen AI & Chatbots'
                      ? 'border-[#e879f9]/35 bg-[#43225e]'
                      : group.title === 'Email Marketing Platforms'
                      ? 'border-[#86efac]/35 bg-[#163c32]'
                      : 'border-[#93c5fd]/35 bg-[#1f335a]'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <h3 className="text-xl font-bold text-white">{group.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <span key={`${group.title}-${item}`} className="rounded-full border border-[#5e6e8d] bg-[#23172f] px-3 py-1 text-sm text-slate-100">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                      {group.tools.map((slug) => {
                        const tool = toolLookup.get(slug)
                        if (!tool) return null
                        return (
                          <Link
                            key={`${group.title}-${slug}`}
                            to={`/tools/${tool.slug || slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#5e6e8d] bg-[#23172f] px-3 py-2"
                          >
                            <div className="h-6 w-6 shrink-0">
                              <AdaptiveImage
                                src={tool.logoSrc || resolveToolLogoCandidates(tool)[0]}
                                fallbackSrcs={resolveToolLogoCandidates(tool).slice(tool.logoSrc ? 0 : 1)}
                                alt={tool.name || slug}
                                variant="logo"
                                aspectRatio="1 / 1"
                                wrapperClassName="h-full w-full"
                                borderClassName=""
                                roundedClassName="rounded-full"
                                sizes="24px"
                                loading="lazy"
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-100">{tool.name || slug}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <h3 className="text-2xl font-bold text-white">What Tools Are Used in Digital Marketing?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200 md:text-base">
                Digital marketing uses tools like SEO platforms, Google Ads, Meta Ads, analytics tools, and AI-based automation tools.
              </p>
              <Link
                to="/courses"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-teal-200/40 bg-teal-300 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_14px_40px_rgba(94,234,212,0.25)] transition hover:-translate-y-0.5 hover:bg-teal-200"
              >
                Explore Curriculum
              </Link>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {skillBottomPlatforms.map((label) => (
                  <span key={`footer-${label}`} className="rounded-full border border-[#5e6e8d] bg-[#213962] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-12 md:py-16" id="comparison-after-blog">
        <Container>
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-50">What Makes AcadVizen Different</h2>
          </div>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(10,16,29,0.96),rgba(3,7,18,0.96))] shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
            <div className="grid grid-cols-3 border-b border-white/10 bg-slate-900/90">
              {['Key Feature', 'Traditional Digital Marketing Institutes', 'AcadVizen: The AI-Orchestrated Legend™'].map((label) => (
                <div key={label} className="border-r border-white/10 px-4 py-4 text-lg font-bold text-slate-100 last:border-r-0">
                  {label}
                </div>
              ))}
            </div>
            <div className="divide-y divide-white/10">
              {comparisonRows.map(([feature, traditional, acadvizen]) => (
                <div key={`after-${feature}`} className="grid grid-cols-3">
                  <div className="border-r border-white/10 bg-slate-900/65 px-4 py-5 text-base font-bold text-slate-100">
                    {feature}
                  </div>
                  <div className="border-r border-white/10 px-4 py-5 text-base leading-7 text-slate-300">
                    {traditional}
                  </div>
                  <div className="bg-emerald-500/8 px-4 py-5 text-base leading-7 text-emerald-100">
                    {acadvizen}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-10 md:py-12" id="faq">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-50">FAQ</h2>
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
                    <span className="text-lg font-bold text-slate-100">{item.question}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="border-t border-white/10 px-5 py-4 text-base text-slate-300">{item.answer}</div>}
                </Surface>
              )
            })}
          </div>
        </Container>
      </Section>

      <div id="blog">
        <BlogSection section={blogSection} posts={blogPosts} />
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





