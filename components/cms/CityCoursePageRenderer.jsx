import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema } from '../../lib/structuredData'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import CourseShowcase from './immersive/CourseShowcase'
import PlacementShowcase from './immersive/PlacementShowcase'
import TestimonialGrid from './immersive/TestimonialGrid'
import ResourceGrid from './immersive/ResourceGrid'
import HighlightList from './immersive/HighlightList'
import FinalCta from './immersive/FinalCta'

function formatCity(slug) {
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

// Acadvizen Immersive Experience - premium presentation layer for the legacy Course+City
// landing template (/digital-marketing-course-{slug}, backed by the `cities` table with no
// admin editor). Data-fetching contract is unchanged from the prior "stacked CMS block"
// version - same tables, same "always render, real content when available" behavior.
export default async function CityCoursePageRenderer({ cityRecord, citySlug }) {
  const cityName = formatCity(citySlug)
  const supabase = getServerSupabaseClient()

  const courses = await safeQuery(
    supabase.from('courses').select('title, slug, short_description').eq('is_active', true).order('order_index', { ascending: true }).limit(3),
    []
  )
  const placements = await safeQuery(
    supabase.from('placements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
    []
  )
  const testimonials = await safeQuery(
    supabase.from('testimonials').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(3),
    []
  )
  const blogs = await safeQuery(
    supabase.from('blogs').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(5),
    []
  )
  const tools = await safeQuery(
    supabase.from('tools_extended').select('name, slug').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
    []
  )

  const internalLinks = buildInternalLinks(
    { title: `Digital Marketing Course in ${cityName}` },
    {
      blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
      courses: courses.map((item) => ({ title: item.title, slug: item.slug, type: 'course' })),
      tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
    },
    4
  )

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: cityName },
  ]

  const resourceGroups = [
    { label: 'Related Blogs', items: internalLinks.blogs.map((b) => ({ title: b.title, href: `/blog/${b.slug}` })) },
    { label: 'Recommended Courses', items: internalLinks.courses.map((c) => ({ title: c.title, href: `/courses/${c.slug}` })) },
    { label: 'Helpful Tools', items: internalLinks.tools.map((t) => ({ title: t.title, href: `/tools/${t.slug}` })) },
  ]

  return (
    <div className="immersive-scope min-h-screen bg-[#050a13]">
      <JsonLd id="city-course-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />

      <ImmersiveHero
        eyebrow={cityName}
        locationLabel
        title={`Digital Marketing Course in ${cityName}`}
        description={
          cityRecord?.description ||
          `Build career-ready digital marketing skills in ${cityName} with expert-led sessions, live projects, and placement support.`
        }
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        badges={['Expert-led Sessions', 'Live Projects', 'Placement Support']}
        stats={[
          { value: `${courses.length || 3}+`, label: 'Career tracks' },
          { value: `${placements.length || 0}+`, label: 'Hiring partners featured' },
          { value: '8-16 wks', label: 'Typical duration' },
          { value: cityName, label: 'Cohort city' },
        ]}
      />

      {cityRecord?.highlights?.length ? (
        <SectionFrame bg="plain" eyebrow="Why this city" title={`Why learn digital marketing in ${cityName}`}>
          <HighlightList items={cityRecord.highlights} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="grid" eyebrow="Programs" title="Featured Courses" description="Pick a track and see the exact curriculum, projects, and mentor structure.">
        <CourseShowcase courses={courses} />
      </SectionFrame>

      <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.35)" blobPosition="bottom-left" eyebrow="Outcomes" title="Placement Highlights" description="A snapshot of hiring partners our learners have joined.">
        <PlacementShowcase placements={placements} />
      </SectionFrame>

      <SectionFrame bg="plain" eyebrow="Voices" title="Student Testimonials" align="center">
        <TestimonialGrid testimonials={testimonials} />
      </SectionFrame>

      <SectionFrame bg="mesh" blobColor="rgba(94,234,212,0.3)" eyebrow="Explore more" title="Explore More Resources">
        <ResourceGrid groups={resourceGroups} />
      </SectionFrame>

      <FinalCta
        title={`Start your digital marketing career in ${cityName}`}
        subtitle="Get a personalised course roadmap from our admissions team."
        primaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        secondaryCta={{ label: 'Browse all courses', href: '/courses' }}
      />
    </div>
  )
}
