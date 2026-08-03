import PageHero from './templates/PageHero'
import PageSection, { InfoCard } from './templates/PageSection'
import PageCTA from './templates/PageCTA'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData'

// Shared renderer for city_pages records (Admin > Cities module), used both by the
// dedicated /digital-marketing-course-in-[city] route and the generic /[slug] catch-all -
// the latter is what actually serves any city slug that isn't one of the two hardcoded
// static exceptions (bangalore, jayanagar), since Next.js resolves that plain dynamic
// segment ahead of this more-specific-looking but still-dynamic sibling folder.
//
// Uses the same shared template primitives (PageHero/PageSection/PageCTA) as every other
// CMS content type so a City page is visually indistinguishable from a hand-built page -
// this previously rendered in a light theme (bg-white/text-slate-900) that didn't match the
// rest of the dark-themed site at all.
export default function CityPageRenderer({ cityPage }) {
  if (!cityPage) return null

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: cityPage.city_name || cityPage.hero_title || 'City' },
  ]

  return (
    <div className="min-h-screen">
      <JsonLd id="city-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      {cityPage.faqs?.length ? <JsonLd id="city-faqs" data={buildFaqSchema(cityPage.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))} /> : null}

      <PageHero
        eyebrow="Digital Marketing Course"
        title={cityPage.hero_title || `Digital Marketing Course in ${cityPage.city_name}`}
        subtitle={cityPage.hero_subtitle || cityPage.hero_description}
        imageUrl={cityPage.hero_image_url}
        imageAlt={cityPage.city_name}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
      />

      {cityPage.about_title && (
        <PageSection title={cityPage.about_title} muted>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300 sm:text-base">
            {cityPage.about_description}
          </p>
          {cityPage.about_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-supplied image URL */
            <img
              src={cityPage.about_image_url}
              alt={cityPage.about_title}
              loading="lazy"
              className="mt-8 w-full max-w-2xl rounded-2xl border border-white/10 shadow-lg"
            />
          )}
        </PageSection>
      )}

      {cityPage.features?.length > 0 && (
        <PageSection title="Course Features">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cityPage.features.map((feature, index) => (
              <InfoCard key={index} title={feature.title} description={feature.description} />
            ))}
          </div>
        </PageSection>
      )}

      {cityPage.stats?.length > 0 && (
        <PageSection muted>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {cityPage.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-teal-300">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {cityPage.testimonials?.length > 0 && (
        <PageSection title="Student Testimonials">
          <div className="grid gap-5 md:grid-cols-2">
            {cityPage.testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="italic text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-4 font-semibold text-slate-100">
                  {testimonial.name}
                  {testimonial.role && <span className="text-slate-400"> — {testimonial.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {cityPage.faqs?.length > 0 && (
        <PageSection title="Frequently Asked Questions" muted>
          <div className="space-y-4">
            {cityPage.faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-base font-semibold text-slate-100">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {(cityPage.contact_phone || cityPage.contact_email || cityPage.contact_address) && (
        <PageSection title="Contact Us">
          <div className="grid gap-6 sm:grid-cols-3">
            {cityPage.contact_phone && <InfoCard title="Phone" description={cityPage.contact_phone} />}
            {cityPage.contact_email && <InfoCard title="Email" description={cityPage.contact_email} />}
            {cityPage.contact_address && <InfoCard title="Address" description={cityPage.contact_address} />}
          </div>
        </PageSection>
      )}

      <PageCTA
        title={`Start your digital marketing career in ${cityPage.city_name || 'your city'}`}
        subtitle="Get a personalised course roadmap from our admissions team."
      />
    </div>
  )
}
