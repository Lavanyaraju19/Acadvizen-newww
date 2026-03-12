import { getServerSupabaseClient } from '../../lib/supabaseServer'
import { buildInternalLinks } from '../../lib/internalLinker'

export const dynamic = 'force-dynamic'

const formatCity = (slug) =>
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

async function fetchCityRecord(supabase, citySlug) {
  const cityName = formatCity(citySlug)
  let data = await safeQuery(supabase.from('cities').select('*').eq('slug', citySlug).limit(1), [])
  if (!data?.length) {
    data = await safeQuery(supabase.from('cities').select('*').ilike('name', cityName).limit(1), [])
  }
  return data?.[0] || null
}

export async function generateMetadata({ params }) {
  const citySlug = params?.city || 'your-city'
  const cityName = formatCity(citySlug)
  const title = `Digital Marketing Course in ${cityName} | Acadvizen`
  const description = `Master digital marketing in ${cityName} with hands-on training, live projects, and placement support.`
  const canonical = `https://acadvizen.com/digital-marketing-course-${citySlug}`
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

export default async function CityCoursePage({ params }) {
  const citySlug = params?.city || 'your-city'
  const cityName = formatCity(citySlug)
  const supabase = getServerSupabaseClient()

  const cityRecord = await fetchCityRecord(supabase, citySlug)
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
    supabase.from('blog_posts').select('title, slug').order('published_at', { ascending: false }).limit(5),
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

  return (
    <main className="px-4 py-12 md:px-8 lg:px-16">
      <section className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold text-slate-900">
          Digital Marketing Course in {cityName}
        </h1>
        <p className="text-base text-slate-600">
          {cityRecord?.description ||
            `Build career-ready digital marketing skills in ${cityName} with expert-led sessions, live projects, and placement support.`}
        </p>
        {cityRecord?.highlights?.length ? (
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            {cityRecord.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mx-auto mt-12 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Featured Courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.length ? (
            courses.map((course) => (
              <article key={course.slug} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{course.overview || 'Hands-on curriculum with industry mentors.'}</p>
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

      <section className="mx-auto mt-12 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Placement Highlights</h2>
        {placements.length ? (
          <ul className="space-y-3 text-sm text-slate-600">
            {placements.map((placement) => (
              <li key={placement.id} className="rounded-lg border border-slate-200 bg-white p-3">
                {placement.company_name || placement.company || 'Placement partner'} — {placement.role || 'Marketing Role'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">Placement stats will appear here once published.</p>
        )}
      </section>

      <section className="mx-auto mt-12 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Student Testimonials</h2>
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

      <section className="mx-auto mt-12 max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Explore More Resources</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Related Blogs</h3>
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
            <h3 className="text-base font-semibold text-slate-900">Recommended Courses</h3>
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
            <h3 className="text-base font-semibold text-slate-900">Helpful Tools</h3>
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
