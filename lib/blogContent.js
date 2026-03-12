function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function stripTags(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeTextBlock(value = '') {
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isLikelyHeading(block = '') {
  const text = stripTags(block)
  if (!text) return false
  if (text.length > 90) return false
  if (text.includes('\n')) return false
  if (/^[-*•]/.test(text)) return false
  if (/^\d+\./.test(text)) return false
  if (/[.!?]$/.test(text)) return false
  if (text.endsWith(':')) return true
  return text.split(/\s+/).length <= 10
}

function createDefaultResponse() {
  return {
    toc: [{ id: 'overview', title: 'Overview' }],
    sections: [{ id: 'overview', heading: 'Overview', paragraphs: ['Content will be updated soon.'], image: null }],
  }
}

function parseHtmlWithHeadings(source = '') {
  const matches = [...source.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)]
  if (!matches.length) return null

  const sections = []
  matches.forEach((match, index) => {
    const heading = stripTags(match[1]) || `Section ${index + 1}`
    const start = match.index + match[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : source.length
    const block = source.slice(start, end)
    const paragraphs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((entry) => normalizeTextBlock(stripTags(entry[1])))
      .filter(Boolean)
    const imageMatch = block.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/i)
    sections.push({
      id: slugify(heading) || `section-${index + 1}`,
      heading,
      paragraphs,
      image: imageMatch ? { src: imageMatch[1], alt: imageMatch[2] } : null,
    })
  })

  const normalizedSections = sections
    .filter((section) => section.heading || section.paragraphs.length || section.image)
    .map((section, index) => ({
      ...section,
      id: section.id || `section-${index + 1}`,
      paragraphs: section.paragraphs.length ? section.paragraphs : [''],
    }))

  return {
    toc: normalizedSections.map((section) => ({ id: section.id, title: section.heading })),
    sections: normalizedSections,
  }
}

function parseHtmlWithoutHeadings(source = '') {
  const paragraphs = [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((entry) => normalizeTextBlock(stripTags(entry[1])))
    .filter(Boolean)
  const imageMatch = source.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/i)

  if (!paragraphs.length && !imageMatch) return null

  return {
    toc: [{ id: 'overview', title: 'Overview' }],
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        paragraphs: paragraphs.length ? paragraphs : [''],
        image: imageMatch ? { src: imageMatch[1], alt: imageMatch[2] } : null,
      },
    ],
  }
}

function parsePlainText(source = '') {
  const blocks = source
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => normalizeTextBlock(block))
    .filter(Boolean)

  if (!blocks.length) return createDefaultResponse()

  const sections = []
  let currentSection = {
    id: 'overview',
    heading: 'Overview',
    paragraphs: [],
    image: null,
  }

  blocks.forEach((block, index) => {
    if (isLikelyHeading(block)) {
      if (currentSection.paragraphs.length || currentSection.image) {
        sections.push(currentSection)
      }
      const heading = block.replace(/:$/, '').trim()
      currentSection = {
        id: slugify(heading) || `section-${index + 1}`,
        heading,
        paragraphs: [],
        image: null,
      }
      return
    }
    currentSection.paragraphs.push(block)
  })

  if (currentSection.paragraphs.length || currentSection.image || !sections.length) {
    sections.push(currentSection)
  }

  const normalizedSections = sections
    .filter((section) => section.heading || section.paragraphs.length)
    .map((section, index) => ({
      ...section,
      id: section.id || `section-${index + 1}`,
      heading: section.heading || `Section ${index + 1}`,
      paragraphs: section.paragraphs.length ? section.paragraphs : [''],
    }))

  return {
    toc: normalizedSections.map((section) => ({ id: section.id, title: section.heading })),
    sections: normalizedSections,
  }
}

export function parseBlogContent(content = '') {
  const source = String(content || '').trim()
  if (!source) return createDefaultResponse()

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(source)
  if (hasHtml) {
    const withHeadings = parseHtmlWithHeadings(source)
    if (withHeadings) return withHeadings
    const withoutHeadings = parseHtmlWithoutHeadings(source)
    if (withoutHeadings) return withoutHeadings
  }

  return parsePlainText(source)
}
