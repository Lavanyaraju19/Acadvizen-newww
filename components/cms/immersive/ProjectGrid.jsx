import { FolderKanban, Sparkles, Target } from 'lucide-react'
import { RevealGroup, RevealItem } from './Reveal'
import SafeImage from './SafeImage'

// Practical-experience project cards backed by the real `course_projects` table (Admin > Course
// Details area). Renders nothing if a course has no real project records yet - never invents
// project titles, tools, or outcomes to fill the section.
export default function ProjectGrid({ projects = [] }) {
  if (!projects.length) return null

  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const tools = String(project.tools_used || '')
          .split(',')
          .map((tool) => tool.trim())
          .filter(Boolean)

        return (
          <RevealItem key={project.id} as="up">
            <div className="immersive-glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:border-teal-300/25">
              {project.image_url ? (
                <div className="h-36 w-full overflow-hidden bg-white/[0.02]">
                  <SafeImage
                    src={project.image_url}
                    alt={project.title}
                    className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center">
                        <FolderKanban className="h-8 w-8 text-white/10" />
                      </div>
                    }
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col gap-3 p-5">
                {project.domain ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-300/20 bg-teal-300/[0.06] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-teal-200">
                    <Sparkles className="h-3 w-3" />
                    {project.domain}
                  </span>
                ) : null}
                <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                {project.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{project.description}</p>
                ) : null}
                {tools.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
                        {tool}
                      </span>
                    ))}
                  </div>
                ) : null}
                {project.outcome ? (
                  <div className="mt-auto flex items-start gap-1.5 pt-1 text-xs text-slate-300">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" />
                    <span>{project.outcome}</span>
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
