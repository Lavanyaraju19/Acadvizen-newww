'use client'

import { Link } from 'react-router-dom'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CustomCursor } from '../ui/CustomCursor'
import { Navbar } from '../Navbar'
import { BottomDockNav } from '../BottomDockNav'
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'

export function PublicLayout({ children }) {
  const locationLinks = [
    'Digital Marketing Courses in Bangalore',
    'Digital Marketing Courses in Jayanagar',
    'Digital Marketing Courses in JP Nagar',
    'Digital Marketing Courses in Koramangala',
    'Digital Marketing Courses in Mysore',
    'Digital Marketing Courses in Indiranagar',
    'Digital Marketing Courses in MG Road',
    'Digital Marketing Courses in Rajajinagar',
    'Digital Marketing Courses in RR Nagar',
    'Digital Marketing Courses in HSR Layout',
    'Digital Marketing Courses in Whitefield',
    'Digital Marketing Courses in Marathahalli',
  ]

  return (
    <div className="min-h-screen flex flex-col acadvizen-noise">
      <CustomCursor />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 advz-animated-bg">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-240px] left-[30%] h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="sticky top-0 z-[55] w-full border-b border-emerald-700/40 bg-emerald-950/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 text-center">
          <p className="text-xs sm:text-sm font-semibold text-emerald-200">
            Starting from March 16 | Limited Seats Available | Admissions Open Now
          </p>
        </div>
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 pb-28 md:pb-32">
        {children}
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
                  <Image
                    src="/logo.png"
                    alt="Acadvizen"
                    width={120}
                    height={32}
                    style={{ aspectRatio: '120/32', width: 'auto', height: 'auto' }}
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold text-slate-100">Acadvizen</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Premium academy for digital marketing mastery.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Academy Index</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: 'Home', to: '/' },
                    { label: 'Course Catalog', to: '/courses' },
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Legal</p>
                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { label: 'Terms of Service', to: '/terms-of-service' },
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
                <div className="mt-6 flex items-center gap-3 text-slate-300">
                  <a
                    href="https://www.instagram.com/acadvizen/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/acadvizen-digital-marketing-institute/?viewAsMember=true"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@Acadvizen"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61586987972331"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left">
                <h4 className="text-xl font-semibold text-slate-100">Digital Marketing Courses in India</h4>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300 leading-relaxed">
                  {locationLinks.map((label, idx) => (
                    <span key={label} className="inline-flex items-center gap-3">
                      {idx > 0 && <span className="text-slate-500">|</span>}
                      <a href="/" className="hover:text-slate-100 transition-colors">
                        {label}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-xs tracking-[0.2em] text-slate-500">
              (c) 2026 ACADVIZEN Digital Marketing. ALL RIGHTS RESERVED.
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  )
}
