'use client'

import { useEffect, useMemo, useState } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'

const MENU_LOCATIONS = ['header', 'footer', 'bottom_dock', 'legal']

export default function SettingsAdminClient() {
  const [settings, setSettings] = useState({
    logo: '',
    favicon: '',
    company_name: '',
    contact_email: '',
    phone_number: '',
    address: '',
    footer_content: '',
    announcement_bar: '',
    default_seo_title: '',
    default_seo_description: '',
    default_og_image: '',
    social_links: {
      instagram: '',
      linkedin: '',
      youtube: '',
      facebook: '',
      whatsapp: '',
    },
    design_tokens: {
      brand_primary: '#5eead4',
      brand_secondary: '#22d3ee',
      heading_font: 'poppins',
      body_font: 'inter',
      button_radius: '12px',
      default_cta_variant: 'solid',
      tracking_scripts: '',
    },
    ui_copy: {
      nav_brand_label: '',
      nav_menu_label: '',
      nav_close_label: '',
      nav_dashboard_label: '',
      nav_signout_label: '',
      nav_signout_confirm_title: '',
      nav_signout_confirm_message: '',
      nav_signout_cancel_label: '',
      nav_signout_confirm_label: '',
      footer_nav_heading: '',
      footer_legal_heading: '',
      footer_contact_heading: '',
      footer_locations_title: '',
      footer_copyright_text: '',
      footer_location_links: [],
      dock_apply_label: '',
      blog_index_title: '',
      blog_index_subtitle: '',
      blog_read_more_label: '',
      blog_related_title: '',
      blog_share_label: '',
      blog_toc_title: '',
      blog_read_time_suffix: '',
      blog_category_prefix: '',
      blog_tag_prefix: '',
      blog_category_empty_label: '',
      blog_tag_empty_label: '',
      blog_author_missing_label: '',
      blog_author_empty_label: '',
    },
  })
  const [menus, setMenus] = useState([])
  const [menuForm, setMenuForm] = useState({
    id: '',
    menu_location: 'header',
    title: '',
    url: '',
    order_index: 0,
    parent_id: '',
    target: '_self',
    is_active: true,
  })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const groupedMenus = useMemo(() => {
    return MENU_LOCATIONS.reduce((acc, location) => {
      acc[location] = menus
        .filter((item) => item.menu_location === location)
        .sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))
      return acc
    }, {})
  }, [menus])

  function setUiCopy(key, value) {
    setSettings((prev) => ({
      ...prev,
      ui_copy: {
        ...(prev.ui_copy || {}),
        [key]: value,
      },
    }))
  }

  async function loadData() {
    setStatus('')
    try {
      const [settingsRes, menusRes] = await Promise.all([
        adminApiFetch('/api/cms/settings', { cache: 'no-store' }),
        adminApiFetch('/api/cms/menus?include_inactive=1&limit=500', { cache: 'no-store' }),
      ])

      setSettings((prev) => ({
        ...prev,
        ...(settingsRes.data || {}),
        social_links: {
          ...prev.social_links,
          ...((settingsRes.data?.social_links && typeof settingsRes.data.social_links === 'object')
            ? settingsRes.data.social_links
            : {}),
        },
        design_tokens: {
          ...prev.design_tokens,
          ...((settingsRes.data?.design_tokens && typeof settingsRes.data.design_tokens === 'object')
            ? settingsRes.data.design_tokens
            : {}),
        },
        ui_copy: {
          ...prev.ui_copy,
          ...((settingsRes.data?.ui_copy && typeof settingsRes.data.ui_copy === 'object')
            ? settingsRes.data.ui_copy
            : {}),
        },
      }))
      setMenus(Array.isArray(menusRes.data) ? menusRes.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load settings.')
      return
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function saveSettings(event) {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/settings', {
        method: 'PUT',
        body: settings,
      })
      setStatus('Site settings saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function saveMenu(event) {
    event.preventDefault()
    if (!menuForm.title.trim() || !menuForm.url.trim()) {
      setStatus('Menu title and URL are required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...menuForm,
        order_index: Number(menuForm.order_index) || 0,
        parent_id: menuForm.parent_id || null,
      }
      await adminApiFetch('/api/cms/menus', {
        method: 'POST',
        body: payload,
      })
      setMenuForm({
        id: '',
        menu_location: 'header',
        title: '',
        url: '',
        order_index: 0,
        parent_id: '',
        target: '_self',
        is_active: true,
      })
      await loadData()
      setStatus('Menu item saved.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMenu(id) {
    if (!window.confirm('Delete this menu item?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/menus/${id}`, { method: 'DELETE' })
      await loadData()
      setStatus('Menu item deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete menu item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Surface className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-slate-50">Site Settings & Menus</h2>
      <p className="mt-1 text-sm text-slate-300">Control announcement bar, contact details, social links, and all navigation menus.</p>

      <form onSubmit={saveSettings} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-base font-semibold text-slate-100">Global Settings</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs text-slate-400">
            Logo URL
            <input value={settings.logo || ''} onChange={(e) => setSettings((p) => ({ ...p, logo: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Favicon URL
            <input value={settings.favicon || ''} onChange={(e) => setSettings((p) => ({ ...p, favicon: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Company Name
            <input value={settings.company_name || ''} onChange={(e) => setSettings((p) => ({ ...p, company_name: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Contact Email
            <input value={settings.contact_email || ''} onChange={(e) => setSettings((p) => ({ ...p, contact_email: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Phone Number
            <input value={settings.phone_number || ''} onChange={(e) => setSettings((p) => ({ ...p, phone_number: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Address
            <textarea rows={3} value={settings.address || ''} onChange={(e) => setSettings((p) => ({ ...p, address: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Announcement Bar
            <input value={settings.announcement_bar || ''} onChange={(e) => setSettings((p) => ({ ...p, announcement_bar: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Footer Content
            <textarea rows={3} value={settings.footer_content || ''} onChange={(e) => setSettings((p) => ({ ...p, footer_content: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Default SEO Title
            <input value={settings.default_seo_title || ''} onChange={(e) => setSettings((p) => ({ ...p, default_seo_title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Default SEO Description
            <textarea rows={2} value={settings.default_seo_description || ''} onChange={(e) => setSettings((p) => ({ ...p, default_seo_description: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Default OG Image
            <input value={settings.default_og_image || ''} onChange={(e) => setSettings((p) => ({ ...p, default_og_image: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          {['instagram', 'linkedin', 'youtube', 'facebook', 'whatsapp'].map((key) => (
            <label key={key} className="text-xs text-slate-400">
              {key[0].toUpperCase() + key.slice(1)} URL
              <input
                value={settings.social_links?.[key] || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    social_links: {
                      ...(prev.social_links || {}),
                      [key]: e.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
              />
            </label>
          ))}
          <label className="text-xs text-slate-400">
            Brand Primary Color
            <input
              value={settings.design_tokens?.brand_primary || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), brand_primary: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Brand Secondary Color
            <input
              value={settings.design_tokens?.brand_secondary || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), brand_secondary: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Heading Font
            <input
              value={settings.design_tokens?.heading_font || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), heading_font: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Body Font
            <input
              value={settings.design_tokens?.body_font || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), body_font: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Default Button Radius
            <input
              value={settings.design_tokens?.button_radius || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), button_radius: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Tracking Scripts / Pixels
            <textarea
              rows={3}
              value={settings.design_tokens?.tracking_scripts || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  design_tokens: { ...(prev.design_tokens || {}), tracking_scripts: e.target.value },
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <div className="md:col-span-2 mt-2 border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-slate-100">Public Copy Controls</h4>
            <p className="mt-1 text-xs text-slate-400">Edit navbar/footer/CTA/blog labels without code changes.</p>
          </div>
          <label className="text-xs text-slate-400">
            Navbar Brand Label
            <input
              value={settings.ui_copy?.nav_brand_label || ''}
              onChange={(e) => setUiCopy('nav_brand_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Navbar Menu Label
            <input
              value={settings.ui_copy?.nav_menu_label || ''}
              onChange={(e) => setUiCopy('nav_menu_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Navbar Close Label
            <input
              value={settings.ui_copy?.nav_close_label || ''}
              onChange={(e) => setUiCopy('nav_close_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Dashboard Label
            <input
              value={settings.ui_copy?.nav_dashboard_label || ''}
              onChange={(e) => setUiCopy('nav_dashboard_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Sign-out Label
            <input
              value={settings.ui_copy?.nav_signout_label || ''}
              onChange={(e) => setUiCopy('nav_signout_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Sign-out Confirm Title
            <input
              value={settings.ui_copy?.nav_signout_confirm_title || ''}
              onChange={(e) => setUiCopy('nav_signout_confirm_title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Sign-out Confirm Message
            <input
              value={settings.ui_copy?.nav_signout_confirm_message || ''}
              onChange={(e) => setUiCopy('nav_signout_confirm_message', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Sign-out Cancel Label
            <input
              value={settings.ui_copy?.nav_signout_cancel_label || ''}
              onChange={(e) => setUiCopy('nav_signout_cancel_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Sign-out Confirm Button Label
            <input
              value={settings.ui_copy?.nav_signout_confirm_label || ''}
              onChange={(e) => setUiCopy('nav_signout_confirm_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Footer Navigation Heading
            <input
              value={settings.ui_copy?.footer_nav_heading || ''}
              onChange={(e) => setUiCopy('footer_nav_heading', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Footer Legal Heading
            <input
              value={settings.ui_copy?.footer_legal_heading || ''}
              onChange={(e) => setUiCopy('footer_legal_heading', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Footer Contact Heading
            <input
              value={settings.ui_copy?.footer_contact_heading || ''}
              onChange={(e) => setUiCopy('footer_contact_heading', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Footer Locations Title
            <input
              value={settings.ui_copy?.footer_locations_title || ''}
              onChange={(e) => setUiCopy('footer_locations_title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Footer Location Links (one per line)
            <textarea
              rows={4}
              value={Array.isArray(settings.ui_copy?.footer_location_links) ? settings.ui_copy.footer_location_links.join('\n') : ''}
              onChange={(e) =>
                setUiCopy(
                  'footer_location_links',
                  String(e.target.value || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                )
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Footer Copyright Template (use {"{year}"} and {"{company}"})
            <input
              value={settings.ui_copy?.footer_copyright_text || ''}
              onChange={(e) => setUiCopy('footer_copyright_text', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Bottom Dock CTA Label
            <input
              value={settings.ui_copy?.dock_apply_label || ''}
              onChange={(e) => setUiCopy('dock_apply_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Index Title
            <input
              value={settings.ui_copy?.blog_index_title || ''}
              onChange={(e) => setUiCopy('blog_index_title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 md:col-span-2">
            Blog Index Subtitle
            <input
              value={settings.ui_copy?.blog_index_subtitle || ''}
              onChange={(e) => setUiCopy('blog_index_subtitle', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Read More Label
            <input
              value={settings.ui_copy?.blog_read_more_label || ''}
              onChange={(e) => setUiCopy('blog_read_more_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Related Title
            <input
              value={settings.ui_copy?.blog_related_title || ''}
              onChange={(e) => setUiCopy('blog_related_title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Share Label
            <input
              value={settings.ui_copy?.blog_share_label || ''}
              onChange={(e) => setUiCopy('blog_share_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog TOC Title
            <input
              value={settings.ui_copy?.blog_toc_title || ''}
              onChange={(e) => setUiCopy('blog_toc_title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Read Time Suffix
            <input
              value={settings.ui_copy?.blog_read_time_suffix || ''}
              onChange={(e) => setUiCopy('blog_read_time_suffix', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Category Prefix
            <input
              value={settings.ui_copy?.blog_category_prefix || ''}
              onChange={(e) => setUiCopy('blog_category_prefix', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Tag Prefix
            <input
              value={settings.ui_copy?.blog_tag_prefix || ''}
              onChange={(e) => setUiCopy('blog_tag_prefix', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Category Empty Label
            <input
              value={settings.ui_copy?.blog_category_empty_label || ''}
              onChange={(e) => setUiCopy('blog_category_empty_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Tag Empty Label
            <input
              value={settings.ui_copy?.blog_tag_empty_label || ''}
              onChange={(e) => setUiCopy('blog_tag_empty_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Author Missing Label
            <input
              value={settings.ui_copy?.blog_author_missing_label || ''}
              onChange={(e) => setUiCopy('blog_author_missing_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Blog Author Empty Label
            <input
              value={settings.ui_copy?.blog_author_empty_label || ''}
              onChange={(e) => setUiCopy('blog_author_empty_label', e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
        <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-base font-semibold text-slate-100">Menu Manager</h3>
        <form onSubmit={saveMenu} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-xs text-slate-400">
            Location
            <select value={menuForm.menu_location} onChange={(e) => setMenuForm((p) => ({ ...p, menu_location: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">
              {MENU_LOCATIONS.map((location) => (
                <option key={location} value={location} className="bg-[#07101b]">
                  {location}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Title
            <input value={menuForm.title} onChange={(e) => setMenuForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            URL
            <input value={menuForm.url} onChange={(e) => setMenuForm((p) => ({ ...p, url: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Order
            <input type="number" value={menuForm.order_index} onChange={(e) => setMenuForm((p) => ({ ...p, order_index: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Parent Menu ID
            <input value={menuForm.parent_id} onChange={(e) => setMenuForm((p) => ({ ...p, parent_id: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="text-xs text-slate-400">
            Target
            <select value={menuForm.target} onChange={(e) => setMenuForm((p) => ({ ...p, target: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100">
              <option value="_self" className="bg-[#07101b]">_self</option>
              <option value="_blank" className="bg-[#07101b]">_blank</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 md:col-span-3">
            <input type="checkbox" checked={menuForm.is_active} onChange={(e) => setMenuForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Active
          </label>
          <button type="submit" disabled={saving} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200 disabled:opacity-70">
            {saving ? 'Saving...' : menuForm.id ? 'Update Menu' : 'Add Menu'}
          </button>
          <button
            type="button"
            onClick={() =>
              setMenuForm({
                id: '',
                menu_location: 'header',
                title: '',
                url: '',
                order_index: 0,
                parent_id: '',
                target: '_self',
                is_active: true,
              })
            }
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
          >
            Reset
          </button>
        </form>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {MENU_LOCATIONS.map((location) => (
            <div key={location} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h4 className="text-sm font-semibold text-slate-100">{location}</h4>
              <div className="mt-3 space-y-2">
                {(groupedMenus[location] || []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-sm font-semibold text-slate-100">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.url} | order {item.order_index}</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuForm({
                            id: item.id,
                            menu_location: item.menu_location || 'header',
                            title: item.title || '',
                            url: item.url || '',
                            order_index: Number(item.order_index || 0),
                            parent_id: item.parent_id || '',
                            target: item.target || '_self',
                            is_active: Boolean(item.is_active),
                          })
                        }
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/[0.05]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMenu(item.id)}
                        className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(groupedMenus[location] || []).length === 0 ? (
                  <p className="text-xs text-slate-500">No menu items.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
    </Surface>
  )
}
