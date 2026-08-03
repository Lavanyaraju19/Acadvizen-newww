import PageHero from './templates/PageHero'
import PageSection, { InfoCard } from './templates/PageSection'
import PageCTA from './templates/PageCTA'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData'

function asList(value) {
  if (Array.isArray(value)) return value
  return []
}

// Renderer for `service_pages` records (Admin > Service Pages) - "service + city" landing
// pages such as "Google Ads Course in Bangalore". Uses the same shared template primitives as
// every other CMS content type so a newly published service page matches the rest of the site.
export default function ServicePageRenderer({ servicePage }) {
  if (!servicePage) return null

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: servicePage.title },
  ]
  const curriculum = asList(servicePage.curriculum)
  const benefits = asList(servicePage.benefits)
  const faqs = asList(servicePage.faqs)

  return (
    <div className="min-h-screen">
      <JsonLd id="service-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      {faqs.length ? <JsonLd id="service-faqs" data={buildFaqSchema(faqs)} /> : null}

      <PageHero
        eyebrow="Course"
        title={servicePage.hero_title || servicePage.title}
        subtitle={servicePage.hero_subtitle}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
      />

      {servicePage.overview ? (
        <PageSection title="Overview" muted>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300 sm:text-base">{servicePage.overview}</p>
        </PageSection>
      ) : null}

      {benefits.length ? (
        <PageSection title="Why Choose This Program">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <InfoCard
                key={index}
                title={typeof benefit === 'string' ? undefined : benefit.title}
                description={typeof benefit === 'string' ? benefit : benefit.description}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      {curriculum.length ? (
        <PageSection title="Curriculum" muted>
          <ul className="grid gap-2 sm:grid-cols-2">
            {curriculum.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                {typeof item === 'string' ? item : item.title}
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {faqs.length ? (
        <PageSection title="Frequently Asked Questions">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-base font-semibold text-slate-100">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </PageSection>
      ) : null}

      <PageCTA title={servicePage.title} subtitle="Get a personalised course roadmap from our admissions team." />
    </div>
  )
}
