function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const INLINE_IMAGE_MARKER = /\[IMAGE_(\d+)\]/gi

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

function normalizeParagraphLines(lines = []) {
  return lines
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLikelyHeading(block = '') {
  const text = stripTags(block)
  if (!text) return false
  if (text.length > 90) return false
  if (text.includes('\n')) return false
  if (/^[-*]/.test(text)) return false
  if (/^\d+\./.test(text)) return false
  if (/[.!?]$/.test(text)) return false
  if (text.endsWith(':')) return true
  return text.split(/\s+/).length <= 10
}

function isListLine(line = '') {
  return /^\s*(?:[-*]\s+|\d+[.)]\s+)/.test(String(line || ''))
}

function stripListMarker(line = '') {
  return String(line || '').replace(/^\s*(?:[-*]\s+|\d+[.)]\s+)/, '').trim()
}

function startsLikeSentence(line = '') {
  return /^[A-Z0-9"'(]/.test(String(line || '').trim())
}

function hasHtmlMarkup(value = '') {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''))
}

export function normalizeInlineImages(value = []) {
  const source = Array.isArray(value) ? value : []
  return source.map((next) => (typeof next === 'string' ? next.trim() : ''))
}

function makeInlineImageBlock(src = '', index = 0) {
  return {
    block_type: 'image',
    content_json: {
      src,
      alt: `Inline image ${index + 1}`,
      caption: '',
    },
  }
}

function makeParagraphBlock(text = '') {
  return {
    block_type: 'paragraph',
    content_json: { text },
  }
}

function appendMarkerOrParagraph(blocks, text = '', inlineImages = []) {
  const normalized = normalizeTextBlock(text)
  if (!normalized) return
  const markerOnly = normalized.match(/^\[IMAGE_(\d+)\]$/i)
  if (markerOnly) {
    const markerIndex = Number(markerOnly[1]) - 1
    const imageSrc = inlineImages[markerIndex]
    if (imageSrc) {
      blocks.push(makeInlineImageBlock(imageSrc, markerIndex))
      return
    }
  }
  blocks.push(makeParagraphBlock(normalized))
}

function convertHtmlToBlocks(content = '', options = {}) {
  const source = String(content || '').replace(/\r\n/g, '\n').trim()
  if (!source) return []

  const inlineImages = normalizeInlineImages(options.inlineImages || options.inline_images)
  const blocks = []
  const tokenPattern =
    /(\[IMAGE_\d+\])|(<h([1-6])[^>]*>[\s\S]*?<\/h\3>)|(<p[^>]*>[\s\S]*?<\/p>)|(<blockquote[^>]*>[\s\S]*?<\/blockquote>)|(<(?:ul|ol)[^>]*>[\s\S]*?<\/(?:ul|ol)>)|(<img\b[^>]*\/?>)/gi

  let lastIndex = 0
  let match

  while ((match = tokenPattern.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index)
    const plainBefore = normalizeTextBlock(stripTags(before))
    if (plainBefore) {
      const beforeBlocks = convertTextSourceToBlocks(plainBefore, inlineImages)
      blocks.push(...beforeBlocks)
    }

    const token = match[0]

    if (/^\[IMAGE_\d+\]$/i.test(token)) {
      appendMarkerOrParagraph(blocks, token, inlineImages)
    } else if (/^<h[1-6]/i.test(token)) {
      const headingMatch = token.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i)
      const headingText = normalizeTextBlock(stripTags(headingMatch?.[2] || ''))
      if (headingText) {
        blocks.push({
          block_type: 'heading',
          content_json: {
            text: headingText,
            level: Math.min(4, Math.max(2, Number(headingMatch?.[1] || 2))),
          },
        })
      }
    } else if (/^<p/i.test(token)) {
      const paragraphMatch = token.match(/^<p[^>]*>([\s\S]*?)<\/p>$/i)
      const paragraphHtml = String(paragraphMatch?.[1] || '')
      if (INLINE_IMAGE_MARKER.test(paragraphHtml) && stripTags(paragraphHtml).trim().match(/^\[IMAGE_\d+\]$/i)) {
        INLINE_IMAGE_MARKER.lastIndex = 0
        appendMarkerOrParagraph(blocks, stripTags(paragraphHtml), inlineImages)
      } else {
        const paragraphText = normalizeTextBlock(stripTags(paragraphHtml))
        if (paragraphText) blocks.push(makeParagraphBlock(paragraphText))
      }
      INLINE_IMAGE_MARKER.lastIndex = 0
    } else if (/^<blockquote/i.test(token)) {
      const quoteMatch = token.match(/^<blockquote[^>]*>([\s\S]*?)<\/blockquote>$/i)
      const quoteText = normalizeTextBlock(stripTags(quoteMatch?.[1] || ''))
      if (quoteText) {
        blocks.push({
          block_type: 'quote',
          content_json: {
            text: quoteText,
            author: '',
          },
        })
      }
    } else if (/^<(?:ul|ol)/i.test(token)) {
      const items = [...token.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((entry) => normalizeTextBlock(stripTags(entry[1] || '')))
        .filter(Boolean)
      if (items.length) {
        blocks.push({
          block_type: 'list',
          content_json: { items },
        })
      }
    } else if (/^<img/i.test(token)) {
      const srcMatch = token.match(/\bsrc=["']([^"']+)["']/i)
      const altMatch = token.match(/\balt=["']([^"']*)["']/i)
      const titleMatch = token.match(/\btitle=["']([^"']*)["']/i)
      if (srcMatch?.[1]) {
        blocks.push({
          block_type: 'image',
          content_json: {
            src: srcMatch[1],
            alt: altMatch?.[1] || titleMatch?.[1] || 'Blog image',
            caption: titleMatch?.[1] || '',
          },
        })
      }
    }

    lastIndex = tokenPattern.lastIndex
  }

  const after = source.slice(lastIndex)
  const plainAfter = normalizeTextBlock(stripTags(after))
  if (plainAfter) {
    blocks.push(...convertTextSourceToBlocks(plainAfter, inlineImages))
  }

  return blocks
}

function expandLinesWithImageMarkers(source = '') {
  return String(source || '')
    .split('\n')
    .flatMap((line) => {
      INLINE_IMAGE_MARKER.lastIndex = 0
      if (!INLINE_IMAGE_MARKER.test(line)) return [line]

      const segments = []
      let cursor = 0

      line.replace(INLINE_IMAGE_MARKER, (match, marker, offset) => {
        const before = line.slice(cursor, offset).trim()
        if (before) segments.push(before)
        segments.push(`[IMAGE_${marker}]`)
        cursor = offset + match.length
        return match
      })

      const after = line.slice(cursor).trim()
      if (after) segments.push(after)
      return segments.length ? segments : [line]
    })
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

function convertTextSourceToBlocks(source = '', inlineImages = []) {
  const lines = expandLinesWithImageMarkers(source)
  const blocks = []
  let paragraphLines = []
  let listItems = []

  const flushParagraph = () => {
    const text = normalizeParagraphLines(paragraphLines)
    if (text) {
      blocks.push(makeParagraphBlock(text))
    }
    paragraphLines = []
  }

  const flushList = () => {
    if (listItems.length) {
      blocks.push({
        block_type: 'list',
        content_json: { items: listItems.slice() },
      })
    }
    listItems = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = String(lines[index] || '')
    const trimmedLine = rawLine.trim()
    const previousTrimmed = index > 0 ? String(lines[index - 1] || '').trim() : ''
    const nextTrimmed = index + 1 < lines.length ? String(lines[index + 1] || '').trim() : ''

    if (!trimmedLine) {
      flushParagraph()
      flushList()
      continue
    }

    const imageMarkerMatch = trimmedLine.match(/^\[IMAGE_(\d+)\]$/i)
    if (imageMarkerMatch) {
      flushParagraph()
      flushList()
      const markerIndex = Number(imageMarkerMatch[1]) - 1
      const imageSrc = inlineImages[markerIndex]
      if (imageSrc) {
        blocks.push(makeInlineImageBlock(imageSrc, markerIndex))
      } else {
        blocks.push({
          block_type: 'paragraph',
          content_json: { text: trimmedLine },
        })
      }
      continue
    }

    if (isListLine(trimmedLine)) {
      flushParagraph()
      const item = stripListMarker(trimmedLine)
      if (item) listItems.push(item)
      continue
    }

    if (listItems.length) flushList()

    const canStartHeading =
      isLikelyHeading(trimmedLine) &&
      (!paragraphLines.length || !previousTrimmed || /[.!?]$/.test(previousTrimmed))

    if (canStartHeading) {
      flushParagraph()
      blocks.push({
        block_type: 'heading',
        content_json: {
          text: trimmedLine.replace(/:$/, '').trim(),
          level: 2,
        },
      })
      continue
    }

    paragraphLines.push(trimmedLine)

    if (
      /[.!?]$/.test(trimmedLine) &&
      nextTrimmed &&
      !isListLine(nextTrimmed) &&
      startsLikeSentence(nextTrimmed)
    ) {
      flushParagraph()
    }
  }

  flushParagraph()
  flushList()

  return blocks
}

export function convertPlainTextToBlocks(content = '', options = {}) {
  const source = String(content || '').replace(/\r\n/g, '\n').trim()
  if (!source) return []

  if (hasHtmlMarkup(source)) {
    const htmlBlocks = convertHtmlToBlocks(source, options)
    if (htmlBlocks.length) return htmlBlocks
  }

  const inlineImages = normalizeInlineImages(options.inlineImages || options.inline_images)
  return convertTextSourceToBlocks(source, inlineImages)
}

function buildSectionsFromBlocks(blocks = []) {
  if (!Array.isArray(blocks) || !blocks.length) return createDefaultResponse()

  const sections = []
  let currentSection = {
    id: 'overview',
    heading: 'Overview',
    paragraphs: [],
    image: null,
  }

  const pushCurrentSection = () => {
    if (!currentSection.heading && !currentSection.paragraphs.length && !currentSection.image) return
    sections.push({
      ...currentSection,
      paragraphs: currentSection.paragraphs.length ? currentSection.paragraphs.slice() : [''],
    })
  }

  blocks.forEach((block, index) => {
    const type = String(block?.block_type || 'paragraph')
    const content = block?.content_json || {}

    if (type === 'heading') {
      if (currentSection.paragraphs.length || currentSection.image || sections.length) {
        pushCurrentSection()
      }
      const heading = String(content.text || '').trim() || `Section ${sections.length + 1}`
      currentSection = {
        id: block.id || slugify(heading) || `section-${index + 1}`,
        heading,
        paragraphs: [],
        image: null,
      }
      return
    }

    if (type === 'image' && content.src) {
      if (!currentSection.image) {
        currentSection.image = {
          src: content.src,
          alt: content.alt || '',
        }
      }
      return
    }

    if (type === 'list' && Array.isArray(content.items) && content.items.length) {
      currentSection.paragraphs.push(content.items.map((item) => `- ${item}`).join('\n'))
      return
    }

    const text = String(content.text || '').trim()
    if (text) currentSection.paragraphs.push(text)
  })

  pushCurrentSection()

  const normalizedSections = sections
    .filter((section) => section.heading || section.paragraphs.length || section.image)
    .map((section, index) => ({
      ...section,
      id: section.id || `section-${index + 1}`,
      heading: section.heading || `Section ${index + 1}`,
      paragraphs: section.paragraphs.length ? section.paragraphs : [''],
    }))

  if (!normalizedSections.length) return createDefaultResponse()

  return {
    toc: normalizedSections.map((section) => ({ id: section.id, title: section.heading })),
    sections: normalizedSections,
  }
}

function parsePlainText(source = '', options = {}) {
  const blocks = convertPlainTextToBlocks(source, options)
  return buildSectionsFromBlocks(blocks)
}

export function parseBlogContent(content = '', options = {}) {
  const source = String(content || '').trim()
  if (!source) return createDefaultResponse()

  if (hasHtmlMarkup(source)) {
    const withHeadings = parseHtmlWithHeadings(source)
    if (withHeadings) return withHeadings
    const withoutHeadings = parseHtmlWithoutHeadings(source)
    if (withoutHeadings) return withoutHeadings
  }

  return parsePlainText(source, options)
}
