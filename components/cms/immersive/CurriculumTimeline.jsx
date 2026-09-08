'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

function normalizeModule(item, index) {
  if (typeof item === 'string') return { title: item, topics: [] }
  if (item && typeof item === 'object') {
    return {
      title: item.title || item.name || item.module || `Module ${index + 1}`,
      topics: Array.isArray(item.topics) ? item.topics : Array.isArray(item.items) ? item.items : [],
    }
  }
  return { title: `Module ${index + 1}`, topics: [] }
}

// Premium numbered-accordion curriculum experience (replaces the earlier plain vertical
// timeline). Module 1 is expanded by default - mirrors how a syllabus is actually consumed
// (skim the module list, open the one you care about) rather than forcing a full scroll.
export default function CurriculumTimeline({ items = [], emptyLabel = 'Curriculum will appear here once published.' }) {
  const modules = (items || []).map(normalizeModule).filter((m) => m.title)
  const [openIndex, setOpenIndex] = useState(0)
  if (!modules.length) return <p className="text-sm text-slate-500">{emptyLabel}</p>

  return (
    <RevealGroup className="mx-auto max-w-4xl space-y-4">
      {modules.map((mod, index) => {
        const isOpen = openIndex === index
        return (
          <RevealItem key={mod.title} as="up" delay={index * 0.03}>
            <div
              className={`overflow-hidden rounded-3xl border transition ${
                isOpen ? 'border-teal-300/30 bg-teal-300/[0.04]' : 'border-white/8 bg-white/[0.02]'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-5 px-6 py-6 text-left sm:px-8"
              >
                <span
                  className={`immersive-display shrink-0 text-3xl font-bold italic transition sm:text-4xl ${
                    isOpen ? 'text-teal-300' : 'text-white/15'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white sm:text-base">{mod.title}</span>
                  {mod.topics.length ? (
                    <span className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                      {mod.topics.length} topic{mod.topics.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-teal-300' : ''}`} />
              </button>
              {isOpen && mod.topics.length ? (
                <div className="border-t border-white/8 px-6 pb-6 pt-5 sm:px-8">
                  <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {mod.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-teal-300">
                          <Check className="h-3 w-3" />
                        </span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
