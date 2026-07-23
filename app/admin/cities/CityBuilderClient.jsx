'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { uploadFileAsset } from '../../../lib/storageUpload'
import RichTextEditor from '../../../components/admin/RichTextEditor'
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  Copy, 
  Layers,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  MessageSquare,
  Image as ImageIcon,
  HelpCircle,
  Settings,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

function createEmptyCity() {
  return {
    id: '',
    city_name: '',
    slug: '',
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_image_url: '',
    hero_video_url: '',
    hero_cta_text: '',
    hero_cta_link: '',
    about_title: '',
    about_description: '',
    about_image_url: '',
    features: [],
    stats: [],
    testimonials: [],
    gallery: [],
    faqs: [],
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    google_maps_url: '',
    seo_title: '',
    seo_description: '',
    meta_keywords: '',
    og_image_url: '',
    canonical_url: '',
    is_active: true,
    priority: 0,
  }
}

const SECTION_TEMPLATES = {
  hero: {
    title: 'Hero Section',
    city_name: 'Bangalore',
    hero_title: 'Digital Marketing Course in Bangalore',
    hero_subtitle: 'Launch Your Career with Industry-Recognized Certification',
    hero_description: 'Join 10,000+ successful graduates. Learn from industry experts with hands-on projects and job assistance.',
    hero_cta_text: 'Enroll Now',
    hero_cta_link: '/courses',
  },
  about: {
    about_title: 'About Our Bangalore Center',
    about_description: 'Our Bangalore center is located in the heart of the tech hub, providing world-class digital marketing education with state-of-the-art facilities.',
  },
  features: {
    features: [
      { title: 'Industry Expert Trainers', description: 'Learn from professionals with 10+ years of experience' },
      { title: 'Hands-on Projects', description: 'Work on real client projects and build your portfolio' },
      { title: 'Job Assistance', description: '100% placement support with top digital marketing agencies' },
      { title: 'Certification', description: 'Get industry-recognized Google and HubSpot certifications' },
    ],
  },
  stats: {
    stats: [
      { label: 'Students Placed', value: '95%' },
      { label: 'Average Package', value: '6 LPA' },
      { label: 'Hiring Partners', value: '150+' },
      { label: 'Course Rating', value: '4.9/5' },
    ],
  },
}

export default function CityBuilderClient() {
  const [cities, setCities] = useState([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [cityForm, setCityForm] = useState(createEmptyCity())
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [expandedSections, setExpandedSections] = useState(new Set(['hero']))

  const selectedCity = cities.find(c => c.id === selectedCityId)

  useEffect(() => {
    loadCities()
  }, [])

  async function loadCities() {
    try {
      const json = await adminApiFetch('/api/cms/cities?include_drafts=1&limit=100', { cache: 'no-store' })
      setCities(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load cities.')
    }
  }

  function selectCity(city) {
    setSelectedCityId(city?.id || '')
    if (city) {
      setCityForm({
        id: city.id || '',
        city_name: city.city_name || '',
        slug: city.slug || '',
        hero_title: city.hero_title || '',
        hero_subtitle: city.hero_subtitle || '',
        hero_description: city.hero_description || '',
        hero_image_url: city.hero_image_url || '',
        hero_video_url: city.hero_video_url || '',
        hero_cta_text: city.hero_cta_text || '',
        hero_cta_link: city.hero_cta_link || '',
        about_title: city.about_title || '',
        about_description: city.about_description || '',
        about_image_url: city.about_image_url || '',
        features: Array.isArray(city.features) ? city.features : [],
        stats: Array.isArray(city.stats) ? city.stats : [],
        testimonials: Array.isArray(city.testimonials) ? city.testimonials : [],
        gallery: Array.isArray(city.gallery) ? city.gallery : [],
        faqs: Array.isArray(city.faqs) ? city.faqs : [],
        contact_phone: city.contact_phone || '',
        contact_email: city.contact_email || '',
        contact_address: city.contact_address || '',
        google_maps_url: city.google_maps_url || '',
        seo_title: city.seo_title || '',
        seo_description: city.seo_description || '',
        meta_keywords: city.meta_keywords || '',
        og_image_url: city.og_image_url || '',
        canonical_url: city.canonical_url || '',
        is_active: city.is_active !== false,
        priority: city.priority || 0,
      })
    } else {
      setCityForm(createEmptyCity())
    }
  }

  async function handleUpload(field, file) {
    if (!file) return
    setUploading(field)
    setStatus('')
    try {
      const asset = await uploadFileAsset(file, 'city-pages')
      setCityForm(prev => ({ ...prev, [field]: asset.url }))
      setStatus('Image uploaded successfully.')
    } catch (error) {
      setStatus(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  async function saveCity(event) {
    event.preventDefault()
    if (!cityForm.city_name.trim()) {
      setStatus('City name is required.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...cityForm,
        slug: cityForm.slug || cityForm.city_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }
      
      const method = cityForm.id ? 'PATCH' : 'POST'
      const endpoint = cityForm.id ? `/api/cms/cities/${cityForm.id}` : '/api/cms/cities'
      
      await adminApiFetch(endpoint, { method, body: payload })
      await loadCities()
      setStatus('City page saved successfully.')
    } catch (error) {
      setStatus(error?.message || 'Failed to save city page.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCity(id) {
    if (!window.confirm('Delete this city page?')) return
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/cities/${id}`, { method: 'DELETE' })
      if (selectedCityId === id) {
        setSelectedCityId('')
        setCityForm(createEmptyCity())
      }
      await loadCities()
      setStatus('City page deleted.')
    } catch (error) {
      setStatus(error?.message || 'Failed to delete city page.')
    } finally {
      setSaving(false)
    }
  }

  async function duplicateCity(city) {
    setSaving(true)
    setStatus('')
    try {
      const payload = {
        ...city,
        id: undefined,
        city_name: `${city.city_name} (Copy)`,
        slug: `${city.slug}-copy`,
        is_active: false,
      }
      
      await adminApiFetch('/api/cms/cities', { method: 'POST', body: payload })
      await loadCities()
      setStatus('City page duplicated.')
    } catch (error) {
      setStatus(error?.message || 'Failed to duplicate city page.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(city) {
    setSaving(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/cities/${city.id}`, {
        method: 'PATCH',
        body: { is_active: !city.is_active }
      })
      await loadCities()
      setStatus(`City page ${city.is_active ? 'disabled' : 'enabled'}.`)
    } catch (error) {
      setStatus(error?.message || 'Failed to update city page.')
    } finally {
      setSaving(false)
    }
  }

  function applyTemplate(templateName) {
    const template = SECTION_TEMPLATES[templateName]
    if (template) {
      setCityForm(prev => ({ ...prev, ...template }))
      setStatus(`Applied ${templateName} template.`)
    }
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

  function addFeature() {
    setCityForm(prev => ({
      ...prev,
      features: [...prev.features, { title: '', description: '' }]
    }))
  }

  function updateFeature(index, field, value) {
    setCityForm(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }))
  }

  function removeFeature(index) {
    setCityForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  function addStat() {
    setCityForm(prev => ({
      ...prev,
      stats: [...prev.stats, { label: '', value: '' }]
    }))
  }

  function updateStat(index, field, value) {
    setCityForm(prev => ({
      ...prev,
      stats: prev.stats.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }))
  }

  function removeStat(index) {
    setCityForm(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }))
  }

  function addTestimonial() {
    setCityForm(prev => ({
      ...prev,
      testimonials: [...prev.testimonials, { name: '', content: '', rating: 5, image_url: '' }]
    }))
  }

  function updateTestimonial(index, field, value) {
    setCityForm(prev => ({
      ...prev,
      testimonials: prev.testimonials.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }))
  }

  function removeTestimonial(index) {
    setCityForm(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index)
    }))
  }

  function addGalleryItem() {
    setCityForm(prev => ({
      ...prev,
      gallery: [...prev.gallery, { url: '', alt: '', caption: '' }]
    }))
  }

  function updateGalleryItem(index, field, value) {
    setCityForm(prev => ({
      ...prev,
      gallery: prev.gallery.map((g, i) => i === index ? { ...g, [field]: value } : g)
    }))
  }

  function removeGalleryItem(index) {
    setCityForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }))
  }

  function addFAQ() {
    setCityForm(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }))
  }

  function updateFAQ(index, field, value) {
    setCityForm(prev => ({
      ...prev,
      faqs: prev.faqs.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }))
  }

  function removeFAQ(index) {
    setCityForm(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }))
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">City Page Builder</h2>
          <p className="mt-1 text-sm text-slate-300">Create and manage city-specific landing pages</p>
        </div>
        <button
          type="button"
          onClick={() => { selectCity(null); setSelectedCityId(''); }}
          className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 hover:bg-teal-200"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add City
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Cities List */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Your Cities</h3>
          <div className="space-y-2">
            {cities.map(city => (
              <button
                key={city.id}
                type="button"
                onClick={() => selectCity(city)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedCityId === city.id 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                    : 'border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{city.city_name}</span>
                  <span className={`w-2 h-2 rounded-full ${city.is_active ? 'bg-green-400' : 'bg-slate-500'}`} />
                </div>
                <div className="text-xs opacity-70 mt-1">
                  /{city.slug} • {city.is_active ? 'Published' : 'Draft'}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* City Editor */}
        <main>
          {!previewMode ? (
            <form onSubmit={saveCity} className="space-y-6">
              {/* Basic Settings */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">City Information</h3>
                    <p className="mt-1 text-xs text-slate-400">Basic city details and URL settings</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyTemplate('hero')}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-slate-300 hover:bg-white/[0.05]"
                    >
                      Load Hero Template
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-slate-400 md:col-span-2">
                    City Name
                    <input
                      type="text"
                      value={cityForm.city_name}
                      onChange={(e) => setCityForm({ ...cityForm, city_name: e.target.value })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Slug (URL)
                    <input
                      type="text"
                      value={cityForm.slug}
                      onChange={(e) => setCityForm({ ...cityForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                  
                  <label className="text-xs text-slate-400">
                    Priority
                    <input
                      type="number"
                      value={cityForm.priority}
                      onChange={(e) => setCityForm({ ...cityForm, priority: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    />
                  </label>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-4">Page Sections</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['hero', 'about', 'features', 'stats', 'testimonials', 'gallery', 'faqs', 'contact', 'seo'].map(section => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => { setActiveSection(section); toggleSection(section); }}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                        activeSection === section 
                          ? 'bg-teal-500/20 text-teal-300' 
                          : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>

                {/* Hero Section */}
                {activeSection === 'hero' && expandedSections.has('hero') && (
                  <div className="space-y-4">
                    <label className="text-xs text-slate-400">
                      Hero Title
                      <input
                        type="text"
                        value={cityForm.hero_title}
                        onChange={(e) => setCityForm({ ...cityForm, hero_title: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Hero Subtitle
                      <input
                        type="text"
                        value={cityForm.hero_subtitle}
                        onChange={(e) => setCityForm({ ...cityForm, hero_subtitle: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Hero Description
                      <RichTextEditor
                        content={cityForm.hero_description}
                        onChange={(content) => setCityForm({ ...cityForm, hero_description: content })}
                        placeholder="Enter hero description..."
                        maxLength={500}
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Hero Image URL
                      <input
                        type="url"
                        value={cityForm.hero_image_url}
                        onChange={(e) => setCityForm({ ...cityForm, hero_image_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Hero Image Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload('hero_image_url', e.target.files?.[0])}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                      {uploading === 'hero_image_url' && <p className="mt-1 text-xs text-slate-400">Uploading...</p>}
                    </label>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-xs text-slate-400">
                        CTA Text
                        <input
                          type="text"
                          value={cityForm.hero_cta_text}
                          onChange={(e) => setCityForm({ ...cityForm, hero_cta_text: e.target.value })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                      
                      <label className="text-xs text-slate-400">
                        CTA Link
                        <input
                          type="url"
                          value={cityForm.hero_cta_link}
                          onChange={(e) => setCityForm({ ...cityForm, hero_cta_link: e.target.value })}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* About Section */}
                {activeSection === 'about' && expandedSections.has('about') && (
                  <div className="space-y-4">
                    <label className="text-xs text-slate-400">
                      About Title
                      <input
                        type="text"
                        value={cityForm.about_title}
                        onChange={(e) => setCityForm({ ...cityForm, about_title: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      About Description
                      <RichTextEditor
                        content={cityForm.about_description}
                        onChange={(content) => setCityForm({ ...cityForm, about_description: content })}
                        placeholder="Enter about description..."
                        maxLength={1000}
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      About Image URL
                      <input
                        type="url"
                        value={cityForm.about_image_url}
                        onChange={(e) => setCityForm({ ...cityForm, about_image_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                )}

                {/* Features Section */}
                {activeSection === 'features' && expandedSections.has('features') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Feature
                    </button>
                    
                    {cityForm.features.map((feature, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs text-slate-400">
                            Feature Title
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => updateFeature(index, 'title', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                          
                          <label className="text-xs text-slate-400">
                            Description
                            <input
                              type="text"
                              value={feature.description}
                              onChange={(e) => updateFeature(index, 'description', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-sm"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats Section */}
                {activeSection === 'stats' && expandedSections.has('stats') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={addStat}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Stat
                    </button>
                    
                    {cityForm.stats.map((stat, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs text-slate-400">
                            Label
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => updateStat(index, 'label', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                          
                          <label className="text-xs text-slate-400">
                            Value
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => updateStat(index, 'value', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeStat(index)}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-sm"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Testimonials Section */}
                {activeSection === 'testimonials' && expandedSections.has('testimonials') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={addTestimonial}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Testimonial
                    </button>
                    
                    {cityForm.testimonials.map((testimonial, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs text-slate-400">
                            Name
                            <input
                              type="text"
                              value={testimonial.name}
                              onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                          
                          <label className="text-xs text-slate-400">
                            Rating (1-5)
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={testimonial.rating}
                              onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value) || 5)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                        </div>
                        
                        <label className="text-xs text-slate-400">
                          Content
                          <textarea
                            value={testimonial.content}
                            onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                        
                        <label className="text-xs text-slate-400">
                          Image URL
                          <input
                            type="url"
                            value={testimonial.image_url}
                            onChange={(e) => updateTestimonial(index, 'image_url', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => removeTestimonial(index)}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-sm"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery Section */}
                {activeSection === 'gallery' && expandedSections.has('gallery') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={addGalleryItem}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Image
                    </button>
                    
                    {cityForm.gallery.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-xs text-slate-400">
                            Image URL
                            <input
                              type="url"
                              value={item.url}
                              onChange={(e) => updateGalleryItem(index, 'url', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                          
                          <label className="text-xs text-slate-400">
                            Alt Text
                            <input
                              type="text"
                              value={item.alt}
                              onChange={(e) => updateGalleryItem(index, 'alt', e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                            />
                          </label>
                        </div>
                        
                        <label className="text-xs text-slate-400">
                          Caption
                          <input
                            type="text"
                            value={item.caption}
                            onChange={(e) => updateGalleryItem(index, 'caption', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(index)}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-sm"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* FAQ Section */}
                {activeSection === 'faqs' && expandedSections.has('faqs') && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={addFAQ}
                      className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add FAQ
                    </button>
                    
                    {cityForm.faqs.map((faq, index) => (
                      <div key={index} className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                        <label className="text-xs text-slate-400">
                          Question
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                          />
                        </label>
                        
                        <label className="text-xs text-slate-400">
                          Answer
                          <RichTextEditor
                            content={faq.answer}
                            onChange={(content) => updateFAQ(index, 'answer', content)}
                            placeholder="Enter answer..."
                            maxLength={500}
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => removeFAQ(index)}
                          className="mt-2 px-3 py-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-sm"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Section */}
                {activeSection === 'contact' && expandedSections.has('contact') && (
                  <div className="space-y-4">
                    <label className="text-xs text-slate-400">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                      <input
                        type="tel"
                        value={cityForm.contact_phone}
                        onChange={(e) => setCityForm({ ...cityForm, contact_phone: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                      <input
                        type="email"
                        value={cityForm.contact_email}
                        onChange={(e) => setCityForm({ ...cityForm, contact_email: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                      <textarea
                        value={cityForm.contact_address}
                        onChange={(e) => setCityForm({ ...cityForm, contact_address: e.target.value })}
                        rows={2}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Google Maps URL
                      <input
                        type="url"
                        value={cityForm.google_maps_url}
                        onChange={(e) => setCityForm({ ...cityForm, google_maps_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                )}

                {/* SEO Section */}
                {activeSection === 'seo' && expandedSections.has('seo') && (
                  <div className="space-y-4">
                    <label className="text-xs text-slate-400">
                      SEO Title
                      <input
                        type="text"
                        value={cityForm.seo_title}
                        onChange={(e) => setCityForm({ ...cityForm, seo_title: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      SEO Description
                      <textarea
                        value={cityForm.seo_description}
                        onChange={(e) => setCityForm({ ...cityForm, seo_description: e.target.value })}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Meta Keywords
                      <input
                        type="text"
                        value={cityForm.meta_keywords}
                        onChange={(e) => setCityForm({ ...cityForm, meta_keywords: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                        placeholder="digital marketing, bangalore, course"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      Canonical URL
                      <input
                        type="url"
                        value={cityForm.canonical_url}
                        onChange={(e) => setCityForm({ ...cityForm, canonical_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                    
                    <label className="text-xs text-slate-400">
                      OG Image URL
                      <input
                        type="url"
                        value={cityForm.og_image_url}
                        onChange={(e) => setCityForm({ ...cityForm, og_image_url: e.target.value })}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {saving ? 'Saving...' : 'Save City Page'}
                </button>
                
                {selectedCityId && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleActive(selectedCity)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      {selectedCity?.is_active ? <EyeOff className="w-4 h-4 inline mr-2" /> : <Eye className="w-4 h-4 inline mr-2" />}
                      {selectedCity?.is_active ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => duplicateCity(selectedCity)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                    >
                      <Copy className="w-4 h-4 inline mr-2" />
                      Duplicate
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => deleteCity(selectedCityId)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl border border-rose-400/30 bg-red-500/10 text-rose-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Delete
                    </button>
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>

              {status && (
                <div className="text-sm text-slate-300">{status}</div>
              )}
            </form>
          ) : (
            /* Preview Mode */
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">City Page Preview</h3>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-8 border border-white/10">
                {/* Hero Preview */}
                {cityForm.hero_image_url && (
                  <div className="relative h-64 rounded-lg overflow-hidden mb-6">
                    <img 
                      src={cityForm.hero_image_url} 
                      alt={cityForm.city_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                      <div className="text-white">
                        <h1 className="text-2xl font-bold">{cityForm.hero_title}</h1>
                        {cityForm.hero_subtitle && <p className="text-lg opacity-90">{cityForm.hero_subtitle}</p>}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-2">{cityForm.about_title}</h2>
                    <div 
                      className="text-slate-300"
                      dangerouslySetInnerHTML={{ __html: cityForm.about_description }}
                    />
                  </div>
                  
                  {cityForm.features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-3">Features</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {cityForm.features.map((feature, index) => (
                          <div key={index} className="p-3 rounded-lg bg-white/[0.02]">
                            <h4 className="font-medium text-slate-200">{feature.title}</h4>
                            <p className="text-sm text-slate-400">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cityForm.stats.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-3">Statistics</h3>
                      <div className="grid gap-3 md:grid-cols-4">
                        {cityForm.stats.map((stat, index) => (
                          <div key={index} className="p-3 rounded-lg bg-white/[0.02] text-center">
                            <div className="text-2xl font-bold text-teal-400">{stat.value}</div>
                            <div className="text-sm text-slate-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cityForm.contact_phone && (
                    <div className="p-4 rounded-lg bg-white/[0.02]">
                      <h3 className="text-lg font-semibold text-slate-100 mb-2">Contact</h3>
                      <div className="space-y-2 text-sm text-slate-300">
                        {cityForm.contact_phone && <p><Phone className="w-4 h-4 inline mr-2" />{cityForm.contact_phone}</p>}
                        {cityForm.contact_email && <p><Mail className="w-4 h-4 inline mr-2" />{cityForm.contact_email}</p>}
                        {cityForm.contact_address && <p><MapPin className="w-4 h-4 inline mr-2" />{cityForm.contact_address}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-slate-400">
                <p><strong>URL:</strong> /{cityForm.slug}</p>
                <p><strong>Status:</strong> {cityForm.is_active ? 'Published' : 'Draft'}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </Surface>
  )
}