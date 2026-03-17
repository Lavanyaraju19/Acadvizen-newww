import { Link } from 'react-router-dom'
import { Container, Section } from './ui/Section'
import { Surface } from './ui/Surface'
import AdaptiveImage from '../../components/media/AdaptiveImage'
import { resolveToolLogoCandidates } from '../../lib/toolMedia'

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
                  <div className="h-6 w-6">
                    <AdaptiveImage
                      src={resolveToolLogoCandidates(tool)[0]}
                      fallbackSrcs={resolveToolLogoCandidates(tool).slice(1)}
                      alt={tool.name}
                      variant="logo"
                      aspectRatio="1 / 1"
                      wrapperClassName="h-full w-full"
                      borderClassName=""
                      roundedClassName="rounded-full"
                      sizes="24px"
                    />
                  </div>
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
                  <div className="h-6 w-6">
                    <AdaptiveImage
                      src={resolveToolLogoCandidates(tool)[0]}
                      fallbackSrcs={resolveToolLogoCandidates(tool).slice(1)}
                      alt={tool.name}
                      variant="logo"
                      aspectRatio="1 / 1"
                      wrapperClassName="h-full w-full"
                      borderClassName=""
                      roundedClassName="rounded-full"
                      sizes="24px"
                    />
                  </div>
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
                    <AdaptiveImage
                      src={resolveToolLogoCandidates(tool)[0]}
                      fallbackSrcs={resolveToolLogoCandidates(tool).slice(1)}
                      alt={tool.name}
                      variant="logo"
                      aspectRatio="1 / 1"
                      wrapperClassName="h-10 w-10"
                      borderClassName=""
                      roundedClassName="rounded-2xl"
                      sizes="40px"
                    />
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
