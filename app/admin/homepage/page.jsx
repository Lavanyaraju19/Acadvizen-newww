'use client'

import { Surface } from '../../../src/components/ui/Surface'
import { 
  Rocket,
  BookOpen,
  Layers,
  GraduationCap,
  FolderKanban,
  Building2,
  Briefcase,
  MessageSquare,
  HelpCircle,
  Wrench,
  ArrowRight,
  Settings,
  Eye
} from 'lucide-react'

const HOMEPAGE_SECTIONS = [
  {
    id: 'hero',
    title: 'Hero Section',
    description: 'Main hero banner with headline, subheading, and call-to-action',
    icon: Rocket,
    path: '/admin/homepage/hero',
    color: 'text-purple-400'
  },
  {
    id: 'course-highlights',
    title: 'Course Highlights',
    description: 'Featured courses showcase with cards and details',
    icon: BookOpen,
    path: '/admin/homepage/course-highlights',
    color: 'text-blue-400'
  },
  {
    id: 'course-modules',
    title: 'Course Modules',
    description: 'Module breakdown and learning path sections',
    icon: Layers,
    path: '/admin/homepage/course-modules',
    color: 'text-cyan-400'
  },
  {
    id: 'curriculum',
    title: 'Curriculum',
    description: 'Detailed curriculum outline and syllabus',
    icon: GraduationCap,
    path: '/admin/homepage/curriculum',
    color: 'text-emerald-400'
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Student projects and portfolio showcase',
    icon: FolderKanban,
    path: '/admin/homepage/projects',
    color: 'text-orange-400'
  },
  {
    id: 'partners',
    title: 'Partners',
    description: 'Partner companies and collaborators',
    icon: Building2,
    path: '/admin/homepage/partners',
    color: 'text-indigo-400'
  },
  {
    id: 'placements',
    title: 'Placements',
    description: 'Placement statistics and hiring companies',
    icon: Briefcase,
    path: '/admin/homepage/placements',
    color: 'text-amber-400'
  },
  {
    id: 'testimonials',
    title: 'Testimonials',
    description: 'Student reviews and success stories',
    icon: MessageSquare,
    path: '/admin/homepage/testimonials',
    color: 'text-pink-400'
  },
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: HelpCircle,
    path: '/admin/homepage/faq',
    color: 'text-teal-400'
  },
  {
    id: 'tools',
    title: 'Tools',
    description: 'Tools and technologies section',
    icon: Wrench,
    path: '/admin/homepage/tools',
    color: 'text-slate-400'
  },
  {
    id: 'cta',
    title: 'Call-to-Action',
    description: 'Final CTA section with buttons and links',
    icon: ArrowRight,
    path: '/admin/homepage/cta',
    color: 'text-rose-400'
  }
]

export default function HomepageBuilderPage() {
  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Homepage Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage and customize each section of your homepage</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {HOMEPAGE_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-xl bg-white/[0.05] ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => window.location.href = section.path}
                className="px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-sm font-medium transition-colors"
              >
                Edit
              </button>
            </div>
            
            <h3 className="text-base font-semibold text-slate-100 mb-2">{section.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{section.description}</p>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => window.location.href = section.path}
                className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Configure section
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05] text-left transition-colors"
          >
            <Eye className="w-5 h-5 mb-2 text-teal-400" />
            <div className="font-medium">Preview Homepage</div>
            <div className="text-xs text-slate-400">View your homepage in a new tab</div>
          </button>
          
          <button
            type="button"
            onClick={() => window.location.href = '/admin/pages'}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05] text-left transition-colors"
          >
            <Settings className="w-5 h-5 mb-2 text-teal-400" />
            <div className="font-medium">Page Settings</div>
            <div className="text-xs text-slate-400">Manage page metadata and SEO</div>
          </button>
        </div>
      </div>
    </Surface>
  )
}
