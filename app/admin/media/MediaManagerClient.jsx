'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Surface } from '../../../src/components/ui/Surface'
import { supabase } from '../../../lib/supabaseClient'
import { uploadFile } from '../../../lib/storageUpload'

const buckets = [
  'blog-images',
  'course-images',
  'placements',
  'site-assets',
  'videos',
  'gallery',
]

function parseStoragePathFromUrl(url, bucket) {
  if (!url || !bucket) return ''
  const marker = `/${bucket}/`
  const index = url.indexOf(marker)
  if (index < 0) return ''
  return url.slice(index + marker.length)
}

function getImageSize(file) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      resolve({ width: null, height: null })
      return
    }
    const image = new window.Image()
    image.onload = () => resolve({ width: image.width, height: image.height })
    image.onerror = () => resolve({ width: null, height: null })
    image.src = URL.createObjectURL(file)
  })
}

export default function MediaManagerClient() {
  const [bucket, setBucket] = useState('site-assets')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [items, setItems] = useState([])

  async function loadMedia() {
    const res = await fetch('/api/cms/media?limit=500', { cache: 'no-store' })
    const payload = await res.json()
    if (!payload?.success) {
      setStatus(payload?.error || 'Failed to load media library.')
      return
    }
    setItems(Array.isArray(payload.data) ? payload.data : [])
  }

  useEffect(() => {
    loadMedia()
  }, [])

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    setStatus('')
    try {
      const [{ width, height }, publicUrl] = await Promise.all([getImageSize(file), uploadFile(file, bucket)])
      const path = parseStoragePathFromUrl(publicUrl, bucket)
      const payload = {
        url: publicUrl,
        bucket,
        path: path || null,
        type: file.type?.startsWith('video/') ? 'video' : file.type?.startsWith('image/') ? 'image' : 'file',
        width,
        height,
        size: file.size,
        alt_text: '',
        caption: '',
      }
      const res = await fetch('/api/cms/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to store media metadata.')
      setStatus('Upload complete.')
      await loadMedia()
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function saveMediaItem(item) {
    setSaving(true)
    setStatus('')
    try {
      const res = await fetch(`/api/cms/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt_text: item.alt_text || '',
          caption: item.caption || '',
        }),
      })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to update media metadata.')
      setStatus('Media metadata updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to update media.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item) {
    if (!window.confirm('Delete this media item?')) return
    setSaving(true)
    setStatus('')
    try {
      if (item.bucket && item.path) {
        await supabase.storage.from(item.bucket).remove([item.path])
      }
      const res = await fetch(`/api/cms/media/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || 'Failed to delete media metadata.')
      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
      setStatus('Media deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete media.')
    } finally {
      setSaving(false)
    }
  }

  function updateField(id, key, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )
  }

  const filteredItems = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (!query.trim()) return true
    const source = `${item.url || ''} ${item.alt_text || ''} ${item.caption || ''}`.toLowerCase()
    return source.includes(query.trim().toLowerCase())
  })

  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-slate-50">Media Library</h2>
      <p className="mt-1 text-sm text-slate-300">Upload, tag, caption, reuse, and delete media from Supabase storage.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Bucket</label>
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          >
            {buckets.map((name) => (
              <option key={name} value={name} className="bg-[#050b12]">
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Upload File</label>
          <input
            type="file"
            onChange={(event) => handleUpload(event.target.files?.[0])}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-slate-400 md:col-span-2">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="URL, alt text, or caption"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-xs text-slate-400">
          Type
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          >
            <option value="all" className="bg-[#050b12]">all</option>
            <option value="image" className="bg-[#050b12]">image</option>
            <option value="video" className="bg-[#050b12]">video</option>
            <option value="file" className="bg-[#050b12]">file</option>
          </select>
        </label>
      </div>

      {status ? <div className="mt-3 text-xs text-slate-300">{status}</div> : null}
      {uploading ? <div className="mt-1 text-xs text-slate-400">Uploading...</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filteredItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={item.alt_text || 'Media'}
                  width={480}
                  height={280}
                  className="h-48 w-full object-cover"
                />
              ) : item.type === 'video' ? (
                <video src={item.url} className="h-48 w-full object-cover" controls />
              ) : (
                <a href={item.url} target="_blank" rel="noreferrer" className="block px-3 py-12 text-center text-sm text-teal-300">
                  Open file
                </a>
              )}
            </div>
            <p className="truncate text-xs text-slate-500">{item.url}</p>
            <div className="mt-3 grid gap-3">
              <label className="text-xs text-slate-400">
                Alt Text
                <input
                  value={item.alt_text || ''}
                  onChange={(event) => updateField(item.id, 'alt_text', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2 text-xs text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400">
                Caption
                <input
                  value={item.caption || ''}
                  onChange={(event) => updateField(item.id, 'caption', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2 text-xs text-slate-100"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveMediaItem(item)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
              >
                Save
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  await navigator.clipboard.writeText(item.url)
                  setStatus('Media URL copied.')
                }}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
              >
                Copy URL
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => deleteItem(item)}
                className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {!filteredItems.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-slate-400 md:col-span-2">
            No media items match the current filters.
          </div>
        ) : null}
      </div>
    </Surface>
  )
}
