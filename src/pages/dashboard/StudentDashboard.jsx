import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'

export function StudentDashboard() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [tools, setTools] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadDashboard()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadDashboard() {
    setLoading(true)

    const { data: enrollData } = await supabase
      .from('course_enrollments')
      .select('course_id, courses(*)')
      .eq('user_id', profile.id)

    if (enrollData) {
      setEnrollments(enrollData.map((e) => e.courses).filter(Boolean))
    }

    const { data: toolsData } = await supabase
      .from('tools_extended')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(20)
    if (toolsData) setTools(toolsData)

    if (enrollData && enrollData.length > 0) {
      const courseIds = enrollData.map((e) => e.course_id)
      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .in('course_id', courseIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
      if (resData) setResources(resData)
    } else {
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

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-8">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-slate-50">Student Dashboard</h1>
              {profile?.student_id && (
                <p className="mt-2 text-sm text-slate-300">
                  Student ID: <span className="font-semibold text-slate-100">{profile.student_id}</span>
                </p>
              )}
            </div>
            <Link
              to="/tools"
              data-cursor="hover"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
            >
              Explore tools <span className="opacity-80">-&gt;</span>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="py-0 pb-10">
        <Container>
          <div className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50">My Enrolled Courses</h2>
              <Link to="/courses" data-cursor="hover" className="text-sm font-semibold text-teal-300 hover:text-teal-200">
                View courses -&gt;
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <Surface className="p-10 text-center text-slate-400">No enrolled courses yet.</Surface>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrollments.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: idx * 0.04, duration: 0.35 }}
                  >
                    <Link to={`/courses/${course.slug}`} data-cursor="hover" className="group block h-full">
                      <Surface className="h-full p-6 transition-transform duration-200 group-hover:-translate-y-1">
                        <div className="absolute -inset-8 opacity-0 blur-2xl transition-opacity group-hover:opacity-100">
                          <div className="h-full w-full rounded-[26px] bg-gradient-to-r from-teal-400/10 via-sky-400/8 to-indigo-400/10" />
                        </div>
                        {course.image_url && (
                          <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] mb-4">
                            <img
                              src={course.image_url}
                              alt={course.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          </div>
                        )}
                        <div className="relative">
                          <h3 className="text-lg font-semibold text-slate-50">{course.title}</h3>
                          {course.short_description && (
                            <p className="mt-2 text-sm text-slate-300 line-clamp-2">{course.short_description}</p>
                          )}
                        </div>
                      </Surface>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-4">Available Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tools.map((tool) => (
                <Link key={tool.id} to={`/tools/${tool.slug}`} data-cursor="hover" className="group block">
                  <Surface className="p-4 text-center transition-transform duration-200 group-hover:-translate-y-1">
                    <div className="absolute -inset-8 opacity-0 blur-2xl transition-opacity group-hover:opacity-100">
                      <div className="h-full w-full rounded-[22px] bg-gradient-to-r from-teal-400/10 via-sky-400/8 to-indigo-400/10" />
                    </div>
                    <div className="relative">
                      {tool.logo_url ? (
                        <div className="aspect-square rounded-xl border border-white/10 bg-white/[0.03] mb-2 overflow-hidden">
                          <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-xl border border-white/10 bg-white/[0.03] mb-2 flex items-center justify-center">
                          <span className="text-teal-200 font-semibold">{tool.name.charAt(0)}</span>
                        </div>
                      )}
                      <p className="text-xs font-semibold text-slate-100 line-clamp-2">{tool.name}</p>
                    </div>
                  </Surface>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link to="/tools" data-cursor="hover" className="text-sm font-semibold text-teal-300 hover:text-teal-200">
                View all tools -&gt;
              </Link>
            </div>
          </div>

          {resources.length > 0 && (
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-4">Course Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((res) => (
                  <Surface key={res.id} className="p-5 transition-transform hover:-translate-y-0.5">
                    <h3 className="text-sm font-semibold text-slate-50">{res.title}</h3>
                    {res.description && <p className="mt-2 text-sm text-slate-300">{res.description}</p>}
                    <div className="mt-4 flex items-center gap-3">
                      {res.file_url && (
                        <a
                          href={res.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-cursor="hover"
                          className="text-sm font-semibold text-teal-300 hover:text-teal-200"
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
                          className="text-sm font-semibold text-slate-300 hover:text-slate-100"
                        >
                          Open Link -&gt;
                        </a>
                      )}
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </div>
  )
}
