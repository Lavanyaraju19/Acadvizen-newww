import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'

export const dynamic = 'force-dynamic'

const formatLocation = (slug) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

async function safeQuery(query, fallback = []) {
  try {
    const { data, error } = await query
    if (error) return fallback
    return data || fallback
  } catch {
    return fallback
  }
}

async function fetchLocationRecord(supabase, locationSlug) {
  const locationName = formatLocation(locationSlug)
  let data = await safeQuery(supabase.from('locations').select('*').eq('slug', locationSlug).limit(1), [])
  if (!data?.length) {
    data = await safeQuery(supabase.from('locations').select('*').ilike('name', locationName).limit(1), [])
  }
  return data?.[0] || null
}

export async function generateMetadata({ params }) {
  const locationSlug = params?.location || 'your-location'
  const locationName = formatLocation(locationSlug)
  const supabase = getServerSupabaseClient()
  const locationRecord = await fetchLocationRecord(supabase, locationSlug)
  const title = locationRecord?.meta_title || `Digital Marketing Courses in ${locationName} | Acadvizen`
  const description =
    locationRecord?.meta_description ||
    `Explore the best digital marketing courses in ${locationName} with industry experts and placement support.`
  const canonical = `https://acadvizen.com/digital-marketing-courses-${locationSlug}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function LocationCoursePage({ params }) {
  const locationSlug = params?.location || 'your-location'
  const locationName = formatLocation(locationSlug)
  const supabase = getServerSupabaseClient()

  const locationRecord = await fetchLocationRecord(supabase, locationSlug)
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
    supabase.from('blog_posts').select('title, slug').order('published_at', { ascending: false }).limit(6),
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

  return (
    <main className="px-4 py-12 md:px-8 lg:px-16">
      <section className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-semibold text-slate-900">{heroTitle}</h1>
        <p className="text-base text-slate-600">{heroDescription}</p>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Course Overview</h2>
        <p className="text-sm text-slate-600">
          Learn performance marketing, SEO, analytics, and automation through a blended curriculum designed for
          real-world growth teams.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Why Learn Digital Marketing in {locationName}</h2>
        <p className="text-sm text-slate-600">
          {locationRecord?.why_text ||
            `${locationName} is rapidly adopting digital-first growth strategies. This program aligns you with
            the skills local employers prioritize for marketing, analytics, and growth roles.`}
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Local Job Demand</h2>
        <p className="text-sm text-slate-600">
          {locationRecord?.demand_text ||
            `Companies in ${locationName} are hiring marketers who can manage paid campaigns, SEO systems, and
            full-funnel conversion strategies.`}
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Placement Opportunities</h2>
        {placements.length ? (
          <ul className="space-y-3 text-sm text-slate-600">
            {placements.map((placement) => (
              <li key={placement.id} className="rounded-lg border border-slate-200 bg-white p-3">
                {placement.company_name || placement.company || 'Placement partner'} — {placement.role || 'Marketing Role'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">Placement updates will appear here once published.</p>
        )}
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Featured Courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.length ? (
            courses.map((course) => (
              <article key={course.slug} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {course.overview || 'Live projects, mentor reviews, and portfolio-ready outcomes.'}
                </p>
                <a className="mt-3 inline-flex text-sm font-semibold text-teal-600" href={`/courses/${course.slug}`}>
                  View course
                </a>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">Course details will appear here once published.</p>
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Testimonials</h2>
        {testimonials.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article key={testimonial.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-600">"{testimonial.quote || testimonial.message}"</p>
                <p className="mt-3 text-xs font-semibold text-slate-900">{testimonial.name || 'Student'}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Testimonials will appear here once published.</p>
        )}
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Course Curriculum</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {[
            'Digital marketing fundamentals',
            'SEO strategy and analytics',
            'Paid ads and performance marketing',
            'Social media and content systems',
            'Automation and CRM workflows',
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-10 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">FAQs</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>How long is the course? Typical schedules range between 8–16 weeks.</p>
          <p>Is placement assistance included? Yes, career support and interview prep are included.</p>
          <p>Can I attend from {locationName}? Yes, the program supports both online and hybrid cohorts.</p>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Explore Related Resources</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Blogs</h3>
            <ul className="mt-3 space-y-2 text-sm text-teal-700">
              {internalLinks.blogs.length ? (
                internalLinks.blogs.map((blog) => (
                  <li key={blog.slug}>
                    <a href={`/blog/${blog.slug}`}>{blog.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related blogs yet.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Courses</h3>
            <ul className="mt-3 space-y-2 text-sm text-teal-700">
              {internalLinks.courses.length ? (
                internalLinks.courses.map((course) => (
                  <li key={course.slug}>
                    <a href={`/courses/${course.slug}`}>{course.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related courses yet.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Tools</h3>
            <ul className="mt-3 space-y-2 text-sm text-teal-700">
              {internalLinks.tools.length ? (
                internalLinks.tools.map((tool) => (
                  <li key={tool.slug}>
                    <a href={`/tools/${tool.slug}`}>{tool.title}</a>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">No related tools yet.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
