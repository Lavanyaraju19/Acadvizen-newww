import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicData } from '../../lib/apiClient'
import { Container, Section } from '../../components/ui/Section'
import { Surface } from '../../components/ui/Surface'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import { resolveToolLogoCandidates } from '../../../lib/toolMedia'

export function ToolDetailsPage() {
  const { slug } = useParams()
  const [tool, setTool] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTool()
  }, [slug])

  async function loadTool() {
    setLoading(true)
    const { data } = await fetchPublicData('tools-extended', { slug })
    const toolRow = Array.isArray(data) ? data[0] : data
    setTool(toolRow)
    if (toolRow?.category) {
      const { data: relatedData } = await fetchPublicData('tools-extended', { category: toolRow.category, limit: 6 })
      const relatedList = Array.isArray(relatedData)
        ? relatedData.filter((item) => item.slug !== toolRow.slug)
        : []
      if (relatedData) setRelated(relatedList)
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
            <div className="h-20 w-20 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
              <AdaptiveImage
                src={resolveToolLogoCandidates(tool)[0]}
                fallbackSrcs={resolveToolLogoCandidates(tool).slice(1)}
                alt={tool.name}
                variant="logo"
                aspectRatio="1 / 1"
                wrapperClassName="h-full w-full"
                borderClassName=""
                roundedClassName="rounded-2xl"
                sizes="80px"
                priority
              />
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

export default ToolDetailsPage
