'use client'

import { useEffect, useState } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'

const statusOptions = ['new', 'contacted', 'qualified', 'closed']

export default function LeadsAdminClient() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')

  async function load() {
    setLoading(true)
    setStatus('')
    try {
      const json = await adminApiFetch('/api/cms/leads?limit=1000', { cache: 'no-store' })
      setItems(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function updateLead(lead) {
    setSavingId(lead.id)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/leads/${lead.id}`, {
        method: 'PATCH',
        body: { status: lead.status },
      })
      setStatus('Lead updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to update lead.')
    } finally {
      setSavingId('')
    }
  }

  function updateLocal(id, key, value) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-slate-50">Leads</h2>
      <p className="mt-1 text-sm text-slate-300">View and manage consultation, inquiry, and brochure leads.</p>

      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-slate-400">
                  Loading leads...
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-slate-400">
                  No leads yet.
                </td>
              </tr>
            ) : (
              items.map((lead) => (
                <tr key={lead.id} className="rounded-xl border border-white/10 bg-white/[0.03] text-sm text-slate-200">
                  <td className="px-3 py-3">{lead.full_name || '-'}</td>
                  <td className="px-3 py-3">{lead.email || '-'}</td>
                  <td className="px-3 py-3">{lead.phone || '-'}</td>
                  <td className="px-3 py-3">{lead.page_slug || '-'}</td>
                  <td className="px-3 py-3">{lead.source || '-'}</td>
                  <td className="px-3 py-3">
                    <select
                      value={lead.status || 'new'}
                      onChange={(event) => updateLocal(lead.id, 'status', event.target.value)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                    >
                      {statusOptions.map((entry) => (
                        <option key={entry} value={entry} className="bg-[#07101b]">
                          {entry}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">{lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={savingId === lead.id}
                      onClick={() => updateLead(lead)}
                      className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05] disabled:opacity-60"
                    >
                      {savingId === lead.id ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}
