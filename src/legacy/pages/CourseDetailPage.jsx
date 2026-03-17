import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import { subscribeToTable } from '../../../lib/realtime'
import { buildInternalLinks } from '../../../lib/internalLinker'
import AdaptiveImage from '../../../components/media/AdaptiveImage'

export function CourseDetailPage() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [details, setDetails] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [internalLinks, setInternalLinks] = useState({ blogs: [], tools: [], placements: [] })

  useEffect(() => {
    if (!slug) return
    loadCourse()
    const coursesChannel = subscribeToTable('courses', () => loadCourse())
    const detailsChannel = subscribeToTable('course_details', () => loadCourse())
    const resourcesChannel = subscribeToTable('resources', () => loadCourse())

    return () => {
      if (coursesChannel) supabase?.removeChannel(coursesChannel)
      if (detailsChannel) supabase?.removeChannel(detailsChannel)
      if (resourcesChannel) supabase?.removeChannel(resourcesChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadCourse() {
    setLoading(true)
    const { data: courseData } = await fetchPublicData('courses', { slug })
    const courseRow = Array.isArray(courseData) ? courseData[0] : courseData

    if (courseRow) {
      setCourse(courseRow)

      const { data: detailsData } = await fetchPublicData('course-details', { course_id: courseRow.id })
      if (detailsData) setDetails(detailsData)

      const { data: resData } = await fetchPublicData('resources', { course_id: courseRow.id })
      const filtered = Array.isArray(resData)
        ? resData.filter((item) => item.is_active !== false)
        : []
      if (resData) setResources(filtered)

      await loadInternalLinks(courseRow)
    } else {
      setCourse(null)
      setDetails([])
      setResources([])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-300/70" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2 text-slate-50">Course not found</h1>
          <Link to="/courses" className="text-teal-300 hover:text-teal-200 transition-colors">
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  async function loadInternalLinks(courseRow) {
    const [blogRes, toolRes, placementRes] = await Promise.all([
      fetchPublicData('blog-posts', { limit: 8 }),
      fetchPublicData('tools-extended', { limit: 8 }),
      fetchPublicData('placements', { limit: 6 }),
    ])

    const blogs = Array.isArray(blogRes.data) ? blogRes.data : []
    const tools = Array.isArray(toolRes.data) ? toolRes.data : []
    const placements = Array.isArray(placementRes.data) ? placementRes.data : []

    const links = buildInternalLinks(
      { title: courseRow?.title || 'Course' },
      {
        blogs: blogs.map((item) => ({ title: item.title, slug: item.slug, type: 'blog' })),
        courses: [],
        tools: tools.map((item) => ({ title: item.name, slug: item.slug, type: 'tool' })),
      },
      4
    )

    setInternalLinks({
      blogs: links.blogs,
      tools: links.tools,
      placements: placements.slice(0, 4),
    })
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-10">
        <Container className="max-w-5xl">
          <Link
            to="/courses"
            data-cursor="hover"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
          >
            <span className="opacity-80">&lt;-</span> Back to Courses
          </Link>

          <Surface
            className="mt-5 overflow-hidden"
            motionProps={{
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            {course.image_url && (
              <AdaptiveImage
                src={course.image_url}
                alt={course.title}
                variant="hero"
                aspectRatio="16 / 9"
                sizes="(max-width: 1024px) 100vw, 960px"
                wrapperClassName="w-full border-b border-white/10"
                borderClassName=""
                roundedClassName=""
              />
            )}

            <div className="p-7 md:p-10">
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-slate-50">
                {course.title}
              </h1>

              {course.description && (
                <div className="mt-5 text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </div>
              )}

              {details.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Course Content</h2>
                  <div className="mt-5 space-y-6">
                    {details.map((detail) => (
                      <div key={detail.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        {detail.section_title && (
                          <h3 className="text-lg font-semibold text-slate-50">
                            {detail.section_title}
                          </h3>
                        )}
                        {detail.content && (
                          <div className="mt-2 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {detail.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resources.length > 0 && (
                <div className="mt-10 pt-8 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Resources</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-transform hover:-translate-y-0.5"
                      >
                        <h3 className="text-sm font-semibold text-slate-50">{res.title}</h3>
                        {res.description && (
                          <p className="mt-2 text-sm text-slate-300">{res.description}</p>
                        )}
                        <div className="mt-4 flex items-center gap-3">
                          {res.file_url && (
                            <a
                              href={res.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="hover"
                              className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
                            >
                              Download -&gt;
                            </a>
                          )}
                          {res.external_url && (
                            <a
                              href={res.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-cursor="hover"
                              className="text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors"
                            >
                              Open Link -&gt;
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-white/10">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Related Links</h2>
                <div className="mt-5 grid gap-6 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Blogs</div>
                    <div className="mt-3 flex flex-col gap-2">
                      {internalLinks.blogs.length ? (
                        internalLinks.blogs.map((item) => (
                          <Link key={item.slug} to={`/blog/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                            {item.title}
                          </Link>
                        ))
                      ) : (
                        <span className="text-slate-400">More blogs coming soon.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tools</div>
                    <div className="mt-3 flex flex-col gap-2">
                      {internalLinks.tools.length ? (
                        internalLinks.tools.map((item) => (
                          <Link key={item.slug} to={`/tools/${item.slug}`} className="text-teal-300 hover:text-teal-200">
                            {item.title}
                          </Link>
                        ))
                      ) : (
                        <span className="text-slate-400">Tools will appear here.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Placements</div>
                    <div className="mt-3 flex flex-col gap-2 text-slate-300">
                      {internalLinks.placements.length ? (
                        internalLinks.placements.map((item) => (
                          <div key={item.id}>{item.company_name || item.company || 'Placement partner'}</div>
                        ))
                      ) : (
                        <span className="text-slate-400">Placement updates coming soon.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}

export default CourseDetailPage


