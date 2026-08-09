import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData'
import { renderDynamicSections } from '../sections/DynamicSectionRenderer'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import StatRow from './immersive/StatRow'
import CourseShowcase from './immersive/CourseShowcase'
import PlacementShowcase from './immersive/PlacementShowcase'
import TestimonialGrid from './immersive/TestimonialGrid'
import FaqAccordion from './immersive/FaqAccordion'
import NearbyPlaces from './immersive/NearbyPlaces'
import ResourceGrid from './immersive/ResourceGrid'
import HighlightList from './immersive/HighlightList'
import FinalCta from './immersive/FinalCta'

function formatLocation(slug) {
  return String(slug || '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function safeQuery(query, fallback = []) {
  try {
    const { data, error } = await query
    if (error) return fallback
    return data || fallback
  } catch {
    return fallback
  }
}

// Admin-added designed blocks (Admin > Locations > Designed Sections) - mirrors the City page
// extra-sections feature via the same generic OwnerSectionsEditor/location_sections table, with
// a `position` insertion-zone anchor so blocks can render between this page's fixed sections
// instead of only at the very end. Rows without a recognized zone default to 'end'.
async function loadExtraSections(locationId) {
  const supabase = getServerSupabaseClient()
  if (!supabase || !locationId) return []
  const { data } = await supabase
    .from('location_sections')
    .select('*')
    .eq('location_id', locationId)
    .eq('visibility', true)
    .order('order_index', { ascending: true })
    .limit(200)
  return data || []
}

function sectionsForZone(extraSections, zone) {
  return extraSections.filter((section) => (section.position || 'end') === zone)
}

const DEFAULT_CURRICULUM = [
  'Digital marketing fundamentals',
  'SEO strategy and analytics',
  'Paid ads and performance marketing',
  'Social media and content systems',
  'Automation and CRM workflows',
]

// Acadvizen Immersive Experience - premium presentation layer for the Course+Area landing
// template (/digital-marketing-courses-{slug}). Data-fetching contract is unchanged from the
// prior "stacked CMS block" version: same tables, same "always render, real content when
// available, honest fallback copy otherwise" behavior. Only the visual composition changed.
export default async function LocationPageRenderer({ locationRecord, locationSlug }) {
  const locationName = formatLocation(locationSlug)
  const supabase = getServerSupabaseClient()
  const extraSections = await loadExtraSections(locationRecord?.id)

  const courses = await safeQuery(
    supabase.from('courses').select('title, slug, short_description').eq('is_active', true).order('order_index', { ascending: true }).limit(4),
    []
  )
  const placements = await safeQuery(
    supabase.from('placements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(4),
    []
  )
  const testimonials = await safeQuery(
    supabase.from('testimonials').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(3),
    []
  )
  const blogs = await safeQuery(
    supabase.from('blogs').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(6),
    []
  )
  const tools = await safeQuery(
    supabase.from('tools_extended').select('name, slug').eq('is_active', true).order('created_at', { ascending: false }).limit(6),
    []
  )
  let siblingQuery = supabase
    .from('locations')
    .select('name, slug, city_id')
    .eq('is_active', true)
    .neq('slug', locationSlug || '')
    .order('order_index', { ascending: true })
    .limit(6)
  if (locationRecord?.city_id) siblingQuery = siblingQuery.eq('city_id', locationRecord.city_id)
  const siblingLocations = await safeQuery(siblingQuery, [])

  const internalLinks = buildInternalLinks(
    { title: `Digital Marketing Courses in ${locationName}` },
    {
      blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
      courses: courses.map((item) => ({ title: item.title, slug: item.slug, type: 'course' })),
      tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
    },
    4
  )

  const heroTitle = locationRecord?.meta_title || `Digital Marketing Courses in ${locationName}`
  const heroDescription =
    locationRecord?.intro_text ||
    `Get industry-ready digital marketing training in ${locationName} with hands-on projects and placement guidance.`

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: locationName },
  ]

  const faqs = [
    { question: 'How long is the course?', answer: 'Typical schedules range between 8–16 weeks, with flexible weekday and weekend batches.' },
    { question: 'Is placement assistance included?', answer: 'Yes, career support, mock interviews and portfolio reviews are included at no extra cost.' },
    { question: `Can I attend from ${locationName}?`, answer: 'Yes, the program supports both in-person and hybrid cohorts for learners across the city.' },
  ]

  const resourceGroups = [
    { label: 'Related Blogs', items: internalLinks.blogs.map((b) => ({ title: b.title, href: `/blog/${b.slug}` })) },
    { label: 'Related Courses', items: internalLinks.courses.map((c) => ({ title: c.title, href: `/courses/${c.slug}` })) },
    { label: 'Helpful Tools', items: internalLinks.tools.map((t) => ({ title: t.title, href: `/tools/${t.slug}` })) },
  ]

  const nearbyPlaces = siblingLocations.map((loc) => ({ name: loc.name, href: `/digital-marketing-courses-${loc.slug}` }))

  return (
    <div className="immersive-scope min-h-screen bg-[#050a13]">
      <JsonLd id="location-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd id="location-faqs" data={buildFaqSchema(faqs)} />

      <ImmersiveHero
        eyebrow={locationName}
        locationLabel
        title={heroTitle}
        description={heroDescription}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        badges={['Live Projects', 'Placement Support', 'Mentor-led Cohorts']}
        stats={[
          { value: `${courses.length || 4}+`, label: 'Career tracks' },
          { value: `${placements.length || 0}+`, label: 'Hiring partners featured' },
          { value: '8-16 wks', label: 'Typical duration' },
          { value: locationName, label: 'Cohort location' },
        ]}
      />

      {sectionsForZone(extraSections, 'top').length ? renderDynamicSections(sectionsForZone(extraSections, 'top')) : null}

      <SectionFrame
        bg="plain"
        eyebrow="Course Overview"
        title="A curriculum built for real growth teams"
        description="Learn performance marketing, SEO, analytics, and automation through a blended curriculum designed for real-world outcomes, not just theory."
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-sm leading-relaxed text-slate-400 sm:text-base">
            <p>
              {locationRecord?.why_text ||
                `${locationName} is rapidly adopting digital-first growth strategies. This program aligns you with
                the skills local employers prioritize for marketing, analytics, and growth roles.`}
            </p>
            <p>
              {locationRecord?.demand_text ||
                `Companies in ${locationName} are hiring marketers who can manage paid campaigns, SEO systems, and
                full-funnel conversion strategies.`}
            </p>
          </div>
          <HighlightList items={DEFAULT_CURRICULUM} />
        </div>
      </SectionFrame>

      {sectionsForZone(extraSections, 'after_intro').length ? renderDynamicSections(sectionsForZone(extraSections, 'after_intro')) : null}

      <SectionFrame bg="grid" eyebrow="Programs" title="Featured Courses" description="Pick a track and see the exact curriculum, projects, and mentor structure.">
        <CourseShowcase courses={courses} />
      </SectionFrame>

      <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.35)" blobPosition="bottom-left" eyebrow="Outcomes" title="Placement Opportunities" description="A snapshot of hiring partners our learners have joined.">
        <PlacementShowcase placements={placements} />
      </SectionFrame>

      <SectionFrame bg="plain" eyebrow="Voices" title="What learners say" align="center">
        <TestimonialGrid testimonials={testimonials} />
      </SectionFrame>

      {nearbyPlaces.length > 0 ? (
        <SectionFrame bg="grid" eyebrow="Explore" title={`Nearby areas in ${locationRecord?.city_id ? 'the city' : 'Bangalore'}`} description="Every neighbourhood has its own cohort schedule and local hiring partners.">
          <NearbyPlaces places={nearbyPlaces} />
        </SectionFrame>
      ) : null}

      {sectionsForZone(extraSections, 'before_faq').length ? renderDynamicSections(sectionsForZone(extraSections, 'before_faq')) : null}

      <SectionFrame bg="plain" eyebrow="Answers" title="Frequently asked questions" align="center">
        <FaqAccordion items={faqs} />
      </SectionFrame>

      <SectionFrame bg="mesh" blobColor="rgba(94,234,212,0.3)" eyebrow="Explore more" title="Related resources">
        <ResourceGrid groups={resourceGroups} />
      </SectionFrame>

      {sectionsForZone(extraSections, 'end').length ? renderDynamicSections(sectionsForZone(extraSections, 'end')) : null}

      <FinalCta
        title={`Start your digital marketing career in ${locationName}`}
        subtitle="Get a personalised course roadmap from our admissions team."
        primaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        secondaryCta={{ label: 'Browse all courses', href: '/courses' }}
      />
    </div>
  )
}
