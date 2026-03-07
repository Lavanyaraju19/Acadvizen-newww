export const revalidate = 1;

import Link from 'next/link'
import { LayoutDashboard, BookOpen, GraduationCap, Image as ImageIcon, Search } from 'lucide-react'
import { Surface } from '../../src/components/ui/Surface'

export default function Page() {
  const quickLinks = [
    { href: '/admin/pages', label: 'Pages', icon: LayoutDashboard },
    { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
    { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
    { href: '/admin/media', label: 'Media Library', icon: ImageIcon },
    { href: '/admin/seo', label: 'SEO', icon: Search },
  ]

  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Dashboard</h2>
      <p className="mt-1 text-sm text-slate-300">
        Full CMS controls for pages, blogs, courses, media, and SEO.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-200 hover:bg-white/[0.05]"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </Surface>
  )
}

