'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Globe, 
  Twitter, 
  Facebook, 
  Code, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react'

export default function SEOManager({ entityType, entityId, seoData, onSave }) {
  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    twitter_card: 'summary_large_image',
    twitter_title: '',
    twitter_description: '',
    twitter_image_url: '',
    focus_keyword: '',
    exclude_from_sitemap: false,
    json_ld_schema: '',
    breadcrumb_schema: '',
  })
  const [seoScore, setSeoScore] = useState(0)
  const [activeSection, setActiveSection] = useState('basic')
  const [expandedSections, setExpandedSections] = useState(new Set(['basic']))
  const [previewData, setPreviewData] = useState({})

  useEffect(() => {
    if (seoData) {
      setFormData({
        meta_title: seoData.meta_title || '',
        meta_description: seoData.meta_description || '',
        canonical_url: seoData.canonical_url || '',
        og_title: seoData.og_title || '',
        og_description: seoData.og_description || '',
        og_image_url: seoData.og_image_url || '',
        twitter_card: seoData.twitter_card || 'summary_large_image',
        twitter_title: seoData.twitter_title || '',
        twitter_description: seoData.twitter_description || '',
        twitter_image_url: seoData.twitter_image_url || '',
        focus_keyword: seoData.focus_keyword || '',
        exclude_from_sitemap: seoData.exclude_from_sitemap || false,
        json_ld_schema: typeof seoData.json_ld_schema === 'string' ? seoData.json_ld_schema : JSON.stringify(seoData.json_ld_schema || {}, null, 2),
        breadcrumb_schema: typeof seoData.breadcrumb_schema === 'string' ? seoData.breadcrumb_schema : JSON.stringify(seoData.breadcrumb_schema || {}, null, 2),
      })
      calculateSeoScore(seoData)
    }
  }, [seoData])

  useEffect(() => {
    updatePreview()
  }, [formData])

  function calculateSeoScore(data) {
    let score = 0
    if (data.meta_title && data.meta_title.length >= 30 && data.meta_title.length <= 60) score += 20
    if (data.meta_description && data.meta_description.length >= 120 && data.meta_description.length <= 160) score += 20
    if (data.focus_keyword) score += 10
    if (data.og_title) score += 10
    if (data.og_description) score += 10
    if (data.og_image_url) score += 10
    if (data.canonical_url) score += 10
    if (data.json_ld_schema) score += 10
    setSeoScore(score)
  }

  function updatePreview() {
    setPreviewData({
      title: formData.meta_title || 'Page Title',
      description: formData.meta_description || 'Page description will appear here...',
      url: formData.canonical_url || 'https://acadvizen.com/page',
    })
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (onSave) {
      onSave({ ...formData, [field]: value })
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

  function getScoreColor(score) {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-rose-400'
  }

  function getScoreLabel(score) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="space-y-4">
      {/* SEO Score Card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">SEO Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(seoScore)}`}>
                {seoScore}/100
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getScoreColor(seoScore)}`}>
              {getScoreLabel(seoScore)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {seoScore >= 80 ? 'Great job!' : seoScore >= 60 ? 'Room for improvement' : 'Needs attention'}
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'basic', label: 'Basic SEO', icon: Search },
          { id: 'opengraph', label: 'Open Graph', icon: Facebook },
          { id: 'twitter', label: 'Twitter Cards', icon: Twitter },
          { id: 'schema', label: 'Schema.org', icon: Code },
          { id: 'sitemap', label: 'Sitemap', icon: Globe },
        ].map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => { setActiveSection(section.id); toggleSection(section.id); }}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors flex items-center gap-2 ${
              activeSection === section.id 
                ? 'bg-teal-500/20 text-teal-300' 
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Basic SEO */}
      {activeSection === 'basic' && expandedSections.has('basic') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Basic SEO
          </h4>
          
          <label className="text-xs text-slate-400">
            Meta Title
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value)}
              maxLength={60}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Page title (30-60 characters)"
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-slate-500">{formData.meta_title.length}/60</span>
              {formData.meta_title.length >= 30 && formData.meta_title.length <= 60 && (
                <span className="text-green-400">✓ Optimal length</span>
              )}
            </div>
          </label>

          <label className="text-xs text-slate-400">
            Meta Description
            <textarea
              value={formData.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              maxLength={160}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Page description (120-160 characters)"
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-slate-500">{formData.meta_description.length}/160</span>
              {formData.meta_description.length >= 120 && formData.meta_description.length <= 160 && (
                <span className="text-green-400">✓ Optimal length</span>
              )}
            </div>
          </label>

          <label className="text-xs text-slate-400">
            Canonical URL
            <input
              type="url"
              value={formData.canonical_url}
              onChange={(e) => handleChange('canonical_url', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="https://acadvizen.com/page"
            />
          </label>

          <label className="text-xs text-slate-400">
            Focus Keyword
            <input
              type="text"
              value={formData.focus_keyword}
              onChange={(e) => handleChange('focus_keyword', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Main keyword for this page"
            />
          </label>
        </div>
      )}

      {/* Open Graph */}
      {activeSection === 'opengraph' && expandedSections.has('opengraph') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Facebook className="w-4 h-4" />
            Open Graph (Facebook/LinkedIn)
          </h4>
          
          <label className="text-xs text-slate-400">
            OG Title
            <input
              type="text"
              value={formData.og_title}
              onChange={(e) => handleChange('og_title', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Leave blank to use meta title"
            />
          </label>

          <label className="text-xs text-slate-400">
            OG Description
            <textarea
              value={formData.og_description}
              onChange={(e) => handleChange('og_description', e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Leave blank to use meta description"
            />
          </label>

          <label className="text-xs text-slate-400">
            OG Image URL
            <input
              type="url"
              value={formData.og_image_url}
              onChange={(e) => handleChange('og_image_url', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="https://example.com/og-image.jpg"
            />
          </label>
        </div>
      )}

      {/* Twitter Cards */}
      {activeSection === 'twitter' && expandedSections.has('twitter') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Twitter className="w-4 h-4" />
            Twitter Cards
          </h4>
          
          <label className="text-xs text-slate-400">
            Card Type
            <select
              value={formData.twitter_card}
              onChange={(e) => handleChange('twitter_card', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
            >
              <option value="summary">Summary Card</option>
              <option value="summary_large_image">Summary Card with Large Image</option>
              <option value="app">App Card</option>
              <option value="player">Player Card</option>
            </select>
          </label>

          <label className="text-xs text-slate-400">
            Twitter Title
            <input
              type="text"
              value={formData.twitter_title}
              onChange={(e) => handleChange('twitter_title', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Leave blank to use OG title"
            />
          </label>

          <label className="text-xs text-slate-400">
            Twitter Description
            <textarea
              value={formData.twitter_description}
              onChange={(e) => handleChange('twitter_description', e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Leave blank to use OG description"
            />
          </label>

          <label className="text-xs text-slate-400">
            Twitter Image URL
            <input
              type="url"
              value={formData.twitter_image_url}
              onChange={(e) => handleChange('twitter_image_url', e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              placeholder="Leave blank to use OG image"
            />
          </label>
        </div>
      )}

      {/* Schema.org */}
      {activeSection === 'schema' && expandedSections.has('schema') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Code className="w-4 h-4" />
            JSON-LD Schema
          </h4>
          
          <label className="text-xs text-slate-400">
            Schema JSON
            <textarea
              value={formData.json_ld_schema}
              onChange={(e) => handleChange('json_ld_schema', e.target.value)}
              rows={8}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 font-mono"
              placeholder='{"@context": "https://schema.org", "@type": "WebPage", ...}'
            />
          </label>

          <label className="text-xs text-slate-400">
            Breadcrumb Schema JSON
            <textarea
              value={formData.breadcrumb_schema}
              onChange={(e) => handleChange('breadcrumb_schema', e.target.value)}
              rows={6}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 font-mono"
              placeholder='{"@context": "https://schema.org", "@type": "BreadcrumbList", ...}'
            />
          </label>
        </div>
      )}

      {/* Sitemap */}
      {activeSection === 'sitemap' && expandedSections.has('sitemap') && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Sitemap Settings
          </h4>
          
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={!formData.exclude_from_sitemap}
              onChange={(e) => handleChange('exclude_from_sitemap', !e.target.checked)}
              className="rounded border-white/10 bg-white/[0.03]"
            />
            Include in sitemap
          </label>

          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-xs text-slate-400">
              <p className="font-medium mb-2">Sitemap Tips:</p>
              <ul className="space-y-1">
                <li>• Include only pages you want indexed</li>
                <li>• Use canonical URLs to avoid duplicate content</li>
                <li>• Update sitemap when content changes</li>
                <li>• Submit sitemap to Google Search Console</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Google Preview */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h4 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Google Search Preview
        </h4>
        <div className="p-4 rounded-lg bg-white border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">{previewData.url}</div>
          <div className="text-xl text-blue-800 font-medium mb-1 hover:underline cursor-pointer">
            {previewData.title}
          </div>
          <div className="text-sm text-slate-600">
            {previewData.description}
          </div>
        </div>
      </div>
    </div>
  )
}