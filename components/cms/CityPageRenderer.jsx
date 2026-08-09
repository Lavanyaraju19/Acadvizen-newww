import { Mail, MapPin, Phone } from 'lucide-react'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData'
import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { renderDynamicSections } from '../sections/DynamicSectionRenderer'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import StatRow from './immersive/StatRow'
import FeatureGrid from './immersive/FeatureGrid'
import TestimonialGrid from './immersive/TestimonialGrid'
import FaqAccordion from './immersive/FaqAccordion'
import Reveal from './immersive/Reveal'
import FinalCta from './immersive/FinalCta'

// Admin-added extra blocks (Admin > Cities > Extra Sections) - a city page keeps its fixed,
// design-guaranteed sections above, and these render after them via the exact same
// DynamicSectionRenderer/section-type registry the generic Page Builder uses, so any type or
// immersive variant supported there works here too without a second rendering system.
async function loadExtraSections(cityPageId) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !cityPageId) return []

  const { data } = await supabase
    .from('city_page_sections')
    .select('*')
    .eq('city_page_id', cityPageId)
    .eq('visibility', true)
    .order('order_index', { ascending: true })
    .limit(200)

  return data || []
}

// Admin blocks carry a `position` insertion-zone anchor (Admin > Cities > Designed Sections) so
// they can render between the fixed sections below, not only appended at the very end. Rows
// created before this anchor existed default to 'end' at the database level, so their render
// position is unchanged.
function sectionsForZone(extraSections, zone) {
  return extraSections.filter((section) => (section.position || 'end') === zone)
}

// Acadvizen Immersive Experience - premium presentation layer for admin-managed city_pages
// records (Admin > Cities module). Data-fetching contract is unchanged - this component still
// receives the full raw row and renders nothing that isn't backed by real admin content.
export default async function CityPageRenderer({ cityPage }) {
  if (!cityPage) return null

  const extraSections = await loadExtraSections(cityPage.id)

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: cityPage.city_name || cityPage.hero_title || 'City' },
  ]

  return (
    <div className="immersive-scope min-h-screen bg-[#050a13]">
      <JsonLd id="city-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      {cityPage.faqs?.length ? <JsonLd id="city-faqs" data={buildFaqSchema(cityPage.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))} /> : null}

      <ImmersiveHero
        eyebrow={cityPage.city_name || 'Digital Marketing Course'}
        locationLabel
        title={cityPage.hero_title || `Digital Marketing Course in ${cityPage.city_name}`}
        description={cityPage.hero_subtitle || cityPage.hero_description}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        stats={(cityPage.stats || []).slice(0, 4)}
      />

      {sectionsForZone(extraSections, 'top').length ? renderDynamicSections(sectionsForZone(extraSections, 'top')) : null}

      {cityPage.about_title ? (
        <SectionFrame bg="plain" eyebrow="About" title={cityPage.about_title}>
          <div className={`grid gap-10 ${cityPage.about_image_url ? 'lg:grid-cols-[1.1fr_0.9fr] lg:items-center' : ''}`}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400 sm:text-base">{cityPage.about_description}</p>
            {cityPage.about_image_url ? (
              <Reveal as="scale">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-supplied image URL */}
                <img
                  src={cityPage.about_image_url}
                  alt={cityPage.about_title}
                  loading="lazy"
                  className="w-full rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
                />
              </Reveal>
            ) : null}
          </div>
        </SectionFrame>
      ) : null}

      {sectionsForZone(extraSections, 'after_intro').length ? renderDynamicSections(sectionsForZone(extraSections, 'after_intro')) : null}

      {cityPage.features?.length > 0 ? (
        <SectionFrame bg="grid" eyebrow="Why Acadvizen" title="Course Features">
          <FeatureGrid features={cityPage.features} />
        </SectionFrame>
      ) : null}

      {cityPage.stats?.length > 0 ? (
        <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.3)" eyebrow="At a glance" title={`${cityPage.city_name || 'This city'} in numbers`}>
          <StatRow stats={cityPage.stats} />
        </SectionFrame>
      ) : null}

      {cityPage.testimonials?.length > 0 ? (
        <SectionFrame bg="plain" eyebrow="Voices" title="Student Testimonials" align="center">
          <TestimonialGrid testimonials={cityPage.testimonials} />
        </SectionFrame>
      ) : null}

      {sectionsForZone(extraSections, 'before_faq').length ? renderDynamicSections(sectionsForZone(extraSections, 'before_faq')) : null}

      {cityPage.faqs?.length > 0 ? (
        <SectionFrame bg="grid" eyebrow="Answers" title="Frequently Asked Questions" align="center">
          <FaqAccordion items={cityPage.faqs} />
        </SectionFrame>
      ) : null}

      {(cityPage.contact_phone || cityPage.contact_email || cityPage.contact_address) ? (
        <SectionFrame bg="mesh" blobColor="rgba(94,234,212,0.3)" eyebrow="Reach us" title="Contact Us">
          <div className="grid gap-4 sm:grid-cols-3">
            {cityPage.contact_phone ? (
              <div className="immersive-glass flex items-center gap-3 rounded-2xl p-5">
                <Phone className="h-4 w-4 shrink-0 text-teal-300" />
                <span className="text-sm text-slate-300">{cityPage.contact_phone}</span>
              </div>
            ) : null}
            {cityPage.contact_email ? (
              <div className="immersive-glass flex items-center gap-3 rounded-2xl p-5">
                <Mail className="h-4 w-4 shrink-0 text-teal-300" />
                <span className="text-sm text-slate-300">{cityPage.contact_email}</span>
              </div>
            ) : null}
            {cityPage.contact_address ? (
              <div className="immersive-glass flex items-center gap-3 rounded-2xl p-5">
                <MapPin className="h-4 w-4 shrink-0 text-teal-300" />
                <span className="text-sm text-slate-300">{cityPage.contact_address}</span>
              </div>
            ) : null}
          </div>
        </SectionFrame>
      ) : null}

      {sectionsForZone(extraSections, 'end').length ? renderDynamicSections(sectionsForZone(extraSections, 'end')) : null}

      <FinalCta
        title={`Start your digital marketing career in ${cityPage.city_name || 'your city'}`}
        subtitle="Get a personalised course roadmap from our admissions team."
        primaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        secondaryCta={{ label: 'Browse all courses', href: '/courses' }}
      />
    </div>
  )
}
