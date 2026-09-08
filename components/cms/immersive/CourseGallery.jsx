import { ImageOff } from 'lucide-react'
import { RevealItem } from './Reveal'
import SafeImage from './SafeImage'

const FALLBACK = (
  <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-slate-600">
    <ImageOff className="h-6 w-6" />
  </div>
)

// Editorial gallery for real Media Library assets (course_gallery table) - one large hero shot
// plus a supporting grid, not a wall of identical squares. Renders nothing if there is no real
// media yet; never fabricates classroom/workshop imagery.
export default function CourseGallery({ items = [] }) {
  const gallery = items.filter((item) => item?.image_url)
  if (!gallery.length) return null

  const [hero, ...rest] = gallery

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:grid-rows-2 sm:gap-4">
      <RevealItem as="up" className="col-span-2 sm:col-span-2 sm:row-span-2">
        <figure className="group relative h-full overflow-hidden rounded-2xl border border-white/10">
          <SafeImage
            src={hero.image_url}
            alt={hero.alt_text || hero.caption || 'Acadvizen learning experience'}
            className="aspect-[16/10] w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-full sm:aspect-auto"
            fallback={FALLBACK}
          />
          {hero.caption ? (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-sm font-medium text-white">
              {hero.caption}
            </figcaption>
          ) : null}
        </figure>
      </RevealItem>
      {rest.slice(0, 4).map((item, index) => (
        <RevealItem key={item.id || item.image_url} as="up" delay={0.06 * (index + 1)}>
          <figure className="group relative h-full overflow-hidden rounded-2xl border border-white/10">
            <SafeImage
              src={item.image_url}
              alt={item.alt_text || item.caption || 'Acadvizen learning experience'}
              className="aspect-square w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:h-full sm:aspect-auto"
              fallback={FALLBACK}
            />
            {item.caption ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 text-xs font-medium text-white">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        </RevealItem>
      ))}
    </div>
  )
}
