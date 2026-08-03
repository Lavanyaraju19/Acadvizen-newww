import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// Visual breadcrumb trail matching the site's dark design system. `items` is ordered from
// Home to the current page: [{ label, href }]. The final item is rendered as plain text
// (current page, not a link). Pair with buildBreadcrumbSchema(items) from lib/structuredData
// for the matching JSON-LD via <JsonLd />.
export default function Breadcrumbs({ items = [] }) {
  const valid = items.filter((item) => item?.label)
  if (valid.length < 2) return null

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        {valid.map((item, index) => {
          const isLast = index === valid.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" /> : null}
              {isLast || !item.href ? (
                <span className="font-medium text-slate-200" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-teal-300">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
