'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApiFetch } from '../../../lib/adminApiClient'

export default function LocationExplorerItemsPanel() {
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState('')
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [newLocationId, setNewLocationId] = useState('')

  useEffect(() => {
    async function loadOptions() {
      try {
        const [groupsJson, locationsJson, coursesJson] = await Promise.all([
          adminApiFetch('/api/cms/entities/location_explorer_groups?limit=200', { cache: 'no-store' }),
          adminApiFetch('/api/cms/entities/locations?limit=500', { cache: 'no-store' }),
          adminApiFetch('/api/cms/entities/courses?limit=500', { cache: 'no-store' }),
        ])
        const groupRows = Array.isArray(groupsJson.data) ? groupsJson.data : []
        setGroups(groupRows)
        setLocations(Array.isArray(locationsJson.data) ? locationsJson.data : [])
        setCourses(Array.isArray(coursesJson.data) ? coursesJson.data : [])
        if (!groupId && groupRows.length) setGroupId(groupRows[0].id)
      } catch (error) {
        setStatus(error?.message || 'Failed to load groups.')
      }
    }
    loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadItems(id) {
    if (!id) {
      setItems([])
      return
    }
    try {
      const json = await adminApiFetch(`/api/cms/entities/location_explorer_items?group_id=${id}&limit=200`, { cache: 'no-store' })
      const rows = Array.isArray(json.data) ? json.data : []
      rows.sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))
      setItems(rows)
    } catch (error) {
      setStatus(error?.message || 'Failed to load items.')
    }
  }

  useEffect(() => {
    loadItems(groupId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const locationLabel = useMemo(() => {
    const map = new Map(locations.map((l) => [l.id, l.name]))
    return (id) => map.get(id) || '—'
  }, [locations])
  const courseLabel = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, c.title]))
    return (id) => (id ? map.get(id) || '—' : '')
  }, [courses])

  async function addItem() {
    if (!groupId || !newLocationId) return
    setBusy(true)
    setStatus('')
    try {
      const nextOrder = items.length ? Math.max(...items.map((i) => Number(i.order_index || 0))) + 1 : 0
      await adminApiFetch('/api/cms/entities/location_explorer_items', {
        method: 'POST',
        body: { group_id: groupId, location_id: newLocationId, order_index: nextOrder, is_active: true },
      })
      setNewLocationId('')
      await loadItems(groupId)
      setStatus('Location added.')
    } catch (error) {
      setStatus(error?.message || 'Failed to add location.')
    } finally {
      setBusy(false)
    }
  }

  async function updateItem(item, patch) {
    setBusy(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/entities/location_explorer_items', {
        method: 'POST',
        body: { id: item.id, group_id: item.group_id, location_id: item.location_id, ...patch },
      })
      await loadItems(groupId)
    } catch (error) {
      setStatus(error?.message || 'Failed to update item.')
    } finally {
      setBusy(false)
    }
  }

  async function removeItem(item) {
    if (!window.confirm('Remove this location from the group?')) return
    setBusy(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/location_explorer_items/${item.id}`, { method: 'DELETE' })
      await loadItems(groupId)
      setStatus('Removed.')
    } catch (error) {
      setStatus(error?.message || 'Failed to remove item.')
    } finally {
      setBusy(false)
    }
  }

  async function move(item, direction) {
    const index = items.findIndex((i) => i.id === item.id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return
    const other = items[swapIndex]
    setBusy(true)
    try {
      await Promise.all([
        adminApiFetch('/api/cms/entities/location_explorer_items', { method: 'POST', body: { id: item.id, group_id: item.group_id, location_id: item.location_id, order_index: other.order_index } }),
        adminApiFetch('/api/cms/entities/location_explorer_items', { method: 'POST', body: { id: other.id, group_id: other.group_id, location_id: other.location_id, order_index: item.order_index } }),
      ])
      await loadItems(groupId)
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Group Locations</h3>
          <p className="mt-1 text-xs text-slate-400">Add, reorder, hide, or override where each location in a group points to.</p>
        </div>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100"
        >
          {groups.length === 0 ? <option value="">No groups yet - create one above</option> : null}
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="bg-[#07101b]">{g.name}</option>
          ))}
        </select>
      </div>

      {groupId ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={newLocationId}
              onChange={(e) => setNewLocationId(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100"
            >
              <option value="">Select a location to add...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#07101b]">{l.name}</option>
              ))}
            </select>
            <button type="button" disabled={busy || !newLocationId} onClick={addItem} className="rounded-lg bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">
              Add Location
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Anchor Text Override</th>
                  <th className="px-3 py-2">Destination Override</th>
                  <th className="px-3 py-2">Course Context</th>
                  <th className="px-3 py-2">Visible</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">No locations in this group yet.</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={item.id} className="text-slate-200 align-top">
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <button type="button" disabled={busy || idx === 0} onClick={() => move(item, 'up')} className="rounded border border-white/10 px-1.5 disabled:opacity-30">↑</button>
                        <button type="button" disabled={busy || idx === items.length - 1} onClick={() => move(item, 'down')} className="rounded border border-white/10 px-1.5 disabled:opacity-30">↓</button>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium">{locationLabel(item.location_id)}</td>
                    <td className="px-3 py-2">
                      <input
                        defaultValue={item.custom_label || ''}
                        onBlur={(e) => e.target.value !== (item.custom_label || '') && updateItem(item, { custom_label: e.target.value || null })}
                        placeholder={locationLabel(item.location_id)}
                        className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        defaultValue={item.custom_url || ''}
                        onBlur={(e) => e.target.value !== (item.custom_url || '') && updateItem(item, { custom_url: e.target.value || null })}
                        placeholder="/digital-marketing-courses-..."
                        className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        defaultValue={item.course_id || ''}
                        onChange={(e) => updateItem(item, { course_id: e.target.value || null })}
                        className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-100"
                      >
                        <option value="">No course context</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#07101b]">{c.title}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={Boolean(item.is_active)} onChange={(e) => updateItem(item, { is_active: e.target.checked })} />
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" disabled={busy} onClick={() => removeItem(item)} className="rounded border border-rose-400/30 px-2 py-1 text-rose-200 hover:bg-rose-400/10 disabled:opacity-50">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {status ? <p className="mt-3 text-xs text-slate-300">{status}</p> : null}
    </section>
  )
}
