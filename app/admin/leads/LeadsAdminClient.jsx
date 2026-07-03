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
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
      setStatus('Lead status updated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to update lead.')
    } finally {
      setSavingId('')
    }
  }

  function updateLocal(id, key, value) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)))
  }

  async function deleteLead(id) {
    if (!window.confirm('Delete this lead record?')) return
    try {
      await adminApiFetch(`/api/cms/leads/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.id !== id))
      setStatus('Lead deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete lead.')
    }
  }

  function getFilteredItems() {
    return items.filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        (item.full_name || '').toLowerCase().includes(query) ||
        (item.email || '').toLowerCase().includes(query) ||
        (item.phone || '').toLowerCase().includes(query) ||
        (item.page_slug || '').toLowerCase().includes(query)
      )
    })
  }

  const filteredItems = getFilteredItems()

  async function exportToCSV() {
    if (filteredItems.length === 0) {
      setStatus('No leads to export.')
      return
    }

    const headers = ['Name', 'Email', 'Phone', 'Page', 'Source', 'Status', 'Created Date']
    const rows = filteredItems.map((lead) => [
      lead.full_name || '',
      lead.email || '',
      lead.phone || '',
      lead.page_slug || '',
      lead.source || '',
      lead.status || '',
      lead.created_at ? new Date(lead.created_at).toLocaleString() : '',
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setStatus('Leads exported to CSV.')
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Lead Management</h2>
          <p className="mt-1 text-sm text-slate-300">View, manage, and export consultation and inquiry leads.</p>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          Export to CSV
        </button>
      </div>

      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-slate-400">
          Search Leads
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email, phone, or page"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-xs text-slate-400">
          Filter by Status
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          >
            <option value="all" className="bg-[#07101b]">All Statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option} className="bg-[#07101b]">
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.14em] text-slate-400">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Page Source</th>
              <th className="px-3 py-2">Lead Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-slate-400">
                  Loading leads...
                </td>
              </tr>
            ) : !filteredItems.length ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-slate-400">
                  No leads found matching the current filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((lead) => (
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
                          {entry.charAt(0).toUpperCase() + entry.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">{lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingId === lead.id}
                        onClick={() => updateLead(lead)}
                        className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.05] disabled:opacity-60"
                      >
                        {savingId === lead.id ? 'Saving...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLead(lead.id)}
                        className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
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
