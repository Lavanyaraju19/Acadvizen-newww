'use client'

import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { Surface } from '../../src/components/ui/Surface'

export default function AdminSectionShell({ title, subtitle }) {
  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-50">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
            <Plus className="h-4 w-4" /> Add
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
        Configure and manage this section from CMS controls.
      </div>
    </Surface>
  )
}
