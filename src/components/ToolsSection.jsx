import { Link } from 'react-router-dom'
import { Container, Section } from './ui/Section'
import { Surface } from './ui/Surface'

export function ToolsSection({ section, tools, categories, selectedCategory, onCategoryChange }) {
  const featuredTools = tools.slice(0, 12)
  const sliderTools = [...featuredTools, ...featuredTools]
  const evenTools = sliderTools.filter((_, idx) => idx % 2 === 0)
  const oddTools = sliderTools.filter((_, idx) => idx % 2 === 1)
  const filteredTools = tools.filter((t) => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'Gen AI') return t.category === 'Gen AI'
    if (selectedCategory === 'Digital Marketing') return t.category !== 'Gen AI'
    return t.category === selectedCategory
  })

  const normalizeToolKey = (value = '') =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const localLogoFor = (tool) => {
    const key = normalizeToolKey(tool.slug || tool.name || '')
    return key ? `/tools/${key}.png` : null
  }

  const logoFor = (tool) => {
    const local = localLogoFor(tool)
    if (local) return local
    if (tool.logo_url) return tool.logo_url
    if (tool.website_url) {
      const match = tool.website_url.match(/^https?:\/\/([^/]+)/i)
      if (match?.[1]) return `https://logo.clearbit.com/${match[1]}`
    }
    return null
  }

  return (
    <Section className="py-12 md:py-16" id="tools">
      <Container>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-50">{section.title}</h2>
            {section.subtitle && <p className="mt-2 text-sm text-slate-300">{section.subtitle}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-teal-300 text-slate-950'
                    : 'border border-white/10 text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {tools.length > 0 && (
          <div className="mt-8 space-y-4 overflow-hidden">
            <div className="logo-scroll gap-8 min-w-max">
              {evenTools.map((tool, idx) => (
                <div
                  key={`${tool.slug}-featured-a-${idx}`}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-slate-200"
                >
                  {logoFor(tool) ? (
                    <img
                      src={logoFor(tool)}
                      alt={tool.name}
                      className="h-6 w-6 object-contain"
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
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-slate-950 text-xs font-bold"
                      style={{ background: tool.brand_color || '#0ea5e9' }}
                    >
                      {tool.name?.charAt(0)}
                    </div>
                  )}
                  <span className="whitespace-nowrap">{tool.name}</span>
                </div>
              ))}
            </div>
            <div className="logo-scroll-reverse gap-8 min-w-max">
              {oddTools.map((tool, idx) => (
                <div
                  key={`${tool.slug}-featured-b-${idx}`}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-slate-200"
                >
                  {logoFor(tool) ? (
                    <img
                      src={logoFor(tool)}
                      alt={tool.name}
                      className="h-6 w-6 object-contain"
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
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-slate-950 text-xs font-bold"
                      style={{ background: tool.brand_color || '#0ea5e9' }}
                    >
                      {tool.name?.charAt(0)}
                    </div>
                  )}
                  <span className="whitespace-nowrap">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <Link key={tool.id} to={`/tools/${tool.slug}`} className="group">
              <Surface
                className="p-6 h-full transition-all duration-300 hover:scale-105 hover:shadow-xl tilt-card"
                style={{ background: tool.brand_color || '#0ea5e9' }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/35" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-white/95 text-slate-950">
                    {logoFor(tool) ? (
                      <img
                        src={logoFor(tool)}
                        alt={tool.name}
                        className="h-10 w-10 object-contain"
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
                  <div className="mt-4 text-sm font-semibold text-white">{tool.name}</div>
                </div>
                {tool.description && (
                  <p className="relative mt-2 text-xs text-slate-100/90 line-clamp-3">{tool.description}</p>
                )}
              </Surface>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  )
}
