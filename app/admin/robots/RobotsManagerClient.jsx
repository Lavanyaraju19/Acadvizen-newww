'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Save, 
  Eye, 
  FileText, 
  Globe,
  Ban,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

export default function RobotsManagerClient() {
  const [robotsTxt, setRobotsTxt] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadRobotsTxt()
  }, [])

  async function loadRobotsTxt() {
    setLoading(true)
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data } = await supabaseClient
        .from('global_settings')
        .select('robots_txt')
        .single()
      
      if (data) {
        setRobotsTxt(data.robots_txt || getDefaultRobotsTxt())
        setPreview(data.robots_txt || getDefaultRobotsTxt())
      }
    } catch (error) {
      console.error('Failed to load robots.txt:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDefaultRobotsTxt() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'
    return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/api/cms/sitemap/generate`
  }

  async function saveRobotsTxt() {
    setSaving(true)
    setStatus('')
    try {
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseClient = supabase.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { error } = await supabaseClient
        .from('global_settings')
        .update({ robots_txt: robotsTxt })
        .eq('id', (await supabaseClient.from('global_settings').select('id').single()).data?.id)
      
      if (error) throw error
      
      setStatus('Robots.txt saved successfully.')
      setPreview(robotsTxt)
    } catch (error) {
      setStatus(error?.message || 'Failed to save robots.txt.')
    } finally {
      setSaving(false)
    }
  }

  function handlePreview() {
    setPreview(robotsTxt)
    setShowPreview(true)
  }

  function insertRule(type) {
    const rules = {
      allowAll: 'User-agent: *\nAllow: /',
      allowGoogle: 'User-agent: Googlebot\nAllow: /',
      disallowAdmin: 'User-agent: *\nDisallow: /admin/',
      disallowApi: 'User-agent: *\nDisallow: /api/',
      crawlDelay: 'Crawl-delay: 10',
      sitemap: `Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://acadvizen.com'}/api/cms/sitemap/generate`,
    }
    
    setRobotsTxt(prev => prev + '\n\n' + rules[type])
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">Robots.txt Manager</h2>
          <p className="mt-1 text-sm text-slate-300">Configure how search engines crawl your website</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            type="button"
            onClick={saveRobotsTxt}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100">Robots.txt Editor</h3>
              <button
                type="button"
                onClick={() => setRobotsTxt(getDefaultRobotsTxt())}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Reset to Default
              </button>
            </div>
            
            <textarea
              value={robotsTxt}
              onChange={(e) => setRobotsTxt(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100 font-mono resize-none"
              placeholder="User-agent: *&#10;Allow: /&#10;&#10;Sitemap: https://acadvizen.com/sitemap.xml"
            />
          </div>
        </div>

        {/* Quick Rules */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Quick Rules</h3>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => insertRule('allowAll')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <CheckCircle className="w-4 h-4 inline mr-2 text-green-400" />
                Allow All
              </button>
              
              <button
                type="button"
                onClick={() => insertRule('allowGoogle')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <Globe className="w-4 h-4 inline mr-2 text-blue-400" />
                Allow Googlebot Only
              </button>
              
              <button
                type="button"
                onClick={() => insertRule('disallowAdmin')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <Ban className="w-4 h-4 inline mr-2 text-rose-400" />
                Disallow Admin
              </button>
              
              <button
                type="button"
                onClick={() => insertRule('disallowApi')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <Ban className="w-4 h-4 inline mr-2 text-rose-400" />
                Disallow API
              </button>
              
              <button
                type="button"
                onClick={() => insertRule('crawlDelay')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <RefreshCw className="w-4 h-4 inline mr-2 text-yellow-400" />
                Add Crawl Delay
              </button>
              
              <button
                type="button"
                onClick={() => insertRule('sitemap')}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] text-sm"
              >
                <FileText className="w-4 h-4 inline mr-2 text-teal-400" />
                Add Sitemap
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base font-semibold text-slate-100 mb-3">Tips</h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>• Robots.txt tells search engines what to crawl</li>
              <li>• Each user-agent group should be separated by a blank line</li>
              <li>• Use Disallow to block specific paths</li>
              <li>• Add your sitemap URL for better indexing</li>
              <li>• Changes may take time to be recognized by search engines</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            
            <pre className="p-4 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-300 font-mono overflow-x-auto">
              {preview}
            </pre>
            
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([preview], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'robots.txt'
                  a.click()
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </Surface>
  )
}