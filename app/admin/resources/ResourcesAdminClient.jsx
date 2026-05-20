'use client'

import { useEffect, useMemo, useState } from 'react'
import EntityCrudManager from '../_components/EntityCrudManager'
import { adminApiFetch } from '../../../lib/adminApiClient'

const EMPTY_OPTIONS = [{ value: '', label: 'None' }]

export default function ResourcesAdminClient() {
  const [courseOptions, setCourseOptions] = useState(EMPTY_OPTIONS)
  const [toolOptions, setToolOptions] = useState(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let active = true

    async function loadOptions() {
      setLoading(true)
      setStatus('')
      try {
        const [coursesResponse, toolsResponse] = await Promise.all([
          adminApiFetch('/api/cms/entities/courses?limit=500', { cache: 'no-store' }),
          adminApiFetch('/api/cms/entities/tools_extended?limit=500', { cache: 'no-store' }),
        ])

        if (!active) return

        const nextCourses = Array.isArray(coursesResponse?.data)
          ? coursesResponse.data.map((item) => ({ value: item.id, label: item.title || item.slug || 'Untitled course' }))
          : []
        const nextTools = Array.isArray(toolsResponse?.data)
          ? toolsResponse.data.map((item) => ({ value: item.id, label: item.name || item.slug || 'Untitled tool' }))
          : []

        setCourseOptions([...EMPTY_OPTIONS, ...nextCourses])
        setToolOptions([...EMPTY_OPTIONS, ...nextTools])
      } catch (error) {
        if (!active) return
        setStatus(error?.message || 'Failed to load course and tool options.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadOptions()
    return () => {
      active = false
    }
  }, [])

  const fields = useMemo(
    () => [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
      { key: 'file_url', label: 'File URL', type: 'file', bucket: 'documents', accept: '.pdf,.doc,.docx,.ppt,.pptx,.zip,image/*,video/*' },
      { key: 'external_url', label: 'External URL' },
      { key: 'course_id', label: 'Course', type: 'select', options: courseOptions },
      { key: 'tool_id', label: 'Tool', type: 'select', options: toolOptions },
      {
        key: 'resource_type',
        label: 'Resource Type',
        type: 'select',
        options: [
          { value: 'pdf', label: 'PDF' },
          { value: 'video', label: 'Video' },
          { value: 'image', label: 'Image' },
          { value: 'brochure', label: 'Brochure' },
          { value: 'llm_link', label: 'LLM Link' },
        ],
      },
      { key: 'order_index', label: 'Order Index', type: 'number' },
      { key: 'is_active', label: 'Published', type: 'checkbox' },
    ],
    [courseOptions, toolOptions]
  )

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
        Loading resource relationships...
      </div>
    )
  }

  return (
    <>
      <EntityCrudManager
        entity="resources"
        title="Resources"
        subtitle="Manage downloadable resources and link them to courses and tools."
        fields={fields}
      />
      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}
    </>
  )
}
