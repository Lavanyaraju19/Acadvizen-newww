import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { Container } from '../ui/Section'
import AdaptiveImage from '../../../components/media/AdaptiveImage'

const showcaseBackground = {
  backgroundColor: '#070a23',
  backgroundImage:
    'radial-gradient(circle at 14% 26%, rgba(119, 249, 235, 0.2) 0, rgba(119, 249, 235, 0.02) 24%), radial-gradient(circle at 86% 22%, rgba(113, 201, 255, 0.18) 0, rgba(113, 201, 255, 0.02) 20%), radial-gradient(circle at 50% 58%, rgba(98, 255, 234, 0.16) 0, rgba(98, 255, 234, 0.02) 18%), linear-gradient(132deg, rgba(3, 8, 28, 0.98) 0%, rgba(9, 18, 53, 0.98) 40%, rgba(16, 74, 99, 0.78) 63%, rgba(6, 11, 33, 0.98) 100%)',
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
            className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {students.map((student) => (
              <article
                key={`${student.name}-${student.image}`}
                className="min-w-[280px] snap-start overflow-hidden rounded-[1.8rem] border-[3px] border-black/70 shadow-[0_18px_32px_rgba(0,0,0,0.24)] sm:min-w-[320px] lg:min-w-[340px]"
                style={{ backgroundColor: student.accent }}
              >
                <div className="relative h-[20rem] overflow-hidden">
                  <div className="absolute inset-0 opacity-90">
                    <div className="absolute -left-12 bottom-[-12%] h-44 w-44 rounded-full bg-black/10 blur-2xl" />
                    <div className="absolute right-[-10%] top-8 h-32 w-32 rounded-full bg-white/12 blur-2xl" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 via-black/5 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 mx-auto h-[92%] w-[92%]">
                    <Image
                      src={student.image}
                      alt={student.name}
                      fill
                      sizes="(max-width: 768px) 86vw, 340px"
                      className={`${
                        student.image.includes('-cutout')
                          ? 'object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,0.26)]'
                          : 'object-cover object-top'
                      }`}
                      style={{ filter: 'contrast(1.04) saturate(1.03)' }}
                    />
                  </div>
                </div>
                <div className="px-5 pb-5 pt-4 text-slate-950">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold leading-tight">{student.name}</h3>
                    {student.companyLogo ? (
                      <div className="mt-3 w-[92px] rounded-2xl bg-white/92 px-2 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
                        <AdaptiveImage
                          src={student.companyLogo}
                          alt={student.company || `${student.name} company`}
                          variant="logo"
                          aspectRatio="16 / 9"
                          sizes="88px"
                          wrapperClassName="w-full bg-transparent"
                          borderClassName=""
                          roundedClassName="rounded-none"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {primaryCta ? (
              <Link
                to={primaryCta.to}
                className="rounded-full border-2 border-[#0b0b0f] bg-[#f3263f] px-7 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(243,38,63,0.28)]"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                to={secondaryCta.to}
                className="rounded-full border border-white/20 bg-white px-6 py-4 text-base font-bold text-slate-950"
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
