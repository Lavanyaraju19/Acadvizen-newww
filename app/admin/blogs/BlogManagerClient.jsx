'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Surface } from '../../../src/components/ui/Surface'
import { convertPlainTextToBlocks, normalizeInlineImages } from '../../../lib/blogContent'
import { uploadFile } from '../../../lib/storageUpload'
import { adminApiFetch } from '../../../lib/adminApiClient'
import BlogBlocksRenderer from '../../../components/blog/BlogBlocksRenderer'
import AdaptiveImage from '../../../components/media/AdaptiveImage'

const BLOCK_TYPES = ['heading', 'paragraph', 'list', 'quote', 'image', 'video', 'link']
const INLINE_IMAGE_FIELDS = Array.from({ length: 6 }, (_, index) => ({
  key: index,
  label: `Inline Image ${index + 1}`,
  marker: `[IMAGE_${index + 1}]`,
}))

function ensureMinimumInlineImages(value, minimum = 6) {
  const normalized = normalizeInlineImages(value)
  const next = normalized.slice()
  while (next.length < minimum) next.push('')
  return next
}

function buildAutoMetaDescription(value = '') {
  return String(value || '')
    .replace(/\[IMAGE_\d+\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

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
  await adminApiFetch('/api/cms/media', {
    method: 'POST',
    body: {
      url,
      bucket,
      type: file.type?.startsWith('video/') ? 'video' : 'image',
      size: file.size,
      alt_text: '',
      caption: '',
    },
  })
}

function createEmptyInlineImages() {
  return ensureMinimumInlineImages([])
}

export default function BlogManagerClient() {
  const contentTextareaRef = useRef(null)
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [blocks, setBlocks] = useState([])
  const [editorMode, setEditorMode] = useState('simple')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showImageInsertPanel, setShowImageInsertPanel] = useState(false)
  const [mediaItems, setMediaItems] = useState([])
  const [mediaPicker, setMediaPicker] = useState({ open: false, type: 'image', target: null })
  const [form, setForm] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    content: '',
    featured_image: '',
    inline_images: createEmptyInlineImages(),
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
  const generatedSimpleBlocks = useMemo(
    () => convertPlainTextToBlocks(form.content || '', { inlineImages: form.inline_images || [] }),
    [form.content, form.inline_images]
  )
  const previewBlocks = useMemo(
    () =>
      editorMode === 'simple'
        ? generatedSimpleBlocks
        : blocks.map((block) => ({ ...block, content_json: block.content_json || {} })),
    [blocks, editorMode, generatedSimpleBlocks]
  )
  const derivedSeoTitle = useMemo(() => String(form.seo_title || '').trim() || String(form.title || '').trim(), [form.seo_title, form.title])
  const derivedSeoDescription = useMemo(
    () => String(form.seo_description || '').trim() || buildAutoMetaDescription(form.content || form.description || ''),
    [form.content, form.description, form.seo_description]
  )

  async function loadBlogs(nextId) {
    try {
      const json = await adminApiFetch('/api/cms/blogs?include_drafts=1&include_blocks=1&limit=300', { cache: 'no-store' })
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
    } catch (error) {
      setStatus(error?.message || 'Failed to load blogs.')
      return
    }
  }

  useEffect(() => {
    loadBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncForm(item) {
    const sourceBlocks = item.blocks?.length ? item.blocks : item.content_json?.blocks || []
    const inlineImages = ensureMinimumInlineImages(item.content_json?.inline_images || [])
    setForm({
      id: item.id || '',
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
      content: item.content || '',
      featured_image: item.featured_image || '',
      inline_images: inlineImages,
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
    setEditorMode(sourceBlocks.length && !item.content ? 'advanced' : 'simple')
    setBlocks(normalizeBlocks(sourceBlocks))
  }

  function resetForm() {
    setEditorMode('simple')
    setForm({
      id: '',
      title: '',
      slug: '',
      description: '',
      content: '',
      featured_image: '',
      inline_images: createEmptyInlineImages(),
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
    adminApiFetch(`/api/cms/media?limit=500&type=${type}`, { cache: 'no-store' })
      .then((json) => {
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
    if (target.type === 'inline-image') {
      setForm((prev) => {
        const nextInlineImages = ensureMinimumInlineImages(prev.inline_images || [])
        nextInlineImages[target.index] = url
        return { ...prev, inline_images: nextInlineImages }
      })
    }
    if (target.type === 'inline-library-append') {
      appendInlineImage(url)
    }
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

  function insertTextAtCursor(text) {
    const textarea = contentTextareaRef.current
    const currentValue = String(form.content || '')
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: `${currentValue}\n\n${text}\n\n`.trim() }))
      return
    }

    const start = textarea.selectionStart ?? currentValue.length
    const end = textarea.selectionEnd ?? currentValue.length
    const nextValue = `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`
    setForm((prev) => ({ ...prev, content: nextValue }))

    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + text.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  function insertInlineImageAtCursor(index) {
    insertTextAtCursor(`\n\n[IMAGE_${index + 1}]\n\n`)
    setShowImageInsertPanel(false)
  }

  function setInlineImageAt(index, value) {
    setForm((prev) => {
      const nextInlineImages = ensureMinimumInlineImages(prev.inline_images || [])
      nextInlineImages[index] = value
      return { ...prev, inline_images: nextInlineImages }
    })
  }

  function appendInlineImage(url) {
    setForm((prev) => ({
      ...prev,
      inline_images: [...ensureMinimumInlineImages(prev.inline_images || []), url],
    }))
  }

  function removeInlineImage(index) {
    setForm((prev) => {
      const nextInlineImages = [...ensureMinimumInlineImages(prev.inline_images || [])]
      nextInlineImages.splice(index, 1)
      return { ...prev, inline_images: ensureMinimumInlineImages(nextInlineImages) }
    })
  }

  async function uploadInlineImages(files) {
    const validFiles = Array.from(files || []).filter(Boolean)
    if (!validFiles.length) return

    setSaving(true)
    setStatus(`Uploading ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}...`)

    try {
      const uploadedUrls = []
      for (const file of validFiles) {
        const url = await uploadFile(file, 'blog-images')
        await registerMedia(url, 'blog-images', file)
        uploadedUrls.push(url)
      }

      setForm((prev) => ({
        ...prev,
        inline_images: [...ensureMinimumInlineImages(prev.inline_images || []), ...uploadedUrls],
      }))
      setStatus(`${uploadedUrls.length} inline image${uploadedUrls.length > 1 ? 's' : ''} uploaded.`)
    } catch (error) {
      setStatus(error?.message || 'Inline image upload failed.')
    } finally {
      setSaving(false)
      setDragActive(false)
    }
  }

  async function saveBlog(event) {
    event.preventDefault()
    if (!form.title.trim()) return setStatus('Blog title is required.')
    if (editorMode === 'simple' && !String(form.content || '').trim()) {
      return setStatus('Full Blog Content is required in Simple Copy-Paste mode.')
    }
    setSaving(true)
    setStatus('')
    try {
      let faqSchema = null
      if (String(form.faq_schema || '').trim()) faqSchema = JSON.parse(form.faq_schema)
      const contentBlocks = editorMode === 'simple'
        ? generatedSimpleBlocks.map((block, index) => ({
            block_type: block.block_type,
            order_index: index,
            content_json: block.content_json || {},
          }))
        : blocks.map((block, index) => ({
            block_type: block.block_type,
            order_index: index,
            content_json: block.content_json || {},
          }))
      const payload = {
        id: form.id || undefined,
        title: form.title.trim(),
        slug: form.slug?.trim() || toSlug(form.title),
        description: form.description || null,
        excerpt: form.description || null,
        content: form.content || null,
        featured_image: form.featured_image || null,
        inline_images: normalizeInlineImages(form.inline_images || []),
        seo_title: derivedSeoTitle || null,
        seo_description: derivedSeoDescription || null,
        tags: splitComma(form.tags),
        categories: splitComma(form.categories),
        status: form.status === 'published' ? 'published' : 'draft',
        author_id: form.author_id || null,
        og_image: form.og_image || null,
        noindex: Boolean(form.noindex),
        faq_schema: faqSchema,
        blocks: contentBlocks,
        auto_generate_blocks: editorMode === 'simple',
      }
      const json = await adminApiFetch('/api/cms/blogs', {
        method: 'POST',
        body: payload,
      })
      await loadBlogs(json.data?.id)
      setStatus(editorMode === 'simple' ? 'Blog saved from Simple Copy-Paste mode.' : 'Blog saved.')
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
      await adminApiFetch(`/api/cms/blogs/${form.id}`, { method: 'DELETE' })
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
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Editor Mode</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Use <span className="text-slate-100">Simple Copy-Paste</span> to paste the full blog into one field. Use
                  <span className="text-slate-100"> Advanced Blocks</span> only when you want to place manual paragraph, list, image, or video blocks.
                </p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => setEditorMode('simple')}
                  className={`rounded-lg px-3 py-2 text-sm ${editorMode === 'simple' ? 'bg-teal-300 font-semibold text-slate-950' : 'text-slate-200'}`}
                >
                  Simple Copy-Paste
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('advanced')}
                  className={`rounded-lg px-3 py-2 text-sm ${editorMode === 'advanced' ? 'bg-teal-300 font-semibold text-slate-950' : 'text-slate-200'}`}
                >
                  Advanced Blocks
                </button>
              </div>
            </div>
          </div>

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
              <span className="mt-1 block text-[11px] text-slate-500">
                Auto-generated from the title when left empty.
              </span>
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
              Full Blog Content
              <span className="mt-1 block text-[11px] text-slate-500">
                Paste the complete article here in one go. Paragraphs, headings, list lines, and inline image markers like
                <span className="text-slate-300"> [IMAGE_1]</span> will be structured automatically when you save.
              </span>
              {editorMode === 'simple' ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageInsertPanel((prev) => !prev)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200"
                  >
                    Insert Image
                  </button>
                  <button
                    type="button"
                    onClick={() => openMediaPicker({ type: 'inline-library-append' }, 'image')}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200"
                  >
                    Add From Media Library
                  </button>
                </div>
              ) : null}
              <textarea
                ref={contentTextareaRef}
                rows={editorMode === 'simple' ? 18 : 8}
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                onClick={() => setShowImageInsertPanel(false)}
                onKeyUp={() => setShowImageInsertPanel(false)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />

              {editorMode === 'simple' && showImageInsertPanel ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Insert Image At Cursor</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Click an image below and the editor will insert the matching image position automatically.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {ensureMinimumInlineImages(form.inline_images || []).map((imageUrl, index) => (
                      imageUrl ? (
                        <button
                          key={`insert-inline-${index}`}
                          type="button"
                          onClick={() => insertInlineImageAtCursor(index)}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/[0.05]"
                        >
                          <AdaptiveImage
                            src={imageUrl}
                            alt={`Inline image ${index + 1}`}
                            variant="content"
                            aspectRatio="4 / 3"
                            sizes="(max-width: 768px) 100vw, 240px"
                            wrapperClassName="w-full"
                            borderClassName=""
                            roundedClassName="rounded-xl"
                            loading="lazy"
                          />
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                            [IMAGE_{index + 1}]
                          </p>
                        </button>
                      ) : null
                    ))}
                    {!ensureMinimumInlineImages(form.inline_images || []).some(Boolean) ? (
                      <p className="text-xs text-slate-500">Upload or add inline images first.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </label>

            {editorMode === 'simple' ? (
              <>
                <div className="md:col-span-2 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                      <p className="text-sm font-semibold text-slate-100">Simple Editor</p>
                      <p className="mt-1 text-sm text-slate-300">
                        Paste your blog, upload inline images, then click any thumbnail to insert it at the cursor position.
                        Old marker syntax still works for backward compatibility, but you do not need to type it manually.
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        Auto-detected blocks: {generatedSimpleBlocks.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-100">Inline Image Library</h4>
                          <p className="mt-1 text-xs text-slate-400">
                            Drag and drop images here, upload them, then use Insert Image to place them visually inside the article.
                          </p>
                        </div>
                        <label className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">
                          Upload Images
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(event) => uploadInlineImages(event.target.files)}
                          />
                        </label>
                      </div>

                      <div
                        onDragOver={(event) => {
                          event.preventDefault()
                          setDragActive(true)
                        }}
                        onDragLeave={(event) => {
                          event.preventDefault()
                          setDragActive(false)
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          setDragActive(false)
                          uploadInlineImages(event.dataTransfer.files)
                        }}
                        className={`mt-4 rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition ${
                          dragActive
                            ? 'border-teal-300 bg-teal-300/10 text-slate-100'
                            : 'border-white/10 bg-black/10 text-slate-400'
                        }`}
                      >
                        Drag & drop blog images here, or use Upload Images.
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {ensureMinimumInlineImages(form.inline_images || []).map((imageUrl, index) => (
                          <div key={`library-inline-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                                  {index < INLINE_IMAGE_FIELDS.length ? INLINE_IMAGE_FIELDS[index].label : `Inline Image ${index + 1}`}
                                </p>
                                <p className="mt-1 text-[11px] text-teal-300">[IMAGE_{index + 1}]</p>
                              </div>
                              {imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => removeInlineImage(index)}
                                  className="rounded border border-rose-400/30 px-2 py-1 text-[11px] text-rose-200"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                            <input
                              value={imageUrl || ''}
                              onChange={(event) => setInlineImageAt(index, event.target.value)}
                              placeholder={`Paste image URL for [IMAGE_${index + 1}]`}
                              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openMediaPicker({ type: 'inline-image', index }, 'image')}
                                className="rounded border border-white/10 px-2 py-2 text-xs text-slate-200"
                              >
                                Pick Media
                              </button>
                              <label className="rounded border border-white/10 px-2 py-2 text-xs text-slate-200">
                                Upload
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(event) => uploadAndApply(event.target.files?.[0], { type: 'inline-image', index }, 'blog-images')}
                                />
                              </label>
                              {imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => insertInlineImageAtCursor(index)}
                                  className="rounded border border-teal-400/30 px-2 py-2 text-xs text-teal-200"
                                >
                                  Insert
                                </button>
                              ) : null}
                            </div>
                            {imageUrl ? (
                              <div className="mt-3">
                                <AdaptiveImage
                                  src={imageUrl}
                                  alt={`Inline image ${index + 1}`}
                                  variant="content"
                                  aspectRatio="4 / 3"
                                  sizes="(max-width: 768px) 100vw, 260px"
                                  wrapperClassName="w-full"
                                  borderClassName=""
                                  roundedClassName="rounded-xl"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">Live Preview</h4>
                        <p className="mt-1 text-xs text-slate-400">
                          Uses the same structured block rendering path as the public blog page.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
                      <div className="border-b border-white/10 px-5 py-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-teal-300">Preview</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-50">
                          {form.title || 'Blog title preview'}
                        </h3>
                        <p className="mt-3 text-sm text-slate-300">
                          {form.description || 'Excerpt preview will appear here.'}
                        </p>
                      </div>
                      <div className="px-5 py-5">
                        <AdaptiveImage
                          src={form.featured_image || '/blog-images/image1.jpg'}
                          alt={form.title || 'Featured image preview'}
                          variant="hero"
                          aspectRatio="16 / 9"
                          sizes="(max-width: 768px) 100vw, 720px"
                          wrapperClassName="w-full"
                          borderClassName=""
                          roundedClassName="rounded-2xl"
                        />
                        <div className="mt-6">
                          <BlogBlocksRenderer blocks={previewBlocks} fallbackSections={[]} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
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
            )}

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
              <span className="mt-1 block text-[11px] text-slate-500">
                Defaults to the Title if you leave this blank.
              </span>
              <input
                value={form.seo_title}
                placeholder={form.title || 'Auto from title'}
                onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
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
              <span className="mt-1 block text-[11px] text-slate-500">
                Defaults to the first 150-160 characters of the blog content if left blank.
              </span>
              <textarea
                rows={3}
                value={form.seo_description}
                placeholder={buildAutoMetaDescription(form.content || form.description || '')}
                onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Effective SEO Preview</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{derivedSeoTitle || 'Title will appear here'}</p>
              <p className="mt-2 text-sm text-slate-400">{derivedSeoDescription || 'Meta description will appear here'}</p>
            </div>
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
