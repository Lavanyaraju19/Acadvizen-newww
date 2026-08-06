'use client'

import { useState, useEffect, useCallback } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
import { isValidNavUrl } from '../../../lib/linkValidation'
import { 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  GripVertical,
  Image as ImageIcon,
  Phone,
  Mail,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Layers,
  Settings,
  MoreHorizontal,
  Monitor,
  Smartphone,
  Link2,
  Copy,
  Scissors
} from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'twitter', label: 'Twitter', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
]

const MENU_ICONS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'book', label: 'Courses', emoji: '📚' },
  { id: 'graduation-cap', label: 'Learning', emoji: '🎓' },
  { id: 'users', label: 'Community', emoji: '👥' },
  { id: 'briefcase', label: 'Jobs', emoji: '💼' },
  { id: 'star', label: 'Featured', emoji: '⭐' },
  { id: 'heart', label: 'Favorites', emoji: '❤️' },
  { id: 'clock', label: 'Schedule', emoji: '⏰' },
  { id: 'calendar', label: 'Calendar', emoji: '📅' },
  { id: 'message', label: 'Messages', emoji: '💬' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
  { id: 'help', label: 'Help', emoji: '❓' },
  { id: 'none', label: 'No Icon', emoji: '' },
]

const MAX_DEPTH = 3
const DEFAULT_MEGA_MENU_COLUMNS = 2

function generateNavItemId() {
  return 'nav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function normalizeNavItems(items) {
  return items.map((item) => ({
    id: item.id || generateNavItemId(),
    label: item.label || '',
    link: item.link || '/',
    active: item.active !== undefined ? item.active : true,
    target: item.target || '_self',
    icon: item.icon || 'none',
    parent_id: item.parent_id || null,
    order_index: item.order_index !== undefined ? item.order_index : 0,
    has_dropdown: item.has_dropdown || false,
    is_mega_menu: item.is_mega_menu || false,
    mega_menu_columns: item.mega_menu_columns || DEFAULT_MEGA_MENU_COLUMNS,
    mega_menu_content: item.mega_menu_content || null,
    visible_desktop: item.visible_desktop !== undefined ? item.visible_desktop : true,
    visible_mobile: item.visible_mobile !== undefined ? item.visible_mobile : true,
    children: Array.isArray(item.children) ? normalizeNavItems(item.children) : [],
  }))
}

export default function HeaderBuilderClient() {
  const [settings, setSettings] = useState({
    logo_url: '',
    logo_alt: 'Acadvizen',
    logo_link: '/',
    announcement_enabled: false,
    announcement_text: '',
    announcement_link: '',
    announcement_bg_color: '#10b981',
    announcement_text_color: '#ffffff',
    nav_items: [],
    primary_cta_enabled: true,
    primary_cta_text: 'Get Started',
    primary_cta_link: '/courses',
    primary_cta_bg_color: '#14b8a6',
    primary_cta_text_color: '#ffffff',
    secondary_cta_enabled: false,
    secondary_cta_text: 'Login',
    secondary_cta_link: '/login',
    secondary_cta_bg_color: 'transparent',
    secondary_cta_text_color: '#ffffff',
    secondary_cta_border_color: '#ffffff',
    show_phone: false,
    phone_number: '',
    phone_link: '',
    show_email: false,
    email_address: '',
    email_link: '',
    show_social: false,
    social_items: [],
    sticky_header: false,
    transparent_header: false,
    header_bg_color: '#050b12',
    header_text_color: '#ffffff',
    header_border_color: 'rgba(255,255,255,0.1)',
    mobile_menu_style: 'drawer',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeSection, setActiveSection] = useState('logo')
  const [expandedSections, setExpandedSections] = useState(new Set(['logo']))
  const [expandedMenuItems, setExpandedMenuItems] = useState(new Set())
  const [editingNavItem, setEditingNavItem] = useState(null)

  const loadSettings = useCallback(async () => {
    try {
      const payload = await adminApiFetch('/api/cms/header', { cache: 'no-store' })
      const data = payload?.data
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          nav_items: normalizeNavItems(Array.isArray(data.nav_items) ? data.nav_items : []),
          social_items: Array.isArray(data.social_items) ? data.social_items : [],
        }))
      }
    } catch (error) {
      setStatus(error?.message || 'Failed to load header settings.')
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  async function saveSettings() {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/header', {
        method: 'POST',
        body: settings,
      })
      setStatus('Header settings saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(field, file) {
    if (!file) return
    setUploading(field)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'header')
      setSettings(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }


  // Check for circular references
  function hasCircularReference(itemId, parentId, navItems) {
    if (!parentId) return false
    if (parentId === itemId) return true
    
    const parent = findNavItemById(parentId, navItems)
    if (!parent) return false
    
    return hasCircularReference(itemId, parent.parent_id, navItems)
  }

  // Find nav item by ID (recursive)
  function findNavItemById(id, items, parent = null) {
    for (const item of items) {
      if (item.id === id) return { item, parent }
      if (item.children && item.children.length > 0) {
        const found = findNavItemById(id, item.children, item)
        if (found) return found
      }
    }
    return null
  }

  // Get depth of a nav item
  function getItemDepth(itemId, navItems) {
    const found = findNavItemById(itemId, navItems)
    if (!found) return 0
    
    let depth = 0
    let current = found.item
    while (current.parent_id) {
      depth++
      const parent = findNavItemById(current.parent_id, navItems)
      if (!parent) break
      current = parent.item
    }
    return depth
  }

  // Get all nav items as flat list
  function getFlatNavItems(items = settings.nav_items, result = []) {
    for (const item of items) {
      result.push(item)
      if (item.children && item.children.length > 0) {
        getFlatNavItems(item.children, result)
      }
    }
    return result
  }

  // Get parent options for dropdown
  function getParentOptions(currentItemId = null) {
    const flatItems = getFlatNavItems()
    return flatItems
      .filter(item => item.id !== currentItemId)
      .filter(item => {
        const depth = getItemDepth(item.id, settings.nav_items)
        return depth < MAX_DEPTH - 1
      })
      .map(item => ({
        value: item.id,
        label: item.label || 'Untitled',
        depth: getItemDepth(item.id, settings.nav_items),
      }))
  }

  // Get parent options for a specific item (excluding its descendants)
  function getParentOptionsForItem(itemId) {
    const flatItems = getFlatNavItems()
    const descendants = new Set()
    
    // Get all descendants of the current item
    const collectDescendants = (item) => {
      descendants.add(item.id)
      if (item.children) {
        item.children.forEach(collectDescendants)
      }
    }
    
    const currentItem = findNavItemById(itemId, settings.nav_items)
    if (currentItem) {
      collectDescendants(currentItem.item)
    }
    
    return flatItems
      .filter(item => !descendants.has(item.id))
      .filter(item => {
        const depth = getItemDepth(item.id, settings.nav_items)
        return depth < MAX_DEPTH - 1
      })
      .map(item => ({
        value: item.id,
        label: item.label || 'Untitled',
        depth: getItemDepth(item.id, settings.nav_items),
      }))
  }

  // Get breadcrumb for a nav item
  function getBreadcrumb(itemId) {
    const breadcrumb = []
    let current = findNavItemById(itemId, settings.nav_items)
    
    while (current) {
      breadcrumb.unshift(current.item.label || 'Untitled')
      if (current.item.parent_id) {
        current = findNavItemById(current.item.parent_id, settings.nav_items)
      } else {
        break
      }
    }
    
    return breadcrumb.join(' > ')
  }

  function addNavItem(parentId = null) {
    const newItem = {
      id: generateId(),
      label: '',
      link: '/',
      active: true,
      target: '_self',
      icon: 'none',
      parent_id: parentId,
      order_index: 0,
      has_dropdown: false,
      is_mega_menu: false,
      mega_menu_columns: DEFAULT_MEGA_MENU_COLUMNS,
      mega_menu_content: null,
      visible_desktop: true,
      visible_mobile: true,
      children: [],
    }

    if (parentId) {
      setSettings(prev => {
        const updateChildren = (items) => {
          return items.map(item => {
            if (item.id === parentId) {
              return {
                ...item,
                children: [...(item.children || []), { ...newItem, order_index: (item.children || []).length }],
                has_dropdown: true,
              }
            }
            if (item.children && item.children.length > 0) {
              return { ...item, children: updateChildren(item.children) }
            }
            return item
          })
        }
        return { ...prev, nav_items: updateChildren(prev.nav_items) }
      })
    } else {
      setSettings(prev => ({
        ...prev,
        nav_items: [...prev.nav_items, { ...newItem, order_index: prev.nav_items.length }],
      }))
    }
  }

  function updateNavItem(itemId, field, value) {
    setSettings(prev => {
      const updateItem = (items) => {
        return items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, [field]: value }
            
            // Auto-enable dropdown when adding children
            if (field === 'children' && value && value.length > 0) {
              updated.has_dropdown = true
            }
            
            // Disable mega menu if dropdown is disabled
            if (field === 'has_dropdown' && value === false) {
              updated.is_mega_menu = false
            }
            
            return updated
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: updateItem(item.children) }
          }
          return item
        })
      }
      return { ...prev, nav_items: updateItem(prev.nav_items) }
    })
  }

  // Recursive version of updateNavItem for nested updates
  function updateNavItemRecursive(items, itemId, field, value) {
    return items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value }
        
        // Auto-enable dropdown when adding children
        if (field === 'children' && value && value.length > 0) {
          updated.has_dropdown = true
        }
        
        // Disable mega menu if dropdown is disabled
        if (field === 'has_dropdown' && value === false) {
          updated.is_mega_menu = false
        }
        
        return updated
      }
      if (item.children && item.children.length > 0) {
        return { ...item, children: updateNavItemRecursive(item.children, itemId, field, value) }
      }
      return item
    })
  }

  function removeNavItem(itemId) {
    setSettings(prev => {
      const removeItem = (items) => {
        return items
          .filter(item => item.id !== itemId)
          .map(item => {
            if (item.children && item.children.length > 0) {
              const newChildren = removeItem(item.children)
              if (newChildren.length === 0) {
                return { ...item, children: [], has_dropdown: false }
              }
              return { ...item, children: newChildren }
            }
            return item
          })
      }
      return { ...prev, nav_items: removeItem(prev.nav_items) }
    })
  }

  function moveNavItem(itemId, direction) {
    setSettings(prev => {
      const moveItem = (items, parentId = null) => {
        const index = items.findIndex(item => item.id === itemId)
        if (index === -1) {
          // Search in children
          return items.map(item => {
            if (item.children && item.children.length > 0) {
              return { ...item, children: moveItem(item.children, item.id) }
            }
            return item
          })
        }

        const newItems = [...items]
        const [removed] = newItems.splice(index, 1)
        
        if (direction === 'up' && index > 0) {
          newItems.splice(index - 1, 0, removed)
        } else if (direction === 'down' && index < items.length - 1) {
          newItems.splice(index + 1, 0, removed)
        }
        
        // Update order indices
        return newItems.map((item, idx) => ({
          ...item,
          order_index: idx,
          children: item.children ? item.children.map((child, cIdx) => ({
            ...child,
            order_index: cIdx,
          })) : [],
        }))
      }
      return { ...prev, nav_items: moveItem(prev.nav_items) }
    })
  }

  function moveNavItemToParent(itemId, newParentId) {
    if (hasCircularReference(itemId, newParentId, settings.nav_items)) {
      setStatus('Cannot move item: circular reference detected.')
      return
    }

    const depth = getItemDepth(newParentId, settings.nav_items)
    if (depth >= MAX_DEPTH - 1) {
      setStatus(`Cannot move item: maximum depth (${MAX_DEPTH}) exceeded.`)
      return
    }

    setSettings(prev => {
      // First, remove the item from its current location
      const removeItem = (items) => {
        return items
          .filter(item => item.id !== itemId)
          .map(item => {
            if (item.children && item.children.length > 0) {
              const newChildren = removeItem(item.children)
              if (newChildren.length === 0) {
                return { ...item, children: [], has_dropdown: false }
              }
              return { ...item, children: newChildren }
            }
            return item
          })
      }

      // Then, add it to the new parent
      const addToParent = (items) => {
        if (!newParentId) {
          return [...items, findNavItemById(itemId, removeItem(prev.nav_items))?.item]
        }
        return items.map(item => {
          if (item.id === newParentId) {
            const child = findNavItemById(itemId, removeItem(prev.nav_items))?.item
            return {
              ...item,
              children: [...(item.children || []), { ...child, parent_id: newParentId }],
              has_dropdown: true,
            }
          }
          if (item.children && item.children.length > 0) {
            return { ...item, children: addToParent(item.children) }
          }
          return item
        })
      }

      return { ...prev, nav_items: addToParent(removeItem(prev.nav_items)) }
    })
  }

  function duplicateNavItem(itemId) {
    const found = findNavItemById(itemId, settings.nav_items)
    if (!found) return

    const duplicateItem = (item) => {
      const newItem = {
        ...item,
        id: generateId(),
        label: `${item.label} (copy)`,
        children: item.children ? item.children.map(child => duplicateItem(child)) : [],
      }
      return newItem
    }

    const duplicated = duplicateItem(found.item)

    setSettings(prev => {
      if (found.parent) {
        const addToParent = (items) => {
          return items.map(item => {
            if (item.id === found.parent.id) {
              return {
                ...item,
                children: [...(item.children || []), { ...duplicated, parent_id: found.parent.id }],
              }
            }
            if (item.children && item.children.length > 0) {
              return { ...item, children: addToParent(item.children) }
            }
            return item
          })
        }
        return { ...prev, nav_items: addToParent(prev.nav_items) }
      } else {
        return { ...prev, nav_items: [...prev.nav_items, duplicated] }
      }
    })
  }

  function toggleMenuItemExpansion(itemId) {
    setExpandedMenuItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  function addSocialItem() {
    setSettings(prev => ({
      ...prev,
      social_items: [...prev.social_items, { platform: 'linkedin', url: '', active: true }]
    }))
  }

  function updateSocialItem(index, field, value) {
    setSettings(prev => ({
      ...prev,
      social_items: prev.social_items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeSocialItem(index) {
    setSettings(prev => ({
      ...prev,
      social_items: prev.social_items.filter((_, i) => i !== index)
    }))
  }

  function toggleSection(section) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Header Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize website header, navigation, and contact info</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Section Navigation */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Sections</h3>
          {[
            { id: 'logo', label: 'Logo', icon: ImageIcon },
            { id: 'announcement', label: 'Announcement Bar', icon: Layers },
            { id: 'navigation', label: 'Navigation', icon: Layers },
            { id: 'cta', label: 'CTA Buttons', icon: ExternalLink },
            { id: 'contact', label: 'Contact Info', icon: Phone },
            { id: 'social', label: 'Social Icons', icon: Layers },
            { id: 'settings', label: 'Header Settings', icon: Settings },
          ].map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => { setActiveSection(section.id); toggleSection(section.id); }}
              className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                activeSection === section.id 
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                  : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </aside>

        {/* Section Editor */}
        <main>
          {/* Logo Section */}
          {activeSection === 'logo' && expandedSections.has('logo') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Logo Settings</h3>
              
              <label className="text-xs text-slate-400">
                Logo URL
                <input
                  type="url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Logo Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload('logo_url', e.target.files?.[0])}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
                {uploading === 'logo_url' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
              </label>
              
              <label className="text-xs text-slate-400">
                Alt Text
                <input
                  type="text"
                  value={settings.logo_alt}
                  onChange={(e) => setSettings({ ...settings, logo_alt: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Logo Link
                <input
                  type="text"
                  value={settings.logo_link}
                  onChange={(e) => setSettings({ ...settings, logo_link: e.target.value })}
                  placeholder="/ or https://example.com"
                  className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 ${
                    !isValidNavUrl(settings.logo_link) && settings.logo_link ? 'border-rose-400/30' : 'border-white/10'
                  }`}
                />
                {!isValidNavUrl(settings.logo_link) && settings.logo_link && (
                  <span className="mt-1 block text-[11px] text-rose-300">Enter a path starting with / or a full https:// URL.</span>
                )}
              </label>
            </div>
          )}

          {/* Announcement Bar */}
          {activeSection === 'announcement' && expandedSections.has('announcement') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Announcement Bar</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, announcement_enabled: !settings.announcement_enabled })}
                  className={`p-2 rounded-lg ${settings.announcement_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.announcement_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                Announcement Text
                <input
                  type="text"
                  value={settings.announcement_text}
                  onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Special offer: 50% off all courses!"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Link URL (optional)
                {/* type="text" not "url" - a native url input rejects relative paths like "/courses",
                    which is the common case here, not an edge case. */}
                <input
                  type="text"
                  value={settings.announcement_link}
                  onChange={(e) => setSettings({ ...settings, announcement_link: e.target.value })}
                  placeholder="/ or https://example.com"
                  className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 ${
                    !isValidNavUrl(settings.announcement_link) && settings.announcement_link ? 'border-rose-400/30' : 'border-white/10'
                  }`}
                />
                {!isValidNavUrl(settings.announcement_link) && settings.announcement_link && (
                  <span className="mt-1 block text-[11px] text-rose-300">Enter a path starting with / or a full https:// URL.</span>
                )}
              </label>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Background Color
                  <input
                    type="color"
                    value={settings.announcement_bg_color}
                    onChange={(e) => setSettings({ ...settings, announcement_bg_color: e.target.value })}
                    className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Text Color
                  <input
                    type="color"
                    value={settings.announcement_text_color}
                    onChange={(e) => setSettings({ ...settings, announcement_text_color: e.target.value })}
                    className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          {activeSection === 'navigation' && expandedSections.has('navigation') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Navigation Menu</h3>
                <button
                  type="button"
                  onClick={() => addNavItem()}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Top-Level Item
                </button>
              </div>

              <div className="space-y-2">
                {settings.nav_items.map((item) => (
                  <NavItemEditor
                    key={item.id}
                    item={item}
                    depth={0}
                    expanded={expandedMenuItems.has(item.id)}
                    onToggleExpand={() => toggleMenuItemExpansion(item.id)}
                    onUpdate={(field, value) => updateNavItem(item.id, field, value)}
                    onAddChild={() => addNavItem(item.id)}
                    onRemove={() => removeNavItem(item.id)}
                    onMoveUp={() => moveNavItem(item.id, 'up')}
                    onMoveDown={() => moveNavItem(item.id, 'down')}
                    onDuplicate={() => duplicateNavItem(item.id)}
                    onMoveToParent={(newParentId) => moveNavItemToParent(item.id, newParentId)}
                    editing={editingNavItem === item.id}
                    onSetEditing={() => setEditingNavItem(editingNavItem === item.id ? null : item.id)}
                    parentOptions={getParentOptions(item.id)}
                    breadcrumb={getBreadcrumb(item.id)}
                    onUpdateChild={(childId, field, value) => {
                      setSettings(prev => ({ ...prev, nav_items: updateNavItemRecursive(prev.nav_items, childId, field, value) }))
                    }}
                    onEditChild={(childId) => setEditingNavItem(editingNavItem === childId ? null : childId)}
                    editingChild={editingNavItem}
                    getParentOptionsForItem={getParentOptionsForItem}
                  />
                ))}
              </div>

              {settings.nav_items.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No navigation items yet. Click &quot;Add Top-Level Item&quot; to get started.
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          {activeSection === 'cta' && expandedSections.has('cta') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">CTA Buttons</h3>
              
              {/* Primary CTA */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">Primary CTA</span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, primary_cta_enabled: !settings.primary_cta_enabled })}
                    className={`p-2 rounded-lg ${settings.primary_cta_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.primary_cta_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      value={settings.primary_cta_text}
                      onChange={(e) => setSettings({ ...settings, primary_cta_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Link
                    <input
                      type="text"
                      value={settings.primary_cta_link}
                      onChange={(e) => setSettings({ ...settings, primary_cta_link: e.target.value })}
                      placeholder="/ or https://example.com"
                      className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 ${
                        !isValidNavUrl(settings.primary_cta_link) && settings.primary_cta_link ? 'border-rose-400/30' : 'border-white/10'
                      }`}
                    />
                    {!isValidNavUrl(settings.primary_cta_link) && settings.primary_cta_link && (
                      <span className="mt-1 block text-[11px] text-rose-300">Enter a path starting with / or a full https:// URL.</span>
                    )}
                  </label>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <label className="text-xs text-slate-400">
                    Background Color
                    <input
                      type="color"
                      value={settings.primary_cta_bg_color}
                      onChange={(e) => setSettings({ ...settings, primary_cta_bg_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Text Color
                    <input
                      type="color"
                      value={settings.primary_cta_text_color}
                      onChange={(e) => setSettings({ ...settings, primary_cta_text_color: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                  </label>
                </div>
              </div>
              
              {/* Secondary CTA */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200">Secondary CTA</span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, secondary_cta_enabled: !settings.secondary_cta_enabled })}
                    className={`p-2 rounded-lg ${settings.secondary_cta_enabled ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.secondary_cta_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-slate-400">
                    Button Text
                    <input
                      type="text"
                      value={settings.secondary_cta_text}
                      onChange={(e) => setSettings({ ...settings, secondary_cta_text: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Link
                    <input
                      type="text"
                      value={settings.secondary_cta_link}
                      onChange={(e) => setSettings({ ...settings, secondary_cta_link: e.target.value })}
                      placeholder="/ or https://example.com"
                      className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 ${
                        !isValidNavUrl(settings.secondary_cta_link) && settings.secondary_cta_link ? 'border-rose-400/30' : 'border-white/10'
                      }`}
                    />
                    {!isValidNavUrl(settings.secondary_cta_link) && settings.secondary_cta_link && (
                      <span className="mt-1 block text-[11px] text-rose-300">Enter a path starting with / or a full https:// URL.</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {activeSection === 'contact' && expandedSections.has('contact') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Contact Information</h3>
              
              {/* Phone */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, show_phone: !settings.show_phone })}
                    className={`p-2 rounded-lg ${settings.show_phone ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.show_phone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <label className="text-xs text-slate-400">
                  Phone Number
                  <input
                    type="tel"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Phone Link (tel:)
                  <input
                    type="text"
                    value={settings.phone_link}
                    onChange={(e) => setSettings({ ...settings, phone_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="tel:+919876543210"
                  />
                </label>
              </div>
              
              {/* Email */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, show_email: !settings.show_email })}
                    className={`p-2 rounded-lg ${settings.show_email ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                  >
                    {settings.show_email ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <label className="text-xs text-slate-400">
                  Email Address
                  <input
                    type="email"
                    value={settings.email_address}
                    onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Email Link (mailto:)
                  <input
                    type="text"
                    value={settings.email_link}
                    onChange={(e) => setSettings({ ...settings, email_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    placeholder="mailto:info@acadvizen.com"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Social Icons */}
          {activeSection === 'social' && expandedSections.has('social') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Social Icons</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_social: !settings.show_social })}
                  className={`p-2 rounded-lg ${settings.show_social ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_social ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <button
                type="button"
                onClick={addSocialItem}
                className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Social Link
              </button>
              
              {settings.social_items.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-slate-400">
                      Platform
                      <select
                        value={item.platform}
                        onChange={(e) => updateSocialItem(index, 'platform', e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      >
                        {SOCIAL_PLATFORMS.map(platform => (
                          <option key={platform.id} value={platform.id}>{platform.label}</option>
                        ))}
                      </select>
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      URL
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateSocialItem(index, 'url', e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => updateSocialItem(index, 'active', e.target.checked)}
                        className="rounded border-white/10 bg-white/[0.03]"
                      />
                      Visible
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeSocialItem(index)}
                      className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Header Settings */}
          {activeSection === 'settings' && expandedSections.has('settings') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Header Settings</h3>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={settings.sticky_header}
                    onChange={(e) => setSettings({ ...settings, sticky_header: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Sticky Header
                </label>
                
                <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={settings.transparent_header}
                    onChange={(e) => setSettings({ ...settings, transparent_header: e.target.checked })}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Transparent Header
                </label>
              </div>
              
              <label className="text-xs text-slate-400">
                Background Color
                <input
                  type="color"
                  value={settings.header_bg_color}
                  onChange={(e) => setSettings({ ...settings, header_bg_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Text Color
                <input
                  type="color"
                  value={settings.header_text_color}
                  onChange={(e) => setSettings({ ...settings, header_text_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Border Color
                <input
                  type="color"
                  value={settings.header_border_color}
                  onChange={(e) => setSettings({ ...settings, header_border_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Mobile Menu Style
                <select
                  value={settings.mobile_menu_style}
                  onChange={(e) => setSettings({ ...settings, mobile_menu_style: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="drawer">Drawer (Slide-in)</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </label>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}

// Nested component for editing individual nav items
function NavItemEditor({
  item,
  depth,
  expanded,
  onToggleExpand,
  onUpdate,
  onAddChild,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onMoveToParent,
  editing,
  onSetEditing,
  parentOptions,
  breadcrumb,
  onUpdateChild,
  onEditChild,
  editingChild,
  getParentOptionsForItem,
}) {
  const hasChildren = item.children && item.children.length > 0
  const canHaveChildren = depth < MAX_DEPTH - 1
  const iconEmoji = MENU_ICONS.find(i => i.id === item.icon)?.emoji || ''

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
      style={{ marginLeft: depth * 20 }}
    >
      {/* Item Header */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <GripVertical className="w-5 h-5 text-slate-500 flex-shrink-0" />

          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {/* Icon & Label */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {iconEmoji && <span className="text-lg">{iconEmoji}</span>}
            <span className="text-sm text-slate-200 truncate">
              {item.label || 'Untitled'}
            </span>
            {item.has_dropdown && (
              <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-xs">
                Dropdown
              </span>
            )}
            {item.is_mega_menu && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                Mega Menu
              </span>
            )}
            {!item.active && (
              <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 text-xs">
                Hidden
              </span>
            )}
          </div>

          {/* Visibility Indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${item.visible_desktop ? 'text-teal-400' : 'text-slate-500'}`}>
              <Monitor className="w-3 h-3" />
            </span>
            <span className={`text-xs ${item.visible_mobile ? 'text-teal-400' : 'text-slate-500'}`}>
              <Smartphone className="w-3 h-3" />
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              title="Move Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              title="Move Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {canHaveChildren && (
              <button
                type="button"
                onClick={onAddChild}
                className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                title="Add Child Item"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSetEditing}
              className={`p-1.5 rounded-lg border ${
                editing ? 'border-teal-500/30 bg-teal-500/20 text-teal-300' : 'border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
              title="Edit"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Panel */}
        {editing && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
            {/* Breadcrumb */}
            {breadcrumb && (
              <div className="text-xs text-slate-400">
                Path: {breadcrumb}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {/* Label */}
              <label className="text-xs text-slate-400">
                Label
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => onUpdate('label', e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>

              {/* Link */}
              <label className="text-xs text-slate-400">
                Link
                <input
                  type="text"
                  value={item.link}
                  onChange={(e) => onUpdate('link', e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="/path or https://example.com"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* Icon */}
              <label className="text-xs text-slate-400">
                Icon
                <select
                  value={item.icon}
                  onChange={(e) => onUpdate('icon', e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  {MENU_ICONS.map(icon => (
                    <option key={icon.id} value={icon.id}>
                      {icon.emoji} {icon.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Target */}
              <label className="text-xs text-slate-400">
                Link Target
                <select
                  value={item.target}
                  onChange={(e) => onUpdate('target', e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="_self">Same Tab (_self)</option>
                  <option value="_blank">New Tab (_blank)</option>
                </select>
              </label>

              {/* Parent */}
              <label className="text-xs text-slate-400">
                Parent Item
                <select
                  value={item.parent_id || ''}
                  onChange={(e) => onMoveToParent(e.target.value || null)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="">No Parent (Top Level)</option>
                  {(getParentOptionsForItem ? getParentOptionsForItem(item.id) : parentOptions).map(option => (
                    <option key={option.value} value={option.value}>
                      {'  '.repeat(option.depth)}{option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Dropdown & Mega Menu Settings */}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={item.has_dropdown}
                  onChange={(e) => onUpdate('has_dropdown', e.target.checked)}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Enable Dropdown
              </label>

              {item.has_dropdown && (
                <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={item.is_mega_menu}
                    onChange={(e) => onUpdate('is_mega_menu', e.target.checked)}
                    className="rounded border-white/10 bg-white/[0.03]"
                  />
                  Mega Menu
                </label>
              )}
            </div>

            {/* Mega Menu Columns */}
            {item.is_mega_menu && (
              <label className="text-xs text-slate-400">
                Mega Menu Columns (1-4)
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={item.mega_menu_columns}
                  onChange={(e) => onUpdate('mega_menu_columns', parseInt(e.target.value) || 1)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            )}

            {/* Mega Menu Content */}
            {item.is_mega_menu && (
              <label className="text-xs text-slate-400">
                Mega Menu Content (HTML or text)
                <textarea
                  value={item.mega_menu_content || ''}
                  onChange={(e) => onUpdate('mega_menu_content', e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 min-h-[100px]"
                  placeholder="Add custom content for mega menu..."
                />
              </label>
            )}

            {/* Visibility Settings */}
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) => onUpdate('active', e.target.checked)}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                Active
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={item.visible_desktop}
                  onChange={(e) => onUpdate('visible_desktop', e.target.checked)}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                <Monitor className="w-3 h-3" />
                Desktop
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <input
                  type="checkbox"
                  checked={item.visible_mobile}
                  onChange={(e) => onUpdate('visible_mobile', e.target.checked)}
                  className="rounded border-white/10 bg-white/[0.03]"
                />
                <Smartphone className="w-3 h-3" />
                Mobile
              </label>
            </div>

            {/* Mega Menu Preview */}
            {item.is_mega_menu && item.mega_menu_content && (
              <div className="mt-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="text-xs text-slate-400 mb-2">Mega Menu Preview:</div>
                <div
                  className="text-sm text-slate-200"
                  dangerouslySetInnerHTML={{ __html: item.mega_menu_content }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="border-t border-white/10 bg-white/[0.01] p-2 space-y-2">
          {item.children.map((child) => (
            <NavItemEditor
              key={child.id}
              item={child}
              depth={depth + 1}
              expanded={false}
              onToggleExpand={() => onToggleExpand && onToggleExpand(child.id)}
              onUpdate={(field, value) => {
                if (onUpdateChild) {
                  onUpdateChild(child.id, field, value)
                } else {
                  onUpdate('children', item.children.map(c => 
                    c.id === child.id ? { ...c, [field]: value } : c
                  ))
                }
              }}
              onAddChild={() => {}}
              onRemove={() => onUpdate('children', item.children.filter(c => c.id !== child.id))}
              onMoveUp={() => {
                const newChildren = [...item.children]
                const idx = newChildren.findIndex(c => c.id === child.id)
                if (idx > 0) {
                  [newChildren[idx], newChildren[idx - 1]] = [newChildren[idx - 1], newChildren[idx]]
                  onUpdate('children', newChildren)
                }
              }}
              onMoveDown={() => {
                const newChildren = [...item.children]
                const idx = newChildren.findIndex(c => c.id === child.id)
                if (idx < newChildren.length - 1) {
                  [newChildren[idx], newChildren[idx + 1]] = [newChildren[idx + 1], newChildren[idx]]
                  onUpdate('children', newChildren)
                }
              }}
              onDuplicate={() => {}}
              onMoveToParent={() => {}}
              editing={editingChild === child.id}
              onSetEditing={() => onEditChild && onEditChild(child.id)}
              parentOptions={getParentOptionsForItem ? getParentOptionsForItem(child.id) : []}
              breadcrumb={breadcrumb ? `${breadcrumb} > ${child.label || 'Untitled'}` : child.label || 'Untitled'}
              onUpdateChild={onUpdateChild}
              onEditChild={onEditChild}
              editingChild={editingChild}
              getParentOptionsForItem={getParentOptionsForItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
