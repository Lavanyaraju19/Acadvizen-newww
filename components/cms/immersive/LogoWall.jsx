import { RevealGroup, RevealItem } from './Reveal'

// Grid of hiring-partner logos. Renders nothing (not a placeholder grid) if no real logos exist.
export default function LogoWall({ companies = [] }) {
  const withLogos = companies.filter((c) => c.logo)
  if (!withLogos.length) return null
  return (
    <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {withLogos.map((company) => (
        <RevealItem key={company.slug || company.name} as="scale">
          <div className="immersive-glass flex h-20 items-center justify-center rounded-2xl p-4 transition hover:border-teal-300/25">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-supplied logo URL */}
            <img src={company.logo} alt={company.name} loading="lazy" className="max-h-10 w-auto max-w-full object-contain" />
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
