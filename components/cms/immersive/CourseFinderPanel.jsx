'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Target } from 'lucide-react'

// Goal-based recommendations come entirely from the admin-managed course_finder_goals table
// (goal -> course_slugs), matched against the real courses list passed in as props. Nothing
// here is hard-coded per goal - if an admin hasn't configured any goals yet, this renders
// nothing rather than fabricating a goal list.
export default function CourseFinderPanel({ goals = [], courses = [] }) {
  const [activeGoalId, setActiveGoalId] = useState(goals[0]?.id || null)
  if (!goals.length) return null

  const activeGoal = goals.find((g) => g.id === activeGoalId) || goals[0]
  const slugs = Array.isArray(activeGoal?.course_slugs) ? activeGoal.course_slugs : []
  const matches = courses.filter((c) => slugs.includes(c.slug))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-3">
        {goals.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => setActiveGoalId(goal.id)}
            className={`immersive-glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
              activeGoal?.id === goal.id ? 'border-teal-300/40 text-teal-100' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Target className="h-4 w-4" />
            {goal.goal}
          </button>
        ))}
      </div>

      {activeGoal?.description ? (
        <p className="mx-auto max-w-2xl text-center text-sm text-slate-400">{activeGoal.description}</p>
      ) : null}

      {matches.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="immersive-glass group flex flex-col justify-between rounded-2xl p-6 transition hover:-translate-y-1 hover:border-teal-300/25"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                {course.short_description ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{course.short_description}</p>
                ) : null}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-300">
                View program <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">No programs are mapped to this goal yet.</p>
      )}
    </div>
  )
}
