// Rich text that the WordPress central admin sends for Main's pages and sections. Main renders it
// with dangerouslySetInnerHTML (RichTextSection), so it is rebuilt here from an allowlist and never
// trusted as sent: unknown tags are dropped (their text kept), script-like elements are dropped with
// their content, only links with safe schemes survive, and no other attribute is kept.

const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'span', 'code'])
const VOID_TAGS = new Set(['br'])
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'textarea', 'svg', 'math', 'select', 'title', 'head'])
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i

function escapeText(value) {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function decodeBasicEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
    .replace(/&amp;/gi, '&')
}

function safeHref(raw) {
  // Browsers ignore control characters and whitespace inside a scheme ("java\tscript:").
  const href = decodeBasicEntities(String(raw || '')).replace(/[\u0000- \u007f-\u009f]/g, '')
  return SAFE_HREF.test(href) ? href : ''
}

function readAttribute(attributes, name) {
  const pattern = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const match = attributes.match(pattern)
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null
}

export function sanitizeRichHtml(input, { maxLength = 50000 } = {}) {
  const html = String(input ?? '')
  if (html.length > maxLength) return null
  let out = ''
  let dropDepth = 0
  let dropTag = ''
  const tokens = html.match(/<!--[\s\S]*?(?:-->|$)|<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\/?>|[^<]+|</g) || []
  for (const token of tokens) {
    if (token.startsWith('<!--')) continue
    const tag = token.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^<>]*?)(\/?)>$/)
    if (!tag) {
      if (!dropDepth) out += escapeText(token)
      continue
    }
    const [, closing, rawName, attributes] = tag
    const name = rawName.toLowerCase()
    if (dropDepth) {
      if (name === dropTag) dropDepth += closing ? -1 : 1
      continue
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing) {
        dropTag = name
        dropDepth = 1
      }
      continue
    }
    if (!ALLOWED_TAGS.has(name)) continue
    if (closing) {
      if (!VOID_TAGS.has(name)) out += `</${name}>`
      continue
    }
    if (name === 'a') {
      const href = safeHref(readAttribute(attributes, 'href'))
      const external = /^https?:\/\//i.test(href)
      out += href ? `<a href="${escapeAttribute(href)}"${external ? ' rel="noopener noreferrer"' : ''}>` : '<a>'
      continue
    }
    out += `<${name}>`
  }
  return out.trim()
}
