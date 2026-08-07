import InternalLinksClient from './InternalLinksClient'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <div className="space-y-5">
      <Surface className="space-y-5 p-6 md:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Internal Links</h2>
          <p className="mt-1 text-sm text-slate-300">
            A live map of every internal link across pages, courses, cities, locations, blogs, tools, companies, internships,
            resources, and service pages - computed from current content, not a cached snapshot.
          </p>
        </div>
        <InternalLinksClient />
      </Surface>
    </div>
  )
}
