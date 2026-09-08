import { Award, BookOpen, Clock, FlaskConical, Layers, Sparkles } from 'lucide-react'
import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import { getCanonicalPath } from '../../lib/cmsPublishing'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildCourseSchema, buildFaqSchema } from '../../lib/structuredData'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import StatRow from './immersive/StatRow'
import TagCloud from './immersive/TagCloud'
import ToolLogoGrid from './immersive/ToolLogoGrid'
import CredentialGrid from './immersive/CredentialGrid'
import CurriculumTimeline from './immersive/CurriculumTimeline'
import ProjectGrid from './immersive/ProjectGrid'
import CourseGallery from './immersive/CourseGallery'
import CourseShowcase from './immersive/CourseShowcase'
import PlacementShowcase from './immersive/PlacementShowcase'
import TestimonialGrid from './immersive/TestimonialGrid'
import NearbyPlaces from './immersive/NearbyPlaces'
import ResourceGrid from './immersive/ResourceGrid'
import FaqAccordion from './immersive/FaqAccordion'
import FinalCta from './immersive/FinalCta'
import LogoWall from './immersive/LogoWall'
import TrainerGrid from './immersive/TrainerGrid'
import LeadCaptureCard from './immersive/LeadCaptureCard'

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

  const [relatedCourses, placements, testimonials, blogs, tools, locations, recruiters, instructors, certifications, projects, gallery] = await Promise.all([
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
    safeQuery(supabase.from('testimonials').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(4)),
    safeQuery(supabase.from('blogs').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(4)),
    safeQuery(supabase.from('tools_extended').select('name, slug, logo_url, category').eq('is_active', true).order('created_at', { ascending: false }).limit(8)),
    safeQuery(supabase.from('locations').select('name, slug').eq('is_active', true).order('order_index', { ascending: true }).limit(6)),
    safeQuery(supabase.from('recruiters').select('name, logo_url, website_url').eq('is_active', true).order('order_index', { ascending: true }).limit(10)),
    safeQuery(supabase.from('instructors').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(6)),
    safeQuery(supabase.from('certifications').select('name, logo_url, issuer, description').eq('is_active', true).order('order_index', { ascending: true }).limit(8)),
    safeQuery(supabase.from('course_projects').select('*').eq('course_id', course.id).eq('is_active', true).order('order_index', { ascending: true }).limit(9)),
    safeQuery(supabase.from('course_gallery').select('*').eq('course_id', course.id).eq('is_active', true).order('order_index', { ascending: true }).limit(5)),
  ])
  const recruiterLogos = recruiters.map((r) => ({ name: r.name, logo: r.logo_url }))
  const toolsWithLogos = tools.filter((t) => t.logo_url)
  const toolsWithoutLogos = tools.filter((t) => !t.logo_url)

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
    formatDuration(course) ? { value: formatDuration(course), label: 'Duration', icon: Clock } : null,
    course.learning_hours ? { value: `${course.learning_hours}h`, label: 'Learning hours', icon: BookOpen } : null,
    course.projects_count ? { value: `${course.projects_count}+`, label: 'Live projects', icon: Layers } : null,
    course.case_studies_count ? { value: `${course.case_studies_count}+`, label: 'Case studies', icon: FlaskConical } : null,
    course.ai_tools_count ? { value: `${course.ai_tools_count}+`, label: 'AI tools covered', icon: Sparkles } : null,
    course.certification_count ? { value: `${course.certification_count}`, label: 'Certifications', icon: Award } : null,
  ].filter(Boolean)

  const heroFacts = facts.slice(0, 4)

  const badges = [
    course.learning_mode,
    course.internship ? 'Internship included' : null,
    course.placement_support ? 'Placement support' : null,
    course.badge,
  ].filter(Boolean)

  const skills = Array.isArray(course.skills) ? course.skills.filter((s) => typeof s === 'string') : []
  const curriculum = Array.isArray(course.curriculum) ? course.curriculum : []
  const nearbyPlaces = locations.map((loc) => ({ name: loc.name, href: getCanonicalPath('location', loc.slug) }))

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
  const hasResources = resourceGroups.some((group) => group.items.length)

  const primaryCta = { label: course.primary_cta_label || 'Talk to Admissions', href: course.primary_cta_url || '/contact' }

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
        primaryCta={primaryCta}
        secondaryCta={course.brochure_url ? { label: course.secondary_cta_label || 'Download Brochure', href: course.brochure_url } : { label: 'Browse all courses', href: '/courses' }}
        badges={badges}
        stats={heroFacts}
        heroImage={course.image_url || course.thumbnail_url || null}
      />

      {recruiterLogos.length ? (
        <SectionFrame bg="plain" eyebrow="Trusted by" title="Where our learners get hired">
          <LogoWall companies={recruiterLogos} />
        </SectionFrame>
      ) : null}

      {facts.length ? (
        <SectionFrame bg="grid" eyebrow="At a glance" title="Course highlights" description="Everything that goes into making this program job-ready.">
          <StatRow stats={facts} surface="ink" />
        </SectionFrame>
      ) : null}

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

      {curriculum.length ? (
        <SectionFrame id="curriculum" bg="plain" eyebrow="Curriculum" title="How the program is structured" description="A module-by-module breakdown of what you'll cover.">
          <CurriculumTimeline items={curriculum} />
        </SectionFrame>
      ) : null}

      {(toolsWithLogos.length || toolsWithoutLogos.length) ? (
        <SectionFrame id="tools" bg="grid" eyebrow="Ecosystem" title="Tools you'll use">
          {toolsWithLogos.length ? <ToolLogoGrid tools={toolsWithLogos} /> : null}
          {toolsWithLogos.length && toolsWithoutLogos.length ? <div className="mt-6" /> : null}
          {toolsWithoutLogos.length ? <TagCloud items={toolsWithoutLogos.map((t) => t.name)} /> : null}
        </SectionFrame>
      ) : null}

      {projects.length ? (
        <SectionFrame id="projects" bg="mesh" blobColor="rgba(94,234,212,0.22)" eyebrow="Practical Experience" title="Projects you'll build" description="Real, hands-on work you can show in interviews and portfolios.">
          <ProjectGrid projects={projects} />
        </SectionFrame>
      ) : null}

      {certifications.length ? (
        <SectionFrame bg="plain" eyebrow="Recognition" title="Certifications you'll earn">
          <CredentialGrid certifications={certifications} />
        </SectionFrame>
      ) : null}

      {instructors.length ? (
        <SectionFrame id="trainers" bg="grid" eyebrow="Mentors" title="Learn from industry practitioners">
          <TrainerGrid trainers={instructors} />
        </SectionFrame>
      ) : null}

      {gallery.length ? (
        <SectionFrame id="gallery" bg="plain" eyebrow="Inside Acadvizen" title="The learning experience">
          <CourseGallery items={gallery} />
        </SectionFrame>
      ) : null}

      {placements.length ? (
        <SectionFrame id="placements" bg="mesh" blobColor="rgba(94,234,212,0.3)" blobPosition="bottom-left" eyebrow="Outcomes" title="Placement Opportunities">
          <PlacementShowcase placements={placements} />
        </SectionFrame>
      ) : null}

      {testimonials.length ? (
        <SectionFrame id="testimonials" bg="plain" eyebrow="Voices" title="What learners say" align="center">
          <TestimonialGrid testimonials={testimonials} />
        </SectionFrame>
      ) : null}

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

      <SectionFrame id="faq" bg="plain" eyebrow="Answers" title="Frequently asked questions" align="center">
        <FaqAccordion items={faqs} />
      </SectionFrame>

      {hasResources ? (
        <SectionFrame bg="grid" eyebrow="Explore more" title="Related resources">
          <ResourceGrid groups={resourceGroups} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="plain" eyebrow="Get started" title="Request a callback" align="center">
        <LeadCaptureCard pageSlug={`courses/${course.slug}`} formType="course_enquiry" />
      </SectionFrame>

      <FinalCta
        title={`Start ${course.title}`}
        subtitle="Get a personalised roadmap and cohort schedule from our admissions team."
        primaryCta={primaryCta}
        secondaryCta={{ label: 'Browse all courses', href: '/courses' }}
      />
    </div>
  )
}
