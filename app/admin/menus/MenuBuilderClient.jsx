'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { isValidNavUrl } from '../../../lib/linkValidation'
import { buildMenuTree } from '../../../lib/menuTree'
import { DesktopNavItem } from '../../../components/cms/NavDropdown'
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Layers,
  Copy,
  Pencil,
  X,
  History,
  Monitor,
  Smartphone,
} from 'lucide-react'

const MENU_LOCATIONS = [
  { id: 'header', label: 'Header Menu', icon: '🔝' },
  { id: 'footer', label: 'Footer Menu', icon: '🔻' },
  { id: 'legal', label: 'Legal Links', icon: '📜' },
  { id: 'mobile', label: 'Mobile Menu', icon: '📱' },
]

const EMPTY_FORM = {
  title: '',
  url: '',
  target: '_self',
  parent_id: null,
  is_active: true,
  icon: '',
  description: '',
  desktop_visible: true,
  mobile_visible: true,
  status: 'published',
}

function SortableMenuRow({ item, level, onEdit, onDuplicate, onToggleActive, onDelete, saving }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, marginLeft: level * 24 }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`rounded-xl border p-3 transition-all ${!item.is_active ? 'opacity-50' : ''} ${
          isDragging ? 'opacity-50 shadow-lg' : ''
        } ${level === 0 ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.02]'}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
            title="Drag to reorder"
            aria-label={`Drag to reorder ${item.title}`}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              <span className="font-medium text-slate-100">{item.title}</span>
              {item.status === 'draft' && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  Draft
                </span>
              )}
              {item.desktop_visible === false && (
                <span title="Hidden on desktop"><Monitor className="h-3.5 w-3.5 text-slate-500" /></span>
              )}
              {item.mobile_visible === false && (
                <span title="Hidden on mobile"><Smartphone className="h-3.5 w-3.5 text-slate-500" /></span>
              )}
            </div>
            <div className="truncate text-xs text-slate-400">{item.url}</div>
            {item.description ? <div className="truncate text-xs text-slate-500">{item.description}</div> : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleActive(item)}
              disabled={saving}
              className={`p-1.5 rounded-lg ${item.is_active ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
              title={item.is_active ? 'Disable' : 'Enable'}
            >
              {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              disabled={saving}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(item)}
              disabled={saving}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              disabled={saving}
              className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MenuBuilderClient() {
  const [menus, setMenus] = useState([])
  const [pages, setPages] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('header')
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadMenus = useCallback(async () => {
    try {
      const json = await adminApiFetch(`/api/cms/menus?location=${selectedLocation}&include_inactive=1&limit=500`, { cache: 'no-store' })
      setMenus(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load menus.')
    }
  }, [selectedLocation])

  useEffect(() => {
    void loadMenus()
  }, [loadMenus])

  useEffect(() => {
    adminApiFetch('/api/cms/pages?limit=250', { cache: 'no-store' })
      .then((json) => setPages(Array.isArray(json.data) ? json.data : []))
      .catch(() => setPages([]))
  }, [])

  const tree = useMemo(() => buildMenuTree(menus), [menus])
  // Flattened for display (drag reorder happens within same-parent groups) and for the "which
  // item can be a parent" picker in the edit form.
  const flatOrdered = useMemo(() => {
    const rows = []
    const walk = (nodes, level) => {
      nodes.forEach((node) => {
        rows.push({ ...node, level })
        if (node.children?.length) walk(node.children, level + 1)
      })
    }
    walk(tree, 0)
    return rows
  }, [tree])

  const eligibleParents = useMemo(
    () => flatOrdered.filter((item) => item.id !== editingItem?.id && item.level < 2),
    [flatOrdered, editingItem]
  )

  async function saveMenuItem(event, statusOverride) {
    event.preventDefault()
    if (!formData.title.trim()) {
      setStatus('A menu label is required.')
      return
    }
    if (!formData.url.trim()) {
      setStatus('A destination is required.')
      return
    }
    if (!isValidNavUrl(formData.url)) {
      setStatus('Enter a valid destination - a path starting with / or a full https:// URL.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        url: formData.url.trim(),
        menu_location: selectedLocation,
        order_index: editingItem ? editingItem.order_index : menus.length,
        status: statusOverride || formData.status,
      }
      if (editingItem) payload.id = editingItem.id

      await adminApiFetch('/api/cms/menus', { method: 'POST', body: payload })
      setShowModal(false)
      setEditingItem(null)
      setFormData(EMPTY_FORM)
      await loadMenus()
      setStatus('Menu item saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMenuItem(item) {
    const childCount = flatOrdered.filter((row) => row.parent_id === item.id).length
    const warning = childCount
      ? `Delete "${item.title}"? Its ${childCount} dropdown item(s) will move up to top-level instead of being deleted.`
      : `Delete "${item.title}"?`
    if (!window.confirm(warning)) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/menus/${item.id}`, { method: 'DELETE' })
      await loadMenus()
      setStatus('Menu item deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateMenuItem(item) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...item, id: undefined, title: `${item.title} (Copy)`, order_index: menus.length },
      })
      await loadMenus()
      setStatus('Menu item duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(item) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/menus/${item.id}`, { method: 'PATCH', body: { is_active: !item.is_active } })
      await loadMenus()
      setStatus(`Menu item ${item.is_active ? 'disabled' : 'enabled'}.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to update menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = flatOrdered.find((row) => row.id === active.id)
    const overItem = flatOrdered.find((row) => row.id === over.id)
    if (!activeItem || !overItem) return
    if ((activeItem.parent_id || null) !== (overItem.parent_id || null)) {
      setStatus('Items can only be reordered within the same level - use "Parent item" in the edit form to move between levels.')
      return
    }

    const siblings = flatOrdered.filter((row) => (row.parent_id || null) === (activeItem.parent_id || null))
    const oldIndex = siblings.findIndex((row) => row.id === active.id)
    const newIndex = siblings.findIndex((row) => row.id === over.id)
    const reordered = arrayMove(siblings, oldIndex, newIndex)

    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/menus/reorder', {
        method: 'PATCH',
        body: {
          menu_location: selectedLocation,
          items: reordered.map((row, index) => ({ id: row.id, order_index: index })),
        },
      })
      await loadMenus()
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder menu.')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(item = null) {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        url: item.url,
        target: item.target || '_self',
        parent_id: item.parent_id || null,
        is_active: item.is_active,
        icon: item.icon || '',
        description: item.description || '',
        desktop_visible: item.desktop_visible !== false,
        mobile_visible: item.mobile_visible !== false,
        status: item.status === 'draft' ? 'draft' : 'published',
      })
    } else {
      setEditingItem(null)
      setFormData(EMPTY_FORM)
    }
    setShowModal(true)
  }

  async function loadVersions() {
    setVersionsLoading(true)
    try {
      const json = await adminApiFetch(`/api/cms/menus/versions?location=${selectedLocation}`, { cache: 'no-store' })
      setVersions(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load menu versions.')
    } finally {
      setVersionsLoading(false)
    }
  }

  async function openVersionsModal() {
    setShowVersions(true)
    await loadVersions()
  }

  async function publishMenu() {
    setSaving(true)
    setStatus('')
    try {
      const draftItems = flatOrdered.filter((item) => item.status === 'draft')
      await Promise.all(
        draftItems.map((item) => adminApiFetch(`/api/cms/menus/${item.id}`, { method: 'PATCH', body: { status: 'published' } }))
      )
      await adminApiFetch('/api/cms/menus/versions', {
        method: 'POST',
        body: { menu_location: selectedLocation, label: `Published ${new Date().toLocaleString()}` },
      })
      await loadMenus()
      setStatus(`Menu published${draftItems.length ? ` (${draftItems.length} draft item(s) went live)` : ''}. A restore point was saved.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to publish menu.')
    } finally {
      setSaving(false)
    }
  }

  async function restoreVersion(version) {
    if (!window.confirm(`Restore the menu to the version from ${new Date(version.created_at).toLocaleString()}? This replaces the current menu.`)) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/menus/versions/${version.id}/restore`, { method: 'POST' })
      setShowVersions(false)
      await loadMenus()
      setStatus('Menu restored.')
    } catch (error) {
      setStatus(error?.message || 'Failed to restore menu version.')
    } finally {
      setSaving(false)
    }
  }

  function pickExistingPage(slug) {
    setFormData((prev) => ({ ...prev, url: slug === '/' ? '/' : `/${slug}` }))
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Menu Builder</h2>
          <p className="mt-1 text-sm text-slate-300">
            Manage navigation menus and dropdowns for any menu item - drag to reorder, no coding required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowPreview(true)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
            Preview
          </button>
          <button type="button" onClick={openVersionsModal} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
            <History className="h-4 w-4" /> Version History
          </button>
          <button type="button" onClick={publishMenu} disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-50">
            Publish Menu
          </button>
          <button type="button" onClick={() => openEditModal()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]">
            <Plus className="h-4 w-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">{status}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Menu Locations</h3>
          {MENU_LOCATIONS.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => setSelectedLocation(location.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                selectedLocation === location.id
                  ? 'border border-teal-500/30 bg-teal-500/20 text-teal-300'
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-xl">{location.icon}</span>
              <span className="text-sm">{location.label}</span>
            </button>
          ))}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
            <p className="mb-1 font-semibold text-slate-200">How dropdowns work</p>
            <ul className="space-y-1">
              <li>- Any item can have dropdown children - pick its &quot;Parent item&quot; when editing a child.</li>
              <li>- Drag items to reorder within the same level.</li>
              <li>- Up to 3 levels: menu &rarr; dropdown &rarr; nested submenu.</li>
            </ul>
          </div>
        </aside>

        <main>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">
                {MENU_LOCATIONS.find((location) => location.id === selectedLocation)?.label} Items
              </h3>
              <span className="text-xs text-slate-400">{menus.length} items</span>
            </div>

            {flatOrdered.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Layers className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p className="font-medium">No menu items yet</p>
                <p className="mt-1 text-sm opacity-70">Click &quot;Add Menu Item&quot; to get started</p>
              </div>
            ) : (
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={flatOrdered.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {flatOrdered.map((item) => (
                      <SortableMenuRow
                        key={item.id}
                        item={item}
                        level={item.level}
                        onEdit={openEditModal}
                        onDuplicate={duplicateMenuItem}
                        onToggleActive={toggleActive}
                        onDelete={deleteMenuItem}
                        saving={saving}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#050b12] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={saveMenuItem} className="space-y-4">
              <label className="text-xs text-slate-400">
                Label
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Parent item (optional - leave blank for a top-level menu item)
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">None - top-level item</option>
                  {eligibleParents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {'— '.repeat(item.level)}{item.title}
                    </option>
                  ))}
                </select>
              </label>

              {pages.length > 0 && (
                <label className="text-xs text-slate-400">
                  Or pick an existing page as the destination
                  <select
                    value=""
                    onChange={(e) => e.target.value && pickExistingPage(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Select a page...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.slug}>{page.title || page.slug}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="text-xs text-slate-400">
                Destination URL
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={`mt-1 w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-slate-100 ${
                    !isValidNavUrl(formData.url) && formData.url ? 'border-rose-400/30' : 'border-white/10'
                  }`}
                  placeholder="/page-name or https://example.com"
                  required
                />
                {!isValidNavUrl(formData.url) && formData.url && (
                  <span className="mt-1 block text-[11px] text-rose-300">Enter a path starting with / or a full https:// URL.</span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">
                  Opens in
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="_self">Same tab</option>
                    <option value="_blank">New tab</option>
                  </select>
                </label>
                <label className="text-xs text-slate-400">
                  Icon (optional, emoji or short text)
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={50}
                    placeholder="📚"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>

              <label className="text-xs text-slate-400">
                Short description (optional - shown under the label in dropdowns)
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={300}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.desktop_visible}
                    onChange={(e) => setFormData({ ...formData, desktop_visible: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Visible on desktop
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.mobile_visible}
                    onChange={(e) => setFormData({ ...formData, mobile_visible: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Visible on mobile
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Enabled
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={(event) => saveMenuItem(event, 'draft')}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={(event) => saveMenuItem(event, 'published')}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-teal-500/20 px-4 py-2 text-sm text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingItem ? 'Update & Publish' : 'Add & Publish')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.05]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#050b12] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Version History</h3>
              <button type="button" onClick={() => setShowVersions(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            {versionsLoading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400">No saved versions yet. Click &quot;Publish Menu&quot; to create a restore point.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{version.label || 'Untitled version'}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(version.created_at).toLocaleString()} - {version.item_count} item(s)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreVersion(version)}
                      disabled={saving}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#050b12] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Live Preview - {MENU_LOCATIONS.find((location) => location.id === selectedLocation)?.label}</h3>
              <button type="button" onClick={() => setShowPreview(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-400">
              This shows exactly how the dropdown will render on the live site, including draft items (draft items are hidden from real visitors until published).
            </p>
            <div className="rounded-2xl border border-white/10 bg-slate-950/92 p-6">
              <div className="flex flex-wrap items-center gap-6">
                {tree.filter((item) => item.desktop_visible !== false).map((item) => (
                  <DesktopNavItem
                    key={item.id}
                    item={item}
                    linkClassName="text-slate-200 hover:text-white text-base font-semibold transition-colors"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Surface>
  )
}
