'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Image, Video, Users, Settings, LayoutDashboard, BookOpen, GraduationCap, Folder, AlertCircle } from 'lucide-react'
import { adminApiFetch } from '../../lib/adminApiClient'

const ENTITY_TYPES = {
  pages: { label: 'Pages', icon: LayoutDashboard, color: 'text-blue-400' },
  blogs: { label: 'Blogs', icon: BookOpen, color: 'text-green-400' },
  courses: { label: 'Courses', icon: GraduationCap, color: 'text-purple-400' },
  media: { label: 'Media', icon: Image, color: 'text-yellow-400' },
  forms: { label: 'Forms', icon: FileText, color: 'text-pink-400' },
  popups: { label: 'Popups', icon: AlertCircle, color: 'text-orange-400' },
  banners: { label: 'Banners', icon: Image, color: 'text-cyan-400' },
  settings: { label: 'Settings', icon: Settings, color: 'text-slate-400' },
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [searchHistory, setSearchHistory] = useState([])
  const inputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    // Load search history from localStorage
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('acadvizen-search-history')
      if (history) {
        setSearchHistory(JSON.parse(history))
      }
    }
  }, [])

  useEffect(() => {
    // Keyboard shortcut to open search (Cmd/Ctrl + K)
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await performSearch(query, selectedType)
        setResults(searchResults)
        setLoading(false)
      } catch (error) {
        console.error('Search failed:', error)
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, selectedType])

  async function performSearch(searchQuery, typeFilter) {
    const allResults = []

    if (typeFilter === 'all' || typeFilter === 'pages') {
      try {
        const pages = await adminApiFetch('/api/cms/pages?limit=50', { cache: 'no-store' })
        const pageResults = (pages.data || [])
          .filter(p => 
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(p => ({
            id: p.id,
            type: 'pages',
            title: p.title,
            subtitle: p.slug,
            url: `/admin/pages?id=${p.id}`,
            preview: p.description?.substring(0, 100)
          }))
        allResults.push(...pageResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'blogs') {
      try {
        const blogs = await adminApiFetch('/api/cms/blogs?limit=50', { cache: 'no-store' })
        const blogResults = (blogs.data || [])
          .filter(b => 
            b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(b => ({
            id: b.id,
            type: 'blogs',
            title: b.title,
            subtitle: b.slug,
            url: `/admin/blogs?id=${b.id}`,
            preview: b.excerpt?.substring(0, 100)
          }))
        allResults.push(...blogResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'courses') {
      try {
        const courses = await adminApiFetch('/api/cms/courses?limit=50', { cache: 'no-store' })
        const courseResults = (courses.data || [])
          .filter(c => 
            c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(c => ({
            id: c.id,
            type: 'courses',
            title: c.title,
            subtitle: c.slug,
            url: `/admin/courses?id=${c.id}`,
            preview: c.description?.substring(0, 100)
          }))
        allResults.push(...courseResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'media') {
      try {
        const media = await adminApiFetch('/api/cms/media?limit=50', { cache: 'no-store' })
        const mediaResults = (media.data || [])
          .filter(m => 
            m.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.caption?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(m => ({
            id: m.id,
            type: 'media',
            title: m.url.split('/').pop(),
            subtitle: m.type,
            url: `/admin/media`,
            preview: m.alt_text || m.caption
          }))
        allResults.push(...mediaResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'forms') {
      try {
        const forms = await adminApiFetch('/api/cms/forms?limit=50', { cache: 'no-store' })
        const formResults = (forms.data || [])
          .filter(f => 
            f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(f => ({
            id: f.id,
            type: 'forms',
            title: f.name,
            subtitle: f.status,
            url: `/admin/forms?id=${f.id}`,
            preview: f.description?.substring(0, 100)
          }))
        allResults.push(...formResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'popups') {
      try {
        const popups = await adminApiFetch('/api/cms/popups?limit=50', { cache: 'no-store' })
        const popupResults = (popups.data || [])
          .filter(p => 
            p.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(p => ({
            id: p.id,
            type: 'popups',
            title: p.name,
            subtitle: p.type,
            url: `/admin/popups?id=${p.id}`,
            preview: p.type
          }))
        allResults.push(...popupResults)
      } catch (e) { /* Ignore errors */ }
    }

    if (typeFilter === 'all' || typeFilter === 'banners') {
      try {
        const banners = await adminApiFetch('/api/cms/banners?limit=50', { cache: 'no-store' })
        const bannerResults = (banners.data || [])
          .filter(b => 
            b.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(b => ({
            id: b.id,
            type: 'banners',
            title: b.name,
            subtitle: b.type,
            url: `/admin/banners?id=${b.id}`,
            preview: b.type
          }))
        allResults.push(...bannerResults)
      } catch (e) { /* Ignore errors */ }
    }

    return allResults.slice(0, 20)
  }

  function addToHistory(query) {
    if (!query.trim()) return
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    if (typeof window !== 'undefined') {
      localStorage.setItem('acadvizen-search-history', JSON.stringify(newHistory))
    }
  }

  function handleResultClick(result) {
    addToHistory(query)
    window.location.href = result.url
  }

  function handleHistoryClick(historyQuery) {
    setQuery(historyQuery)
    inputRef.current?.focus()
  }

  function clearHistory() {
    setSearchHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('acadvizen-search-history')
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] flex items-center gap-2"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <kbd className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-slate-500">⌘K</kbd>
      </button>
    )
  }

  const Icon = ENTITY_TYPES[selectedType]?.icon || Search

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#050b12] shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Icon className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, blogs, courses, media, forms..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-lg"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
          >
            <kbd className="px-2 py-0.5 rounded bg-white/[0.05] text-xs">ESC</kbd>
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 p-3 border-b border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              selectedType === 'all' 
                ? 'bg-teal-500/20 text-teal-300' 
                : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.05]'
            }`}
          >
            All
          </button>
          {Object.entries(ENTITY_TYPES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedType(key)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap flex items-center gap-1.5 ${
                selectedType === key 
                  ? 'bg-teal-500/20 text-teal-300' 
                  : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.05]'
              }`}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p>Searching...</p>
            </div>
          ) : query ? (
            results.length > 0 ? (
              <div className="p-2">
                {results.map((result, index) => {
                  const config = ENTITY_TYPES[result.type]
                  const ResultIcon = config?.icon || FileText
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 rounded-xl hover:bg-white/[0.05] text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-white/[0.03] ${config?.color || 'text-slate-400'}`}>
                          <ResultIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-100">{result.title}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded bg-white/[0.05] ${config?.color || 'text-slate-500'}`}>
                              {config?.label}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="text-xs text-slate-500 mt-0.5">{result.subtitle}</p>
                          )}
                          {result.preview && (
                            <p className="text-sm text-slate-400 mt-1 truncate">{result.preview}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No results found</p>
                <p className="text-sm mt-1 opacity-70">Try adjusting your search or filters</p>
              </div>
            )
          ) : (
            /* Search History */
            searchHistory.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300">Recent Searches</h3>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHistoryClick(historyQuery)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-sm text-slate-400 hover:bg-white/[0.05] hover:text-slate-300"
                    >
                      {historyQuery}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.05]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.05]">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.05]">ESC</kbd> Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  )
}