// Consistent section wrapper for CMS template content blocks - same container width,
// vertical rhythm, and heading typography used across City/Location/Service/Resource pages.
export default function PageSection({ title, children, className = '', muted = false }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 ${muted ? 'bg-white/[0.02]' : ''} ${className}`}>
      {title ? <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">{title}</h2> : null}
      <div className={title ? 'mt-6' : ''}>{children}</div>
    </section>
  )
}

export function InfoCard({ title, description, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-300/30 hover:bg-white/[0.05] ${className}`}>
      {title ? <h3 className="text-lg font-semibold text-slate-100">{title}</h3> : null}
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p> : null}
    </div>
  )
}
