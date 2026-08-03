import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import PageHero from './templates/PageHero'
import PageSection, { InfoCard } from './templates/PageSection'
import PageCTA from './templates/PageCTA'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema } from '../../lib/structuredData'

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

// Generic programmatic-SEO template for /digital-marketing-courses-{slug}. Renders for ANY slug
// with this prefix (not just ones with an admin-authored `locations` row) by design - this
// mirrors the behavior of the dedicated route folder this was extracted from, which Next.js
// routing made unreachable (see lib/cmsServer.js PREFIXED_SLUG_PATTERNS for why).
//
// Uses the same shared template primitives (PageHero/PageSection/PageCTA) as every other CMS
// content type so an Area/Location page matches the rest of the dark-themed site instead of
// the light theme (bg-white/text-slate-900) this previously rendered in.
export default async function LocationPageRenderer({ locationRecord, locationSlug }) {
  const locationName = formatLocation(locationSlug)
  const supabase = getServerSupabaseClient()

  const courses = await safeQuery(
    supabase.from('courses').select('title, slug, overview').eq('is_active', true).order('order_index', { ascending: true }).limit(4),
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

  return (
    <div className="min-h-screen">
      <JsonLd id="location-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />

      <PageHero
        eyebrow="Digital Marketing Courses"
        title={heroTitle}
        subtitle={heroDescription}
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
      />

      <PageSection title="Course Overview" muted>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Learn performance marketing, SEO, analytics, and automation through a blended curriculum designed for
          real-world growth teams.
        </p>
      </PageSection>

      <PageSection title={`Why Learn Digital Marketing in ${locationName}`}>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          {locationRecord?.why_text ||
            `${locationName} is rapidly adopting digital-first growth strategies. This program aligns you with
            the skills local employers prioritize for marketing, analytics, and growth roles.`}
        </p>
      </PageSection>

      <PageSection title="Local Job Demand" muted>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          {locationRecord?.demand_text ||
            `Companies in ${locationName} are hiring marketers who can manage paid campaigns, SEO systems, and
            full-funnel conversion strategies.`}
        </p>
      </PageSection>

      <PageSection title="Placement Opportunities">
        {placements.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {placements.map((placement) => (
              <InfoCard
                key={placement.id}
                title={placement.company_name || placement.company || 'Placement partner'}
                description={placement.role || 'Marketing Role'}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Placement updates will appear here once published.</p>
        )}
      </PageSection>

      <PageSection title="Featured Courses" muted>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.length ? (
            courses.map((course) => (
              <article key={course.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-300/30">
                <h3 className="text-lg font-semibold text-slate-100">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {course.overview || 'Live projects, mentor reviews, and portfolio-ready outcomes.'}
                </p>
                <a className="mt-4 inline-flex text-sm font-semibold text-teal-300 hover:text-teal-200" href={`/courses/${course.slug}`}>
                  View course →
                </a>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-400">Course details will appear here once published.</p>
          )}
        </div>
      </PageSection>

      <PageSection title="Testimonials">
        {testimonials.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-slate-300">&ldquo;{testimonial.quote || testimonial.message}&rdquo;</p>
                <p className="mt-3 text-xs font-semibold text-slate-100">{testimonial.name || 'Student'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Testimonials will appear here once published.</p>
        )}
      </PageSection>

      <PageSection title="Course Curriculum" muted>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            'Digital marketing fundamentals',
            'SEO strategy and analytics',
            'Paid ads and performance marketing',
            'Social media and content systems',
            'Automation and CRM workflows',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
              {item}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="FAQs">
        <div className="space-y-4">
          <InfoCard title="How long is the course?" description="Typical schedules range between 8–16 weeks." />
          <InfoCard title="Is placement assistance included?" description="Yes, career support and interview prep are included." />
          <InfoCard title={`Can I attend from ${locationName}?`} description="Yes, the program supports both online and hybrid cohorts." />
        </div>
      </PageSection>

      <PageSection title="Explore Related Resources" muted>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Blogs</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {internalLinks.blogs.length ? (
                internalLinks.blogs.map((blog) => (
                  <li key={blog.slug}>
                    <a href={`/blog/${blog.slug}`} className="text-teal-300 hover:text-teal-200">{blog.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related blogs yet.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Courses</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {internalLinks.courses.length ? (
                internalLinks.courses.map((course) => (
                  <li key={course.slug}>
                    <a href={`/courses/${course.slug}`} className="text-teal-300 hover:text-teal-200">{course.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related courses yet.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tools</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {internalLinks.tools.length ? (
                internalLinks.tools.map((tool) => (
                  <li key={tool.slug}>
                    <a href={`/tools/${tool.slug}`} className="text-teal-300 hover:text-teal-200">{tool.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related tools yet.</li>
              )}
            </ul>
          </div>
        </div>
      </PageSection>

      <PageCTA
        title={`Start your digital marketing career in ${locationName}`}
        subtitle="Get a personalised course roadmap from our admissions team."
      />
    </div>
  )
}
