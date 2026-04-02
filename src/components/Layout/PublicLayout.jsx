'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Image from 'next/image'
import { Navbar } from '../Navbar'
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { useSiteCms } from '../../hooks/useSiteCms'

const CustomCursor = dynamic(() => import('../ui/CustomCursor').then((mod) => mod.CustomCursor), {
  ssr: false,
})
const BottomDockNav = dynamic(() => import('../BottomDockNav').then((mod) => mod.BottomDockNav), {
  ssr: false,
})

function normalizeMenuItems(value = []) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      title: String(item.title || '').trim(),
      url: String(item.url || '').trim(),
      target: String(item.target || '_self'),
    }))
    .filter((item) => item.title && item.url)
}

function normalizeStringList(value = []) {
  if (Array.isArray(value)) return value.map((entry) => String(entry || '').trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

export function PublicLayout({ children }) {
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const { settings, menus } = useSiteCms()
  const uiCopy = settings?.ui_copy && typeof settings.ui_copy === 'object' ? settings.ui_copy : {}
  const defaultLocationLinks = [
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
  const locationLinks = normalizeStringList(uiCopy.footer_location_links).length
    ? normalizeStringList(uiCopy.footer_location_links)
    : defaultLocationLinks
  const uiFooterFallback = normalizeMenuItems(uiCopy.footer_fallback_links)
  const uiLegalFallback = normalizeMenuItems(uiCopy.legal_fallback_links)
  const footerLinks = Array.isArray(menus?.footer) && menus.footer.length
    ? menus.footer.filter((item) => !item.parent_id)
    : (uiFooterFallback.length ? uiFooterFallback : [
        { title: 'Home', url: '/' },
        { title: 'Course Catalog', url: '/courses' },
        { title: 'Our Story', url: '/about' },
        { title: 'Hiring Partners', url: '/contact' },
        { title: 'Enroll Today', url: '/register' },
      ])
  const legalLinks = Array.isArray(menus?.legal) && menus.legal.length
    ? menus.legal.filter((item) => !item.parent_id)
    : (uiLegalFallback.length ? uiLegalFallback : [
        { title: 'Terms of Service', url: '/terms-of-service' },
        { title: 'Privacy Policy', url: '/privacy-policy' },
      ])
  const contactEmail = settings?.contact_email || 'ceo@acadvizen.com'
  const contactPhone = settings?.phone_number || '+91 7411314848'
  const contactAddress =
    settings?.address || 'No 647-35/29 5th Block, Jayanagar\nBangalore, Karnataka 560078'
  const announcementText = 'Starting batch from April 6th | Limited Seats Available | Admission Open Now'
  const socialLinks = settings?.social_links && typeof settings.social_links === 'object'
    ? settings.social_links
    : {}
  const logoSrc = settings?.logo || '/logo.png'
  const logoMarkSrc = '/logo-mark.png'
  const companyName = settings?.company_name || uiCopy.nav_brand_label || 'Acadvizen'
  const designTokens = settings?.design_tokens && typeof settings.design_tokens === 'object' ? settings.design_tokens : {}
  const footerNavHeading = String(uiCopy.footer_nav_heading || 'Academy Index')
  const footerLegalHeading = String(uiCopy.footer_legal_heading || 'Legal')
  const footerContactHeading = String(uiCopy.footer_contact_heading || 'HQ Command')
  const footerLocationsTitle = String(uiCopy.footer_locations_title || 'Digital Marketing Courses in India')
  const locationLinkBaseUrl = String(uiCopy.footer_location_link_url || '/')
  const footerCopyTemplate = String(uiCopy.footer_copyright_text || '(c) {year} {company}. ALL RIGHTS RESERVED.')
  const footerCopy = footerCopyTemplate
    .replaceAll('{year}', String(new Date().getFullYear()))
    .replaceAll('{company}', companyName.toUpperCase())
  const addressLine = contactAddress
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' | ')
  const fixedSocialLinks = [
    {
      key: 'linkedin',
      href: socialLinks.linkedin || 'https://www.linkedin.com/company/acadvizen-digital-marketing-institute/?viewAsMember=true',
      label: 'LinkedIn',
      icon: Linkedin,
    },
    {
      key: 'instagram',
      href: socialLinks.instagram || 'https://www.instagram.com/acadvizen/',
      label: 'Instagram',
      icon: Instagram,
    },
    {
      key: 'facebook',
      href: socialLinks.facebook || 'https://www.facebook.com/profile.php?id=61586987972331',
      label: 'Facebook',
      icon: Facebook,
    },
    {
      key: 'youtube',
      href: socialLinks.youtube || 'https://www.youtube.com/@Acadvizen',
      label: 'YouTube',
      icon: Youtube,
    },
  ]
  const layoutStyle = {
    '--brand-primary': designTokens.brand_primary || '#5eead4',
    '--brand-secondary': designTokens.brand_secondary || '#22d3ee',
  }

  useEffect(() => {
    const threshold = 16
    const topThreshold = 32

    const onScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollYRef.current

      if (currentY <= topThreshold) {
        setHeaderVisible(true)
        lastScrollYRef.current = currentY
        return
      }

      if (Math.abs(delta) < threshold) return

      if (delta > 0) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }

      lastScrollYRef.current = currentY
    }

    lastScrollYRef.current = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col acadvizen-noise" style={layoutStyle}>
      <CustomCursor />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 advz-animated-bg">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-240px] left-[30%] h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div
        className={`fixed inset-x-0 top-0 z-[55] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          headerVisible ? 'translate-y-0 opacity-100' : '-translate-y-[110%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full border-b border-[#1f7a34] bg-[#278f38]">
          <div className="mx-auto max-w-7xl px-4 py-2 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#c9ffe0] sm:text-sm">
              {announcementText.includes('Admission Open Now') ? (
                <>
                  Starting batch from April 6th | Limited Seats Available |{' '}
                  <span className="font-extrabold text-yellow-300">Admission Open Now</span>
                </>
              ) : (
                announcementText
              )}
            </p>
          </div>
        </div>

        <Navbar />
      </div>

      <div className="h-[110px] sm:h-[112px]" />

      <main className="flex-1 relative z-10 pb-28 md:pb-32">
        {children}
      </main>

      <div className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 md:flex">
        <div className="mr-0 flex flex-col items-center gap-4 rounded-l-2xl border border-white/15 bg-black/55 px-3 py-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur">
          {fixedSocialLinks.map((item) => {
            const Icon = item.icon
            const colorClass =
              item.key === 'linkedin'
                ? 'text-[#0a66c2]'
                : item.key === 'instagram'
                ? 'text-[#e1306c]'
                : item.key === 'facebook'
                ? 'text-[#1877f2]'
                : 'text-[#ff0000]'
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-2xl transition hover:scale-105 hover:bg-black/60 ${colorClass}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2.2} />
              </a>
            )
          })}
        </div>
      </div>

      <BottomDockNav />

      <footer className="relative z-10 mt-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
        <div className="border-t border-white/10 bg-[#040d19]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                    <Image
                      src={logoMarkSrc}
                      alt={companyName}
                      width={56}
                      height={56}
                      style={{ width: 'auto', height: 'auto' }}
                      className="h-10 w-auto shrink-0 object-contain"
                    />
                  </div>
                  <span className="text-2xl font-bold text-slate-100">{companyName}</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {settings?.footer_content || 'Premium academy for digital marketing mastery.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footerNavHeading}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {footerLinks.map((item) => (
                    <Link
                      key={`${item.title}-${item.url}`}
                      to={item.url}
                      target={item.target || '_self'}
                      data-cursor="hover"
                      className="group relative inline-flex text-sm text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {item.title}
                      <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-teal-300 to-sky-300 transition-transform duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footerLegalHeading}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {legalLinks.map((item) => (
                    <Link
                      key={`${item.title}-${item.url}`}
                      to={item.url}
                      target={item.target || '_self'}
                      data-cursor="hover"
                      className="group relative inline-flex text-sm text-slate-400 transition-colors hover:text-slate-100"
                    >
                      {item.title}
                      <span className="pointer-events-none absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-teal-300 to-sky-300 transition-transform duration-300 group-hover:scale-x-100" />
                    </Link>
                  ))}
                </div>

                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footerContactHeading}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <p>{addressLine}</p>
                  <p>{contactPhone}</p>
                  <p>{contactEmail}</p>
                </div>
                <div className="mt-6 flex items-center gap-3 text-slate-300">
                  <a
                    href={socialLinks.instagram || 'https://www.instagram.com/acadvizen/'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href={socialLinks.linkedin || 'https://www.linkedin.com/company/acadvizen-digital-marketing-institute/?viewAsMember=true'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href={socialLinks.youtube || 'https://www.youtube.com/@Acadvizen'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="transition-colors hover:text-slate-100"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                  <a
                    href={socialLinks.facebook || 'https://www.facebook.com/profile.php?id=61586987972331'}
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
              <div className="px-2 text-left">
                <h4 className="text-xl font-semibold text-slate-100">{footerLocationsTitle}</h4>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-relaxed text-slate-300">
                  {locationLinks.map((label, idx) => (
                    <span key={label} className="inline-flex items-center gap-3">
                      {idx > 0 && <span className="text-slate-500">|</span>}
                      <a href={locationLinkBaseUrl} className="hover:text-slate-100 transition-colors">
                        {label}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-xs tracking-[0.2em] text-slate-500">
              {footerCopy}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
