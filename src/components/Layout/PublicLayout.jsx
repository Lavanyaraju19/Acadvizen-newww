import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { AnimatedOutlet } from '../ui/AnimatedOutlet'
import { CustomCursor } from '../ui/CustomCursor'
import { Navbar } from '../Navbar'
import { BottomDockNav } from '../BottomDockNav'

export function PublicLayout() {
  const [tickerItems, setTickerItems] = useState([])

  useEffect(() => {
    loadTicker()
    const tickerChannel = supabase
      .channel('public-ticker-layout')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticker' }, loadTicker)
      .subscribe()
    return () => {
      supabase.removeChannel(tickerChannel)
    }
  }, [])

  async function loadTicker() {
    const { data } = await supabase
      .from('ticker')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    if (data) setTickerItems(data)
  }

  return (
    <div className="min-h-screen flex flex-col acadvizen-noise">
      <CustomCursor />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 advz-animated-bg">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-240px] left-[30%] h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 w-full bg-slate-950/95 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 overflow-hidden">
          <div className="advz-ticker text-xs sm:text-sm text-teal-200" style={{ '--advz-ticker-duration': '18s' }}>
            {tickerItems.length > 0
              ? tickerItems.map((item) => item.text).join(' | ')
              : 'Next Batch Starts in 5 Days | Limited Seats Available | Admissions Open Now'}
          </div>
        </div>
      </div>

      <main className="flex-1 relative z-10 pb-28 md:pb-32">
        <AnimatedOutlet />
      </main>

      <BottomDockNav />

      <footer className="relative z-10 mt-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="border-t border-white/10 bg-white/[0.02] backdrop-blur"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid gap-10 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Acadvizen" className="h-8 w-auto" />
                  <span className="font-semibold text-slate-100">Acadvizen</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Premium academy for digital marketing mastery.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  ACADVIZEN is the best digital marketing training institute in Bangalore offering live campaign
                  training, AI-driven marketing tools, placement assistance, and career-focused mentorship.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Academy Index</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: 'Home', to: '/' },
                    { label: 'Course Catalog', to: '/courses' },
                    { label: 'Premium Tools', to: '/tools' },
                    { label: 'Our Story', to: '/about' },
                    { label: 'Hiring Partners', to: '/contact' },
                    { label: 'Enroll Today', to: '/register' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      data-cursor="hover"
                      className="group relative inline-flex text-sm text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {item.label}
                      <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-teal-300 to-sky-300 transition-transform duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Support Node</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: 'Help Center', to: '/contact' },
                    { label: 'Student FAQ', to: '/contact' },
                    { label: 'Refund Policy', to: '/contact' },
                    { label: 'Contact Support', to: '/contact' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      data-cursor="hover"
                      className="group relative inline-flex text-sm text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {item.label}
                      <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-teal-300 to-sky-300 transition-transform duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Legal</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: 'Terms of Service', to: '/about' },
                    { label: 'Privacy Policy', to: '/privacy-policy' },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      data-cursor="hover"
                      className="group relative inline-flex text-sm text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {item.label}
                      <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-teal-300 to-sky-300 transition-transform duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">HQ Command</p>
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <p>No 647-35/29 5th Block, Jayanagar</p>
                  <p>Bangalore, Karnataka 560078</p>
                  <p>+91 7411314848</p>
                  <p>ceo@acadvizen.com</p>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs tracking-[0.2em] text-slate-500">
              (c) 2026 ACADVIZEN Digital Marketing. ALL RIGHTS RESERVED.
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  )
}
