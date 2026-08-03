const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://acadvizen.com').replace(/\/+$/, '')

function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// items: [{ label, path }] in order from Home to the current page (current page's path is optional).
export function buildBreadcrumbSchema(items = []) {
  const valid = items.filter((item) => item?.label)
  if (!valid.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: valid.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}

export function buildOrganizationSchema({ name, description, url, logo, sameAs = [] } = {}) {
  if (!name) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(description ? { description } : {}),
    ...(url ? { url: absoluteUrl(url) } : {}),
    ...(logo ? { logo: absoluteUrl(logo) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function buildJobPostingSchema({
  title,
  description,
  hiringOrganizationName = 'Acadvizen',
  datePosted,
  validThrough,
  employmentType = 'INTERN',
  location,
  applyUrl,
} = {}) {
  if (!title) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description: description || title,
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrganizationName,
    },
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    employmentType,
    ...(location ? { jobLocation: { '@type': 'Place', address: location } } : {}),
    ...(applyUrl ? { directApply: true, url: applyUrl } : {}),
  }
}

export function buildFaqSchema(faqs = []) {
  const valid = faqs.filter((faq) => faq?.question && faq?.answer)
  if (!valid.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildWebPageSchema({ name, description, path } = {}) {
  if (!name) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    ...(description ? { description } : {}),
    ...(path ? { url: absoluteUrl(path) } : {}),
  }
}
