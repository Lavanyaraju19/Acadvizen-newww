import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function CourseDetailPage() {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [details, setDetails] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    loadCourse()
    const coursesChannel = supabase
      .channel('public-course-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, loadCourse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_details' }, loadCourse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, loadCourse)
      .subscribe()

    return () => {
      supabase.removeChannel(coursesChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadCourse() {
    setLoading(true)
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (courseData) {
      setCourse(courseData)

      const { data: detailsData } = await supabase
        .from('course_details')
        .select('*')
        .eq('course_id', courseData.id)
        .order('order_index', { ascending: true })
      if (detailsData) setDetails(detailsData)

      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .eq('course_id', courseData.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
      if (resData) setResources(resData)
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
              <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-white/[0.02]">
                <img src={course.image_url} alt={course.title} className="h-full w-full object-cover" />
              </div>
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
            </div>
          </Surface>
        </Container>
      </Section>
    </div>
  )
}
