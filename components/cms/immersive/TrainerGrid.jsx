import { Linkedin } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

// Instructor/trainer cards backed by the real `instructors` table (Admin > Trust & Conversion).
// Photo uses a controlled portrait aspect-ratio box (object-cover) so differently-sized admin
// uploads never break card alignment - falls back to an initial avatar tile when no photo is set.
export default function TrainerGrid({ trainers = [] }) {
  if (!trainers.length) return null
  return (
    <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trainers.map((trainer) => {
        const expertise = Array.isArray(trainer.expertise) ? trainer.expertise.filter((tag) => typeof tag === 'string') : []
        return (
          <RevealItem key={trainer.id || trainer.name} as="up">
            <div className="immersive-glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-teal-300/25">
              <div className="aspect-[4/5] w-full overflow-hidden bg-white/[0.02]">
                <SafeImage
                  src={trainer.image_url}
                  alt={trainer.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center bg-teal-300/[0.06]">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-300/15 text-2xl font-semibold text-teal-200">
                        {(trainer.name || '?').charAt(0)}
                      </span>
                    </div>
                  }
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-white">{trainer.name}</div>
                    {trainer.title ? <div className="mt-0.5 text-xs text-teal-300/80">{trainer.title}</div> : null}
                  </div>
                  {trainer.linkedin_url ? (
                    <a
                      href={trainer.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${trainer.name} on LinkedIn`}
                      className="shrink-0 text-slate-500 transition hover:text-teal-300"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
                {trainer.bio ? <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">{trainer.bio}</p> : null}
                {expertise.length ? (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    {expertise.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
