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

  const projectFields = useMemo(
    () => [
      { key: 'course_id', label: 'Course', type: 'select', optionsFrom: 'courses', optionsLabelKey: 'title', emptyLabel: 'Select course' },
      { key: 'title', label: 'Project Title' },
      { key: 'domain', label: 'Domain / Skill (e.g. SEO, Paid Ads)' },
      { key: 'image_url', label: 'Project Image', type: 'file', bucket: 'site-assets', accept: 'image/*' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, full: true },
      { key: 'tools_used', label: 'Tools Used (comma separated, e.g. Google Ads, Canva, GA4)', full: true },
      { key: 'outcome', label: 'Outcome / Result (optional)', full: true },
      { key: 'order_index', label: 'Display Order', type: 'number', default: 0 },
      { key: 'is_active', label: 'Visible on the course page', type: 'checkbox', default: true },
    ],
    []
  )

  const galleryFields = useMemo(
    () => [
      { key: 'course_id', label: 'Course', type: 'select', optionsFrom: 'courses', optionsLabelKey: 'title', emptyLabel: 'Select course' },
      { key: 'image_url', label: 'Image', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
      { key: 'caption', label: 'Caption (optional)', full: true },
      { key: 'alt_text', label: 'Alt Text (for accessibility, optional)', full: true },
      { key: 'order_index', label: 'Display Order (first image is shown large)', type: 'number', default: 0 },
      { key: 'is_active', label: 'Visible on the course page', type: 'checkbox', default: true },
    ],
    []
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

      <div className="mt-5">
        <EntityCrudManager
          entity="course_projects"
          title="Course Projects"
          subtitle="Real, practical projects shown on a course page's 'Projects you'll build' section. A course with no projects here simply skips that section on the live page."
          fields={projectFields}
        />
      </div>

      <div className="mt-5">
        <EntityCrudManager
          entity="course_gallery"
          title="Course Gallery / Learning Experience"
          subtitle="Real classroom, workshop, and project-presentation photos shown on a course page's 'The learning experience' section. Uploads are added to the Media Library automatically. A course with no images here simply skips that section on the live page."
          fields={galleryFields}
        />
      </div>

      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
    </>
  )
}
