'use client'

import { useState } from 'react'
import { supabase } from '../../../src/lib/supabaseClient'
import { Surface } from '../../../src/components/ui/Surface'

const buckets = ['images', 'videos', 'documents', 'lms-files']

export default function MediaManagerClient() {
  const [bucket, setBucket] = useState('images')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setStatus('')
    const safeName = file.name.replace(/\s+/g, '-')
    const path = `${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) {
      setStatus(error.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setStatus(data?.publicUrl ? `Uploaded: ${data.publicUrl}` : 'Uploaded successfully')
    setUploading(false)
  }

  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-semibold text-slate-50">Media Library</h2>
      <p className="mt-1 text-sm text-slate-300">Upload images, videos, PDFs, and LMS files to Supabase Storage.</p>

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
      <div className="mt-4 text-xs text-slate-300">{uploading ? 'Uploading...' : status}</div>
    </Surface>
  )
}
