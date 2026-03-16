export const revalidate = 0
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Surface } from '../../../src/components/ui/Surface'

export default function Page() {
  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-slate-50">Testimonials moved to Trust & Conversion</h2>
      <p className="mt-2 text-sm text-slate-300">
        Manage testimonials, video testimonials, success stories, recruiters, and conversion CTAs from one unified CMS area.
      </p>
      <Link
        href="/admin/trust"
        className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
      >
        Open Trust & Conversion
      </Link>
    </Surface>
  )
}
