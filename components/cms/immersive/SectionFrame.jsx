import Reveal from './Reveal'

const BG_CLASS = {
  plain: '',
  mesh: 'immersive-mesh-bg',
  grid: 'immersive-grid-bg',
}

// Alternating-background section shell shared by every Immersive page. `bg` rotates through
// plain/mesh/grid so consecutive sections never look identical, and `blobColor` (if set) adds a
// single soft glow blob positioned by `blobPosition` - kept to one blob per section on purpose,
// per the "very subtle, no visual clutter" brief.
export default function SectionFrame({
  id,
  bg = 'plain',
  blobColor,
  blobPosition = 'top-right',
  eyebrow,
  title,
  description,
  align = 'left',
  headerSlot,
  className = '',
  contentClassName = '',
  children,
}) {
  const blobPos =
    blobPosition === 'top-right'
      ? 'top-[-10%] right-[-6%] h-72 w-72'
      : blobPosition === 'bottom-left'
        ? 'bottom-[-10%] left-[-6%] h-80 w-80'
        : 'top-1/3 left-1/2 -translate-x-1/2 h-96 w-96'

  return (
    <section id={id} className={`relative ${BG_CLASS[bg] || ''} ${className}`}>
      {blobColor ? <span className={`immersive-glow-blob ${blobPos}`} style={{ background: blobColor }} aria-hidden="true" /> : null}
      <div className={`relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8 ${contentClassName}`}>
        {(eyebrow || title || description || headerSlot) && (
          <div className={`mb-12 flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-3xl'}`}>
            {eyebrow ? (
              <Reveal as="up">
                <span className="immersive-eyebrow inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-teal-300/90">
                  <span className="h-1 w-1 rounded-full bg-teal-300" />
                  {eyebrow}
                </span>
              </Reveal>
            ) : null}
            {title ? (
              <Reveal as="up" delay={0.05}>
                <h2 className="immersive-display text-3xl font-semibold text-white [text-wrap:balance] sm:text-4xl lg:text-5xl">
                  {title}
                </h2>
              </Reveal>
            ) : null}
            {description ? (
              <Reveal as="up" delay={0.1}>
                <p className="max-w-2xl text-base leading-relaxed text-slate-400">{description}</p>
              </Reveal>
            ) : null}
            {headerSlot}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
