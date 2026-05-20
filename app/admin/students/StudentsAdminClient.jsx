'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { Surface } from '../../../src/components/ui/Surface'

export default function StudentsAdminClient() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')

  async function loadUsers() {
    setLoading(true)
    setStatus('')
    try {
      const query = new URLSearchParams()
      query.set('limit', '1000')
      if (search.trim()) query.set('q', search.trim())
      if (roleFilter !== 'all') query.set('role', roleFilter)
      if (approvalFilter !== 'all') query.set('approval_status', approvalFilter)

      const payload = await adminApiFetch(`/api/cms/users?${query.toString()}`, { cache: 'no-store' })
      setItems(Array.isArray(payload?.data) ? payload.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadUsers()
    }, 200)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, approvalFilter])

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updateUser(userId, patch, successMessage) {
    setSavingId(userId)
    setStatus('')
    try {
      const payload = await adminApiFetch(`/api/cms/users/${userId}`, {
        method: 'PATCH',
        body: patch,
      })

      setItems((prev) => prev.map((item) => (item.id === userId ? payload.data : item)))
      setStatus(successMessage)
    } catch (error) {
      setStatus(error?.message || 'Failed to update user.')
    } finally {
      setSavingId('')
    }
  }

  const totals = useMemo(
    () => ({
      all: items.length,
      approved: items.filter((item) => item.approval_status === 'approved').length,
      pending: items.filter((item) => item.approval_status === 'pending').length,
      admins: items.filter((item) => item.role === 'admin').length,
    }),
    [items]
  )

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Users & Access</h2>
          <p className="mt-1 text-sm text-slate-300">
            Approve accounts, change roles, and manage admin access from a single verified server-backed flow.
          </p>
        </div>
        <div className="grid gap-2 text-right text-xs text-slate-300">
          <span>Total: {totals.all}</span>
          <span>Approved: {totals.approved}</span>
          <span>Pending: {totals.pending}</span>
          <span>Admins: {totals.admins}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-slate-400 md:col-span-2">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Email, full name, or student ID"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-400">
            Role
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              <option value="all" className="bg-[#07101b]">All</option>
              <option value="student" className="bg-[#07101b]">Student</option>
              <option value="sales" className="bg-[#07101b]">Sales</option>
              <option value="admin" className="bg-[#07101b]">Admin</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Approval
            <select
              value={approvalFilter}
              onChange={(event) => setApprovalFilter(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            >
              <option value="all" className="bg-[#07101b]">All</option>
              <option value="pending" className="bg-[#07101b]">Pending</option>
              <option value="approved" className="bg-[#07101b]">Approved</option>
              <option value="rejected" className="bg-[#07101b]">Rejected</option>
            </select>
          </label>
        </div>
      </div>

      {status ? <p className="mt-3 text-sm text-slate-300">{status}</p> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Approval</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    No users found for the current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const rowSaving = savingId === item.id
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-semibold text-slate-100">{item.full_name || 'Unnamed user'}</p>
                        <p className="text-xs text-slate-400">{item.email}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{item.student_id || '-'}</td>
                      <td className="px-4 py-4">
                        <select
                          value={item.role}
                          disabled={rowSaving}
                          onChange={(event) =>
                            updateUser(item.id, { role: event.target.value }, `Updated role for ${item.email}.`)
                          }
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        >
                          <option value="student" className="bg-[#07101b]">Student</option>
                          <option value="sales" className="bg-[#07101b]">Sales</option>
                          <option value="admin" className="bg-[#07101b]">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={item.approval_status}
                          disabled={rowSaving}
                          onChange={(event) =>
                            updateUser(
                              item.id,
                              { approval_status: event.target.value },
                              `Updated approval status for ${item.email}.`
                            )
                          }
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-100"
                        >
                          <option value="pending" className="bg-[#07101b]">Pending</option>
                          <option value="approved" className="bg-[#07101b]">Approved</option>
                          <option value="rejected" className="bg-[#07101b]">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={rowSaving}
                            onClick={() =>
                              updateUser(
                                item.id,
                                { approval_status: 'approved' },
                                `Approved ${item.email}.`
                              )
                            }
                            className="rounded-lg border border-emerald-400/30 px-3 py-1 text-xs text-emerald-200 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={rowSaving}
                            onClick={() =>
                              updateUser(
                                item.id,
                                { approval_status: 'rejected' },
                                `Rejected ${item.email}.`
                              )
                            }
                            className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-200 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Surface>
  )
}
