import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { RevealItem } from './Reveal'

// Full-width immersive CTA panel - glow blob backdrop + large editorial type, replacing the
// flat gradient-box treatment used by the default CtaBannerSection.
export default function CtaPanel({ heading, text, button }) {
  if (!heading && !text && !button?.href) return null

  return (
    <RevealItem as="scale">
      <div className="immersive-glass-strong relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-16">
        <div className="immersive-glow-blob pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          {heading ? (
            <h2 className="immersive-display text-3xl font-bold text-white [text-wrap:balance] sm:text-5xl">{heading}</h2>
          ) : null}
          {text ? <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-300 sm:text-lg">{text}</p> : null}
          {button?.href ? (
            <Link
              href={button.href}
              target={button.target || '_self'}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-300 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-95"
            >
              {button.label || 'Get Started'}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </RevealItem>
  )
}
