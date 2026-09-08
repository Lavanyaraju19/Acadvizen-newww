'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'

// Editorial FAQ accordion - one item open at a time, glass panel treatment matching the rest
// of the immersive library. Renders nothing if there are no real FAQ items.
//
// The answer for every item is always rendered into the DOM (visually collapsed via the
// `hidden` attribute for closed items) rather than conditionally rendering `null` - the
// previous version only ever mounted the open item's answer, so a plain HTTP fetch of the page
// (a crawler, "view source", curl) saw question text for every FAQ but answer text for only the
// one open by default. `hidden` still lets CSS/JS reveal it on click while keeping the full
// Q&A pairs in the server-rendered HTML for SEO and FAQPage structured data parity.
export default function FaqAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(0)
  if (!items.length) return null

  return (
    <RevealGroup className="mx-auto max-w-3xl space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <RevealItem key={`${item.question}-${index}`} as="up">
            <div className={`immersive-glass overflow-hidden rounded-2xl transition ${isOpen ? 'border-teal-300/25' : ''}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-sm font-semibold text-white sm:text-base">{item.question}</span>
                <Plus className={`h-4 w-4 flex-shrink-0 text-teal-300 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
              </button>
              <div hidden={!isOpen} className="px-6 pb-6 text-sm leading-relaxed text-slate-300">{item.answer}</div>
            </div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
