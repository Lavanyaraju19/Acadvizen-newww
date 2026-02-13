import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Container, Section } from '../components/ui/Section'
import { Surface } from '../components/ui/Surface'

export function ToolsPage() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [pageSections, setPageSections] = useState({})

  useEffect(() => {
    loadTools()
    loadPageSections()
    const channel = supabase
      .channel('public-tools')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tools_extended' }, loadTools)
      .subscribe()
    const pageChannel = supabase
      .channel('public-page-tools')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, loadPageSections)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(pageChannel)
    }
  }, [])

  async function loadTools() {
    setLoading(true)
    const { data } = await supabase
      .from('tools_extended')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) setTools(data)
    setLoading(false)
  }

  async function loadPageSections() {
    const { data } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_slug', 'tools')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (!data) return
    const next = {}
    data.forEach((section) => {
      if (section.section_key) next[section.section_key] = section
    })
    setPageSections(next)
  }

  const parseJson = (value, fallback) => {
    if (!value) return fallback
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch (err) {
        return fallback
      }
    }
    return value
  }

  const getSection = (key) => pageSections[key] || {}
  const heroSection = getSection('hero')
  const emptySection = getSection('empty')
  const metaSection = getSection('meta')
  const metaCta = parseJson(metaSection.cta_json, {})

  const categorySet = new Set(tools.map((t) => t.category).filter(Boolean))
  categorySet.delete('Gen AI')
  const categories = ['all', 'Gen AI', 'Digital Marketing', ...categorySet]
  const filtered = tools.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      category === 'all' ||
      (category === 'Gen AI' && t.category === 'Gen AI') ||
      (category === 'Digital Marketing' && t.category !== 'Gen AI') ||
      t.category === category
    return matchSearch && matchCategory
  })

  const normalizeToolKey = (value = '') =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()

  const localLogoFor = (tool) => {
    const key = normalizeToolKey(tool.slug || tool.name || '')
    return key ? `/tools/${key}.png` : null
  }

  return (
    <div className="min-h-screen">
      <Section className="pt-10 md:pt-14 pb-6 md:pb-10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-50">{heroSection.title}</h1>
            {heroSection.subtitle && (
              <p className="mt-3 text-slate-300 max-w-2xl mx-auto">{heroSection.subtitle}</p>
            )}
          </motion.div>
        </Container>
      </Section>

      <Section className="py-6 md:py-10">
        <Container>
          <Surface className="p-4 md:p-5">
            <motion.div layout className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <span className="text-sm">?</span>
                </div>
                <input
                  id="tools-search"
                  name="tools_search"
                  type="text"
                  placeholder={metaCta.search_placeholder || ''}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/15"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#050b12]">
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </motion.div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <span className="text-slate-200">{filtered.length}</span> of{' '}
                <span className="text-slate-200">{tools.length}</span>
              </div>
              <div className="hidden md:block">{metaCta.tip}</div>
            </div>
          </Surface>

          <div className="mt-6 md:mt-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
              </div>
            ) : filtered.length === 0 ? (
              <Surface className="p-10 text-center text-slate-400">{emptySection.body}</Surface>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence initial={false}>
                  {filtered.map((tool) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.22 }}
                    >
                      <Link to={`/tools/${tool.slug}`} data-cursor="hover" className="group block h-full">
                        <Surface className="h-full p-6 transition-transform duration-200 group-hover:-translate-y-1">
                          <div className="absolute -inset-8 opacity-0 blur-2xl transition-opacity group-hover:opacity-100">
                            <div className="h-full w-full rounded-[26px] bg-gradient-to-r from-teal-400/10 via-sky-400/8 to-indigo-400/10" />
                          </div>
                          <div className="relative flex items-start gap-4">
                            <div className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden flex items-center justify-center shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                              {localLogoFor(tool) || tool.logo_url ? (
                                <img
                                  src={localLogoFor(tool) || tool.logo_url}
                                  alt={tool.name}
                                  className="h-full w-full object-contain"
                                  onError={(e) => {
                                    const fallback = tool.logo_url || null
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback
                                    } else {
                                      e.currentTarget.style.display = 'none'
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-teal-200 font-semibold">{tool.name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold text-slate-50 truncate">{tool.name}</h3>
                              {tool.description && (
                                <p className="mt-1 text-sm text-slate-300 line-clamp-2">
                                  {tool.description}
                                </p>
                              )}
                              <div className="mt-4 flex items-center justify-between gap-4">
                              {tool.category ? (
                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                                  {tool.category}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">Digital marketing</span>
                              )}
                                <span className="text-xs font-semibold text-teal-300 group-hover:text-teal-200 transition-colors">
                                  Open -&gt;
                                </span>
                              </div>
                            </div>
                          </div>
                        </Surface>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </Container>
      </Section>
    </div>
  )
}
