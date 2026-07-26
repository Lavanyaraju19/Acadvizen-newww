'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
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
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutList,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Monitor,
  Check,
  AlertCircle
} from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'twitter', label: 'Twitter', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'github', label: 'GitHub', icon: '⌘' },
  { id: 'tiktok', label: 'TikTok', icon: '♪' },
  { id: 'pinterest', label: 'Pinterest', icon: 'P' },
  { id: 'discord', label: 'Discord', icon: '💭' },
]

const CONTACT_TYPES = [
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'phone', label: 'Phone', icon: '📞' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'website', label: 'Website', icon: '🌐' },
  { id: 'hours', label: 'Business Hours', icon: '🕐' },
]

const COLUMN_WIDTHS = [
  { id: 'auto', label: 'Auto' },
  { id: '1/4', label: '1/4 (25%)' },
  { id: '1/3', label: '1/3 (33%)' },
  { id: '1/2', label: '1/2 (50%)' },
  { id: 'full', label: 'Full (100%)' },
]

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Validation functions
function isValidUrl(url) {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidEmail(email) {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone) {
  if (!phone) return true
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/
  return phoneRegex.test(phone)
}

export default function FooterBuilderClient() {
  const [settings, setSettings] = useState({
    logo_url: '',
    logo_alt: 'Acadvizen',
    columns: [
      {
        id: generateUUID(),
        title: 'Quick Links',
        width: 'auto',
        order_index: 0,
        links: [
          { id: generateUUID(), label: 'Home', url: '/', external: false, active: true, order_index: 0 },
          { id: generateUUID(), label: 'About', url: '/about', external: false, active: true, order_index: 1 },
        ]
      },
      {
        id: generateUUID(),
        title: 'Courses',
        width: 'auto',
        order_index: 1,
        links: [
          { id: generateUUID(), label: 'All Courses', url: '/courses', external: false, active: true, order_index: 0 },
        ]
      },
      {
        id: generateUUID(),
        title: 'Company',
        width: 'auto',
        order_index: 2,
        links: [
          { id: generateUUID(), label: 'About Us', url: '/about', external: false, active: true, order_index: 0 },
          { id: generateUUID(), label: 'Contact', url: '/contact', external: false, active: true, order_index: 1 },
        ]
      }
    ],
    copyright_text: '© 2026 ACADVIZEN. ALL RIGHTS RESERVED.',
    copyright_year: new Date().getFullYear(),
    company_name: 'ACADVIZEN',
    legal_links: [
      { id: generateUUID(), label: 'Privacy Policy', url: '/privacy', external: false, active: true, order_index: 0 },
      { id: generateUUID(), label: 'Terms of Service', url: '/terms', external: false, active: true, order_index: 1 },
      { id: generateUUID(), label: 'Cookie Policy', url: '/cookies', external: false, active: true, order_index: 2 },
    ],
    social_links: [],
    contact_info: [],
    show_newsletter: false,
    newsletter_title: 'Subscribe to our newsletter',
    newsletter_placeholder: 'Enter your email',
    newsletter_success_message: 'Thank you for subscribing!',
    newsletter_api_endpoint: '',
    show_cta: false,
    cta_title: 'Ready to start?',
    cta_description: 'Join our program today',
    cta_button_text: 'Get Started',
    cta_button_link: '/courses',
    cta_bg_color: '#14b8a6',
    cta_text_color: '#ffffff',
    footer_bg_color: '#050b12',
    footer_text_color: '#ffffff',
    footer_link_color: '#94a3b8',
    footer_border_color: 'rgba(255,255,255,0.1)',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeSection, setActiveSection] = useState('columns')
  const [expandedSections, setExpandedSections] = useState(new Set(['columns', 'cta']))
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data } = await supabaseClient
        .from('footer_settings')
        .select('*')
        .single()
      
      if (data) {
        // Migrate old data structure to new structure if needed
        const migratedData = { ...data }
        
        // If old column structure exists, migrate to new columns array
        if (data.column1_title && !data.columns) {
          migratedData.columns = [
            {
              id: generateUUID(),
              title: data.column1_title || 'Column 1',
              width: 'auto',
              order_index: 0,
              links: (data.column1_links || []).map((link, i) => ({
                id: generateUUID(),
                label: link.label || '',
                url: link.link || '/',
                external: false,
                active: link.active !== false,
                order_index: i
              }))
            },
            {
              id: generateUUID(),
              title: data.column2_title || 'Column 2',
              width: 'auto',
              order_index: 1,
              links: (data.column2_links || []).map((link, i) => ({
                id: generateUUID(),
                label: link.label || '',
                url: link.link || '/',
                external: false,
                active: link.active !== false,
                order_index: i
              }))
            },
            {
              id: generateUUID(),
              title: data.column3_title || 'Column 3',
              width: 'auto',
              order_index: 2,
              links: (data.column3_links || []).map((link, i) => ({
                id: generateUUID(),
                label: link.label || '',
                url: link.link || '/',
                external: false,
                active: link.active !== false,
                order_index: i
              }))
            },
            {
              id: generateUUID(),
              title: data.column4_title || 'Column 4',
              width: 'auto',
              order_index: 3,
              links: (data.column4_links || []).map((link, i) => ({
                id: generateUUID(),
                label: link.label || '',
                url: link.link || '/',
                external: false,
                active: link.active !== false,
                order_index: i
              }))
            }
          ]
        }
        
        // Migrate social_items to social_links
        if (data.social_items && !data.social_links) {
          migratedData.social_links = data.social_items.map((item, i) => ({
            id: generateUUID(),
            platform: item.platform || 'linkedin',
            url: item.url || '',
            icon: SOCIAL_PLATFORMS.find(p => p.id === item.platform)?.icon || 'in',
            active: item.active !== false,
            order_index: i
          }))
        }
        
        // Migrate contact fields to contact_info
        if ((data.contact_phone || data.contact_email || data.contact_address) && !data.contact_info) {
          const contactInfo = []
          if (data.contact_address) {
            contactInfo.push({
              id: generateUUID(),
              type: 'address',
              label: 'Address',
              value: data.contact_address,
              icon: '📍',
              active: true,
              order_index: 0
            })
          }
          if (data.contact_phone) {
            contactInfo.push({
              id: generateUUID(),
              type: 'phone',
              label: 'Phone',
              value: data.contact_phone,
              icon: '📞',
              active: true,
              order_index: 1
            })
          }
          if (data.contact_email) {
            contactInfo.push({
              id: generateUUID(),
              type: 'email',
              label: 'Email',
              value: data.contact_email,
              icon: '✉️',
              active: true,
              order_index: 2
            })
          }
          migratedData.contact_info = contactInfo
        }
        
        // Migrate legal links
        if ((data.privacy_policy_link || data.terms_link || data.cookie_policy_link) && !data.legal_links) {
          const legalLinks = []
          if (data.privacy_policy_link) {
            legalLinks.push({
              id: generateUUID(),
              label: 'Privacy Policy',
              url: data.privacy_policy_link,
              external: false,
              active: true,
              order_index: 0
            })
          }
          if (data.terms_link) {
            legalLinks.push({
              id: generateUUID(),
              label: 'Terms of Service',
              url: data.terms_link,
              external: false,
              active: true,
              order_index: 1
            })
          }
          if (data.cookie_policy_link) {
            legalLinks.push({
              id: generateUUID(),
              label: 'Cookie Policy',
              url: data.cookie_policy_link,
              external: false,
              active: true,
              order_index: 2
            })
          }
          migratedData.legal_links = legalLinks
        }
        
        setSettings(prev => ({
          ...prev,
          ...migratedData,
          columns: Array.isArray(migratedData.columns) ? migratedData.columns : prev.columns,
          social_links: Array.isArray(migratedData.social_links) ? migratedData.social_links : prev.social_links,
          contact_info: Array.isArray(migratedData.contact_info) ? migratedData.contact_info : prev.contact_info,
          legal_links: Array.isArray(migratedData.legal_links) ? migratedData.legal_links : prev.legal_links,
        }))
      }
    } catch (error) {
      console.error('Failed to load footer settings:', error)
    }
  }

  async function saveSettings() {
    setSaving(true)
    setStatus('')
    try {
      // Use API route instead of direct service role key access
      const response = await fetch('/api/cms/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) throw new Error('Failed to update footer settings')
      
      const { error } = await response.json()
      if (error) throw error
      
      setStatus('Footer settings saved successfully.')
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
      const asset = await uploadFileAsset(file, 'footer')
      setSettings(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  // Column functions
  function addColumn() {
    if (settings.columns.length >= 6) {
      setStatus('Maximum 6 columns allowed.')
      return
    }
    setSettings(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        {
          id: generateUUID(),
          title: `Column ${prev.columns.length + 1}`,
          width: 'auto',
          order_index: prev.columns.length,
          links: []
        }
      ]
    }))
  }

  function removeColumn(columnId) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== columnId)
    }))
  }

  function updateColumn(columnId, field, value) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, [field]: value } : col
      )
    }))
  }

  function moveColumnUp(index) {
    if (index === 0) return
    const newColumns = [...settings.columns]
    const [removed] = newColumns.splice(index, 1)
    newColumns.splice(index - 1, 0, removed)
    // Update order_index
    newColumns.forEach((col, i) => col.order_index = i)
    setSettings(prev => ({ ...prev, columns: newColumns }))
  }

  function moveColumnDown(index) {
    if (index === settings.columns.length - 1) return
    const newColumns = [...settings.columns]
    const [removed] = newColumns.splice(index, 1)
    newColumns.splice(index + 1, 0, removed)
    // Update order_index
    newColumns.forEach((col, i) => col.order_index = i)
    setSettings(prev => ({ ...prev, columns: newColumns }))
  }

  // Link functions
  function addLink(columnId) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId 
          ? {
              ...col,
              links: [
                ...col.links,
                {
                  id: generateUUID(),
                  label: '',
                  url: '/',
                  external: false,
                  active: true,
                  order_index: col.links.length
                }
              ]
            }
          : col
      )
    }))
  }

  function updateLink(columnId, linkId, field, value) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId 
          ? {
              ...col,
              links: col.links.map(link => 
                link.id === linkId ? { ...link, [field]: value } : link
              )
            }
          : col
      )
    }))
  }

  function removeLink(columnId, linkId) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId 
          ? {
              ...col,
              links: col.links.filter(link => link.id !== linkId)
            }
          : col
      )
    }))
  }

  function moveLinkUp(columnId, linkIndex) {
    if (linkIndex === 0) return
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id !== columnId) return col
        const newLinks = [...col.links]
        const [removed] = newLinks.splice(linkIndex, 1)
        newLinks.splice(linkIndex - 1, 0, removed)
        newLinks.forEach((link, i) => link.order_index = i)
        return { ...col, links: newLinks }
      })
    }))
  }

  function moveLinkDown(columnId, linkIndex) {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id !== columnId) return col
        if (linkIndex === col.links.length - 1) return col
        const newLinks = [...col.links]
        const [removed] = newLinks.splice(linkIndex, 1)
        newLinks.splice(linkIndex + 1, 0, removed)
        newLinks.forEach((link, i) => link.order_index = i)
        return { ...col, links: newLinks }
      })
    }))
  }

  // Social link functions
  function addSocialLink() {
    setSettings(prev => ({
      ...prev,
      social_links: [
        ...prev.social_links,
        {
          id: generateUUID(),
          platform: 'linkedin',
          url: '',
          icon: 'in',
          active: true,
          order_index: prev.social_links.length
        }
      ]
    }))
  }

  function updateSocialLink(linkId, field, value) {
    setSettings(prev => ({
      ...prev,
      social_links: prev.social_links.map(link => 
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }))
  }

  function removeSocialLink(linkId) {
    setSettings(prev => ({
      ...prev,
      social_links: prev.social_links.filter(link => link.id !== linkId)
    }))
  }

  function moveSocialLinkUp(index) {
    if (index === 0) return
    const newLinks = [...settings.social_links]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index - 1, 0, removed)
    newLinks.forEach((link, i) => link.order_index = i)
    setSettings(prev => ({ ...prev, social_links: newLinks }))
  }

  function moveSocialLinkDown(index) {
    if (index === settings.social_links.length - 1) return
    const newLinks = [...settings.social_links]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index + 1, 0, removed)
    newLinks.forEach((link, i) => link.order_index = i)
    setSettings(prev => ({ ...prev, social_links: newLinks }))
  }

  // Contact info functions
  function addContactInfo() {
    setSettings(prev => ({
      ...prev,
      contact_info: [
        ...prev.contact_info,
        {
          id: generateUUID(),
          type: 'address',
          label: 'Contact',
          value: '',
          icon: '📍',
          active: true,
          order_index: prev.contact_info.length
        }
      ]
    }))
  }

  function updateContactInfo(contactId, field, value) {
    setSettings(prev => ({
      ...prev,
      contact_info: prev.contact_info.map(contact => {
        if (contact.id !== contactId) return contact
        const updated = { ...contact, [field]: value }
        // Update icon when type changes
        if (field === 'type') {
          const type = CONTACT_TYPES.find(t => t.id === value)
          if (type) updated.icon = type.icon
        }
        return updated
      })
    }))
  }

  function removeContactInfo(contactId) {
    setSettings(prev => ({
      ...prev,
      contact_info: prev.contact_info.filter(contact => contact.id !== contactId)
    }))
  }

  function moveContactInfoUp(index) {
    if (index === 0) return
    const newContacts = [...settings.contact_info]
    const [removed] = newContacts.splice(index, 1)
    newContacts.splice(index - 1, 0, removed)
    newContacts.forEach((contact, i) => contact.order_index = i)
    setSettings(prev => ({ ...prev, contact_info: newContacts }))
  }

  function moveContactInfoDown(index) {
    if (index === settings.contact_info.length - 1) return
    const newContacts = [...settings.contact_info]
    const [removed] = newContacts.splice(index, 1)
    newContacts.splice(index + 1, 0, removed)
    newContacts.forEach((contact, i) => contact.order_index = i)
    setSettings(prev => ({ ...prev, contact_info: newContacts }))
  }

  // Legal links functions
  function addLegalLink() {
    setSettings(prev => ({
      ...prev,
      legal_links: [
        ...prev.legal_links,
        {
          id: generateUUID(),
          label: '',
          url: '/',
          external: false,
          active: true,
          order_index: prev.legal_links.length
        }
      ]
    }))
  }

  function updateLegalLink(linkId, field, value) {
    setSettings(prev => ({
      ...prev,
      legal_links: prev.legal_links.map(link => 
        link.id === linkId ? { ...link, [field]: value } : link
      )
    }))
  }

  function removeLegalLink(linkId) {
    setSettings(prev => ({
      ...prev,
      legal_links: prev.legal_links.filter(link => link.id !== linkId)
    }))
  }

  function moveLegalLinkUp(index) {
    if (index === 0) return
    const newLinks = [...settings.legal_links]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index - 1, 0, removed)
    newLinks.forEach((link, i) => link.order_index = i)
    setSettings(prev => ({ ...prev, legal_links: newLinks }))
  }

  function moveLegalLinkDown(index) {
    if (index === settings.legal_links.length - 1) return
    const newLinks = [...settings.legal_links]
    const [removed] = newLinks.splice(index, 1)
    newLinks.splice(index + 1, 0, removed)
    newLinks.forEach((link, i) => link.order_index = i)
    setSettings(prev => ({ ...prev, legal_links: newLinks }))
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
          <h2 className="text-2xl font-semibold text-slate-50">Footer Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Customize footer columns, links, and contact info</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-xl border border-white/10 ${showPreview ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-200'} hover:bg-white/[0.05]`}
          >
            <Monitor className="w-4 h-4 inline mr-2" />
            {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Open Site
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

      {showPreview && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Live Preview</h3>
          <div 
            className="rounded-xl p-6 border border-white/10"
            style={{ 
              backgroundColor: settings.footer_bg_color,
              color: settings.footer_text_color 
            }}
          >
            {/* CTA Section */}
            {settings.show_cta && (
              <div 
                className="rounded-xl p-6 mb-6 text-center"
                style={{ backgroundColor: settings.cta_bg_color, color: settings.cta_text_color }}
              >
                <h4 className="text-xl font-bold mb-2">{settings.cta_title}</h4>
                <p className="mb-4 opacity-90">{settings.cta_description}</p>
                <button className="px-6 py-2 rounded-lg border-2 border-current font-semibold hover:opacity-80">
                  {settings.cta_button_text}
                </button>
              </div>
            )}
            
            {/* Newsletter Section */}
            {settings.show_newsletter && (
              <div className="mb-6 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold mb-2">{settings.newsletter_title}</h4>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder={settings.newsletter_placeholder}
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.05] text-sm"
                  />
                  <button className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-semibold">
                    Subscribe
                  </button>
                </div>
              </div>
            )}
            
            {/* Columns */}
            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: settings.columns.map(col => col.width === 'auto' ? '1fr' : col.width).join(' ') }}>
              {settings.columns.map(column => (
                <div key={column.id}>
                  <h5 className="font-semibold mb-3" style={{ color: settings.footer_link_color }}>{column.title}</h5>
                  <ul className="space-y-2">
                    {column.links.filter(link => link.active).map(link => (
                      <li key={link.id}>
                        <a 
                          href={link.url} 
                          className="text-sm hover:opacity-80 flex items-center gap-1"
                          style={{ color: settings.footer_link_color }}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                          {link.external && <ExternalLink className="w-3 h-3" />}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {/* Contact Info */}
            {settings.contact_info.filter(c => c.active).length > 0 && (
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                {settings.contact_info.filter(c => c.active).map(contact => (
                  <div key={contact.id} className="flex items-start gap-2">
                    <span className="text-lg">{CONTACT_TYPES.find(t => t.id === contact.type)?.icon}</span>
                    <div>
                      <p className="text-xs opacity-70">{contact.label}</p>
                      <p className="text-sm">{contact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Social Links */}
            {settings.social_links.filter(s => s.active).length > 0 && (
              <div className="mb-6 flex gap-4">
                {settings.social_links.filter(s => s.active).map(social => (
                  <a 
                    key={social.id} 
                    href={social.url}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/[0.05]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-lg">{social.icon}</span>
                  </a>
                ))}
              </div>
            )}
            
            {/* Legal Links & Copyright */}
            <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm opacity-70">{settings.copyright_text}</p>
              <div className="flex gap-4 text-sm">
                {settings.legal_links.filter(link => link.active).map(link => (
                  <a 
                    key={link.id} 
                    href={link.url}
                    className="hover:opacity-80 flex items-center gap-1"
                    style={{ color: settings.footer_link_color }}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                    {link.external && <ExternalLink className="w-3 h-3" />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Section Navigation */}
        <aside className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Sections</h3>
          {[
            { id: 'logo', label: 'Logo', icon: ImageIcon },
            { id: 'columns', label: 'Footer Columns', icon: LayoutList },
            { id: 'contact', label: 'Contact Info', icon: Phone },
            { id: 'social', label: 'Social Icons', icon: Layers },
            { id: 'newsletter', label: 'Newsletter', icon: Mail },
            { id: 'cta', label: 'CTA Section', icon: Layers },
            { id: 'legal', label: 'Legal & Copyright', icon: Layers },
            { id: 'settings', label: 'Footer Settings', icon: Layers },
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
              <h3 className="text-base font-semibold text-slate-100">Footer Logo</h3>
              
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
            </div>
          )}

          {/* Footer Columns */}
          {activeSection === 'columns' && expandedSections.has('columns') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Footer Columns ({settings.columns.length}/6)</h3>
                <button
                  type="button"
                  onClick={addColumn}
                  disabled={settings.columns.length >= 6}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Column
                </button>
              </div>
              
              {settings.columns.map((column, colIndex) => (
                <div key={column.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-start gap-3 mb-4">
                    <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                    <div className="flex-1 grid gap-3 md:grid-cols-3">
                      <label className="text-xs text-slate-400">
                        Column Title
                        <input
                          type="text"
                          value={column.title}
                          onChange={(e) => updateColumn(column.id, 'title', e.target.value)}
                          className="mt-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      
                      <label className="text-xs text-slate-400">
                        Width
                        <select
                          value={column.width}
                          onChange={(e) => updateColumn(column.id, 'width', e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        >
                          {COLUMN_WIDTHS.map(width => (
                            <option key={width.id} value={width.id}>{width.label}</option>
                          ))}
                        </select>
                      </label>
                      
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => moveColumnUp(colIndex)}
                          disabled={colIndex === 0}
                          className="flex-1 p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveColumnDown(colIndex)}
                          disabled={colIndex === settings.columns.length - 1}
                          className="flex-1 p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColumn(column.id)}
                          className="flex-1 p-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 ml-8">
                    <span className="text-xs text-slate-400">Links ({column.links.length})</span>
                    <button
                      type="button"
                      onClick={() => addLink(column.id)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Link
                    </button>
                  </div>
                  
                  {column.links.map((link, linkIndex) => (
                    <div key={link.id} className="p-3 rounded-lg border border-white/10 bg-white/[0.02] mb-2 ml-8">
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateLink(column.id, link.id, 'label', e.target.value)}
                              placeholder="Link Label"
                              className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                            <div className="relative">
                              <input
                                type="text"
                                value={link.url}
                                onChange={(e) => updateLink(column.id, link.id, 'url', e.target.value)}
                                placeholder="Link URL"
                                className={`px-3 py-1.5 text-sm rounded-lg border bg-white/[0.03] text-slate-100 pr-20 ${
                                  !isValidUrl(link.url) && link.url ? 'border-rose-400/30' : 'border-white/10'
                                }`}
                              />
                              {!isValidUrl(link.url) && link.url && (
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-rose-400">
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs text-slate-400">
                              <input
                                type="checkbox"
                                checked={link.external}
                                onChange={(e) => updateLink(column.id, link.id, 'external', e.target.checked)}
                                className="rounded border-white/10 bg-white/[0.03]"
                              />
                              <ExternalLink className="w-3 h-3" />
                              External
                            </label>
                            
                            <label className="flex items-center gap-2 text-xs text-slate-400">
                              <input
                                type="checkbox"
                                checked={link.active}
                                onChange={(e) => updateLink(column.id, link.id, 'active', e.target.checked)}
                                className="rounded border-white/10 bg-white/[0.03]"
                              />
                              <Eye className="w-3 h-3" />
                              Visible
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveLinkUp(column.id, linkIndex)}
                            disabled={linkIndex === 0}
                            className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLinkDown(column.id, linkIndex)}
                            disabled={linkIndex === column.links.length - 1}
                            className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLink(column.id, link.id)}
                            className="p-1 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Contact Info */}
          {activeSection === 'contact' && expandedSections.has('contact') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Contact Information ({settings.contact_info.length})</h3>
                <button
                  type="button"
                  onClick={addContactInfo}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Contact
                </button>
              </div>
              
              {settings.contact_info.map((contact, index) => (
                <div key={contact.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-400">
                          Type
                          <select
                            value={contact.type}
                            onChange={(e) => updateContactInfo(contact.id, 'type', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          >
                            {CONTACT_TYPES.map(type => (
                              <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                          </select>
                        </label>
                        
                        <label className="text-xs text-slate-400">
                          Icon Preview
                          <div className="mt-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 flex items-center gap-2">
                            <span className="text-lg">{contact.icon}</span>
                            <span className="text-slate-400">{CONTACT_TYPES.find(t => t.id === contact.type)?.label}</span>
                          </div>
                        </label>
                      </div>
                      
                      <label className="text-xs text-slate-400">
                        Label
                        <input
                          type="text"
                          value={contact.label}
                          onChange={(e) => updateContactInfo(contact.id, 'label', e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      
                      <label className="text-xs text-slate-400">
                        Value
                        {contact.type === 'address' ? (
                          <textarea
                            value={contact.value}
                            onChange={(e) => updateContactInfo(contact.id, 'value', e.target.value)}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        ) : (
                          <input
                            type={contact.type === 'email' ? 'email' : contact.type === 'phone' ? 'tel' : 'text'}
                            value={contact.value}
                            onChange={(e) => updateContactInfo(contact.id, 'value', e.target.value)}
                            className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 ${
                              (contact.type === 'email' && !isValidEmail(contact.value) && contact.value) ||
                              (contact.type === 'phone' && !isValidPhone(contact.value) && contact.value)
                                ? 'border-rose-400/30' : 'border-white/10'
                            }`}
                          />
                        )}
                        {((contact.type === 'email' && !isValidEmail(contact.value) && contact.value) ||
                          (contact.type === 'phone' && !isValidPhone(contact.value) && contact.value)) && (
                          <span className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Invalid format
                          </span>
                        )}
                      </label>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={contact.active}
                            onChange={(e) => updateContactInfo(contact.id, 'active', e.target.checked)}
                            className="rounded border-white/10 bg-white/[0.03]"
                          />
                          <Eye className="w-3 h-3" />
                          Visible
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveContactInfoUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveContactInfoDown(index)}
                        disabled={index === settings.contact_info.length - 1}
                        className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeContactInfo(contact.id)}
                        className="p-1 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Social Icons */}
          {activeSection === 'social' && expandedSections.has('social') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Social Icons ({settings.social_links.length})</h3>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Social Link
                </button>
              </div>
              
              {settings.social_links.map((social, index) => (
                <div key={social.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-400">
                          Platform
                          <select
                            value={social.platform}
                            onChange={(e) => {
                              updateSocialLink(social.id, 'platform', e.target.value)
                              const platform = SOCIAL_PLATFORMS.find(p => p.id === e.target.value)
                              if (platform) updateSocialLink(social.id, 'icon', platform.icon)
                            }}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          >
                            {SOCIAL_PLATFORMS.map(platform => (
                              <option key={platform.id} value={platform.id}>{platform.label}</option>
                            ))}
                          </select>
                        </label>
                        
                        <label className="text-xs text-slate-400">
                          Icon Preview
                          <div className="mt-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 flex items-center gap-2">
                            <span className="text-lg">{social.icon}</span>
                            <span className="text-slate-400">{SOCIAL_PLATFORMS.find(p => p.id === social.platform)?.label}</span>
                          </div>
                        </label>
                      </div>
                      
                      <label className="text-xs text-slate-400">
                        URL
                        <div className="relative">
                          <input
                            type="url"
                            value={social.url}
                            onChange={(e) => updateSocialLink(social.id, 'url', e.target.value)}
                            className={`mt-1 w-full px-3 py-2 text-sm rounded-lg border bg-white/[0.03] text-slate-100 pr-20 ${
                              !isValidUrl(social.url) && social.url ? 'border-rose-400/30' : 'border-white/10'
                            }`}
                          />
                          {!isValidUrl(social.url) && social.url && (
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-rose-400">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </label>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={social.active}
                            onChange={(e) => updateSocialLink(social.id, 'active', e.target.checked)}
                            className="rounded border-white/10 bg-white/[0.03]"
                          />
                          <Eye className="w-3 h-3" />
                          Visible
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveSocialLinkUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSocialLinkDown(index)}
                        disabled={index === settings.social_links.length - 1}
                        className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSocialLink(social.id)}
                        className="p-1 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Newsletter */}
          {activeSection === 'newsletter' && expandedSections.has('newsletter') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">Newsletter Section</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_newsletter: !settings.show_newsletter })}
                  className={`p-2 rounded-lg ${settings.show_newsletter ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_newsletter ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                Title
                <input
                  type="text"
                  value={settings.newsletter_title}
                  onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Placeholder Text
                <input
                  type="text"
                  value={settings.newsletter_placeholder}
                  onChange={(e) => setSettings({ ...settings, newsletter_placeholder: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Success Message
                <input
                  type="text"
                  value={settings.newsletter_success_message}
                  onChange={(e) => setSettings({ ...settings, newsletter_success_message: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                API Endpoint
                <input
                  type="text"
                  value={settings.newsletter_api_endpoint}
                  onChange={(e) => setSettings({ ...settings, newsletter_api_endpoint: e.target.value })}
                  placeholder="/api/newsletter"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
            </div>
          )}

          {/* CTA Section */}
          {activeSection === 'cta' && expandedSections.has('cta') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-100">CTA Section</h3>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, show_cta: !settings.show_cta })}
                  className={`p-2 rounded-lg ${settings.show_cta ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.03] text-slate-400'}`}
                >
                  {settings.show_cta ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <label className="text-xs text-slate-400">
                CTA Title
                <input
                  type="text"
                  value={settings.cta_title}
                  onChange={(e) => setSettings({ ...settings, cta_title: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                CTA Description
                <textarea
                  value={settings.cta_description}
                  onChange={(e) => setSettings({ ...settings, cta_description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </label>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Button Text
                  <input
                    type="text"
                    value={settings.cta_button_text}
                    onChange={(e) => setSettings({ ...settings, cta_button_text: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Button Link
                  <input
                    type="text"
                    value={settings.cta_button_link}
                    onChange={(e) => setSettings({ ...settings, cta_button_link: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Background Color
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={settings.cta_bg_color}
                      onChange={(e) => setSettings({ ...settings, cta_bg_color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                    <input
                      type="text"
                      value={settings.cta_bg_color}
                      onChange={(e) => setSettings({ ...settings, cta_bg_color: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </div>
                </label>
                
                <label className="text-xs text-slate-400">
                  Text Color
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={settings.cta_text_color}
                      onChange={(e) => setSettings({ ...settings, cta_text_color: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                    />
                    <input
                      type="text"
                      value={settings.cta_text_color}
                      onChange={(e) => setSettings({ ...settings, cta_text_color: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Legal & Copyright */}
          {activeSection === 'legal' && expandedSections.has('legal') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Legal & Copyright</h3>
              
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-slate-400">
                  Copyright Text
                  <textarea
                    value={settings.copyright_text}
                    onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
                
                <label className="text-xs text-slate-400">
                  Company Name
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </label>
              </div>
              
              <label className="text-xs text-slate-400">
                Copyright Year
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={settings.copyright_year}
                    onChange={(e) => setSettings({ ...settings, copyright_year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, copyright_year: new Date().getFullYear() })}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                  >
                    Auto
                  </button>
                </div>
              </label>
              
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-100">Legal Links ({settings.legal_links.length})</span>
                  <button
                    type="button"
                    onClick={addLegalLink}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add Link
                  </button>
                </div>
                
                {settings.legal_links.map((link, index) => (
                  <div key={link.id} className="p-3 rounded-lg border border-white/10 bg-white/[0.02] mb-2">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-slate-500 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateLegalLink(link.id, 'label', e.target.value)}
                            placeholder="Link Label"
                            className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                          <div className="relative">
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => updateLegalLink(link.id, 'url', e.target.value)}
                              placeholder="Link URL"
                              className={`px-3 py-1.5 text-sm rounded-lg border bg-white/[0.03] text-slate-100 pr-20 ${
                                !isValidUrl(link.url) && link.url ? 'border-rose-400/30' : 'border-white/10'
                              }`}
                            />
                            {!isValidUrl(link.url) && link.url && (
                              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-rose-400">
                                <AlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={link.external}
                              onChange={(e) => updateLegalLink(link.id, 'external', e.target.checked)}
                              className="rounded border-white/10 bg-white/[0.03]"
                            />
                            <ExternalLink className="w-3 h-3" />
                            External
                          </label>
                          
                          <label className="flex items-center gap-2 text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={link.active}
                              onChange={(e) => updateLegalLink(link.id, 'active', e.target.checked)}
                              className="rounded border-white/10 bg-white/[0.03]"
                            />
                            <Eye className="w-3 h-3" />
                            Visible
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveLegalLinkUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLegalLinkDown(index)}
                          disabled={index === settings.legal_links.length - 1}
                          className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLegalLink(link.id)}
                          className="p-1 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Settings */}
          {activeSection === 'settings' && expandedSections.has('settings') && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-base font-semibold text-slate-100">Footer Styling</h3>
              
              <label className="text-xs text-slate-400">
                Background Color
                <input
                  type="color"
                  value={settings.footer_bg_color}
                  onChange={(e) => setSettings({ ...settings, footer_bg_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Text Color
                <input
                  type="color"
                  value={settings.footer_text_color}
                  onChange={(e) => setSettings({ ...settings, footer_text_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Link Color
                <input
                  type="color"
                  value={settings.footer_link_color}
                  onChange={(e) => setSettings({ ...settings, footer_link_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
              
              <label className="text-xs text-slate-400">
                Border Color
                <input
                  type="color"
                  value={settings.footer_border_color}
                  onChange={(e) => setSettings({ ...settings, footer_border_color: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg border border-white/10 bg-white/[0.03]"
                />
              </label>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}