import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function ToolDetailsPage() {
  const { slug } = useParams()
  const [tool, setTool] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  const normalizeToolKey = (value = '') =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const localLogoFor = (toolData) => {
    const key = normalizeToolKey(toolData?.slug || toolData?.name || '')
    return key ? `/tools/${key}.png` : null
  }

  useEffect(() => {
    loadTool()
  }, [slug])

  async function loadTool() {
    setLoading(true)
    const { data } = await supabase
      .from('tools_extended')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    setTool(data || null)
    if (data?.category) {
      const { data: relatedData } = await supabase
        .from('tools_extended')
        .select('*')
        .eq('category', data.category)
        .eq('is_active', true)
        .neq('slug', data.slug)
        .limit(6)
      if (relatedData) setRelated(relatedData)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
      </div>
    )
  }

  if (!tool) {
    return (
      <Section className="py-16">
        <Container>
          <Surface className="p-10 text-center text-slate-400">
            Tool not found. <Link to="/tools" className="text-teal-300">Back to tools</Link>
          </Surface>
        </Container>
      </Section>
    )
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container className="max-w-4xl">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-slate-950"
              style={{ background: tool.brand_color || '#0ea5e9' }}
            >
              {localLogoFor(tool) || tool.logo_url ? (
                <img
                  src={localLogoFor(tool) || tool.logo_url}
                  alt={tool.name}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const fallback = tool.logo_url || null
                    if (fallback && e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback
                    } else {
                      e.currentTarget.style.display = 'none'
                    }
                  }}
                />
              ) : (
                <span className="text-xl font-bold">{tool.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{tool.name}</h1>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{slug}</div>
              <p className="mt-2 text-sm text-slate-300">{tool.description}</p>
              {tool.website_url && (
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                >
                  Visit Official Website
                </a>
              )}
              <Link
                to="/"
                className="mt-3 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.05]"
              >
                Enroll Now
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="py-6 md:py-10">
          <Container>
            <h2 className="text-xl font-semibold text-slate-50 mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link key={item.id} to={`/tools/${item.slug}`}>
                  <Surface className="p-4 h-full transition-transform hover:-translate-y-1">
                    <div className="text-sm font-semibold text-slate-50">{item.name}</div>
                    {item.category && <div className="mt-2 text-xs text-slate-400">{item.category}</div>}
                  </Surface>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </div>
  )
}
