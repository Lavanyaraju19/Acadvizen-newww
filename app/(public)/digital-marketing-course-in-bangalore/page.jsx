import Link from 'next/link'
import { buildMetadata } from '../../lib/seo'

export const dynamic = 'force-static'

export const metadata = buildMetadata({
  title: 'Best Digital Marketing Course in Bangalore',
  description:
    'Upgrade your career with practical, AI-powered digital marketing training in Bangalore with projects and placement support.',
  path: '/digital-marketing-course-in-bangalore',
})

export default function Page() {
  const faqItems = [
    {
      q: 'Who is this digital marketing course for?',
      a: 'This course is designed for students, working professionals, entrepreneurs, and career switchers who want practical digital marketing skills.',
    },
    {
      q: 'Do you provide placement support in Bangalore?',
      a: 'Yes. ACADVIZEN provides resume building, mock interviews, portfolio support, and recruiter connections.',
    },
    {
      q: 'Is there internship support included?',
      a: 'Yes. Internship support is provided as part of structured learning tracks with project-based execution.',
    },
    {
      q: 'Can I attend classes online and offline?',
      a: 'Yes. Learning modes include both classroom and online options based on your preference.',
    },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Acadvizen Digital Marketing Institute',
    url: 'https://www.acadvizen.com/digital-marketing-course-in-bangalore',
    telephone: '+91-7411314848',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No 647-35/29 5th Block, Jayanagar',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      postalCode: '560078',
      addressCountry: 'IN',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.acadvizen.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Digital Marketing Course in Bangalore',
        item: 'https://www.acadvizen.com/digital-marketing-course-in-bangalore',
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <section className="pt-12 md:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">
            Best Digital Marketing Course in Bangalore
          </h1>
          <p className="mt-4 text-slate-300 max-w-4xl">
            ACADVIZEN offers practical digital marketing training in Bangalore with live projects, AI-powered tools,
            campaign simulations, internship support, and career-focused mentoring.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
          {[
            '45-95 day programs with specialization tracks',
            'Live project execution with mentor feedback loops',
            'Placement support with recruiter connection workflows',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Course Highlights</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'AI-enabled digital marketing workflows',
              'SEO, Social Media, and Google Ads practical modules',
              'Case-study-led execution approach',
              'Personalized roadmap based on career goals',
              'Portfolio and resume workshop sessions',
              'Interview prep and recruiter-aligned readiness',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Why Bangalore Learners Choose ACADVIZEN</h2>
          <p className="mt-4 text-slate-300 max-w-4xl">
            We combine industry-focused curriculum, local mentorship, flexible learning modes, and practical campaign
            execution. Our training model is outcome-driven and aligned to real hiring standards in Bangalore.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/contact" className="text-teal-300 hover:text-teal-200">
              Contact admissions
            </Link>
            <Link href="/courses" className="text-teal-300 hover:text-teal-200">
              Explore course programs
            </Link>
            <Link href="/blog" className="text-teal-300 hover:text-teal-200">
              Read latest blogs
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-3 max-w-4xl">
            {faqItems.map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100">{item.q}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  )
}
