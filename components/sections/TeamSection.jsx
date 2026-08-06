import { bodyClass, headingClass, normalizeContent, normalizeStyle, safeList, safeString, sectionInlineStyle, sectionPaddingClass, sectionVisibilityClass } from './sectionUtils'
import AdaptiveImage from '../media/AdaptiveImage'

export default function TeamSection({ section }) {
  const content = normalizeContent(section)
  const style = normalizeStyle(section)
  const members = safeList(content.members)
  if (!members.length) return null

  return (
    <section className={`${sectionPaddingClass(content, style)} ${sectionVisibilityClass(content)}`} style={sectionInlineStyle(content, style)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {content.heading ? <h2 className={`mb-6 font-semibold text-slate-50 ${headingClass(style)}`}>{safeString(content.heading)}</h2> : null}
        {content.subheading ? <p className={`mb-8 max-w-3xl whitespace-pre-line text-slate-300 ${bodyClass(style)}`}>{safeString(content.subheading)}</p> : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, index) => {
            const socials = safeList(member?.socials)
            return (
              <article key={`${safeString(member?.name)}-${index}`} className="rounded-2xl border border-white/10 bg-[var(--section-card-bg,rgba(255,255,255,0.03))] p-5 text-center">
                {member?.photo ? (
                  <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-white/[0.02]">
                    <AdaptiveImage
                      src={safeString(member.photo)}
                      alt={safeString(member.name, 'Team member')}
                      variant="card"
                      aspectRatio="1 / 1"
                      imageClassName="object-cover"
                      sizes="96px"
                      wrapperClassName="h-full w-full"
                      borderClassName=""
                      roundedClassName="rounded-full"
                    />
                  </div>
                ) : null}
                {member?.name ? <h3 className="text-base font-semibold text-slate-100">{safeString(member.name)}</h3> : null}
                {member?.role ? <p className="mt-1 text-sm text-teal-300">{safeString(member.role)}</p> : null}
                {member?.bio ? <p className="mt-3 text-sm text-slate-400">{safeString(member.bio)}</p> : null}
                {socials.length ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {socials.map((social, socialIndex) => (
                      <a
                        key={`${safeString(social?.href)}-${socialIndex}`}
                        href={safeString(social?.href) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-slate-400 hover:text-teal-300"
                      >
                        {safeString(social?.label, 'Link')}
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
