'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Surface } from '../../../src/components/ui/Surface'
import { uploadFile } from '../../../lib/storageUpload'

const BLOCK_TYPES = ['heading', 'paragraph', 'list', 'quote', 'image', 'video', 'link']

function toSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function splitComma(value = '') {
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function toComma(value) {
  return Array.isArray(value) ? value.join(', ') : ''
}

function normalizeBlocks(value) {
  if (!Array.isArray(value)) return []
  return value.map((block, index) => ({
    id: block.id || `tmp-${index}-${Date.now()}`,
    block_type: block.block_type || 'paragraph',
    content_json: block.content_json && typeof block.content_json === 'object' ? block.content_json : {},
  }))
}

function makeBlock(type) {
  if (type === 'heading') return { block_type: 'heading', content_json: { text: '', level: 2 } }
  if (type === 'list') return { block_type: 'list', content_json: { items: [] } }
  if (type === 'quote') return { block_type: 'quote', content_json: { text: '', author: '' } }
  if (type === 'image') return { block_type: 'image', content_json: { src: '', alt: '', caption: '' } }
  if (type === 'video') return { block_type: 'video', content_json: { embed_url: '', title: '' } }
  if (type === 'link') return { block_type: 'link', content_json: { label: '', href: '', target: '_self' } }
  return { block_type: 'paragraph', content_json: { text: '' } }
}

function withBlockId(block) {
  return {
    id: block.id || `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...block,
  }
}

function listText(items) {
  return Array.isArray(items) ? items.join('\n') : ''
}

function parseList(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

async function registerMedia(url, bucket, file) {
  await fetch('/api/cms/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      bucket,
      type: file.type?.startsWith('video/') ? 'video' : 'image',
      size: file.size,
      alt_text: '',
      caption: '',
    }),
  })
}

export default function BlogManagerClient() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [blocks, setBlocks] = useState([])
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [mediaItems, setMediaItems] = useState([])
  const [mediaPicker, setMediaPicker] = useState({ open: false, type: 'image', target: null })
  const [form, setForm] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    content: '',
    featured_image: '',
    seo_title: '',
    seo_description: '',
    tags: '',
    categories: '',
    status: 'draft',
    author_id: '',
    og_image: '',
    noindex: false,
    faq_schema: '{}',
  })

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId])

  async function loadBlogs(nextId) {
    const res = await fetch('/api/cms/blogs?include_drafts=1&include_blocks=1&limit=300', { cache: 'no-store' })
    const json = await res.json()
    if (!json?.success) {
      setStatus(json?.error || 'Failed to load blogs.')
      return
    }
    const rows = Array.isArray(json.data) ? json.data : []
    setItems(rows)
    const id = nextId || selectedId || rows[0]?.id || ''
    setSelectedId(id)
    if (id) {
      const row = rows.find((entry) => entry.id === id)
      if (row) syncForm(row)
    } else {
      resetForm()
    }
  }

  useEffect(() => {
    loadBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncForm(item) {
    setForm({
      id: item.id || '',
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      content: item.content || '',
      featured_image: item.featured_image || '',
      seo_title: item.seo_title || '',
      seo_description: item.seo_description || '',
      tags: toComma(item.tags),
      categories: toComma(item.categories),
      status: item.status || 'draft',
      author_id: item.author_id || '',
      og_image: item.og_image || '',
      noindex: item.noindex === true,
      faq_schema: item.faq_schema ? JSON.stringify(item.faq_schema, null, 2) : '{}',
    })
    const sourceBlocks = item.blocks?.length ? item.blocks : item.content_json?.blocks || []
    setBlocks(normalizeBlocks(sourceBlocks))
  }

  function resetForm() {
    setForm({
      id: '',
      title: '',
      slug: '',
      description: '',
      content: '',
      featured_image: '',
      seo_title: '',
      seo_description: '',
      tags: '',
      categories: '',
      status: 'draft',
      author_id: '',
      og_image: '',
      noindex: false,
      faq_schema: '{}',
    })
    setBlocks([])
  }

  function addBlock(type, afterIndex = null) {
    setBlocks((prev) => {
      const next = prev.slice()
      const block = withBlockId(makeBlock(type))
      if (afterIndex === null || afterIndex < 0 || afterIndex >= next.length) {
        next.push(block)
      } else {
        next.splice(afterIndex + 1, 0, block)
      }
      return next
    })
  }

  function updateBlockContent(index, patch) {
    setBlocks((prev) =>
      prev.map((block, i) =>
        i === index ? { ...block, content_json: { ...(block.content_json || {}), ...patch } } : block
      )
    )
  }

  function moveBlock(index, direction) {
    setBlocks((prev) => {
      const next = prev.slice()
      const target = index + direction
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function openMediaPicker(target, type) {
    fetch(`/api/cms/media?limit=500&type=${type}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.error || 'Failed to load media.')
        setMediaItems(Array.isArray(json.data) ? json.data : [])
        setMediaPicker({ open: true, type, target })
      })
      .catch((error) => setStatus(error?.message || 'Failed to load media.'))
  }

  function applyMedia(url, media, explicitTarget = null) {
    const target = explicitTarget || mediaPicker.target
    if (!target) return
    if (target.type === 'featured') setForm((prev) => ({ ...prev, featured_image: url }))
    if (target.type === 'og') setForm((prev) => ({ ...prev, og_image: url }))
    if (target.type === 'block-image') {
      updateBlockContent(target.index, {
        src: url,
        alt: media?.alt_text || '',
        caption: media?.caption || '',
      })
    }
    if (target.type === 'block-video') {
      updateBlockContent(target.index, { embed_url: url })
    }
    setMediaPicker({ open: false, type: 'image', target: null })
  }

  async function uploadAndApply(file, target, bucket = 'blog-images') {
    if (!file) return
    setSaving(true)
    try {
      const url = await uploadFile(file, bucket)
      await registerMedia(url, bucket, file)
      applyMedia(url, null, target)
      setStatus('Upload complete.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setSaving(false)
    }
  }

  async function saveBlog(event) {
    event.preventDefault()
    if (!form.title.trim()) return setStatus('Blog title is required.')
    setSaving(true)
    setStatus('')
    try {
      let faqSchema = null
      if (String(form.faq_schema || '').trim()) faqSchema = JSON.parse(form.faq_schema)
      const payload = {
        id: form.id || undefined,
        title: form.title.trim(),
        slug: form.slug?.trim() || toSlug(form.title),
        description: form.description || null,
        content: form.content || null,
        featured_image: form.featured_image || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        tags: splitComma(form.tags),
        categories: splitComma(form.categories),
        status: form.status === 'published' ? 'published' : 'draft',
        author_id: form.author_id || null,
        og_image: form.og_image || null,
        noindex: Boolean(form.noindex),
        faq_schema: faqSchema,
        blocks: blocks.map((block, index) => ({
          block_type: block.block_type,
          order_index: index,
          content_json: block.content_json || {},
        })),
      }
      const res = await fetch('/api/cms/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to save blog.')
      await loadBlogs(json.data?.id)
      setStatus('Blog saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save blog.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBlog() {
    if (!form.id) return
    if (!window.confirm('Delete this blog post?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/blogs/${form.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to delete blog.')
      setSelectedId('')
      resetForm()
      await loadBlogs('')
      setStatus('Blog deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete blog.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Blog CMS</h2>
          <p className="mt-1 text-sm text-slate-300">
            Featured image is separate. Add image/video blocks anywhere inside content.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedId('')
            resetForm()
          }}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          New Blog
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-slate-100">Posts</h3>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id)
                  syncForm(item)
                }}
                className={`w-full rounded-lg px-3 py-2 text-left ${
                  selectedId === item.id
                    ? 'bg-teal-300 text-slate-950'
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-xs opacity-80">
                  /{item.slug} | {item.status}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <form onSubmit={saveBlog} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs text-slate-400">
              Title
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value, slug: prev.slug || toSlug(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400">
              Slug
              <input
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: toSlug(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Excerpt
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              Plain Text Fallback
              <textarea
                rows={6}
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200"
                  >
                    + {type}
                  </button>
                ))}
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Tip: write a paragraph, then click <span className="text-slate-200">+ image after</span> or
                <span className="text-slate-200"> + video after</span> in that block.
              </p>
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <div key={block.id || index} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <select
                        value={block.block_type}
                        onChange={(event) =>
                          setBlocks((prev) =>
                            prev.map((entry, i) =>
                              i === index ? { ...withBlockId(makeBlock(event.target.value)), id: entry.id } : entry
                            )
                          )
                        }
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                      >
                        {BLOCK_TYPES.map((type) => (
                          <option key={type} value={type} className="bg-[#07101b]">
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addBlock('image', index)}
                          className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200"
                        >
                          + Image After
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock('video', index)}
                          className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200"
                        >
                          + Video After
                        </button>
                        <button type="button" onClick={() => moveBlock(index, -1)} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">Up</button>
                        <button type="button" onClick={() => moveBlock(index, 1)} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">Down</button>
                        <button type="button" onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))} className="rounded border border-rose-400/30 px-2 py-1 text-xs text-rose-200">Remove</button>
                      </div>
                    </div>

                    {(block.block_type === 'paragraph' || block.block_type === 'quote') && (
                      <textarea
                        rows={4}
                        value={block.content_json?.text || ''}
                        onChange={(event) => updateBlockContent(index, { text: event.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                      />
                    )}

                    {block.block_type === 'heading' && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={block.content_json?.text || ''}
                          onChange={(event) => updateBlockContent(index, { text: event.target.value })}
                          placeholder="Heading text"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                        <select
                          value={block.content_json?.level || 2}
                          onChange={(event) => updateBlockContent(index, { level: Number(event.target.value) })}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        >
                          {[2, 3, 4].map((level) => (
                            <option key={level} value={level} className="bg-[#07101b]">
                              H{level}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {block.block_type === 'list' && (
                      <textarea
                        rows={4}
                        value={listText(block.content_json?.items)}
                        onChange={(event) => updateBlockContent(index, { items: parseList(event.target.value) })}
                        placeholder="One bullet per line"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                      />
                    )}

                    {block.block_type === 'image' && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={block.content_json?.src || ''}
                          onChange={(event) => updateBlockContent(index, { src: event.target.value })}
                          placeholder="Image URL"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100 md:col-span-2"
                        />
                        <input
                          value={block.content_json?.alt || ''}
                          onChange={(event) => updateBlockContent(index, { alt: event.target.value })}
                          placeholder="Alt text"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                        <input
                          value={block.content_json?.caption || ''}
                          onChange={(event) => updateBlockContent(index, { caption: event.target.value })}
                          placeholder="Caption"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => openMediaPicker({ type: 'block-image', index }, 'image')} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">Pick Media</button>
                          <label className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">
                            Upload
                            <input type="file" className="hidden" accept="image/*" onChange={(event) => uploadAndApply(event.target.files?.[0], { type: 'block-image', index }, 'blog-images')} />
                          </label>
                        </div>
                      </div>
                    )}

                    {block.block_type === 'video' && (
                      <div className="grid gap-2">
                        <input
                          value={block.content_json?.embed_url || ''}
                          onChange={(event) => updateBlockContent(index, { embed_url: event.target.value })}
                          placeholder="YouTube/Vimeo embed URL or uploaded video URL"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openMediaPicker({ type: 'block-video', index }, 'video')} className="w-fit rounded border border-white/10 px-2 py-1 text-xs text-slate-200">
                            Pick Video
                          </button>
                          <label className="rounded border border-white/10 px-2 py-1 text-xs text-slate-200">
                            Upload Video
                            <input type="file" className="hidden" accept="video/*" onChange={(event) => uploadAndApply(event.target.files?.[0], { type: 'block-video', index }, 'blog-videos')} />
                          </label>
                        </div>
                      </div>
                    )}

                    {block.block_type === 'link' && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          value={block.content_json?.label || ''}
                          onChange={(event) => updateBlockContent(index, { label: event.target.value })}
                          placeholder="Link label"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                        <input
                          value={block.content_json?.href || ''}
                          onChange={(event) => updateBlockContent(index, { href: event.target.value })}
                          placeholder="Link URL"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {!blocks.length ? <p className="text-xs text-slate-500">No content blocks yet.</p> : null}
              </div>
            </div>

            <label className="text-xs text-slate-400">
              Featured Image URL
              <input value={form.featured_image} onChange={(event) => setForm((prev) => ({ ...prev, featured_image: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <div className="text-xs text-slate-400">
              Featured Image
              <div className="mt-1 flex flex-wrap gap-2">
                <button type="button" onClick={() => openMediaPicker({ type: 'featured' }, 'image')} className="rounded border border-white/10 px-2 py-2 text-xs text-slate-200">Pick Media</button>
                <label className="rounded border border-white/10 px-2 py-2 text-xs text-slate-200">
                  Upload
                  <input type="file" className="hidden" accept="image/*" onChange={(event) => uploadAndApply(event.target.files?.[0], { type: 'featured' }, 'blog-images')} />
                </label>
              </div>
            </div>
            <label className="text-xs text-slate-400">
              OG Image URL
              <input value={form.og_image} onChange={(event) => setForm((prev) => ({ ...prev, og_image: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <div className="text-xs text-slate-400">
              OG Image
              <button type="button" onClick={() => openMediaPicker({ type: 'og' }, 'image')} className="mt-1 rounded border border-white/10 px-2 py-2 text-xs text-slate-200">Pick Media</button>
            </div>
            <label className="text-xs text-slate-400">
              Tags
              <input value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Categories
              <input value={form.categories} onChange={(event) => setForm((prev) => ({ ...prev, categories: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              SEO Title
              <input value={form.seo_title} onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400">
              Status
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">
                <option value="draft" className="bg-[#07101b]">Draft</option>
                <option value="published" className="bg-[#07101b]">Published</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Author ID
              <input value={form.author_id} onChange={(event) => setForm((prev) => ({ ...prev, author_id: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={form.noindex} onChange={(event) => setForm((prev) => ({ ...prev, noindex: event.target.checked }))} />
              Noindex this post
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              SEO Description
              <textarea rows={3} value={form.seo_description} onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="text-xs text-slate-400 md:col-span-2">
              FAQ Schema JSON
              <textarea rows={4} value={form.faq_schema} onChange={(event) => setForm((prev) => ({ ...prev, faq_schema: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-slate-100" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
              {saving ? 'Saving...' : 'Save Blog'}
            </button>
            {form.id ? (
              <button type="button" onClick={deleteBlog} disabled={saving} className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">
                Delete
              </button>
            ) : null}
            {form.slug ? (
              <Link href={`/blog/${form.slug}`} target="_blank" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
                Preview
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
      {selected?.updated_at ? <p className="mt-1 text-xs text-slate-500">Last updated: {new Date(selected.updated_at).toLocaleString()}</p> : null}

      {mediaPicker.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-2xl border border-white/10 bg-[#081224] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">Select {mediaPicker.type}</h3>
              <button type="button" onClick={() => setMediaPicker({ open: false, type: 'image', target: null })} className="rounded border border-white/10 px-3 py-1 text-xs text-slate-200">Close</button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {mediaItems.map((item) => (
                <button key={item.id} type="button" onClick={() => applyMedia(item.url, item)} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left hover:bg-white/[0.05]">
                  <div className="truncate text-xs text-slate-300">{item.url}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{item.type}</div>
                </button>
              ))}
              {!mediaItems.length ? <p className="text-xs text-slate-500">No media available.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </Surface>
  )
}
