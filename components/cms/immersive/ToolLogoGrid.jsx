import { Wrench } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

// Logo-forward tool grid (real `tools_extended.logo_url`) - each tile pairs the actual brand
// mark with its name/category, matching how a tools ecosystem is presented on a course landing
// page rather than as plain text chips. Falls back to nothing here; callers should use TagCloud
// for tools that have no logo on file. Uses SafeImage so a dead logo URL (e.g. the discontinued
// Clearbit public logo API some admin-entered tool records point to) degrades to a plain icon
// tile instead of a broken-image glyph.
export default function ToolLogoGrid({ tools = [] }) {
  if (!tools.length) return null
  return (
    <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tools.map((tool) => (
        <RevealItem key={tool.slug || tool.name} as="scale">
          <div className="immersive-glass flex h-full flex-col items-center gap-3 rounded-2xl p-5 text-center transition hover:-translate-y-1 hover:border-teal-300/25">
            <div className="flex h-12 w-full items-center justify-center">
              <SafeImage
                src={tool.logo_url}
                alt={tool.name}
                className="max-h-12 w-auto max-w-full object-contain"
                fallback={
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-300/10 text-teal-200">
                    <Wrench className="h-4 w-4" />
                  </span>
                }
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{tool.name}</div>
              {tool.category ? <div className="mt-0.5 text-[11px] text-slate-500">{tool.category}</div> : null}
            </div>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
