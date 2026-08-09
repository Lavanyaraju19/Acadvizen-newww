'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

const FIELDS = [
  { key: 'duration', label: 'Duration', get: (c) => (c.duration_value ? `${c.duration_value} ${c.duration_unit || ''}`.trim() : null) },
  { key: 'learning_mode', label: 'Mode', get: (c) => c.learning_mode },
  { key: 'learning_hours', label: 'Learning Hours', get: (c) => (c.learning_hours ? `${c.learning_hours} hrs` : null) },
  { key: 'projects_count', label: 'Live Projects', get: (c) => c.projects_count },
  { key: 'case_studies_count', label: 'Case Studies', get: (c) => c.case_studies_count },
  { key: 'ai_tools_count', label: 'AI Tools Covered', get: (c) => c.ai_tools_count },
  { key: 'certification_count', label: 'Certifications', get: (c) => c.certification_count },
  { key: 'internship', label: 'Internship', get: (c) => (c.internship === null || c.internship === undefined ? null : c.internship ? 'Included' : 'Not included') },
  { key: 'placement_support', label: 'Placement Support', get: (c) => (c.placement_support === null || c.placement_support === undefined ? null : c.placement_support ? 'Included' : 'Not included') },
]

function fieldValue(field, course) {
  const value = field.get(course)
  if (value === null || value === undefined || value === '') return 'Not specified'
  return String(value)
}

// Real-data comparison only - every cell reads directly off the course record and shows an
// honest "Not specified" fallback rather than ever inventing a value.
export default function CompareProgramsPanel({ courses = [] }) {
  const [selectedSlugs, setSelectedSlugs] = useState(() => courses.slice(0, 2).map((c) => c.slug))

  if (courses.length < 2) return null

  const selected = courses.filter((c) => selectedSlugs.includes(c.slug))

  function toggle(slug) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 4) return prev
      return [...prev, slug]
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {courses.map((course) => {
          const active = selectedSlugs.includes(course.slug)
          return (
            <button
              key={course.slug}
              type="button"
              onClick={() => toggle(course.slug)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-teal-300/40 bg-teal-300/15 text-teal-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {active ? <Check className="mr-1.5 inline h-3.5 w-3.5" /> : null}
              {course.title}
            </button>
          )
        })}
      </div>
      <p className="text-center text-xs text-slate-500">Select 2-4 programs to compare ({selected.length} selected).</p>

      {selected.length >= 2 ? (
        <div className="immersive-glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Field</th>
                {selected.map((course) => (
                  <th key={course.slug} className="px-5 py-4 text-left text-sm font-semibold text-white">
                    {course.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => (
                <tr key={field.key} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</td>
                  {selected.map((course) => (
                    <td key={course.slug} className="px-5 py-3 text-slate-200">
                      {fieldValue(field, course)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <X className="h-4 w-4" /> Select at least 2 programs to see a comparison.
        </p>
      )}
    </div>
  )
}
