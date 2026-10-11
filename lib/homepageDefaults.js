// The homepage's built-in content: what www.acadvizen.com shows while no edited version exists.
// Moved verbatim from src/legacy/pages/HomePage.jsx so the homepage and the WordPress central
// admin ("Copy what the homepage shows today") use the same lists. Editing a list in WordPress
// stores its own copy (home_sections, key home_list_*); these stay as the fallback.
import { homepageLearningValues, courseCaseStudies } from '../src/lib/sitePageContent.js'

export const HOMEPAGE_LEARNING_VALUES = homepageLearningValues
export const HOMEPAGE_CASE_STUDIES = courseCaseStudies

export const HOMEPAGE_PROGRAM_HIGHLIGHTS = [
  'AI-ARCHITECT Mastery: Learn to manage 120+ AI tools to automate 80% of manual marketing tasks.',
  'GEO & AEO Implementation: Rank beyond Google by getting your brand cited in ChatGPT, Gemini, and Perplexity answers.',
  'Viral Content Flywheels: Build automated systems that turn one video into 50+ viral assets for Reels and YouTube.',
  'Performance Max Scaling: Master Google’s AI-driven PMax and Meta Advantage+ to scale ad ROI with zero manual bidding.',
  'No-Code Ecosystem Building: Launch high-speed, AI-optimized websites and landing pages in hours using Framer and Elementor.',
  "Marketing Data Science: Use GA4 and Looker Studio to build predictive dashboards that forecast next month's revenue.",
  '25+ Live "Proof-of-Work" Projects: Graduate with a live digital portfolio of real campaigns, not just a paper certificate.',
  '100% Placement via AI-Resume Tech: Get hired using ATS-optimized resumes and interview training for 2026 high-salary roles.',
]

export const HOMEPAGE_COURSE_MODULES = [
  {
    title: 'Digital 3.0 & AIO (AI Orchestration)',
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
    title: 'Advanced SEO 5.0 (Search Intelligence)',
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
    title: 'Viral Ecosystems & Content Intelligence',
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
    title: 'Performance Marketing & Ad-Tech Scaling',
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
    title: 'Marketing Analytics',
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

export const HOMEPAGE_FAQ_ITEMS = [
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

export const HOMEPAGE_SCROLLING_TOOLS = [
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

export const HOMEPAGE_SKILL_GROUPS = [
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

export const HOMEPAGE_PARTNERS = [
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

/**
 * The homepage lists that can be edited centrally: key (stored as home_sections.section_key
 * "home_list_<key>"), what editors call it, its built-in content and the item fields it uses.
 */
export const HOME_LISTS = {
  learning_values: { label: 'What you will learn (short lines)', defaults: HOMEPAGE_LEARNING_VALUES, strings: true },
  program_highlights: { label: 'Programme highlights', defaults: HOMEPAGE_PROGRAM_HIGHLIGHTS, strings: true },
  course_modules: { label: 'Course modules', defaults: HOMEPAGE_COURSE_MODULES },
  skill_groups: { label: 'Skills and tools by area', defaults: HOMEPAGE_SKILL_GROUPS },
  case_studies: { label: 'Case studies', defaults: HOMEPAGE_CASE_STUDIES },
  tools: { label: 'Tools strip', defaults: HOMEPAGE_SCROLLING_TOOLS },
  partners: { label: 'Hiring partners', defaults: HOMEPAGE_PARTNERS },
  faq: { label: 'Frequently asked questions', defaults: HOMEPAGE_FAQ_ITEMS },
}
export const HOME_LIST_PREFIX = 'home_list_'
