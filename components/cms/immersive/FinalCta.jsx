import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'

export default function FinalCta({ title, subtitle, primaryCta = { label: 'Talk to Admissions', href: '/contact' }, secondaryCta }) {
  return (
    <section className="immersive-mesh-bg relative overflow-hidden border-t border-white/5">
      <span className="immersive-glow-blob left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(94, 234, 212, 0.35)' }} aria-hidden="true" />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(94,234,212,0.6), transparent)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
        <Reveal as="scale">
          <div className="immersive-glass-strong relative overflow-hidden rounded-[2.5rem] px-8 py-14 sm:px-14">
            <span
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rotate-12 opacity-[0.07]"
              style={{ background: 'linear-gradient(135deg, #5eead4, transparent 70%)' }}
              aria-hidden="true"
            />
            <h2 className="immersive-display text-3xl font-semibold text-white [text-wrap:balance] sm:text-4xl">{title}</h2>
            {subtitle ? <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">{subtitle}</p> : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center gap-2 rounded-full bg-teal-300 px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/30"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
