'use client'

// ACADVIZEN COURSE COMMAND CENTER - the global "Courses" mega-menu. Renders inside
// DesktopNavItem's existing accessible dropdown shell (open/close state, hover-intent delay,
// outside-click, full keyboard support) via its `renderPanel` prop, so this file only owns the
// two-region layout and the course-category CMS data, not menu interaction mechanics.
//
// Category + course data is fetched once on mount (not per-hover) from the same generic,
// publicly-readable entity endpoints the admin CRUD uses (lib/cmsEntities.js), so editing a
// course or category in the CMS updates this menu everywhere it renders without any code change.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'

let cachedData = null
let cachedPromise = null

async function loadMegaMenuData() {
  if (cachedData) return cachedData
  if (cachedPromise) return cachedPromise

  cachedPromise = (async () => {
    try {
      const [categoriesRes, coursesRes] = await Promise.all([
        fetch('/api/cms/entities/course_categories?limit=100', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/cms/entities/courses?limit=200', { cache: 'no-store' }).then((r) => r.json()),
      ])
      const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : []
      const courses = Array.isArray(coursesRes?.data) ? coursesRes.data : []
      cachedData = { categories, courses }
      return cachedData
    } catch {
      cachedData = { categories: [], courses: [] }
      return cachedData
    }
  })()

  return cachedPromise
}

function CourseMetaPills({ course }) {
  const pills = []
  if (course.duration) pills.push(course.duration)
  if (course.learning_mode) pills.push(course.learning_mode)
  if (course.ai_tools_count) pills.push(`${course.ai_tools_count}+ AI Tools`)
  if (course.projects_count) pills.push(`${course.projects_count}+ Projects`)
  if (!pills.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {pills.slice(0, 4).map((pill) => (
        <span key={pill} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {pill}
        </span>
      ))}
    </div>
  )
}

export function CourseMegaMenuPanel({ closeNow }) {
  const [data, setData] = useState(cachedData || { categories: [], courses: [] })
  const [activeCategoryId, setActiveCategoryId] = useState('')

  useEffect(() => {
    let cancelled = false
    loadMegaMenuData().then((result) => {
      if (cancelled) return
      setData(result)
      if (result.categories.length) setActiveCategoryId((prev) => prev || result.categories[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { categories, courses } = data
  const activeCourses = activeCategoryId ? courses.filter((c) => c.category_id === activeCategoryId) : courses
  const [featured, ...rest] = activeCourses

  if (!categories.length && !courses.length) {
    return (
      <div className="w-full p-6 text-sm text-slate-400">
        No published courses yet. Add courses and categories in Admin &rarr; Courses.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[220px_1fr] overflow-hidden rounded-2xl">
      <div className="border-r border-white/10 bg-white/[0.02] p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Program Types</p>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="menuitem"
              onMouseEnter={() => setActiveCategoryId(category.id)}
              onFocus={() => setActiveCategoryId(category.id)}
              onClick={() => setActiveCategoryId(category.id)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                activeCategoryId === category.id
                  ? 'bg-teal-500/15 text-teal-200'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <Link
          to="/courses"
          role="menuitem"
          onClick={closeNow}
          className="mt-3 flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
        >
          Explore All Programs
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-4">
        {!activeCourses.length ? (
          <p className="p-4 text-sm text-slate-400">No published courses in this category yet.</p>
        ) : (
          <>
            {featured ? (
              <Link
                to={`/courses/${featured.slug}`}
                role="menuitem"
                onClick={closeNow}
                className="group block rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent p-4 transition-colors hover:border-teal-400/40"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">Featured Program</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-baseline gap-2 text-lg font-semibold text-white">
                      <span className="text-teal-300/60">01</span>
                      {featured.short_title || featured.title}
                    </p>
                    {featured.subtitle ? <p className="mt-1 text-sm text-slate-300">{featured.subtitle}</p> : null}
                    <CourseMetaPills course={featured} />
                  </div>
                  <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-teal-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ) : null}

            {rest.length ? (
              <div className="mt-3 divide-y divide-white/5 border-t border-white/5">
                {rest.slice(0, 5).map((course, index) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.slug}`}
                    role="menuitem"
                    onClick={closeNow}
                    className="group flex items-center justify-between gap-3 py-2.5 text-sm text-slate-200 transition-colors hover:text-white"
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="text-xs text-slate-500">{String(index + 2).padStart(2, '0')}</span>
                      <span className="truncate font-medium">{course.short_title || course.title}</span>
                      {course.duration ? <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">&middot; {course.duration}</span> : null}
                    </span>
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-300" />
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Touch-friendly mobile equivalent: "Courses >" -> tap -> category list -> tap category -> course
 * list -> "Explore All Programs". Deliberately not the desktop two-column panel squeezed down -
 * a proper two-step drill-down that fits the mobile slide-out nav panel this renders inside of.
 */
export function CourseMobileMenu({ onNavigate }) {
  const [data, setData] = useState(cachedData || { categories: [], courses: [] })
  const [openCategory, setOpenCategory] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadMegaMenuData().then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { categories, courses } = data

  if (!categories.length && !courses.length) {
    return (
      <Link to="/courses" onClick={onNavigate} className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]">
        Courses
      </Link>
    )
  }

  if (openCategory) {
    const categoryCourses = courses.filter((c) => c.category_id === openCategory.id)
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenCategory(null)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-teal-300 hover:bg-white/[0.05]"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Courses
        </button>
        <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{openCategory.name}</p>
        <div className="space-y-0.5">
          {categoryCourses.length ? (
            categoryCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                onClick={onNavigate}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
              >
                {course.short_title || course.title}
                {course.duration ? <span className="text-xs text-slate-500">{course.duration}</span> : null}
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-slate-500">No published courses in this category yet.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Programs</p>
      <div className="space-y-0.5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setOpenCategory(category)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            {category.name}
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-500" />
          </button>
        ))}
      </div>
      <Link
        to="/courses"
        onClick={onNavigate}
        className="mt-2 flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
      >
        Explore All Programs
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
