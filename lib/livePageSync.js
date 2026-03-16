import { LIVE_SYNC_TARGETS } from './livePageTargets'

function makeSection(type, order_index, content_json = {}, style_json = {}) {
  return {
    type,
    order_index,
    visibility: true,
    content_json,
    style_json,
  }
}

function parseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

function groupByKey(rows = [], key = 'section_key') {
  return rows.reduce((acc, row) => {
    if (row?.[key]) acc[row[key]] = row
    return acc
  }, {})
}

function logSyncError(step, error, extra = {}) {
  console.error('[cms-import][live-sync]', step, {
    message: error?.message || String(error),
    code: error?.code || null,
    details: error?.details || null,
    hint: error?.hint || null,
    ...extra,
  })
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

async function fetchHomeSectionMap(supabase) {
  const { data, error } = await supabase
    .from('home_sections')
    .select('section_key,title,subtitle,body,items_json,cta_json')
  if (error) {
    logSyncError('fetchHomeSectionMap', error)
    return {}
  }
  return groupByKey(data || [])
}

async function fetchPageSectionMaps(supabase, pages = []) {
  const { data, error } = await supabase
    .from('page_sections')
    .select('page_slug,section_key,title,subtitle,body,items_json,cta_json')
    .in('page_slug', pages)

  if (error) {
    logSyncError('fetchPageSectionMaps', error, { pages })
    return {}
  }

  return (data || []).reduce((acc, row) => {
    if (!row?.page_slug || !row?.section_key) return acc
    if (!acc[row.page_slug]) acc[row.page_slug] = {}
    acc[row.page_slug][row.section_key] = row
    return acc
  }, {})
}

function buildHomeTemplate(homeSectionMap) {
  const learningValues = [
    { label: '120+ Tools', value: '120+' },
    { label: '75+ Live Projects', value: '75+' },
    { label: '45+ Globally Recognized Certifications', value: '45+' },
    { label: '25+ Global Industry Experts', value: '25+' },
  ]
  const coursePrograms = [
    {
      title: 'Basic',
      list: ['45 Days', '15+ Tools, Gen AI Tools, Digital Marketing Tools', '7 Live Projects', 'Placement Assistance'],
    },
    {
      title: 'Advanced',
      list: ['65 Days', '20+ Tools, Gen AI Tools, Digital Marketing Tools', '15+ Live Projects', 'Placement Assistance'],
    },
    {
      title: 'Master',
      list: ['95 Days', '65+ Tools, Gen AI Tools, Digital Marketing Tools', '25+ Live Projects', 'Internship + Placement', 'Guest Lectures'],
    },
  ]
  const whoSection = homeSectionMap.who_for || {}
  const whoItems = parseJson(whoSection.items_json, [
    { title: 'Freshers', desc: 'Start your career in digital marketing with a customized learning plan.' },
    { title: 'Working Professionals', desc: 'Upskill with tools and modules that match your job requirements.' },
    { title: 'Business Owners', desc: 'Learn marketing tools that grow your business.' },
    { title: 'Freelancers', desc: 'Build your own skill stack and get more clients.' },
  ])
  const blogSection = homeSectionMap.blog_section || {}
  const partnersSection = homeSectionMap.hiring_partners || {}
  const popupSection = homeSectionMap.registration_popup || {}
  const popupCta = parseJson(popupSection.cta_json, {})
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

  return {
    id: 'home',
    title: 'Home',
    slug: 'home',
    description: 'Current live homepage content synced from the legacy public website.',
    seo_title: 'Best Digital Marketing Course In Bangalore',
    seo_description:
      'Upgrade your career with the best digital marketing training institute in Bangalore - learn practical tools, live campaigns, and industry-ready strategies.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: 'Master AI-Powered Digital Marketing Course',
        subheading: 'Build Your Own Learning Path with Guidance from Global Industry Experts',
        badges: [{ label: '6 Months Elite Program' }, { label: 'Includes 2 Months Internship' }],
      }),
      makeSection('stats_section', 1, {
        heading: 'Our Learning Values',
        subheading: 'Hands-on digital marketing training in Bangalore with live project experience',
        stats: learningValues,
      }),
      makeSection('feature_cards', 2, {
        heading: 'Our Course Programs',
        subheading:
          'Upgrade your career with the best digital marketing training institute in Bangalore-learn practical tools, live campaigns, and industry-ready strategies.',
        cards: coursePrograms,
      }),
      makeSection('feature_cards', 3, {
        heading: 'Personalized Your Syllabus',
        subheading:
          'Students will gain practical insights, live case studies, and real-world strategies learned from global industry experts.',
        cards: [
          { title: 'Course duration' },
          { title: 'Learning mode - classroom and online' },
          { title: 'Choose your tools' },
          { title: 'Personalize syllabus' },
          { title: 'Case studies 25+' },
          { title: 'Hands on learning / practical experience' },
          { title: 'Global experts' },
          { title: 'Industry experts' },
          { title: 'Global certifications 35+' },
        ],
      }),
      makeSection('text_block', 4, {
        heading: 'Tools You Will Master',
        text: 'Explore the tools you will work with. Click any logo to view details.',
      }),
      makeSection('feature_cards', 5, {
        heading: firstText(whoSection.title, 'Who Is This For?'),
        cards: (Array.isArray(whoItems) ? whoItems : []).map((item) => ({
          title: item?.title || '',
          text: item?.desc || '',
        })),
      }),
      makeSection('text_block', 6, {
        heading: firstText(partnersSection.title, 'Our Alumni Work Across 2,000+ Global Giants'),
        subheading: firstText(partnersSection.subtitle, 'Trusted by leading brands and high-growth companies.'),
        text: 'Digital Marketing opens doors to career opportunities across the world.',
      }),
      makeSection('feature_cards', 7, {
        heading: 'Who Have All Worked',
        subheading: 'Expertise delivered across modern digital marketing disciplines.',
        cards: [
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
        ].map((title) => ({ title })),
      }),
      makeSection('three_column_layout', 8, {
        heading: 'What Makes ACADVIZEN Different?',
        columns: [
          {
            title: 'What Most Institutes Teach',
            list: ['Same marketing tools', 'No customization', 'Theory heavy', 'No real projects'],
          },
          {
            title: 'What Makes ACADVIZEN Different',
            list: ['Customize tools', 'Real campaign execution', 'Career specialization', 'Industry workflows', 'Placement support'],
          },
        ],
      }),
      makeSection('faq', 9, {
        heading: 'FAQ',
        items: faqItems,
      }),
      makeSection('text_block', 10, {
        heading: firstText(blogSection.title, 'From the Blog'),
        subheading: firstText(blogSection.subtitle, 'Latest insights from Acadvizen.'),
        text: firstText(blogSection.body, 'No blog posts yet.'),
      }),
      makeSection('lead_form', 11, {
        heading: firstText(popupSection.title, 'Quick Registration'),
        subheading: firstText(popupSection.subtitle, 'Reserve your spot in under 60 seconds.'),
        text: firstText(popupSection.body, 'I agree to the Privacy Policy and allow Acadvizen to contact me.'),
        name_label: 'Full Name',
        email_label: 'Email',
        phone_label: 'Mobile Number (+91)',
        submit_label: firstText(popupCta.submit_label, 'Register Now'),
        source: 'home-popup',
        form_type: 'registration',
      }),
    ],
  }
}

function buildAboutTemplate(pageSectionMap) {
  const heroSection = pageSectionMap.hero || {}
  const heroCta = parseJson(heroSection.cta_json, {})
  const storySection = pageSectionMap.story || {}
  const storyItems = parseJson(storySection.items_json, [
    'Best academy for AI digital marketing.',
    'Acadvizen is a leading AI-powered digital marketing learning institute.',
  ])
  const statsSection = pageSectionMap.stats || {}
  const statsItems = parseJson(statsSection.items_json, [])
  const highlightsSection = pageSectionMap.highlights || {}
  const highlightsItems = parseJson(highlightsSection.items_json, [])
  const missionSection = pageSectionMap.mission || {}
  const missionItems = parseJson(missionSection.items_json, [])
  const foundersSection = pageSectionMap.founders || {}
  const founders = parseJson(foundersSection.items_json, [
    { name: 'Chandra', image: '/team/chandra.jpg' },
    { name: 'Manasvini', image: '/team/manasvini.png' },
  ])

  return {
    id: 'about',
    title: 'About',
    slug: 'about',
    description: 'Current live about-page content synced from the legacy public website.',
    seo_title: 'About Us',
    seo_description: 'Learn about our mission, mentors, and digital marketing training approach.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: firstText(heroSection.title, 'Best Academy for AI Digital Marketing'),
        subheading: firstText(heroSection.subtitle, 'Acadvizen leading AI-powered digital marketing learning institute.'),
        badges: heroCta?.badge ? [{ label: heroCta.badge }] : [],
      }),
      makeSection('text_block', 1, {
        heading: 'Best Academy for AI Digital Marketing',
        text:
          'ACADVIZEN stands as the best digital marketing training institute in Bangalore, delivering practical, career-driven education. As a top-rated digital marketing institute in Bangalore, we combine live projects, expert mentorship, and real-time tools.',
      }),
      makeSection('three_column_layout', 2, {
        columns: [
          {
            title: 'Our Mission',
            text: 'To combine creativity, data, and AI to train the next generation of digital marketers.',
          },
          {
            title: 'Our Vision',
            text: "To shape future marketers using AI-driven strategies for tomorrow's digital economy.",
          },
          {
            title: 'Why Choose Us',
            list: ['Industry mentors', 'Live projects', 'Placement assistance', 'Soft skills training', 'Tool-based learning'],
          },
        ],
      }),
      makeSection('text_block', 3, {
        heading: firstText(storySection.title, 'Our Story'),
        text: (Array.isArray(storyItems) ? storyItems : []).join('\n\n'),
      }),
      makeSection('stats_section', 4, {
        heading: 'Story Highlights',
        stats: (Array.isArray(statsItems) ? statsItems : []).map((item) => ({
          label: item?.k || '',
          value: item?.v || '',
        })),
      }),
      makeSection('feature_cards', 5, {
        heading: firstText(highlightsSection.title, 'Highlights'),
        cards: (Array.isArray(highlightsItems) ? highlightsItems : []).map((item) => ({
          title: item?.title || '',
          text: item?.desc || '',
        })),
      }),
      makeSection('feature_cards', 6, {
        heading: firstText(missionSection.title, 'Mission Blocks'),
        subheading: missionSection.subtitle || '',
        cards: (Array.isArray(missionItems) ? missionItems : []).map((item) => ({
          title: item?.t || '',
          text: item?.d || '',
        })),
      }),
      makeSection('gallery', 7, {
        heading: firstText(foundersSection.title, 'Our Trainers'),
        subheading: foundersSection.subtitle || '',
        items: (Array.isArray(founders) ? founders : []).map((person) => ({
          src: person?.image || '/team/chandra.jpg',
          alt: person?.name || 'Trainer',
          caption: person?.name || '',
        })),
      }),
    ],
  }
}

function buildContactTemplate(pageSectionMap) {
  const formSection = pageSectionMap.form || {}
  const formCta = parseJson(formSection.cta_json, {})
  const officeSection = pageSectionMap.office || {}
  const officeImages = parseJson(officeSection.items_json, [])

  return {
    id: 'contact',
    title: 'Contact',
    slug: 'contact',
    description: 'Current live contact-page content synced from the legacy public website.',
    seo_title: 'Contact',
    seo_description: 'Get in touch with our admissions and support teams.',
    status: 'draft',
    sections: [
      makeSection('text_block', 0, {
        heading: 'Looking for the best digital marketing institute?',
        text: 'Join our digital marketing course today and take the first step towards a high-income, future-ready career.',
      }),
      makeSection('lead_form', 1, {
        heading: firstText(formSection.title, 'Contact Form'),
        subheading: firstText(formSection.subtitle, formSection.body, 'Share your details and our admissions team will get back to you.'),
        name_label: 'Full Name',
        phone_label: 'Phone Number',
        email_label: 'Email',
        message_label: 'Message',
        submit_label: firstText(formCta.submit_label, 'Send Message'),
        source: 'contact-page',
        form_type: 'contact',
        success_message: 'Thanks, our team will contact you shortly.',
      }),
      makeSection('gallery', 2, {
        heading: firstText(officeSection.title, 'Office Images'),
        items: (Array.isArray(officeImages) ? officeImages : []).map((src) => ({
          src,
          alt: 'Acadvizen office',
          caption: '',
        })),
      }),
      makeSection('cta_banner', 3, {
        heading: 'Bangalore',
        text: 'Head Office JP Nagar, Acadvizen Institute\nMarenahalli, 5th Block, Jayanagar\nBengaluru, Karnataka 560078',
        button: {
          label: 'Get Directions',
          href: 'https://www.google.com/maps?q=Acadvizen+Institute+Jayanagar+Bengaluru',
          target: '_blank',
        },
      }),
    ],
  }
}

function buildCoursesTemplate(pageSectionMap, courses) {
  const heroSection = pageSectionMap.hero || {}
  return {
    id: 'courses',
    title: 'Courses',
    slug: 'courses',
    description: 'Current live courses-page content synced from the legacy public website.',
    seo_title: 'Courses',
    seo_description: 'Explore digital marketing courses, curriculum depth, and project-led outcomes.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: firstText(heroSection.title, 'Courses'),
        subheading: firstText(heroSection.subtitle, 'Browse our role-focused digital marketing programs.'),
      }),
      makeSection('stats_section', 1, {
        heading: 'Course Highlights',
        subheading: 'A practical blueprint designed for high-growth careers.',
        stats: [
          { label: 'Skill Tracks', value: '12' },
          { label: 'Live Practice Hours', value: '220+' },
          { label: 'Applied Modules', value: '34' },
          { label: 'Mentor Clinics', value: '1:1' },
          { label: 'Tool Stack Access', value: '30+' },
          { label: 'Portfolio Sprints', value: '8' },
          { label: 'Capstone Missions', value: '6' },
          { label: 'Career Readiness', value: 'Global' },
          { label: 'Interview Workshops', value: 'Weekly' },
        ],
      }),
      makeSection('feature_cards', 2, {
        heading: 'Current Course Cards',
        cards: (courses || []).map((course) => ({
          title: course?.title || '',
          text: course?.short_description || '',
          imageSrc: course?.image_url || '',
          buttonLabel: 'Open',
          buttonHref: course?.slug ? `/courses/${course.slug}` : '',
        })),
      }),
      makeSection('testimonial', 3, {
        heading: 'Success Stories',
        subheading: 'Learners turned campaigns into real offers at growth-focused teams.',
        items: [
          { name: 'Ritu S', role: 'Performance Marketer · Infosys', quote: 'Placed at Infosys.' },
          { name: 'Varun K', role: 'SEO Strategist · Deloitte', quote: 'Placed at Deloitte.' },
          { name: 'Megha P', role: 'Growth Analyst · Amazon', quote: 'Placed at Amazon.' },
        ],
      }),
      makeSection('feature_cards', 4, {
        heading: 'About Us',
        subheading: 'Mentors, reviewers, and practitioners from industry teams.',
        cards: ['SEO Mentor', 'Ads Mentor', 'Analytics Mentor', 'Content Mentor'].map((title) => ({ title })),
      }),
      makeSection('feature_cards', 5, {
        heading: 'Projects',
        subheading: 'Portfolio-grade executions across paid, organic, and automation tracks.',
        cards: [
          { title: 'Campaign Build Sprint', text: 'Real task briefs, deadlines, and mentor review loops.' },
          { title: 'SEO Growth Case', text: 'Real task briefs, deadlines, and mentor review loops.' },
          { title: 'Analytics Dashboard Build', text: 'Real task briefs, deadlines, and mentor review loops.' },
        ],
      }),
      makeSection('cta_banner', 6, {
        heading: 'Explore More',
        text: 'Related blogs, tools, and placement links are shown on the live page based on current entity data.',
      }),
    ],
  }
}

function buildPlacementTemplate(pageSectionMap, placements) {
  const heroSection = pageSectionMap.hero || {}
  return {
    id: 'placement',
    title: 'Placement',
    slug: 'placement',
    description: 'Current live placement-page content synced from the legacy public website.',
    seo_title: 'Placement',
    seo_description: 'Placement support helps candidates stand out and unlock real career opportunities.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: firstText(heroSection.title, 'Acadvizen Placement'),
        subheading: firstText(
          heroSection.subtitle,
          'Placement support helps candidates stand out, get noticed by top recruiters, and unlock real career opportunities.'
        ),
      }),
      makeSection('text_block', 1, {
        heading: 'Global Learner Growth Map',
        text: 'Night-theme world view with learner points and regional growth percentages.',
      }),
      makeSection('stats_section', 2, {
        heading: 'Career Opportunities Across the World',
        subheading: 'Digital Marketing opens doors to career opportunities across the world.',
        stats: [
          { label: 'North America', value: '+10%' },
          { label: 'Europe', value: '+10%' },
          { label: 'Asia', value: '+13%' },
          { label: 'South America', value: '+15%' },
          { label: 'Africa', value: '+9%' },
          { label: 'Australia', value: '+8%' },
        ],
      }),
      makeSection('feature_cards', 3, {
        heading: 'Digital Marketing Career Path',
        cards: [
          { title: 'Join Your Course', text: 'Begin your journey by enrolling in a role-focused track tailored to your career goals.' },
          { title: 'Skill-Building Projects & Certifications', text: 'Gain hands-on experience through real projects and certifications that validate your skills.' },
          { title: 'Portfolio & Resume Workshops', text: 'Craft a standout resume and portfolio with expert guidance to impress potential employers.' },
          { title: 'Mock Interviews + HR Training', text: 'Prepare for real interviews with mock sessions, HR best practices, and communication tips.' },
          { title: 'Placement Drives with Top Recruiters', text: 'Get access to placement drives and job opportunities with top companies hiring actively.' },
          { title: 'Offer Letters + Joining Support', text: 'Receive offer letters and complete post-placement support from documentation to onboarding.' },
        ],
      }),
      makeSection('feature_cards', 4, {
        heading: 'Current Placement Cards',
        cards: (placements || []).map((placement) => ({
          title: placement?.role || '',
          text: `${placement?.company_name || ''}${placement?.location ? ` · ${placement.location}` : ''}`,
          list: [
            placement?.package ? `Package: ${placement.package}` : '',
            placement?.description || '',
          ].filter(Boolean),
          imageSrc: placement?.featured_image || '',
          buttonLabel: 'View details',
          buttonHref: placement?.id ? `/placement/${placement.id}` : '',
        })),
      }),
      makeSection('testimonial', 5, {
        heading: 'Success Stories',
        subheading:
          'Our students come from different backgrounds - graduates, working professionals, career switchers, and entrepreneurs.',
        items: [
          {
            name: 'Acadvizen Learner',
            role: 'Placed at Accenture',
            quote: 'Hands-on project training helped me transition confidently into a digital marketing role.',
          },
          {
            name: 'Acadvizen Learner',
            role: 'Placed at TCS',
            quote: 'The structured curriculum and interview preparation made placement conversion much easier.',
          },
          {
            name: 'Acadvizen Learner',
            role: 'Placed at IBM',
            quote: 'Tool-based learning and live campaigns gave me practical confidence from day one.',
          },
        ],
      }),
      makeSection('three_column_layout', 6, {
        heading: 'Placement Support',
        subheading:
          'Our placement cell ensures students are industry-ready through resume building, mock interviews, portfolio development, and recruiter connections.',
        columns: [
          {
            title: 'Placement Process',
            list: [
              'Step 1 - Resume & Portfolio Preparation',
              'Step 2 - Mock Interviews',
              'Step 3 - Industry Referrals',
              'Step 4 - Job Interviews',
            ],
          },
          {
            title: 'Support Tracks',
            list: [
              'Mock interview rounds',
              'Resume and portfolio reviews',
              'Recruiter network support',
              'Offer and joining guidance',
            ],
          },
        ],
      }),
    ],
  }
}

function buildHireFromUsTemplate() {
  const readinessBlocks = [
    {
      title: 'Career Advice',
      list: [
        'Personalized guidance from dedicated learning advisors.',
        'Tailored career roadmaps to match industry demand.',
        'Pre-enrollment 1:1 mentoring session to align learning goals.',
      ],
    },
    {
      title: 'Guide Program',
      list: [
        'A structured walkthrough of the program from our experts.',
        'Free certification-equivalent masterclass to experience our teaching quality.',
        'Smooth onboarding, documentation, and payment process for learners.',
      ],
    },
    {
      title: 'Specialisation',
      list: [
        'Access to niche-focused modules in SEO, SEM, SMM, Analytics, and more.',
        'Hands-on learning with advanced tools and frameworks.',
        'Masterclasses designed in collaboration with industry leaders.',
      ],
    },
    {
      title: 'Practicals',
      list: [
        'Real-world projects, simulations, and case studies.',
        'Practical assignments that mirror live business challenges.',
        'Portfolio-ready work to showcase to employers.',
      ],
    },
    {
      title: 'Placements',
      list: [
        'Dedicated placement cell with mock interviews and resume building.',
        '1,000+ hiring partners across industries.',
        '93% average placement rate with competitive salary packages.',
      ],
    },
    {
      title: 'Resource & Forums',
      list: [
        'Lifetime access to LMS, recorded sessions, and cheat sheets.',
        'Active peer and alumni forums for knowledge sharing.',
        'Expert-led communities for continuous learning and networking.',
      ],
    },
  ]

  return {
    id: 'hire-from-us',
    title: 'Hire From Us',
    slug: 'hire-from-us',
    description: 'Current live hire-from-us content synced from the legacy public website.',
    seo_title: 'Hire From Us',
    seo_description: 'See how Acadvizen prepares learners to deliver from day one.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: 'How We Ensure That The Talent Is Ready To Deliver',
        subheading:
          "At ACADVIZEN, we don't just train. We prepare our learners to step into your workplace and start delivering from day one.",
      }),
      makeSection('feature_cards', 1, {
        heading: 'Readiness Framework',
        cards: readinessBlocks.map((block) => ({ title: block.title, list: block.list })),
      }),
    ],
  }
}

function buildToolsTemplate(pageSectionMap, tools) {
  const heroSection = pageSectionMap.hero || {}
  const emptySection = pageSectionMap.empty || {}
  const metaSection = pageSectionMap.meta || {}
  const metaCta = parseJson(metaSection.cta_json, {})

  return {
    id: 'tools',
    title: 'Tools',
    slug: 'tools',
    description: 'Current live tools-page content synced from the legacy public website.',
    seo_title: 'Tools',
    seo_description: 'Browse AI and digital marketing tools covered in Acadvizen programs.',
    status: 'draft',
    sections: [
      makeSection('hero', 0, {
        heading: firstText(heroSection.title, 'Tools'),
        subheading: firstText(heroSection.subtitle, ''),
      }),
      makeSection('text_block', 1, {
        heading: 'Search And Filter Copy',
        text: [firstText(metaCta.search_placeholder, 'Search tools'), firstText(metaCta.tip, '')].filter(Boolean).join('\n\n'),
        subheading: firstText(emptySection.body, 'No tools matched your current search.'),
      }),
      makeSection('feature_cards', 2, {
        heading: 'Current Tool Cards',
        cards: (tools || []).map((tool) => ({
          title: tool?.name || '',
          text: tool?.description || '',
          imageSrc: tool?.logo_url || '',
          buttonLabel: 'Open',
          buttonHref: tool?.slug ? `/tools/${tool.slug}` : '',
          list: [tool?.category || ''].filter(Boolean),
        })),
      }),
      makeSection('cta_banner', 3, {
        heading: 'Recommended Resources',
        text: 'The live page also shows dynamic recommended blogs and courses based on the current tool catalogue.',
      }),
    ],
  }
}

function buildLandingTemplate(target, homeTemplate) {
  return {
    ...homeTemplate,
    id: target.id,
    title: target.title,
    slug: target.slug,
    description: `Current live landing-page content for ${target.title}, synced from the legacy public website.`,
    seo_title: target.title,
    seo_description: homeTemplate.seo_description,
    status: 'draft',
  }
}

export async function buildLivePageTemplates(supabase, requestedSlugs = []) {
  const slugs = requestedSlugs.length ? requestedSlugs : LIVE_SYNC_TARGETS.map((target) => target.slug)
  const needsHome = slugs.includes('home') || slugs.some((slug) => slug !== 'about' && slug !== 'contact' && slug !== 'courses' && slug !== 'placement' && slug !== 'hire-from-us' && slug !== 'tools')
  const [homeSectionMap, pageSectionMaps, coursesRes, placementsRes, toolsRes] = await Promise.all([
    needsHome ? fetchHomeSectionMap(supabase) : Promise.resolve({}),
    fetchPageSectionMaps(supabase, ['about', 'contact', 'courses', 'placement', 'tools']),
    slugs.includes('courses') ? supabase.from('courses').select('title,slug,short_description,image_url').order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
    slugs.includes('placement') ? supabase.from('placements').select('id,role,company_name,location,package,description,featured_image').order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
    slugs.includes('tools') ? supabase.from('tools_extended').select('name,slug,description,category,logo_url').order('name', { ascending: true }).limit(18) : Promise.resolve({ data: [] }),
  ])

  if (coursesRes?.error) {
    logSyncError('fetchCourses', coursesRes.error)
  }
  if (placementsRes?.error) {
    logSyncError('fetchPlacements', placementsRes.error)
  }
  if (toolsRes?.error) {
    logSyncError('fetchTools', toolsRes.error)
  }

  const homeTemplate = buildHomeTemplate(homeSectionMap)
  const templateMap = {
    home: homeTemplate,
    about: buildAboutTemplate(pageSectionMaps.about || {}),
    contact: buildContactTemplate(pageSectionMaps.contact || {}),
    courses: buildCoursesTemplate(pageSectionMaps.courses || {}, coursesRes.data || []),
    placement: buildPlacementTemplate(pageSectionMaps.placement || {}, placementsRes.data || []),
    'hire-from-us': buildHireFromUsTemplate(),
    tools: buildToolsTemplate(pageSectionMaps.tools || {}, toolsRes.data || []),
  }

  for (const target of LIVE_SYNC_TARGETS) {
    if (!templateMap[target.slug]) {
      templateMap[target.slug] = buildLandingTemplate(target, homeTemplate)
    }
  }

  return slugs.map((slug) => templateMap[slug]).filter(Boolean)
}
