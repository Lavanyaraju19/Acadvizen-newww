'use client'

import { useState, useEffect } from 'react'
import { adminApiFetch } from '../../lib/adminApiClient'
import { 
  Heart, 
  Search, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Zap, 
  Shield, 
  Activity,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState(new Set(['overall']))

  useEffect(() => {
    loadHealthData()
  }, [])

  async function loadHealthData() {
    setLoading(true)
    try {
      const json = await adminApiFetch('/api/cms/health/scan', { cache: 'no-store' })
      setHealthData(json.data)
    } catch (error) {
      console.error('Failed to load health data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function runScan() {
    setLoading(true)
    try {
      await adminApiFetch('/api/cms/health/scan', { method: 'POST' })
      await loadHealthData()
    } catch (error) {
      console.error('Failed to run health scan:', error)
    } finally {
      setLoading(false)
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

  function getStatusColor(score) {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-rose-400'
  }

  function getStatusIcon(score) {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-400" />
    return <XCircle className="w-5 h-5 text-rose-400" />
  }

  function getStatusLabel(score) {
    if (score >= 80) return 'Healthy'
    if (score >= 60) return 'Warning'
    return 'Needs Attention'
  }

  if (!healthData) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-400" />
            Website Health
          </h3>
          <button
            type="button"
            onClick={runScan}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center text-slate-400 text-sm py-8">
          No health data available. Click scan to check website health.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-teal-400" />
          Website Health
        </h3>
        <button
          type="button"
          onClick={runScan}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Overall Score */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(healthData.overall_score)}
            <div>
              <div className="text-sm text-slate-400">Overall Health</div>
              <div className={`text-3xl font-bold ${getStatusColor(healthData.overall_score)}`}>
                {healthData.overall_score}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${getStatusColor(healthData.overall_score)}`}>
              {getStatusLabel(healthData.overall_score)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Last scan: {new Date(healthData.scan_date).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <HealthCard
          icon={Search}
          label="SEO"
          score={healthData.seo_score}
          issues={healthData.seo_missing_meta_titles + healthData.seo_missing_meta_descriptions}
          expanded={expandedSections.has('seo')}
          onToggle={() => toggleSection('seo')}
        />
        <HealthCard
          icon={FileText}
          label="Content"
          score={healthData.content_score}
          issues={healthData.content_draft_pages + healthData.content_empty_pages}
          expanded={expandedSections.has('content')}
          onToggle={() => toggleSection('content')}
        />
        <HealthCard
          icon={LinkIcon}
          label="Links"
          score={healthData.link_score}
          issues={healthData.link_broken_internal + healthData.link_404_pages}
          expanded={expandedSections.has('links')}
          onToggle={() => toggleSection('links')}
        />
        <HealthCard
          icon={ImageIcon}
          label="Media"
          score={healthData.media_score}
          issues={healthData.media_large_images + healthData.media_missing_alt}
          expanded={expandedSections.has('media')}
          onToggle={() => toggleSection('media')}
        />
        <HealthCard
          icon={Zap}
          label="Performance"
          score={healthData.perf_score}
          issues={healthData.perf_slow_pages + healthData.perf_large_assets}
          expanded={expandedSections.has('performance')}
          onToggle={() => toggleSection('performance')}
        />
      </div>

      {/* Detailed Sections */}
      {expandedSections.has('seo') && (
        <HealthSection
          title="SEO Health"
          icon={Search}
          data={[
            { label: 'Missing Meta Titles', value: healthData.seo_missing_meta_titles },
            { label: 'Missing Meta Descriptions', value: healthData.seo_missing_meta_descriptions },
            { label: 'Missing Canonical URLs', value: healthData.seo_missing_canonical },
            { label: 'Missing OG Images', value: healthData.seo_missing_og_image },
            { label: 'Missing Focus Keywords', value: healthData.seo_missing_focus_keyword },
            { label: 'Duplicate Titles', value: healthData.seo_duplicate_titles },
            { label: 'Duplicate Descriptions', value: healthData.seo_duplicate_descriptions },
          ]}
        />
      )}

      {expandedSections.has('content') && (
        <HealthSection
          title="Content Health"
          icon={FileText}
          data={[
            { label: 'Draft Pages', value: healthData.content_draft_pages },
            { label: 'Unpublished Pages', value: healthData.content_unpublished_pages },
            { label: 'Empty Pages', value: healthData.content_empty_pages },
            { label: 'Broken Images', value: healthData.content_broken_images },
            { label: 'Missing Featured Images', value: healthData.content_missing_featured },
          ]}
        />
      )}

      {expandedSections.has('links') && (
        <HealthSection
          title="Link Health"
          icon={LinkIcon}
          data={[
            { label: 'Broken Internal Links', value: healthData.link_broken_internal },
            { label: 'Broken External Links', value: healthData.link_broken_external },
            { label: 'Redirect Chains', value: healthData.link_redirect_chains },
            { label: 'Missing Redirects', value: healthData.link_missing_redirects },
            { label: '404 Pages', value: healthData.link_404_pages },
          ]}
        />
      )}

      {expandedSections.has('media') && (
        <HealthSection
          title="Media Health"
          icon={ImageIcon}
          data={[
            { label: 'Large Images (>2MB)', value: healthData.media_large_images },
            { label: 'Duplicate Images', value: healthData.media_duplicate_images },
            { label: 'Unused Images', value: healthData.media_unused_images },
            { label: 'Missing ALT Text', value: healthData.media_missing_alt },
            { label: 'Unsupported Formats', value: healthData.media_unsupported_formats },
          ]}
        />
      )}

      {expandedSections.has('performance') && (
        <HealthSection
          title="Performance"
          icon={Zap}
          data={[
            { label: 'Slow Pages', value: healthData.perf_slow_pages },
            { label: 'Large Assets', value: healthData.perf_large_assets },
            { label: 'Slow Images', value: healthData.perf_slow_images },
            { label: 'Cache Status', value: healthData.perf_cache_status },
          ]}
        />
      )}
    </div>
  )
}

function HealthCard({ icon: Icon, label, score, issues, expanded, onToggle }) {
  const IconComponent = Icon
  const getColor = (s) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-rose-400'
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-4 rounded-xl border transition-all ${
        expanded 
          ? 'border-teal-500/30 bg-teal-500/10' 
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <IconComponent className={`w-6 h-6 ${getColor(score)}`} />
        <div className={`text-2xl font-bold ${getColor(score)}`}>{score}%</div>
        <div className="text-xs text-slate-400">{label}</div>
        {issues > 0 && (
          <div className="text-xs text-rose-400">{issues} issues</div>
        )}
      </div>
    </button>
  )
}

function HealthSection({ title, icon: Icon, data }) {
  const IconComponent = Icon
  
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4">
      <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-3">
        <IconComponent className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
            <span className="text-sm text-slate-300">{item.label}</span>
            <span className={`text-sm font-medium ${item.value > 0 ? 'text-rose-400' : 'text-green-400'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}