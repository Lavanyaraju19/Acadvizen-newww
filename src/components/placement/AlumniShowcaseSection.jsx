import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '../ui/Section'
import AdaptiveImage from '../../../components/media/AdaptiveImage'
import ConsistentPortraitMedia from '../shared/ConsistentPortraitMedia'

const showcaseBackground = {
  backgroundColor: '#041117',
  backgroundImage:
    "linear-gradient(135deg, rgba(3,10,12,0.7) 0%, rgba(4,12,16,0.82) 55%, rgba(2,6,8,0.88) 100%), url('/textures/green-marble.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

export function AlumniShowcaseSection({
  eyebrow = 'PLACEMENT SHOWCASE',
  title = 'Alumni Placed at Top Companies',
  description,
  students = [],
  primaryCta = { to: '/courses', label: 'Explore Programs' },
  secondaryCta = { to: '/contact', label: 'Book a Free Demo Class' },
  className = '',
}) {
  const sliderRef = useRef(null)

  const scrollCards = (direction) => {
    if (!sliderRef.current) return
    const amount = Math.max(sliderRef.current.clientWidth * 0.82, 320)
    sliderRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <section className={`relative py-10 md:py-12 ${className}`}>
      <Container className="max-w-7xl">
        <div
          className="overflow-hidden rounded-[2.4rem] border border-cyan-300/15 px-6 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:px-8 md:py-12"
          style={showcaseBackground}
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100/80">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-bold italic tracking-tight text-slate-50 md:text-6xl">{title}</h2>
            {description ? (
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">{description}</p>
            ) : null}
          </div>

          <div className="mt-10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => scrollCards(-1)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18"
              aria-label="Scroll alumni cards left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCards(1)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18"
              aria-label="Scroll alumni cards right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={sliderRef}
            className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
          >
            {students.map((student) => (
              <article
                key={`${student.name}-${student.image}`}
                className="flex min-h-[31rem] min-w-[250px] snap-start flex-col overflow-hidden rounded-[1.8rem] border-[3px] border-black/70 bg-white shadow-[0_22px_38px_rgba(0,0,0,0.24)] sm:min-w-[280px] lg:min-w-[295px]"
              >
                <div style={{ backgroundColor: student.accent }}>
                  <ConsistentPortraitMedia src={student.image} alt={student.name} />
                </div>
                <div className="flex flex-1 flex-col justify-between bg-white px-4 pb-5 pt-4 text-slate-950 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="text-[1.15rem] font-bold leading-tight tracking-tight sm:text-[1.35rem]">{student.name}</h3>
                    {student.company || student.companyLogo ? (
                      <div className="mt-3">
                        {student.companyLogo ? (
                          <div className="w-[150px] sm:w-[170px]">
                            <AdaptiveImage
                              src={student.companyLogo}
                              alt={student.company || `${student.name} company`}
                              variant="logo"
                              aspectRatio="16 / 9"
                              sizes="170px"
                              wrapperClassName="w-full bg-transparent"
                              borderClassName=""
                              roundedClassName="rounded-none"
                            />
                          </div>
                        ) : null}
                        {student.company ? <p className="mt-2 text-base font-bold text-slate-950">{student.company}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {primaryCta ? (
              <Link
                to={primaryCta.to}
                className="inline-flex min-w-[230px] items-center justify-center rounded-full border-2 border-[#0b0b0f] bg-[#f3263f] px-7 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(243,38,63,0.28)]"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                to={secondaryCta.to}
                className="inline-flex min-w-[230px] items-center justify-center rounded-full border border-white/20 bg-white px-6 py-4 text-base font-bold text-slate-950"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}

export default AlumniShowcaseSection
