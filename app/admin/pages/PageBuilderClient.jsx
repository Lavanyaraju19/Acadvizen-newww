'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Surface } from '../../../src/components/ui/Surface'

const SECTION_TYPES = [
  'hero',
  'text_block',
  'image_block',
  'video_block',
  'two_column_layout',
  'three_column_layout',
  'testimonial',
  'faq',
  'gallery',
  'cta_banner',
  'stats_section',
  'feature_cards',
  'custom_rich_text',
  'testimonials_feed',
  'placement_feed',
  'recruiters_feed',
  'instructors_feed',
  'certifications_feed',
  'success_stories_feed',
  'metrics_counters',
  'trust_badges_feed',
  'community_events_feed',
  'cta_block_ref',
  'lead_form',
]

function toSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function parseLines(value = '') {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function formFromContent(content = {}) {
  return {
    heading: content.heading || '',
    subheading: content.subheading || '',
    text: content.text || '',
    listText: Array.isArray(content.list) ? content.list.join('\n') : '',
    imageSrc: content.src || '',
    imageAlt: content.alt || '',
    videoUrl: content.embed_url || content.url || '',
    buttonLabel: content.button?.label || '',
    buttonHref: content.button?.href || '',
    buttonTarget: content.button?.target || '_self',
    padding: content.padding || 'md',
    alignment: content.alignment || 'left',
    mobileHidden: Boolean(content.mobile_hidden),
    desktopHidden: Boolean(content.desktop_hidden),
    feedLimit: content.limit || '',
    ctaKey: content.cta_key || content.key || '',
    leadSource: content.source || '',
    leadFormType: content.form_type || '',
    successMessage: content.success_message || '',
    rawJson: JSON.stringify(content, null, 2),
  }
}

function formFromStyle(style = {}) {
  return {
    bgColor: style.background_color || style.section_background || '',
    textColor: style.text_color || '',
    headingSize: style.heading_size || 'md',
    textSize: style.text_size || 'md',
    fontFamily: style.font_family || 'poppins',
    buttonBg: style.button_background || '',
    buttonText: style.button_text_color || '',
    imageWidth: style.image_width || '',
    imageHeight: style.image_height || '',
    imageRadius: style.image_radius || '',
    imageFit: style.image_fit || 'cover',
    layoutVariant: style.layout_variant || 'default',
    columns: style.columns || 3,
    maxWidth: style.max_width || '',
  }
}

function contentFromForm(form) {
  const payload = {
    heading: form.heading || undefined,
    subheading: form.subheading || undefined,
    text: form.text || undefined,
    list: parseLines(form.listText),
    src: form.imageSrc || undefined,
    alt: form.imageAlt || undefined,
    embed_url: form.videoUrl || undefined,
    button:
      form.buttonLabel || form.buttonHref
        ? {
            label: form.buttonLabel || 'Learn more',
            href: form.buttonHref || '#',
            target: form.buttonTarget || '_self',
          }
        : undefined,
    padding: form.padding || 'md',
    alignment: form.alignment || 'left',
    mobile_hidden: Boolean(form.mobileHidden),
    desktop_hidden: Boolean(form.desktopHidden),
    limit: Number(form.feedLimit) || undefined,
    cta_key: form.ctaKey || undefined,
    source: form.leadSource || undefined,
    form_type: form.leadFormType || undefined,
    success_message: form.successMessage || undefined,
  }

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false
      if (key === 'button' && !value?.label && !value?.href) return false
      return true
    })
  )

  if (form.rawJson?.trim()) {
    try {
      const raw = JSON.parse(form.rawJson)
      return { ...cleaned, ...(raw || {}) }
    } catch {
      return cleaned
    }
  }
  return cleaned
}

function styleFromForm(form) {
  const payload = {
    background_color: form.bgColor || undefined,
    text_color: form.textColor || undefined,
    heading_size: form.headingSize || undefined,
    text_size: form.textSize || undefined,
    font_family: form.fontFamily || undefined,
    button_background: form.buttonBg || undefined,
    button_text_color: form.buttonText || undefined,
    image_width: form.imageWidth || undefined,
    image_height: form.imageHeight || undefined,
    image_radius: form.imageRadius || undefined,
    image_fit: form.imageFit || undefined,
    layout_variant: form.layoutVariant || undefined,
    columns: Number(form.columns) || undefined,
    max_width: form.maxWidth || undefined,
    padding: form.padding || undefined,
    alignment: form.alignment || undefined,
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export default function PageBuilderClient() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [selectedPageId, setSelectedPageId] = useState('')
  const [pageForm, setPageForm] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    seo_title: '',
    seo_description: '',
    status: 'draft',
  })
  const [sectionForm, setSectionForm] = useState({
    id: '',
    type: 'hero',
    isVisible: true,
    heading: '',
    subheading: '',
    text: '',
    listText: '',
    imageSrc: '',
    imageAlt: '',
    videoUrl: '',
    buttonLabel: '',
    buttonHref: '',
    buttonTarget: '_self',
    padding: 'md',
    alignment: 'left',
    mobileHidden: false,
    desktopHidden: false,
    rawJson: '',
    feedLimit: '',
    ctaKey: '',
    leadSource: '',
    leadFormType: '',
    successMessage: '',
    bgColor: '',
    textColor: '',
    headingSize: 'md',
    textSize: 'md',
    fontFamily: 'poppins',
    buttonBg: '',
    buttonText: '',
    imageWidth: '',
    imageHeight: '',
    imageRadius: '',
    imageFit: 'cover',
    layoutVariant: 'default',
    columns: 3,
    maxWidth: '',
  })
  const [draggingId, setDraggingId] = useState('')

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || null,
    [pages, selectedPageId]
  )
  const sections = useMemo(
    () =>
      (selectedPage?.sections || [])
        .slice()
        .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0)),
    [selectedPage]
  )

  async function loadPages(nextSelectedId) {
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/cms/pages?include_drafts=1&include_sections=1', { cache: 'no-store' })
      const payload = await res.json()
      if (!payload?.success) throw new Error(payload?.error || 'Failed to load pages.')
      const nextPages = Array.isArray(payload.data) ? payload.data : []
      setPages(nextPages)
      const selectedId = nextSelectedId || selectedPageId || nextPages[0]?.id || ''
      setSelectedPageId(selectedId)
      if (selectedId) {
        const page = nextPages.find((item) => item.id === selectedId)
        if (page) {
          setPageForm({
            id: page.id,
            title: page.title || '',
            slug: page.slug || '',
            description: page.description || '',
            seo_title: page.seo_title || '',
            seo_description: page.seo_description || '',
            status: page.status || 'draft',
          })
        }
      }
    } catch (error) {
      setStatus(error?.message || 'Unable to load pages.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncPageForm = (page) => {
    if (!page) return
    setPageForm({
      id: page.id,
      title: page.title || '',
      slug: page.slug || '',
      description: page.description || '',
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      status: page.status || 'draft',
    })
  }

  const beginCreatePage = () => {
    setPageForm({
      id: '',
      title: '',
      slug: '',
      description: '',
      seo_title: '',
      seo_description: '',
      status: 'draft',
    })
  }

  const beginEditSection = (section) => {
    setSectionForm({
      id: section.id,
      type: section.type || 'hero',
      isVisible: section.visibility !== false,
      ...formFromContent(section.content_json || {}),
      ...formFromStyle(section.style_json || {}),
    })
  }

  const resetSectionForm = () => {
    setSectionForm({
      id: '',
      type: 'hero',
      isVisible: true,
      heading: '',
      subheading: '',
      text: '',
      listText: '',
      imageSrc: '',
      imageAlt: '',
      videoUrl: '',
      buttonLabel: '',
      buttonHref: '',
      buttonTarget: '_self',
      padding: 'md',
      alignment: 'left',
      mobileHidden: false,
      desktopHidden: false,
      rawJson: '',
      feedLimit: '',
      ctaKey: '',
      leadSource: '',
      leadFormType: '',
      successMessage: '',
      bgColor: '',
      textColor: '',
      headingSize: 'md',
      textSize: 'md',
      fontFamily: 'poppins',
      buttonBg: '',
      buttonText: '',
      imageWidth: '',
      imageHeight: '',
      imageRadius: '',
      imageFit: 'cover',
      layoutVariant: 'default',
      columns: 3,
      maxWidth: '',
    })
  }

  async function handleSavePage(event) {
    event.preventDefault()
    if (!pageForm.title.trim()) {
      setStatus('Page title is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...pageForm,
        slug: pageForm.slug?.trim() || toSlug(pageForm.title),
      }
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to save page.')
      await loadPages(json.data?.id)
      setStatus('Page saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save page.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePage() {
    if (!pageForm.id) return
    if (!window.confirm('Delete this page and all its sections?')) return
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch(`/api/cms/pages/${pageForm.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to delete page.')
      beginCreatePage()
      await loadPages('')
      setStatus('Page deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete page.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSection(event) {
    event.preventDefault()
    if (!selectedPageId) {
      setStatus('Create or select a page first.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        page_id: selectedPageId,
        type: sectionForm.type,
        order_index: sectionForm.id
          ? sections.find((item) => item.id === sectionForm.id)?.order_index || sections.length
          : sections.length,
        content_json: contentFromForm(sectionForm),
        style_json: styleFromForm(sectionForm),
        visibility: sectionForm.isVisible !== false,
      }

      let res
      if (sectionForm.id) {
        res = await fetch(`/api/cms/sections/${sectionForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/cms/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to save section.')
      await loadPages(selectedPageId)
      resetSectionForm()
      setStatus('Section saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save section.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSection(id) {
    if (!window.confirm('Delete this section?')) return
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch(`/api/cms/sections/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to delete section.')
      await loadPages(selectedPageId)
      setStatus('Section deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete section.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateSection(id) {
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch('/api/cms/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', id }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to duplicate section.')
      await loadPages(selectedPageId)
      setStatus('Section duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate section.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisibility(section) {
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch(`/api/cms/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: !section.visibility }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to update visibility.')
      await loadPages(selectedPageId)
      setStatus('Section visibility updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to update visibility.')
    } finally {
      setSaving(false)
    }
  }

  async function reorderSections(nextSections) {
    setSaving(true)
    setStatus('')
    try {
      await Promise.all(
        nextSections.map((section, index) =>
          fetch(`/api/cms/sections/${section.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: index }),
          })
        )
      )
      await loadPages(selectedPageId)
      setStatus('Section order updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder sections.')
    } finally {
      setSaving(false)
      setDraggingId('')
    }
  }

  function onDropSection(targetId) {
    if (!draggingId || draggingId === targetId) return
    const copy = sections.slice()
    const fromIndex = copy.findIndex((item) => item.id === draggingId)
    const toIndex = copy.findIndex((item) => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = copy.splice(fromIndex, 1)
    copy.splice(toIndex, 0, moved)
    reorderSections(copy)
  }

  async function saveReusableBlock() {
    if (!sectionForm.heading && !sectionForm.text) {
      setStatus('Add heading or content before saving reusable block.')
      return
    }
    setSaving(true)
    setStatus('')
    try {
      const payload = {
        name: `${sectionForm.type}-${Date.now()}`,
        type: sectionForm.type,
        content_json: contentFromForm(sectionForm),
        style_json: styleFromForm(sectionForm),
        status: 'draft',
      }
      const res = await fetch('/api/cms/entities/reusable_blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to save reusable block.')
      setStatus('Reusable block saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save reusable block.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Page Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Create pages, add sections, reorder with drag and drop, and publish instantly.</p>
        </div>
        <button
          type="button"
          onClick={beginCreatePage}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          New Page
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-slate-100">Pages</h3>
          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="text-xs text-slate-400">Loading...</div>
            ) : pages.length === 0 ? (
              <div className="text-xs text-slate-400">No pages yet.</div>
            ) : (
              pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setSelectedPageId(page.id)
                    syncPageForm(page)
                    resetSectionForm()
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedPageId === page.id
                      ? 'bg-teal-300 text-slate-950'
                      : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="font-semibold">{page.title}</div>
                  <div className="text-xs opacity-80">/{page.slug}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="space-y-6">
          <form onSubmit={handleSavePage} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100">Page Details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Title
                <input
                  value={pageForm.title}
                  onChange={(event) =>
                    setPageForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                      slug: prev.slug || toSlug(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Slug
                <input
                  value={pageForm.slug}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, slug: toSlug(event.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Description
                <textarea
                  rows={3}
                  value={pageForm.description}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                SEO Title
                <input
                  value={pageForm.seo_title}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Status
                <select
                  value={pageForm.status}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                >
                  <option value="draft" className="bg-[#07101b]">Draft</option>
                  <option value="published" className="bg-[#07101b]">Published</option>
                </select>
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                SEO Description
                <textarea
                  rows={2}
                  value={pageForm.seo_description}
                  onChange={(event) => setPageForm((prev) => ({ ...prev, seo_description: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>
              {pageForm.id ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeletePage}
                  className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
                >
                  Delete Page
                </button>
              ) : null}
              {pageForm.slug ? (
                <Link
                  href={`/${pageForm.slug}`}
                  target="_blank"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
                >
                  Preview
                </Link>
              ) : null}
            </div>
          </form>

          <form onSubmit={handleSaveSection} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100">{sectionForm.id ? 'Edit Section' : 'Add Section'}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-slate-400">
                Section Type
                <select
                  value={sectionForm.type}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, type: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                >
                  {SECTION_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#07101b]">
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Heading
                <input
                  value={sectionForm.heading}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, heading: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Subheading
                <input
                  value={sectionForm.subheading}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, subheading: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Paragraph
                <textarea
                  rows={4}
                  value={sectionForm.text}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, text: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                List Items (one per line)
                <textarea
                  rows={4}
                  value={sectionForm.listText}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, listText: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Image URL
                <input
                  value={sectionForm.imageSrc}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, imageSrc: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Image Alt Text
                <input
                  value={sectionForm.imageAlt}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, imageAlt: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Video URL / Embed URL
                <input
                  value={sectionForm.videoUrl}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Data Feed Limit
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sectionForm.feedLimit}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, feedLimit: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                CTA Block Key (for `cta_block_ref`)
                <input
                  value={sectionForm.ctaKey}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, ctaKey: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Lead Source (for `lead_form`)
                <input
                  value={sectionForm.leadSource}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, leadSource: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Lead Form Type
                <input
                  value={sectionForm.leadFormType}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, leadFormType: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Lead Success Message
                <input
                  value={sectionForm.successMessage}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, successMessage: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Button Label
                <input
                  value={sectionForm.buttonLabel}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonLabel: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Button URL
                <input
                  value={sectionForm.buttonHref}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonHref: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Padding
                <select
                  value={sectionForm.padding}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, padding: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                >
                  {['none', 'sm', 'md', 'lg'].map((value) => (
                    <option key={value} value={value} className="bg-[#07101b]">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Alignment
                <select
                  value={sectionForm.alignment}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, alignment: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                >
                  {['left', 'center', 'right'].map((value) => (
                    <option key={value} value={value} className="bg-[#07101b]">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sectionForm.isVisible}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, isVisible: event.target.checked }))}
                />
                Section visible
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sectionForm.mobileHidden}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, mobileHidden: event.target.checked }))}
                />
                Hide on mobile
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sectionForm.desktopHidden}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, desktopHidden: event.target.checked }))}
                />
                Hide on desktop
              </label>
              <label className="text-xs text-slate-400 md:col-span-2">
                Advanced JSON (optional override)
                <textarea
                  rows={6}
                  value={sectionForm.rawJson}
                  onChange={(event) => setSectionForm((prev) => ({ ...prev, rawJson: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-slate-100"
                />
              </label>
              <div className="md:col-span-2 mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Visual Style Controls</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="text-xs text-slate-400">
                    Background Color
                    <input
                      type="text"
                      placeholder="#0f172a"
                      value={sectionForm.bgColor}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, bgColor: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Text Color
                    <input
                      type="text"
                      placeholder="#cbd5e1"
                      value={sectionForm.textColor}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, textColor: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Font Family
                    <select
                      value={sectionForm.fontFamily}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, fontFamily: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    >
                      {['poppins', 'montserrat', 'lato', 'open_sans', 'inter', 'system'].map((value) => (
                        <option key={value} value={value} className="bg-[#07101b]">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">
                    Heading Size
                    <select
                      value={sectionForm.headingSize}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, headingSize: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    >
                      {['sm', 'md', 'lg'].map((value) => (
                        <option key={value} value={value} className="bg-[#07101b]">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">
                    Text Size
                    <select
                      value={sectionForm.textSize}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, textSize: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    >
                      {['sm', 'md', 'lg'].map((value) => (
                        <option key={value} value={value} className="bg-[#07101b]">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">
                    Layout Variant
                    <input
                      value={sectionForm.layoutVariant}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, layoutVariant: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Button Bg
                    <input
                      type="text"
                      placeholder="#5eead4"
                      value={sectionForm.buttonBg}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonBg: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      placeholder="#020617"
                      value={sectionForm.buttonText}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, buttonText: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Image Width
                    <input
                      value={sectionForm.imageWidth}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, imageWidth: event.target.value }))}
                      placeholder="100%"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Image Height
                    <input
                      value={sectionForm.imageHeight}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, imageHeight: event.target.value }))}
                      placeholder="420px"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Image Radius
                    <input
                      value={sectionForm.imageRadius}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, imageRadius: event.target.value }))}
                      placeholder="16px"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Image Fit
                    <select
                      value={sectionForm.imageFit}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, imageFit: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    >
                      {['cover', 'contain', 'fill'].map((value) => (
                        <option key={value} value={value} className="bg-[#07101b]">
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400">
                    Columns
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={sectionForm.columns}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, columns: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Max Width
                    <input
                      value={sectionForm.maxWidth}
                      onChange={(event) => setSectionForm((prev) => ({ ...prev, maxWidth: event.target.value }))}
                      placeholder="1200px"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70"
              >
                {saving ? 'Saving...' : sectionForm.id ? 'Update Section' : 'Add Section'}
              </button>
              <button
                type="button"
                onClick={resetSectionForm}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveReusableBlock}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
              >
                Save as Reusable Block
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100">Sections</h3>
            <p className="mt-1 text-xs text-slate-400">Drag and drop to reorder sections.</p>
            <div className="mt-4 space-y-3">
              {!selectedPage ? (
                <div className="text-sm text-slate-400">Select a page to manage sections.</div>
              ) : sections.length === 0 ? (
                <div className="text-sm text-slate-400">No sections yet.</div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => setDraggingId(section.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDropSection(section.id)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {section.type} <span className="text-slate-500">#{section.order_index}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {section.visibility ? 'Visible' : 'Hidden'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => beginEditSection(section)}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSection(section.id)}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVisibility(section)}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
                        >
                          {section.visibility ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(section.id)}
                          className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
    </Surface>
  )
}
