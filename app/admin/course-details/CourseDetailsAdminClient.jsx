'use client'

import { useEffect, useMemo, useState } from 'react'
import EntityCrudManager from '../_components/EntityCrudManager'
import { adminApiFetch } from '../../../lib/adminApiClient'

const EMPTY_OPTIONS = [{ value: '', label: 'Select course' }]

export default function CourseDetailsAdminClient() {
  const [courseOptions, setCourseOptions] = useState(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let active = true

    async function loadCourses() {
      setLoading(true)
      setStatus('')
      try {
        const response = await adminApiFetch('/api/cms/entities/courses?limit=500', { cache: 'no-store' })
        if (!active) return

        const options = Array.isArray(response?.data)
          ? response.data.map((item) => ({ value: item.id, label: item.title || item.slug || 'Untitled course' }))
          : []
        setCourseOptions([...EMPTY_OPTIONS, ...options])
      } catch (error) {
        if (!active) return
        setStatus(error?.message || 'Failed to load course options.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCourses()
    return () => {
      active = false
    }
  }, [])

  const fields = useMemo(
    () => [
      { key: 'course_id', label: 'Course', type: 'select', options: courseOptions },
      { key: 'section_title', label: 'Section Title' },
      { key: 'content', label: 'Content', type: 'textarea', rows: 6, full: true },
      { key: 'order_index', label: 'Order Index', type: 'number' },
    ],
    [courseOptions]
  )

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
        Loading course detail options...
      </div>
    )
  }

  return (
    <>
      <EntityCrudManager
        entity="course_details"
        title="Course Details"
        subtitle="Manage the section-by-section detail content that appears inside course detail pages."
        fields={fields}
      />
      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
    </>
  )
}
