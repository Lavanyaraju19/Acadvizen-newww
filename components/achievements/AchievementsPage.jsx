import Image from 'next/image'
import { Play } from 'lucide-react'
import FeaturedTestimonialCarousel from './FeaturedTestimonialCarousel'
import {
  achievementAwardImages,
  achievementAwardVideos,
  achievementMediaLogos,
  achievementTestimonialVideos,
  achievementsAwardVideosDescription,
  achievementsAwardVideosHeading,
  achievementsMediaDescription,
  achievementsMediaHeading,
  achievementsPageDescription,
  achievementsPageHeading,
  achievementsSupportingParagraph,
  achievementsTestimonialsDescription,
  achievementsTestimonialsHeading,
} from '../../lib/achievementsContent'

function SectionIntro({ title, description, invert = false }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <h2 className={`text-3xl font-semibold tracking-tight sm:text-4xl ${invert ? 'text-white' : 'text-[#102417]'}`}>{title}</h2>
      <p className={`mt-4 text-base leading-8 sm:text-lg ${invert ? 'text-slate-200' : 'text-[#4f6552]'}`}>{description}</p>
    </div>
  )
}

function FramedAwardCollage() {
  const [first, second, third, fourth, fifth, sixth] = achievementAwardImages

  const slots = [
    { item: first, className: 'col-span-1 row-span-1' },
    { item: second, className: 'col-span-2 row-span-2' },
    { item: third, className: 'col-span-1 row-span-1' },
    { item: fourth, className: 'col-span-1 row-span-1' },
    { item: fifth, className: 'col-span-1 row-span-1' },
    { item: sixth, className: 'col-span-1 row-span-1' },
  ]

  return (
    <div className="mx-auto mt-10 max-w-4xl rounded-[34px] bg-[#1a1a18] p-5 shadow-[0_28px_80px_rgba(8,14,10,0.32)] sm:p-7">
      <div className="rounded-[26px] bg-[#f9f7f1] p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {slots.map(({ item, className }) => (
            <div
              key={item.id}
              className={`relative overflow-hidden rounded-[8px] bg-[#ece7db] shadow-[0_8px_24px_rgba(28,31,22,0.12)] ${className}`}
              style={{ minHeight: className.includes('row-span-2') ? 380 : 182 }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-[#ddd6c7] pt-4 text-center">
          <p className="text-2xl font-semibold tracking-tight text-[#1e1f1b]">Awards & Achievements</p>
        </div>
      </div>
    </div>
  )
}

function AwardVideoCard({ item }) {
  return (
    <article className="rounded-[24px] border border-[#d8dfd0] bg-white p-4 shadow-[0_18px_50px_rgba(22,38,25,0.08)]">
      <div className="relative overflow-hidden rounded-[18px] bg-[#101010]" style={{ aspectRatio: '16 / 9' }}>
        <Image src={item.poster} alt={item.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.35))]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#132718] shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </div>
        </div>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight text-[#132718]">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#586a58]">{item.summary}</p>
    </article>
  )
}

export default function AchievementsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,110,130,0.28),transparent_28%),linear-gradient(135deg,#103744_0%,#081728_28%,#081728_72%,#103744_100%)] text-[#102417]">
      <section className="px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="mx-auto max-w-7xl rounded-[34px] bg-[linear-gradient(180deg,#f7fbf4_0%,#edf4e7_45%,#fbfcf8_100%)] px-6 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#486548]">Achievements</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#102417] sm:text-5xl lg:text-6xl">
              {achievementsPageHeading}
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#4f6552]">{achievementsPageDescription}</p>
          </div>

          <FramedAwardCollage />

          <p className="mx-auto mt-8 max-w-4xl text-center text-lg leading-8 text-[#4f6552]">
            {achievementsSupportingParagraph}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro title={achievementsAwardVideosHeading} description={achievementsAwardVideosDescription} invert />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {achievementAwardVideos.map((item) => (
              <AwardVideoCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] bg-[#f7f8f2] px-6 py-12 shadow-[0_22px_70px_rgba(19,39,24,0.08)] sm:px-8 lg:px-10">
          <SectionIntro title={achievementsMediaHeading} description={achievementsMediaDescription} />
          <div className="mt-12 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
            {achievementMediaLogos.map((item) => (
              <div
                key={item.id}
                className="flex h-[112px] items-center justify-center bg-white px-8 shadow-[0_8px_18px_rgba(19,39,24,0.04)]"
              >
                <Image
                  src={item.logoSrc}
                  alt={item.name}
                  width={280}
                  height={90}
                  className="h-auto max-h-[74px] w-auto max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro title={achievementsTestimonialsHeading} description={achievementsTestimonialsDescription} invert />
          <div className="mt-12">
            <FeaturedTestimonialCarousel items={achievementTestimonialVideos} />
          </div>
        </div>
      </section>
    </main>
  )
}
