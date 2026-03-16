export function normalizeContent(section) {
  const raw = section?.content_json
  if (!raw || typeof raw !== 'object') return {}
  return raw
}

export function normalizeStyle(section) {
  const raw = section?.style_json
  if (!raw || typeof raw !== 'object') return {}
  return raw
}

export function sectionVisibilityClass(content = {}) {
  const classes = []
  if (content.mobile_hidden) classes.push('hidden md:block')
  if (content.desktop_hidden) classes.push('md:hidden')
  return classes.join(' ')
}

export function sectionPaddingClass(content = {}, style = {}) {
  const padding = String(style.padding || content.padding || 'md').toLowerCase()
  if (padding === 'none') return 'py-0'
  if (padding === 'sm') return 'py-6 md:py-8'
  if (padding === 'lg') return 'py-14 md:py-20'
  return 'py-10 md:py-14'
}

export function sectionAlignClass(content = {}, style = {}) {
  const align = String(style.alignment || content.alignment || 'left').toLowerCase()
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function safeCssColor(value) {
  if (!value) return undefined
  const color = String(value).trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return color
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(color)) return color
  return undefined
}

function safeCssSize(value) {
  if (value === null || value === undefined || value === '') return undefined
  const str = String(value).trim()
  if (/^\d+(\.\d+)?(px|rem|em|vw|vh|%)$/.test(str)) return str
  return undefined
}

function safeCssFontWeight(value) {
  if (value === null || value === undefined || value === '') return undefined
  const str = String(value).trim()
  if (/^(100|200|300|400|500|600|700|800|900|normal|bold|bolder|lighter)$/.test(str)) return str
  return undefined
}

const FONT_MAP = {
  poppins: "'Poppins', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  lato: "'Lato', sans-serif",
  open_sans: "'Open Sans', sans-serif",
  inter: "'Inter', sans-serif",
  system: "system-ui, sans-serif",
}

export function sectionInlineStyle(content = {}, style = {}) {
  const merged = { ...content, ...style }
  const inline = {}

  const bg = safeCssColor(merged.background_color || merged.section_background)
  if (bg) inline.backgroundColor = bg

  const text = safeCssColor(merged.text_color)
  if (text) inline.color = text

  const buttonBg = safeCssColor(merged.button_background)
  if (buttonBg) inline['--section-btn-bg'] = buttonBg

  const buttonText = safeCssColor(merged.button_text_color)
  if (buttonText) inline['--section-btn-text'] = buttonText

  const buttonBorder = safeCssColor(merged.button_border_color)
  if (buttonBorder) inline['--section-btn-border'] = buttonBorder

  const cardBg = safeCssColor(merged.card_background)
  if (cardBg) inline['--section-card-bg'] = cardBg

  const headingWeight = safeCssFontWeight(merged.heading_weight)
  if (headingWeight) inline['--section-heading-weight'] = headingWeight

  const bodyWeight = safeCssFontWeight(merged.body_weight)
  if (bodyWeight) inline['--section-body-weight'] = bodyWeight

  const buttonRadius = safeCssSize(merged.button_radius)
  if (buttonRadius) inline['--section-btn-radius'] = buttonRadius

  const font = FONT_MAP[String(merged.font_family || '').toLowerCase()]
  if (font) inline.fontFamily = font

  const maxWidth = safeCssSize(merged.max_width)
  if (maxWidth) inline.maxWidth = maxWidth

  return inline
}

export function headingClass(style = {}) {
  const size = String(style.heading_size || '').toLowerCase()
  if (size === 'sm') return 'text-2xl md:text-3xl [font-weight:var(--section-heading-weight,600)]'
  if (size === 'lg') return 'text-4xl md:text-6xl [font-weight:var(--section-heading-weight,600)]'
  return 'text-3xl md:text-5xl [font-weight:var(--section-heading-weight,600)]'
}

export function bodyClass(style = {}) {
  const size = String(style.text_size || '').toLowerCase()
  if (size === 'sm') return 'text-sm md:text-base [font-weight:var(--section-body-weight,400)]'
  if (size === 'lg') return 'text-lg md:text-xl [font-weight:var(--section-body-weight,400)]'
  return 'text-base md:text-lg [font-weight:var(--section-body-weight,400)]'
}

export function imageStyle(style = {}) {
  const next = {}
  const width = safeCssSize(style.image_width)
  const height = safeCssSize(style.image_height)
  const radius = safeCssSize(style.image_radius)
  if (width) next.width = width
  if (height) next.height = height
  if (radius) next.borderRadius = radius
  if (style.image_fit) next.objectFit = String(style.image_fit)
  return next
}

export function safeList(value) {
  if (!Array.isArray(value)) return []
  return value.filter(Boolean)
}

export function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}
