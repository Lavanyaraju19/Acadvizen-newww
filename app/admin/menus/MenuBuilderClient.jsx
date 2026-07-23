'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Plus, 
  Save, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Menu as MenuIcon
} from 'lucide-react'

const MENU_LOCATIONS = [
  { id: 'header', label: 'Header Menu', icon: '🔝' },
  { id: 'footer', label: 'Footer Menu', icon: '🔻' },
  { id: 'mobile', label: 'Mobile Menu', icon: '📱' },
]

export default function MenuBuilderClient() {
  const [menus, setMenus] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('header')
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    target: '_self',
    parent_id: null,
    is_active: true,
  })

  useEffect(() => {
    loadMenus()
  }, [selectedLocation])

  async function loadMenus() {
    try {
      const json = await adminApiFetch(`/api/cms/menus?location=${selectedLocation}&include_inactive=1&limit=500`, { cache: 'no-store' })
      setMenus(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load menus.')
    }
  }

  async function saveMenuItem(event) {
    event.preventDefault()
    if (!formData.title || !formData.url) {
      setStatus('Title and URL are required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...formData,
        menu_location: selectedLocation,
        order_index: menus.length,
      }
      
      if (editingItem) {
        payload.id = editingItem.id
        payload.order_index = editingItem.order_index
      }
      
      await adminApiFetch('/api/cms/menus', { method: 'POST', body: payload })
      setShowModal(false)
      setEditingItem(null)
      setFormData({ title: '', url: '', target: '_self', parent_id: null, is_active: true })
      await loadMenus()
      setStatus('Menu item saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMenuItem(id) {
    if (!window.confirm('Delete this menu item?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/menus/${id}`, { method: 'DELETE' })
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
      const payload = {
        ...item,
        id: undefined,
        title: `${item.title} (Copy)`,
        order_index: menus.length,
      }
      
      await adminApiFetch('/api/cms/menus', { method: 'POST', body: payload })
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
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...item, is_active: !item.is_active }
      })
      await loadMenus()
      setStatus(`Menu item ${item.is_active ? 'disabled' : 'enabled'}.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to update menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function moveItemUp(item) {
    const currentIndex = menus.findIndex(m => m.id === item.id)
    if (currentIndex === 0) return
    
    const aboveItem = menus[currentIndex - 1]
    
    setSaving(true)
    try {
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...item, order_index: aboveItem.order_index }
      })
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...aboveItem, order_index: item.order_index }
      })
      await loadMenus()
    } catch (error) {
      setStatus(error?.message || 'Failed to reorder menu.')
    } finally {
      setSaving(false)
    }
  }

  async function moveItemDown(item) {
    const currentIndex = menus.findIndex(m => m.id === item.id)
    if (currentIndex === menus.length - 1) return
    
    const belowItem = menus[currentIndex + 1]
    
    setSaving(true)
    try {
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...item, order_index: belowItem.order_index }
      })
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: { ...belowItem, order_index: item.order_index }
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
        parent_id: item.parent_id,
        is_active: item.is_active,
      })
    } else {
      setEditingItem(null)
      setFormData({ title: '', url: '', target: '_self', parent_id: null, is_active: true })
    }
    setShowModal(true)
  }

  function buildMenuTree(items) {
    const map = {}
    const roots = []
    
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })
    
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id])
      } else {
        roots.push(map[item.id])
      }
    })
    
    return roots
  }

  const menuTree = buildMenuTree(menus)

  function renderMenuItem(item, level = 0) {
    return (
      <div key={item.id} style={{ marginLeft: level * 20 }}>
        <div className={`p-4 rounded-xl border transition-all ${
          !item.is_active ? 'opacity-50' : ''
        } ${level === 0 ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.02]'}`}>
          <div className="flex items-center gap-3">
            <GripVertical className="w-5 h-5 text-slate-500 cursor-move" />
            <div className="flex-1">
              <div className="font-medium text-slate-100">{item.title}</div>
              <div className="text-xs text-slate-400">{item.url}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveItemUp(item)}
                disabled={saving}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                title="Move Up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItemDown(item)}
                disabled={saving}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                title="Move Down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleActive(item)}
                disabled={saving}
                className={`p-1.5 rounded-lg ${item.is_active ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                title={item.is_active ? 'Disable' : 'Enable'}
              >
                {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => openEditModal(item)}
                disabled={saving}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                title="Edit"
              >
                <MenuIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => duplicateMenuItem(item)}
                disabled={saving}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteMenuItem(item.id)}
                disabled={saving}
                className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {item.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Menu Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Manage website navigation menus with drag-and-drop</p>
        </div>
        <button
          type="button"
          onClick={() => openEditModal()}
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 hover:bg-teal-200"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Menu Item
        </button>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Menu Locations */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Menu Locations</h3>
          {MENU_LOCATIONS.map(location => (
            <button
              key={location.id}
              type="button"
              onClick={() => setSelectedLocation(location.id)}
              className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                selectedLocation === location.id 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-xl">{location.icon}</span>
              <span className="text-sm">{location.label}</span>
            </button>
          ))}
        </aside>

        {/* Menu Items */}
        <main>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100">
                {MENU_LOCATIONS.find(l => l.id === selectedLocation)?.label} Items
              </h3>
              <span className="text-xs text-slate-400">{menus.length} items</span>
            </div>

            {menuTree.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MenuIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No menu items yet</p>
                <p className="text-sm mt-1 opacity-70">Click "Add Menu Item" to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {menuTree.map(item => renderMenuItem(item))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-slate-100 mb-2">Tips</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Drag items to reorder (use up/down arrows)</li>
              <li>• Create nested menus by setting parent items</li>
              <li>• Use `_blank` target to open links in new tab</li>
              <li>• Disable items without deleting them</li>
            </ul>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <MenuIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveMenuItem} className="space-y-4">
              <label className="text-xs text-slate-400">
                Title
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                URL
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/page-name or https://example.com"
                  required
                />
              </label>

              <label className="text-xs text-slate-400">
                Target
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="_self">Same tab (_self)</option>
                  <option value="_blank">New tab (_blank)</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Visible (Enabled)
              </label>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Surface>
  )
}