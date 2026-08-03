import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'
import PageHero from './templates/PageHero'
import PageSection, { InfoCard } from './templates/PageSection'
import PageCTA from './templates/PageCTA'
import JsonLd from './templates/JsonLd'
import { buildBreadcrumbSchema } from '../../lib/structuredData'

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

// Generic programmatic-SEO template for /digital-marketing-course-{slug} (legacy `cities`
// table, no dedicated admin editor - see lib/cmsServer.js PREFIXED_SLUG_PATTERNS). Always
// renders for any slug with this prefix, mirroring LocationPageRenderer/CityPageRenderer's
// "never 404, real content when available" contract, and uses the same shared template
// primitives so it matches the rest of the dark-themed site instead of the light theme
// (bg-white/text-slate-900) this route previously rendered in before it was unreachable.
export default async function CityCoursePageRenderer({ cityRecord, citySlug }) {
  const cityName = formatCity(citySlug)
  const supabase = getServerSupabaseClient()

  const courses = await safeQuery(
    supabase.from('courses').select('title, slug, overview').eq('is_active', true).order('order_index', { ascending: true }).limit(3),
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

  return (
    <div className="min-h-screen">
      <JsonLd id="city-course-breadcrumbs" data={buildBreadcrumbSchema(breadcrumbItems)} />

      <PageHero
        eyebrow="Digital Marketing Course"
        title={`Digital Marketing Course in ${cityName}`}
        subtitle={
          cityRecord?.description ||
          `Build career-ready digital marketing skills in ${cityName} with expert-led sessions, live projects, and placement support.`
        }
        breadcrumbs={breadcrumbItems}
        primaryCta={{ label: 'Explore Courses', href: '/courses' }}
        secondaryCta={{ label: 'Talk to Admissions', href: '/contact' }}
      />

      {cityRecord?.highlights?.length ? (
        <PageSection title="Highlights" muted>
          <ul className="grid gap-2 sm:grid-cols-2">
            {cityRecord.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                {highlight}
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      <PageSection title="Featured Courses">
        <div className="grid gap-4 md:grid-cols-2">
          {courses.length ? (
            courses.map((course) => (
              <article key={course.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-300/30">
                <h3 className="text-lg font-semibold text-slate-100">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{course.overview || 'Hands-on curriculum with industry mentors.'}</p>
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

      <PageSection title="Placement Highlights" muted>
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
          <p className="text-sm text-slate-400">Placement stats will appear here once published.</p>
        )}
      </PageSection>

      <PageSection title="Student Testimonials">
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

      <PageSection title="Explore More Resources" muted>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Related Blogs</h3>
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recommended Courses</h3>
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Helpful Tools</h3>
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

      <PageCTA title={`Start your digital marketing career in ${cityName}`} subtitle="Get a personalised course roadmap from our admissions team." />
    </div>
  )
}
