// The links the header, footer and legal menus show while no menu rows exist for them: first the
// lists in site_settings.ui_copy, otherwise these built-in lists. One source for the public
// components (src/components/Navbar.jsx, src/components/Layout/PublicLayout.jsx) and for the
// WordPress central admin's "import current links", so an import reproduces exactly what is shown.

export const HEADER_FALLBACK_LINKS = [
  { title: 'Courses', url: '/courses', target: '_self' },
  { title: 'Placement', url: '/placement', target: '_self' },
  { title: 'Achievements', url: '/achievements', target: '_self' },
  { title: 'Blog', url: '/blog', target: '_self' },
  { title: 'Contact', url: '/contact', target: '_self' },
]

export const FOOTER_FALLBACK_LINKS = [
  { title: 'Home', url: '/' },
  { title: 'Course Catalog', url: '/courses' },
  { title: 'Our Story', url: '/about' },
  { title: 'Hiring Partners', url: '/contact' },
  { title: 'Enroll Today', url: '/register' },
]

export const LEGAL_FALLBACK_LINKS = [
  { title: 'Terms of Service', url: '/terms-of-service' },
  { title: 'Privacy Policy', url: '/privacy-policy' },
]

export const MENU_LOCATIONS = ['header', 'footer', 'legal']

const UI_COPY_KEYS = { header: 'header_fallback_links', footer: 'footer_fallback_links', legal: 'legal_fallback_links' }
const BUILT_IN = { header: HEADER_FALLBACK_LINKS, footer: FOOTER_FALLBACK_LINKS, legal: LEGAL_FALLBACK_LINKS }

/** A ui_copy link list as the public components read it: title and url required, target defaults to _self. */
export function normalizeFallbackLinks(value) {
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

/** The links a menu location shows when it has no menu rows. */
export function fallbackMenuLinks(location, uiCopy = {}) {
  const fromSettings = normalizeFallbackLinks(uiCopy && typeof uiCopy === 'object' ? uiCopy[UI_COPY_KEYS[location]] : null)
  return fromSettings.length ? fromSettings : (BUILT_IN[location] || [])
}
