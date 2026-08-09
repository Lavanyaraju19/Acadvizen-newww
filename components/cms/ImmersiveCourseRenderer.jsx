import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildCourseSchema, buildFaqSchema } from '../../lib/structuredData'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import StatRow from './immersive/StatRow'
import HighlightList from './immersive/HighlightList'
import TagCloud from './immersive/TagCloud'
import CurriculumTimeline from './immersive/CurriculumTimeline'
import CourseShowcase from './immersive/CourseShowcase'
import PlacementShowcase from './immersive/PlacementShowcase'
import TestimonialGrid from './immersive/TestimonialGrid'
import NearbyPlaces from './immersive/NearbyPlaces'
import ResourceGrid from './immersive/ResourceGrid'
import FaqAccordion from './immersive/FaqAccordion'
import FinalCta from './immersive/FinalCta'

async function safeQuery(query, fallback = []) {
  try {
    const { data, error } = await query
    if (error) return fallback
    return data || fallback
  } catch {
    return fallback
  }
}

function formatDuration(course) {
  if (!course?.duration_value) return null
  const unit = course.duration_unit || 'weeks'
  return `${course.duration_value} ${unit}`
}

// Acadvizen Immersive Experience - premium presentation layer for a real `courses` table row.
// Wired into app/(public)/courses/[slug]/page.jsx as a new tier that activates for any course
// with a real DB row, ahead of the legacy react-router CourseDetailPage fallback. Never renders
// fabricated projects, case studies, or trainer content - those sections are simply omitted
// when the site has no real data source for them yet (see ACADVIZEN BUILD-READINESS REPORT).
export default async function ImmersiveCourseRenderer({ course }) {
  if (!course) return null
  const supabase = getServerSupabaseClient()

  const [relatedCourses, placements, testimonials, blogs, tools, locations] = await Promise.all([
    safeQuery(
      supabase
        .from('courses')
        .select('title, slug, short_description')
        .eq('is_active', true)
        .neq('slug', course.slug)
        .order('order_index', { ascending: true })
        .limit(3)
    ),
    safeQuery(supabase.from('placements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(4)),
    safeQuery(supabase.from('testimonials').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(3)),
    safeQuery(supabase.from('blogs').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(4)),
    safeQuery(supabase.from('tools_extended').select('name, slug').eq('is_active', true).order('created_at', { ascending: false }).limit(6)),
    safeQuery(supabase.from('locations').select('name, slug').eq('is_active', true).order('order_index', { ascending: true }).limit(6)),
  ])

  const internalLinks = buildInternalLinks(
    { title: course.title },
    {
      blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
      courses: relatedCourses.map((item) => ({ title: item.title, slug: item.slug, type: 'course' })),
      tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
    },
    4
  )

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: course.title },
  ]

  const facts = [
    formatDuration(course) ? { value: formatDuration(course), label: 'Duration' } : null,
    course.learning_hours ? { value: `${course.learning_hours}h`, label: 'Learning hours' } : null,
    course.projects_count ? { value: `${course.projects_count}+`, label: 'Live projects' } : null,
    course.certification_count ? { value: `${course.certification_count}`, label: 'Certifications' } : null,
  ].filter(Boolean)

  const badges = [
    course.learning_mode,
    course.internship ? 'Internship included' : null,
    course.placement_support ? 'Placement support' : null,
    course.badge,
  ].filter(Boolean)

  const skills = Array.isArray(course.skills) ? course.skills.filter((s) => typeof s === 'string') : []
  const curriculum = Array.isArray(course.curriculum) ? course.curriculum : []
  const nearbyPlaces = locations.map((loc) => ({ name: loc.name, href: `/digital-marketing-courses-${loc.slug}` }))

  const faqs = [
    { question: 'How long does this course take?', answer: formatDuration(course) ? `Typically ${formatDuration(course)}, with flexible weekday and weekend batches.` : 'Schedules are flexible - talk to admissions for the next cohort start date.' },
    { question: 'Is placement assistance included?', answer: course.placement_support ? 'Yes, placement support is included with this program.' : 'Career support is available - contact admissions for details.' },
    { question: 'Do I need prior experience?', answer: 'No prior experience is required - the curriculum is designed to take you from fundamentals to job-ready skills.' },
  ]

  const resourceGroups = [
    { label: 'Related Blogs', items: internalLinks.blogs.map((b) => ({ title: b.title, href: `/blog/${b.slug}` })) },
    { label: 'Related Courses', items: internalLinks.courses.map((c) => ({ title: c.title, href: `/courses/${c.slug}` })) },
    { label: 'Helpful Tools', items: internalLinks.tools.map((t) => ({ title: t.title, href: `/tools/${t.slug}` })) },
  ]

  return (
    <div className="immersive-scope min-h-screen bg-[#050a13]">
      <JsonLd id="course-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        id="course-schema"
        data={buildCourseSchema({ name: course.title, description: course.short_description || course.description, path: `/courses/${course.slug}` })}
      />
      <JsonLd id="course-faqs" data={buildFaqSchema(faqs)} />

      <ImmersiveHero
        eyebrow={course.subtitle || 'Career Program'}
        title={course.title}
        description={course.short_description || course.description}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: course.primary_cta_label || 'Talk to Admissions', href: course.primary_cta_url || '/contact' }}
        secondaryCta={course.brochure_url ? { label: course.secondary_cta_label || 'Download Brochure', href: course.brochure_url } : { label: 'Browse all courses', href: '/courses' }}
        badges={badges}
        stats={facts}
      />

      {course.description ? (
        <SectionFrame bg="plain" eyebrow="Program Story" title="What you'll learn">
          <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-400 sm:text-base">{course.description}</p>
        </SectionFrame>
      ) : null}

      {skills.length ? (
        <SectionFrame bg="grid" eyebrow="Outcomes" title="Skills you'll master">
          <TagCloud items={skills} />
        </SectionFrame>
      ) : null}

      {facts.length ? (
        <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.3)" eyebrow="At a glance" title="Program facts">
          <StatRow stats={facts} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="plain" eyebrow="Curriculum" title="How the program is structured" description="A module-by-module breakdown of what you'll cover.">
        <CurriculumTimeline items={curriculum} />
      </SectionFrame>

      {tools.length ? (
        <SectionFrame bg="grid" eyebrow="Ecosystem" title="Tools you'll use">
          <TagCloud items={tools.map((t) => t.name)} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="mesh" blobColor="rgba(94,234,212,0.3)" blobPosition="bottom-left" eyebrow="Outcomes" title="Placement Opportunities">
        <PlacementShowcase placements={placements} />
      </SectionFrame>

      <SectionFrame bg="plain" eyebrow="Voices" title="What learners say" align="center">
        <TestimonialGrid testimonials={testimonials} />
      </SectionFrame>

      {nearbyPlaces.length ? (
        <SectionFrame bg="grid" eyebrow="Locations" title="Where you can study this">
          <NearbyPlaces places={nearbyPlaces} />
        </SectionFrame>
      ) : null}

      {relatedCourses.length ? (
        <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.25)" eyebrow="Explore more" title="Related Courses">
          <CourseShowcase courses={relatedCourses} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="plain" eyebrow="Answers" title="Frequently asked questions" align="center">
        <FaqAccordion items={faqs} />
      </SectionFrame>

      <SectionFrame bg="grid" eyebrow="Explore more" title="Related resources">
        <ResourceGrid groups={resourceGroups} />
      </SectionFrame>

      <FinalCta
        title={`Start ${course.title}`}
        subtitle="Get a personalised roadmap and cohort schedule from our admissions team."
        primaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        secondaryCta={{ label: 'Browse all courses', href: '/courses' }}
      />
    </div>
  )
}
