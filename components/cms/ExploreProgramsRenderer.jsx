import { getServerSupabaseClient } from '../../lib/supabaseServer'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema } from '../../lib/structuredData'
import ImmersiveHero from './immersive/ImmersiveHero'
import SectionFrame from './immersive/SectionFrame'
import CategoryNavigator from './immersive/CategoryNavigator'
import CourseShowcase from './immersive/CourseShowcase'
import NearbyPlaces from './immersive/NearbyPlaces'
import PlacementShowcase from './immersive/PlacementShowcase'
import LogoWall from './immersive/LogoWall'
import TagCloud from './immersive/TagCloud'
import TestimonialGrid from './immersive/TestimonialGrid'
import ResourceGrid from './immersive/ResourceGrid'
import FaqAccordion from './immersive/FaqAccordion'
import FinalCta from './immersive/FinalCta'
import CompareProgramsPanel from './immersive/CompareProgramsPanel'
import CourseFinderPanel from './immersive/CourseFinderPanel'

async function safeQuery(query, fallback = []) {
  try {
    const { data, error } = await query
    if (error) return fallback
    return data || fallback
  } catch {
    return fallback
  }
}

// Acadvizen Immersive Experience - /explore-programs. A premium program-discovery hub, kept
// entirely separate from /courses (the plain catalogue). Every section pulls from the same
// admin-managed tables that already power the rest of the CMS (courses, course_categories,
// cities, locations, companies, testimonials, blogs, tools_extended) - there is no bespoke
// "Explore Programs" content table; editing those existing admin screens updates this page.
export default async function ExploreProgramsRenderer() {
  const supabase = getServerSupabaseClient()

  const [categories, featuredCourses, allCourses, cities, locations, placements, companies, tools, testimonials, blogs, goals, cityPageSlugs] = await Promise.all([
    safeQuery(supabase.from('course_categories').select('name, slug, description').eq('is_active', true).order('order_index', { ascending: true })),
    safeQuery(supabase.from('courses').select('title, slug, short_description').eq('is_active', true).order('order_index', { ascending: true }).limit(8)),
    safeQuery(supabase.from('courses').select('title, slug, short_description, duration_value, duration_unit, learning_mode, learning_hours, projects_count, case_studies_count, ai_tools_count, certification_count, internship, placement_support').eq('is_active', true).order('order_index', { ascending: true }).limit(30)),
    safeQuery(supabase.from('cities').select('name, slug').eq('is_active', true).order('name', { ascending: true }).limit(8)),
    safeQuery(supabase.from('locations').select('name, slug').eq('is_active', true).order('order_index', { ascending: true }).limit(9)),
    safeQuery(supabase.from('placements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(4)),
    safeQuery(supabase.from('companies').select('name, slug, logo').eq('is_active', true).order('created_at', { ascending: false }).limit(10)),
    safeQuery(supabase.from('tools_extended').select('name, slug').eq('is_active', true).order('created_at', { ascending: false }).limit(10)),
    safeQuery(supabase.from('testimonials').select('*').eq('is_active', true).order('order_index', { ascending: true }).limit(3)),
    safeQuery(supabase.from('blogs').select('title, slug').eq('status', 'published').order('published_at', { ascending: false }).limit(4)),
    safeQuery(supabase.from('course_finder_goals').select('*').eq('is_active', true).order('priority', { ascending: true })),
    safeQuery(supabase.from('pages').select('slug').ilike('slug', 'digital-marketing-course-in-%')),
  ])

  const breadcrumbItems = [{ label: 'Home', href: '/' }, { label: 'Explore Programs' }]
  // Cities with a matching `pages` row at /digital-marketing-course-in-{slug} use that URL;
  // older `cities` rows with no such page (never migrated to the "-in-" template) still resolve
  // at the legacy /digital-marketing-course-{slug} pattern instead - linking every city through
  // the "-in-" pattern unconditionally produced dead 404 links for those rows (e.g. Mysore).
  const migratedCitySlugs = new Set(cityPageSlugs.map((row) => row.slug.replace('digital-marketing-course-in-', '')))
  const cityPlaces = cities.map((c) => ({
    name: c.name,
    href: migratedCitySlugs.has(c.slug) ? `/digital-marketing-course-in-${c.slug}` : `/digital-marketing-course-${c.slug}`,
  }))
  const areaPlaces = locations.map((l) => ({ name: l.name, href: `/digital-marketing-courses-${l.slug}` }))

  const faqs = [
    { question: 'What is Explore Programs?', answer: 'A single place to discover every Acadvizen program - by category, by city, and by career outcome - before diving into the full course catalogue.' },
    { question: 'How is this different from the Courses page?', answer: 'Courses is the full catalogue with every listing. Explore Programs is a curated discovery experience highlighting categories, locations, and outcomes.' },
    { question: 'Can I study from any city?', answer: 'Yes - most programs support hybrid and online cohorts alongside in-person locations.' },
  ]

  const resourceGroups = [
    { label: 'Latest Blogs', items: blogs.map((b) => ({ title: b.title, href: `/blog/${b.slug}` })) },
  ]

  return (
    <div className="immersive-scope min-h-screen bg-[#050a13]">
      <JsonLd id="explore-programs-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd id="explore-programs-faqs" data={buildFaqSchema(faqs)} />

      <ImmersiveHero
        eyebrow="Explore Programs"
        title="Find the program built for where you want to go"
        description="Browse career tracks, certification programs, and city cohorts - all in one premium discovery experience."
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Browse All Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        badges={['AI-First Curriculum', 'Live Projects', 'Placement Support']}
        stats={[
          { value: `${featuredCourses.length || 0}+`, label: 'Active programs' },
          { value: `${categories.length || 0}`, label: 'Program categories' },
          { value: `${cities.length || 0}`, label: 'Cities' },
          { value: `${companies.length || 0}+`, label: 'Hiring partners' },
        ]}
      />

      {categories.length ? (
        <SectionFrame bg="plain" eyebrow="Categories" title="Browse by program type" description="Flagship, career, specialist, and certification tracks.">
          <CategoryNavigator categories={categories} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="grid" eyebrow="Featured" title="Featured Programs">
        <CourseShowcase courses={featuredCourses} />
      </SectionFrame>

      {cityPlaces.length ? (
        <SectionFrame bg="mesh" blobColor="rgba(96,165,250,0.3)" eyebrow="Locations" title="Browse by City">
          <NearbyPlaces places={cityPlaces} />
        </SectionFrame>
      ) : null}

      {areaPlaces.length ? (
        <SectionFrame bg="grid" eyebrow="Locations" title="Browse by Area">
          <NearbyPlaces places={areaPlaces} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="plain" eyebrow="Outcomes" title="Career Outcomes">
        <PlacementShowcase placements={placements} />
      </SectionFrame>

      {companies.length ? (
        <SectionFrame bg="mesh" blobColor="rgba(94,234,212,0.3)" eyebrow="Hiring partners" title="Companies our learners join">
          <LogoWall companies={companies} />
        </SectionFrame>
      ) : null}

      {tools.length ? (
        <SectionFrame bg="grid" eyebrow="Ecosystem" title="Tools you'll master across programs">
          <TagCloud items={tools.map((t) => t.name)} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="plain" eyebrow="Voices" title="What learners say" align="center">
        <TestimonialGrid testimonials={testimonials} />
      </SectionFrame>

      {goals.length ? (
        <SectionFrame bg="grid" eyebrow="Not sure where to start?" title="Find your program by goal" align="center">
          <CourseFinderPanel goals={goals} courses={allCourses} />
        </SectionFrame>
      ) : null}

      {allCourses.length >= 2 ? (
        <SectionFrame bg="plain" eyebrow="Compare" title="Compare programs side by side" align="center">
          <CompareProgramsPanel courses={allCourses} />
        </SectionFrame>
      ) : null}

      {blogs.length ? (
        <SectionFrame bg="grid" eyebrow="Explore more" title="Related resources">
          <ResourceGrid groups={resourceGroups} />
        </SectionFrame>
      ) : null}

      <SectionFrame bg="mesh" eyebrow="Answers" title="Frequently asked questions" align="center">
        <FaqAccordion items={faqs} />
      </SectionFrame>

      <FinalCta
        title="Not sure which program fits?"
        subtitle="Talk to our admissions team for a personalised recommendation."
        primaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
        secondaryCta={{ label: 'Browse All Courses', href: '/courses' }}
      />
    </div>
  )
}
