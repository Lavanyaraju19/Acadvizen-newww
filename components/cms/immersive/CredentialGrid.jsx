import { Award } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

const FALLBACK_BADGE = (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/10 text-teal-200">
    <Award className="h-5 w-5" />
  </span>
)

// Certification credential cards (real `certifications` table: name/issuer/logo_url/description) -
// a step up from a bare logo wall so the issuing body and context are visible, not just a mark.
export default function CredentialGrid({ certifications = [] }) {
  if (!certifications.length) return null
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certifications.map((cert) => (
        <RevealItem key={cert.id || cert.name} as="up">
          <div className="immersive-glass flex h-full items-start gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-teal-300/25">
            {cert.logo_url ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2">
                <SafeImage src={cert.logo_url} alt={cert.name} className="max-h-full w-auto max-w-full object-contain" fallback={FALLBACK_BADGE} />
              </div>
            ) : (
              FALLBACK_BADGE
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{cert.name}</div>
              {cert.issuer ? <div className="mt-0.5 text-xs text-teal-300/80">{cert.issuer}</div> : null}
              {cert.description ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{cert.description}</p> : null}
            </div>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
