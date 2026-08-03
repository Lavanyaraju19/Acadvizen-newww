// Universal bottom-of-page conversion banner shared by every CMS content-type template.
export default function PageCTA({
  title = 'Ready to start your digital marketing career?',
  subtitle = 'Talk to our admissions team and get a personalised course roadmap.',
  primaryText = 'Get Started',
  primaryHref = '/courses',
  secondaryText = 'Talk to us',
  secondaryHref = '/contact',
}) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <h2 className="relative text-2xl font-bold text-slate-50 sm:text-3xl">{title}</h2>
        {subtitle ? <p className="relative mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          {primaryText ? (
            <a
              href={primaryHref}
              className="rounded-xl bg-teal-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
            >
              {primaryText}
            </a>
          ) : null}
          {secondaryText ? (
            <a
              href={secondaryHref}
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.05]"
            >
              {secondaryText}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}
