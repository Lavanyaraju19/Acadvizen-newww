/**
 * Converts pages extracted by extract.mjs (desktop, tablet and mobile measurements of the same
 * DOM) into native Elementor elements: Flexbox/Grid containers, Heading, Text Editor, Button,
 * Image and (for inline SVG icons, embeds and forms) HTML widgets.
 *
 * Styles come from the browser's computed styles at each width, so Elementor's desktop / tablet /
 * mobile settings reproduce the original responsive layout. Colours and text styles that repeat
 * across the site become Elementor global colours / typographies ("Main …" in Site Settings), so
 * one change there restyles every Main Website page. Effects Elementor has no control for
 * (backdrop blur, multi-layer gradients, gradient text) go to the element's Custom CSS.
 */

import crypto from 'node:crypto'

export const VIEWPORTS = { desktop: 1440, tablet: 800, mobile: 390 }
/** Window height pages are captured at (capture.mjs). */
export const CAPTURE_HEIGHT = 900
const DEVICES = ['desktop', 'tablet', 'mobile']

/* Value helpers ------------------------------------------------------------------------------- */

const px = (v) => {
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}
const isTransparent = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c)

/** rgb()/rgba() -> #rrggbb or #rrggbbaa (Elementor colour controls accept both). */
export function hexColor(c) {
  const m = String(c || '').match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\s*\)/)
  if (!m) return String(c || '')
  const h = (n) => Math.round(Math.max(0, Math.min(255, Number(n)))).toString(16).padStart(2, '0')
  const a = m[4] === undefined ? 1 : Number(m[4])
  return `#${h(m[1])}${h(m[2])}${h(m[3])}${a < 1 ? h(a * 255) : ''}`.toUpperCase()
}

export function elementId(seed) {
  return crypto.createHash('md5').update(seed).digest('hex').slice(0, 7)
}

const fontFamily = (f) => String(f || '').split(',')[0].replace(/["']/g, '').replace(/^__([A-Za-z]+)_[\w]+$/, '$1').replace(/ Fallback$/, '').trim()
const box = (s, prop) => ({ unit: 'px', top: String(px(s[`${prop}Top`])), right: String(px(s[`${prop}Right`])), bottom: String(px(s[`${prop}Bottom`])), left: String(px(s[`${prop}Left`])), isLinked: false })
const radius = (s) => ({ unit: 'px', top: String(px(s.borderTopLeftRadius)), right: String(px(s.borderTopRightRadius)), bottom: String(px(s.borderBottomRightRadius)), left: String(px(s.borderBottomLeftRadius)), isLinked: false })
const isZeroBox = (b) => ['top', 'right', 'bottom', 'left'].every((k) => Number(b[k]) === 0)
const size = (n, unit = 'px') => ({ unit, size: n, sizes: [] })

const FLEX_MAP = { normal: 'flex-start', start: 'flex-start', 'flex-start': 'flex-start', left: 'flex-start', center: 'center', end: 'flex-end', 'flex-end': 'flex-end', right: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly', stretch: 'stretch', baseline: 'flex-start' }
const ALIGN_TEXT = { start: 'left', left: 'left', center: 'center', end: 'right', right: 'right', justify: 'justify', '-webkit-center': 'center' }

function parseShadow(shadow) {
  if (!shadow || shadow === 'none') return null
  // Tailwind adds invisible "ring" layers (transparent colour, 0 size); they change nothing.
  const layers = shadow.split(/,(?![^(]*\))/).map((l) => l.trim()).filter((l) => !/rgba\([^)]*,\s*0\)/.test(l) && !/^(rgba?\([^)]*\)\s+)?0px 0px 0px 0px/.test(l))
  if (!layers.length) return null
  shadow = layers.join(', ')
  if (layers.length > 1 || /inset/.test(shadow)) return { css: shadow }
  const m = shadow.match(/(rgba?\([^)]*\)|#[0-9a-f]+)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?/i)
  if (!m) return { css: shadow }
  return { horizontal: px(m[2]), vertical: px(m[3]), blur: px(m[4]), spread: px(m[5] || 0), color: hexColor(m[1]) }
}

/** Simple two-stop linear gradients map to Elementor's gradient background; others need CSS. */
function parseGradient(image) {
  if (!image || image === 'none') return null
  if (/url\(/.test(image) && !/gradient/.test(image)) return { url: image.match(/url\(["']?([^"')]+)["']?\)/)[1] }
  const layers = image.split(/,(?![^(]*\))/)
  const lin = image.match(/^linear-gradient\(\s*(?:(-?[\d.]+)deg\s*,\s*)?(rgba?\([^)]*\)|#[0-9a-f]+)(?:\s+([\d.]+)%)?\s*,\s*(rgba?\([^)]*\)|#[0-9a-f]+)(?:\s+([\d.]+)%)?\s*\)$/i)
  if (lin && layers.length === 1) {
    return { gradient: { angle: lin[1] ? px(lin[1]) : 180, a: hexColor(lin[2]), aStop: lin[3] ? px(lin[3]) : 0, b: hexColor(lin[4]), bStop: lin[5] ? px(lin[5]) : 100 } }
  }
  return { css: image }
}

/* Design tokens (Elementor globals) ------------------------------------------------------------- */

export class DesignSystem {
  constructor(prefix = 'Main') {
    this.prefix = prefix
    this.colorCount = new Map()
    this.typeCount = new Map()
    this.colors = new Map() // hex -> global id
    this.types = new Map() // key -> { id, settings }
  }

  countColor(hex) {
    if (hex) this.colorCount.set(hex, (this.colorCount.get(hex) || 0) + 1)
  }

  countType(key, settings) {
    const entry = this.typeCount.get(key) || { n: 0, settings }
    entry.n += 1
    this.typeCount.set(key, entry)
  }

  /**
   * Freezes the globals: colours used 3+ times, the 24 most used text styles. IDs come from the
   * value itself, so separately built bundles agree on them (one colour is one global everywhere).
   */
  finalize() {
    let i = 0
    for (const [hex, n] of [...this.colorCount.entries()].sort((a, b) => b[1] - a[1])) {
      if (n < 3 || i >= 40) break
      if (/^#[0-9A-F]{6}00$/.test(hex)) continue // fully transparent
      i += 1
      this.colors.set(hex, `acvmc${hex.slice(1).toLowerCase()}`)
    }
    let t = 0
    for (const [key, entry] of [...this.typeCount.entries()].sort((a, b) => b[1].n - a[1].n)) {
      if (entry.n < 2 || t >= 24) break
      t += 1
      this.types.set(key, { id: `acvmt${crypto.createHash('sha1').update(key).digest('hex').slice(0, 8)}`, settings: entry.settings })
    }
  }

  kit() {
    const colors = [...this.colors.entries()].map(([hex, id]) => ({ _id: id, title: `${this.prefix} ${hex}`, color: hex }))
    const typography = [...this.types.values()].map(({ id, settings }) => {
      const s = settings.desktop
      const label = `${this.prefix} ${Math.round(s.size)}/${Math.round(s.lineHeight)} ${s.weight}${s.transform && s.transform !== 'none' ? ' ' + s.transform : ''}${s.letterSpacing ? ' ls' + s.letterSpacing : ''} (${id.slice(-4)})`
      const out = { _id: id, title: label, typography_typography: 'custom', typography_font_family: s.family, typography_font_size: size(s.size), typography_font_weight: String(s.weight), typography_line_height: size(s.lineHeight), typography_letter_spacing: size(s.letterSpacing), typography_text_transform: s.transform === 'none' ? '' : s.transform, typography_font_style: s.style === 'normal' ? '' : s.style }
      for (const device of ['tablet', 'mobile']) {
        const d = settings[device]
        if (!d) continue
        if (d.size !== s.size) out[`typography_font_size_${device}`] = size(d.size)
        if (d.lineHeight !== s.lineHeight) out[`typography_line_height_${device}`] = size(d.lineHeight)
      }
      return out
    })
    return { colors, typography }
  }
}

/* Viewport merging ----------------------------------------------------------------------------- */

function indexTree(roots) {
  const map = new Map()
  const walk = (n) => {
    map.set(n.id, n)
    for (const c of n.children || []) walk(c)
  }
  for (const r of roots) walk(r)
  return map
}

/**
 * Responsive settings: desktop value as the base; tablet/mobile only where they differ.
 * fn(node) returns a flat object of settings for one device.
 */
// Elementor gives every flex container --width:100% and flex-wrap:wrap below 768px unless the
// element has its own mobile value, so these are written for mobile even when equal to desktop.
const ALWAYS_ON_MOBILE = new Set(['width', 'flex_wrap'])

function responsive(nodes, fn) {
  const base = nodes.desktop ? fn(nodes.desktop, 'desktop') : {}
  const out = { ...base }
  for (const device of ['tablet', 'mobile']) {
    if (!nodes[device] || nodes[device].hidden) continue
    const values = fn(nodes[device], device)
    for (const [k, v] of Object.entries(values)) {
      if (JSON.stringify(v) !== JSON.stringify(base[k]) || (device === 'mobile' && ALWAYS_ON_MOBILE.has(k))) out[`${k}_${device}`] = v
    }
  }
  return out
}

/* Element builders ----------------------------------------------------------------------------- */

const TEXT_KINDS = new Set(['heading', 'text', 'link'])

function typographyOf(n) {
  const s = n.style
  return { family: fontFamily(s.fontFamily), size: px(s.fontSize), weight: Number(s.fontWeight) || 400, lineHeight: s.lineHeight === 'normal' ? Math.round(px(s.fontSize) * 1.2) : px(s.lineHeight), letterSpacing: s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing), transform: s.textTransform, style: s.fontStyle }
}

/**
 * Widget settings from several parts. Their __globals__ (global colours/fonts) are merged: a plain
 * spread keeps only the last part's, which dropped the typography of a badge with a background.
 */
export function mergeSettings(...parts) {
  const out = {}
  for (const part of parts) {
    if (!part) continue
    const { __globals__: globals, ...rest } = part
    Object.assign(out, rest)
    if (globals) out.__globals__ = { ...(out.__globals__ || {}), ...globals }
  }
  return out
}

function typographySettings(nodes, ds, prefix = 'typography') {
  const per = {}
  for (const d of DEVICES) if (nodes[d] && !nodes[d].hidden) per[d] = typographyOf(nodes[d])
  const key = JSON.stringify(per)
  const global = ds.types.get(key)
  if (global) return { __globals__: { [`${prefix}_typography`]: `globals/typography?id=${global.id}` } }
  const settings = responsive(nodes, (n) => {
    const t = typographyOf(n)
    return {
      [`${prefix}_font_size`]: size(t.size),
      [`${prefix}_line_height`]: size(t.lineHeight),
      [`${prefix}_letter_spacing`]: size(t.letterSpacing),
    }
  })
  const t = per.desktop || Object.values(per)[0]
  return {
    [`${prefix}_typography`]: 'custom',
    [`${prefix}_font_family`]: t.family,
    [`${prefix}_font_weight`]: String(t.weight),
    [`${prefix}_text_transform`]: t.transform === 'none' ? '' : t.transform,
    [`${prefix}_font_style`]: t.style === 'normal' ? '' : t.style,
    ...settings,
  }
}

function colorSetting(key, hex, ds, settings) {
  if (!hex) return
  const id = ds.colors.get(hex)
  if (id) {
    settings.__globals__ = { ...(settings.__globals__ || {}), [key]: `globals/colors?id=${id}` }
  } else {
    settings[key] = hex
  }
}

/** Box styles shared by containers and widgets (prefix "" for containers, "_" for widgets). */
function boxSettings(nodes, ds, widget) {
  const p = widget ? '_' : ''
  const d = nodes.desktop || nodes.tablet || nodes.mobile
  const s = d.style
  const settings = {}
  const css = []
  // Spacing
  Object.assign(settings, responsive(nodes, (n) => {
    const out = {}
    const m = box(n.style, 'margin')
    // Equal large side margins are "margin: auto" centring; alignment handles that instead.
    if (Number(m.left) >= 24 && Math.abs(Number(m.left) - Number(m.right)) <= 1) {
      m.left = '0'
      m.right = '0'
    }
    const pd = box(n.style, 'padding')
    if (!isZeroBox(m)) out[`${p}margin`] = m
    if (!isZeroBox(pd)) out[widget ? '_padding' : 'padding'] = pd
    return out
  }))
  // Background
  const bg = parseGradient(s.backgroundImage)
  if (!isTransparent(s.backgroundColor) || bg) {
    if (bg && bg.gradient) {
      settings[`${p}background_background`] = 'gradient'
      settings[`${p}background_color`] = bg.gradient.a
      settings[`${p}background_color_stop`] = size(bg.gradient.aStop, '%')
      settings[`${p}background_color_b`] = bg.gradient.b
      settings[`${p}background_color_b_stop`] = size(bg.gradient.bStop, '%')
      settings[`${p}background_gradient_angle`] = size(bg.gradient.angle, 'deg')
    } else {
      settings[`${p}background_background`] = 'classic'
      if (!isTransparent(s.backgroundColor)) colorSetting(`${p}background_color`, hexColor(s.backgroundColor), ds, settings)
      if (bg && bg.url) {
        settings[`${p}background_image`] = { url: bg.url, id: '' }
        settings[`${p}background_size`] = ['cover', 'contain'].includes(s.backgroundSize) ? s.backgroundSize : 'cover'
        settings[`${p}background_position`] = 'center center'
        settings[`${p}background_repeat`] = s.backgroundRepeat === 'no-repeat' ? 'no-repeat' : 'no-repeat'
      }
      if (bg && bg.css) css.push(`background-image:${bg.css}`)
    }
  }
  // Border
  const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => px(s[`border${k}Width`]))
  if (bw.some((w) => w > 0) && s.borderTopStyle !== 'none') {
    settings[`${p}border_border`] = s.borderTopStyle
    settings[`${p}border_width`] = { unit: 'px', top: String(bw[0]), right: String(bw[1]), bottom: String(bw[2]), left: String(bw[3]), isLinked: false }
    colorSetting(`${p}border_color`, hexColor(s.borderTopColor), ds, settings)
  }
  const r = radius(s)
  if (!isZeroBox(r)) settings[`${p}border_radius`] = r
  // Shadow
  const sh = parseShadow(s.boxShadow)
  if (sh && sh.css) css.push(`box-shadow:${sh.css}`)
  else if (sh) {
    settings[`${p}box_shadow_box_shadow_type`] = 'yes'
    settings[`${p}box_shadow_box_shadow`] = sh
  }
  // Effects without an Elementor control
  if (s.backdropFilter && s.backdropFilter !== 'none') css.push(`backdrop-filter:${s.backdropFilter}`, `-webkit-backdrop-filter:${s.backdropFilter}`)
  if (s.filter && s.filter !== 'none') css.push(`filter:${s.filter}`)
  if (s.opacity && Number(s.opacity) < 1) css.push(`opacity:${s.opacity}`)
  if (s.transform && s.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(s.transform)) {
    // A pure rotation uses Elementor's own Rotate control (Advanced > Transform); anything else stays CSS.
    const m = s.transform.match(/^matrix\(([-\d.e]+), ([-\d.e]+), ([-\d.e]+), ([-\d.e]+), 0, 0\)$/)
    const [ma, mb, mc, md] = m ? m.slice(1).map(Number) : []
    if (m && Math.abs(ma - md) < 1e-3 && Math.abs(mb + mc) < 1e-3 && Math.abs(ma * ma + mb * mb - 1) < 1e-3) {
      settings._transform_rotateZ_effect = size(Math.round(((Math.atan2(mb, ma) * 180) / Math.PI) * 10) / 10, 'deg')
    } else {
      css.push(`transform:${s.transform}`)
    }
  }
  if (s.mixBlendMode && s.mixBlendMode !== 'normal') css.push(`mix-blend-mode:${s.mixBlendMode}`)
  if (s.animationName && s.animationName !== 'none') css.push(`/* original animation: ${s.animationName} ${s.animationDuration} */`)
  // Positioning (absolute/fixed decorations, sticky bars)
  if (['absolute', 'fixed'].includes(s.position)) {
    settings[widget ? '_position' : 'position'] = s.position
    const left = s.left !== 'auto' ? px(s.left) : null
    const right = s.right !== 'auto' ? px(s.right) : null
    const top = s.top !== 'auto' ? px(s.top) : null
    const bottom = s.bottom !== 'auto' ? px(s.bottom) : null
    settings._offset_orientation_h = left === null && right !== null ? 'end' : 'start'
    settings[left === null && right !== null ? '_offset_x_end' : '_offset_x'] = size(left === null ? (right ?? 0) : left)
    settings._offset_orientation_v = top === null && bottom !== null ? 'end' : 'start'
    settings[top === null && bottom !== null ? '_offset_y_end' : '_offset_y'] = size(top === null ? (bottom ?? 0) : top)
    if (s.zIndex !== 'auto') settings[widget ? '_z_index' : 'z_index'] = Number(s.zIndex)
  } else if (s.position === 'sticky') {
    css.push(`position:sticky`, `top:${s.top}`, `z-index:${s.zIndex === 'auto' ? 10 : s.zIndex}`)
  } else if (s.zIndex !== 'auto' && s.position === 'relative') {
    settings[widget ? '_z_index' : 'z_index'] = Number(s.zIndex)
  }
  // Visibility per device
  for (const dev of DEVICES) {
    if (!nodes[dev] || nodes[dev].hidden) settings[`hide_${dev}`] = `hidden-${dev}`
  }
  // A widget limited by max-width keeps that limit at every screen size (containers use Elementor's
  // own "Boxed" width instead, see Converter.container).
  const maxWidth = widget && nodes.desktop && !nodes.desktop.hidden ? cappedWidth(nodes.desktop) : 0
  if (maxWidth) css.push(`max-width:${maxWidth}px`)
  if (css.length) settings.custom_css = `selector{${css.join(';')}}`
  return settings
}

/** The max-width in px that limits this box's width (0 when the width is not capped). */
function cappedWidth(n) {
  const max = /px$/.test(n.style.maxWidth || '') ? px(n.style.maxWidth) : 0
  return max > 0 && Math.abs(n.rect.w - max) <= 1 ? Math.round(max) : 0
}

function linkSetting(href) {
  if (!href) return null
  return { url: href, is_external: /^https?:\/\//.test(href) && !/acadvizen\.com/.test(href) ? 'on' : '', nofollow: '', custom_attributes: '' }
}

/**
 * An accordion answer whose points were cards on the Main Website (course modules): the points stay
 * a plain list in the Text Editor (easy to edit), drawn as the same grid of cards with a coloured
 * dot; one column on phones.
 */
function cardsCss(cards) {
  if (!cards) return ''
  const c = cards.card
  const [dotA, dotB] = cards.dots
  return `selector ul.acv-cards{display:grid;grid-template-columns:repeat(${Math.max(1, cards.columns)},minmax(0,1fr));gap:${cards.gap};list-style:none;margin:0;padding:0}`
    + `selector ul.acv-cards li{position:relative;margin:0;background:${c.bg};border:${c.border};border-radius:${c.radius};padding:${c.padding};padding-left:calc(${c.padding.split(' ').pop()} + 22px);color:${c.color};font-size:${c.fontSize};line-height:${c.lineHeight}}`
    + (dotA ? `selector ul.acv-cards li::before{content:"";position:absolute;left:${c.padding.split(' ').pop()};top:calc(${c.padding.split(' ')[0]} + 8px);width:10px;height:10px;border-radius:50%;background:${dotA}}` : '')
    + (dotB && dotB !== dotA ? `selector ul.acv-cards li:nth-child(even)::before{background:${dotB}}` : '')
    + '@media (max-width:767px){selector ul.acv-cards{grid-template-columns:1fr}}'
}

function widget(widgetType, seed, settings) {
  return { id: elementId(seed), elType: 'widget', widgetType, settings, elements: [], isInner: false }
}

function isButtonLike(s) {
  return !isTransparent(s.backgroundColor) || px(s.borderTopWidth) > 0 || (s.backgroundImage && s.backgroundImage !== 'none')
}

/** Width for a child that does not simply stretch across its parent. */
function widthSettings(nodes, parents, widget) {
  // A box that keeps its size from desktop to tablet is a fixed-size item (logo, icon, button).
  const d = nodes.desktop
  const t = nodes.tablet
  const fixedSize = d && t && !d.hidden && !t.hidden && Math.abs(d.rect.w - t.rect.w) <= 1
  return responsive(nodes, (n, device) => {
    const parent = parents[device]
    if (!parent || parent.hidden || n.hidden || n.rect.w === 0) return {}
    const ps = parent.style
    const inner = parent.rect.w - px(ps.paddingLeft) - px(ps.paddingRight) - px(ps.borderLeftWidth) - px(ps.borderRightWidth)
    const isRow = ps.display.includes('flex') && ps.flexDirection.startsWith('row')
    const isGrid = ps.display.includes('grid')
    const out = {}
    const w = n.rect.w
    // Full width, or full width up to a max-width (Custom CSS from boxSettings). Said explicitly,
    // so a percentage set for a wider screen does not carry over to tablet/mobile.
    const stretched = Math.abs(w - inner) <= 2 || (!isRow && cappedWidth(n) > 0)
    if (isGrid) return out
    // A short single-line text in a row (a badge, a label next to an icon, a link's text in a link
    // sized to it) sizes to its text ("Inline" width): a measured width would wrap it when the font
    // renders a pixel wider.
    const lineHeight = n.style.lineHeight === 'normal' ? px(n.style.fontSize) * 1.2 : px(n.style.lineHeight)
    const textHeight = n.rect.h - px(n.style.paddingTop) - px(n.style.paddingBottom) - px(n.style.borderTopWidth) - px(n.style.borderBottomWidth)
    // (Zero-width children, e.g. a hover underline bar, do not count.)
    const onlyChild = parent.children && parent.children.filter((c) => !c.hidden && c.rect.w > 0).length === 1
    if (widget && isRow && TEXT_KINDS.has(n.kind) && textHeight <= lineHeight * 1.5 && (w < inner * 0.5 || (stretched && onlyChild))) {
      out._element_width = 'auto'
      out._flex_size = 'none'
      return out
    }
    if (stretched && !isRow) {
      if (widget) out._element_width = 'inherit'
      else out.width = size(100, '%')
      const ml = px(n.style.marginLeft)
      if (ml > 0 && Math.abs(ml - px(n.style.marginRight)) <= 1) out._flex_align_self = 'center'
      return out
    }
    if (!stretched || isRow) {
      const value = fixedSize ? size(Math.round(w)) : size(Math.round((w / Math.max(1, inner)) * 10000) / 100, '%')
      if (widget) {
        out._element_width = 'initial'
        out._element_custom_width = value
      } else {
        out.width = value
      }
      const ml = px(n.style.marginLeft)
      const mr = px(n.style.marginRight)
      if (!isRow && ml > 0 && Math.abs(ml - mr) <= 1) out._flex_align_self = 'center'
    }
    if (isRow) {
      out._flex_size = Number(n.style.flexGrow) > 0 ? 'grow' : 'none'
    }
    return out
  })
}

/* Node conversion --------------------------------------------------------------------------------- */

const shortcodeValue = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/["[\]]/g, '').replace(/\s+/g, ' ').trim()

/**
 * The Main Website's lead forms (name / email / phone, posting to /api/cms/leads) become the
 * WordPress [acv_lead_form] shortcode, which sends the same request. Other forms return ''.
 */
export function leadFormShortcode(html, form = 'inquiry', rows = []) {
  // form: a form_type, or { form_type, source, success } from the page's Main lead_form section.
  // rows: the field names on each row of the live form ([["fullName"], ["phone", "email"], …]).
  const extra = typeof form === 'object' && form ? form : {}
  let formType = typeof form === 'string' ? form : (extra.form_type || 'inquiry')
  // The contact page's form (fullName + message) saved nothing on the Main Website; it becomes a lead.
  if (/name="fullName"/.test(html) && /name="message"/.test(html)) {
    html = html.replace(/name="fullName"/, 'name="full_name"')
    formType = 'contact'
  }
  if (!/name="full_name"/.test(html) || !/name="(email|phone)"/.test(html)) return ''
  const placeholder = (name) => shortcodeValue((html.match(new RegExp(`name="${name}"[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*name="${name}"`)) || []).slice(1).find(Boolean))
  const submit = shortcodeValue((html.match(/<button[^>]*type="submit"[^>]*>([\s\S]*?)<\/button>/) || [])[1])
  // Field order, and visible labels (a <label> before each field, as on the contact form).
  const keyOf = { full_name: 'name', email: 'email', phone: 'phone', message: 'message', experienceLevel: 'experience', experience_level: 'experience' }
  const found = [...html.matchAll(/name="(full_name|email|phone|message|experienceLevel|experience_level)"/g)].map((m) => ({ key: keyOf[m[1]], name: m[1], at: m.index }))
  // The "Fresher / Experienced" choice: its options, as on the live form.
  const select = html.match(/<select[^>]*name="experience(?:Level|_level)"[^>]*>([\s\S]*?)<\/select>/)
  const experienceOptions = select ? [...select[1].matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)].map((m) => shortcodeValue(m[1].replace(/<[^>]+>/g, '').trim()).replace(/,/g, '')).filter(Boolean).join(',') : ''
  // Fields on one row of the live form are kept side by side ("phone+email").
  const rowOf = (name) => rows.findIndex((r) => r.map((x) => (x === 'fullName' ? 'full_name' : x)).includes(name))
  const groups = []
  for (const f of found) {
    const last = groups[groups.length - 1]
    if (last && rowOf(f.name) >= 0 && rowOf(f.name) === rowOf(last[last.length - 1].name)) last.push(f)
    else groups.push([f])
  }
  const labels = {}
  let from = 0
  for (const f of found) {
    const before = html.slice(from, f.at)
    const label = [...before.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].pop()
    if (label) labels[f.name] = shortcodeValue(label[1].replace(/<[^>]+>/g, '').trim())
    from = f.at
  }
  const above = found.length > 0 && found.every((f) => labels[f.name])
  const label = (name) => (above ? labels[name] : placeholder(name))
  const atts = [['form_type', formType], ['source', shortcodeValue(extra.source)], ['success', shortcodeValue(extra.success)], ['message', /name="message"/.test(html) ? 'yes' : ''], ['submit', submit], ['labels', above ? 'above' : ''], ['fields', groups.map((g) => g.map((f) => f.key).join('+')).join(',')], ['name_label', label('full_name')], ['email_label', label('email')], ['phone_label', label('phone')], ['message_label', label('message')], ['experience_label', select ? label(select[0].includes('experienceLevel') ? 'experienceLevel' : 'experience_level') : ''], ['experience_options', experienceOptions]]
  return `[acv_lead_form ${atts.filter(([, v]) => v).map(([k, v]) => `${k}="${v}"`).join(' ')}]`
}

/**
 * A logo strip that scrolls (marquee): a row with an animation, or wider than its box, whose
 * contents are only images (at least 6, often each repeated for a seamless loop).
 */
export function isLogoStrip(n, parent) {
  if (!n || n.kind !== 'box' || !n.children || !n.children.length) return false
  const leaves = []
  const walkLeaves = (x) => { if (!x.children || !x.children.length) leaves.push(x); else x.children.forEach(walkLeaves) }
  walkLeaves(n)
  const images = leaves.filter((x) => x.kind === 'image')
  if (images.length < 6 || images.length < leaves.filter((x) => !x.hidden).length * 0.8) return false
  const moving = (n.style.animationName && n.style.animationName !== 'none') || /marquee|logo-scroll|scroll-x|ticker/i.test(n.cls || '')
  const overflowing = parent && n.rect.w > parent.rect.w * 1.2
  return Boolean(moving || overflowing)
}

export class Converter {
  constructor({ ds, seed, transformText = (t) => t, transformLink = (h) => h, transformImage = (u) => u, notes = [], formType = 'inquiry' }) {
    this.formType = formType
    this.ds = ds
    this.seed = seed
    this.transformText = transformText
    this.transformLink = transformLink
    this.transformImage = transformImage
    this.notes = notes
  }

  /** First pass: count colours and text styles so repeated ones become globals. */
  collect(trees) {
    const walk = (n) => {
      const nodes = this.nodesFor(trees, n.id)
      const s = n.style || {}
      if (!n.hidden) {
        if (TEXT_KINDS.has(n.kind)) {
          this.ds.countColor(hexColor(s.color))
          const per = {}
          for (const d of DEVICES) if (nodes[d] && !nodes[d].hidden) per[d] = typographyOf(nodes[d])
          this.ds.countType(JSON.stringify(per), per)
        }
        if (!isTransparent(s.backgroundColor)) this.ds.countColor(hexColor(s.backgroundColor))
        if (px(s.borderTopWidth) > 0) this.ds.countColor(hexColor(s.borderTopColor))
      }
      for (const c of n.children || []) walk(c)
    }
    for (const r of trees.desktop.roots) walk(r)
  }

  nodesFor(trees, id) {
    return { desktop: trees.index.desktop.get(id), tablet: trees.index.tablet.get(id), mobile: trees.index.mobile.get(id) }
  }

  static prepare(viewports) {
    const trees = { desktop: viewports.desktop, tablet: viewports.tablet, mobile: viewports.mobile, index: {} }
    for (const d of DEVICES) trees.index[d] = indexTree(viewports[d].roots)
    return trees
  }

  convertRoots(trees) {
    return trees.desktop.roots.flatMap((r) => this.convert(trees, r, null, true))
  }

  convert(trees, node, parent, top = false) {
    const nodes = this.nodesFor(trees, node.id)
    const visibleSomewhere = DEVICES.some((d) => nodes[d] && !nodes[d].hidden)
    if (!visibleSomewhere) return []
    const n = nodes.desktop && !nodes.desktop.hidden ? nodes.desktop : (nodes.tablet && !nodes.tablet.hidden ? nodes.tablet : nodes.mobile)
    const parents = parent ? this.nodesFor(trees, parent.id) : {}
    const seed = `${this.seed}:${node.id}`

    if (TEXT_KINDS.has(n.kind)) return [this.textWidget(nodes, n, parents, seed)]
    if (n.kind === 'image') return [this.imageWidget(nodes, n, parents, seed)]
    if (n.kind === 'video') return [this.videoWidget(nodes, n, parents, seed)]
    if (n.kind === 'svg' || n.kind === 'embed' || n.kind === 'form') return [this.htmlWidget(nodes, n, parents, seed)]
    if (n.kind === 'accordion') return [this.accordionWidget(nodes, n, parents, seed)]
    if (isLogoStrip(n, parents.desktop)) return [this.carouselWidget(nodes, n, parents, seed)]

    // Containers: collapse wrappers that add nothing visible.
    const children = (n.children || []).filter((c) => DEVICES.some((d) => trees.index[d].get(c.id) && !trees.index[d].get(c.id).hidden))
    if (!children.length) {
      const s = n.style
      const visual = !isTransparent(s.backgroundColor) || (s.backgroundImage && s.backgroundImage !== 'none') || px(s.borderTopWidth) > 0 || (s.boxShadow && s.boxShadow !== 'none')
      const spacer = !visual && n.rect.h > 0 && !['absolute', 'fixed'].includes(s.position)
      if (spacer) return [{ id: elementId(seed), elType: 'container', settings: { content_width: 'full', padding: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }, ...responsive(nodes, (x) => (x.hidden ? {} : { min_height: size(Math.round(x.rect.h)) })), ...Object.fromEntries(DEVICES.filter((d) => !nodes[d] || nodes[d].hidden).map((d) => [`hide_${d}`, `hidden-${d}`])) }, elements: [], isInner: !top }]
      if (!visual || n.rect.w === 0 || n.rect.h === 0) return []
    }
    if (!top && children.length === 1 && this.isPlainWrapper(n, children[0])) {
      return this.convert(trees, children[0], parent)
    }
    return [this.container(trees, nodes, n, parents, seed, children, top)]
  }

  isPlainWrapper(n, child) {
    const s = n.style
    const nothingVisible = isTransparent(s.backgroundColor) && (!s.backgroundImage || s.backgroundImage === 'none') && px(s.borderTopWidth) === 0 && (!s.boxShadow || s.boxShadow === 'none') && !['absolute', 'fixed', 'sticky'].includes(s.position)
    const noSpacing = isZeroBox(box(s, 'padding')) && isZeroBox(box(s, 'margin'))
    const sameBox = child.rect && Math.abs(child.rect.w - n.rect.w) <= 2 && Math.abs(child.rect.h - n.rect.h) <= 2
    // A positioned box around an absolutely placed child (a "fill" image in a sized frame) is that
    // child's frame: without it the image would cover whatever follows (e.g. a logo's caption).
    const framesAbsoluteChild = s.position === 'relative' && child.style && ['absolute', 'fixed'].includes(child.style.position)
    return nothingVisible && noSpacing && sameBox && !framesAbsoluteChild && n.tag !== 'a' && !(s.backdropFilter && s.backdropFilter !== 'none')
  }

  container(trees, nodes, n, parents, seed, children, top) {
    const s = n.style
    const settings = {
      content_width: 'full',
      ...boxSettings(nodes, this.ds, false),
      ...(top ? {} : widthSettings(nodes, parents, false)),
    }
    // A page column limited by max-width (e.g. 1280px with side padding) is an Elementor "Boxed"
    // container: core Layout settings an administrator can see and change, no custom CSS.
    const capped = !n.hidden ? cappedWidth(n) : 0
    if (capped) {
      settings.content_width = 'boxed'
      settings.boxed_width = size(Math.max(0, capped - px(s.paddingLeft) - px(s.paddingRight)))
      for (const key of ['width', 'width_tablet', 'width_mobile', '_flex_align_self', '_flex_align_self_tablet', '_flex_align_self_mobile']) delete settings[key]
    }
    // A pill/badge in a row (a box around one line of text) is as wide as its text, as on the Main
    // Website; a measured width wraps it when the font renders a pixel wider.
    const parentNode = parents.desktop
    const inRow = parentNode && parentNode.style.display.includes('flex') && parentNode.style.flexDirection.startsWith('row')
    const leaves = []
    // Visible leaves only: a zero-width child (a hover underline bar) is not content.
    const collect = (x) => { if (x.hidden || x.rect.w === 0) return; if (!x.children || !x.children.length) leaves.push(x); else x.children.forEach(collect) }
    collect(n)
    const oneLine = leaves.length === 1 && TEXT_KINDS.has(leaves[0].kind) && leaves[0].rect.h <= (px(leaves[0].style.lineHeight) || px(leaves[0].style.fontSize) * 1.2) * 1.5
    if (!top && inRow && oneLine && !capped) {
      for (const key of ['width', 'width_tablet', 'width_mobile']) delete settings[key]
      settings._flex_size = 'none'
      settings.custom_css = `${settings.custom_css || ''}selector{--width:auto;width:auto}`
    }
    // Likewise a one-line link in a column (a footer or menu list), at the start of its line.
    const parentInner = parentNode ? parentNode.rect.w - px(parentNode.style.paddingLeft) - px(parentNode.style.paddingRight) : 0
    if (!top && !inRow && oneLine && !capped && n.tag === 'a' && parentNode && n.rect.w < parentInner - 2 && px(n.style.marginLeft) === 0 && px(n.style.marginRight) === 0 && Math.abs(n.rect.x - parentNode.rect.x - px(parentNode.style.paddingLeft)) <= 1) {
      for (const key of ['width', 'width_tablet', 'width_mobile', '_flex_align_self', '_flex_align_self_tablet', '_flex_align_self_mobile']) delete settings[key]
      settings._flex_align_self = 'flex-start'
      settings.custom_css = `${settings.custom_css || ''}selector{--width:auto;width:auto}`
    }
    const isGrid = s.display.includes('grid')
    Object.assign(settings, responsive(nodes, (x) => {
      const st = x.style
      const out = {}
      if (st.display.includes('grid')) {
        out.container_type = 'grid'
        const cols = st.gridTemplateColumns === 'none' ? 1 : st.gridTemplateColumns.split(/\s+(?![^(]*\))/).length
        out.grid_columns_grid = size(cols, 'fr')
        // Unequal tracks (e.g. a 280px contents column beside the article): the widest track
        // stretches (1fr), the others keep their width - Elementor's custom grid template.
        const tracks = st.gridTemplateColumns === 'none' ? [] : st.gridTemplateColumns.split(/\s+(?![^(]*\))/).map((t) => px(t))
        if (tracks.length > 1 && tracks.every((t) => t > 0) && Math.max(...tracks) - Math.min(...tracks) > 2) {
          const widest = tracks.indexOf(Math.max(...tracks))
          out.grid_columns_grid = { unit: 'custom', size: tracks.map((t, i) => (i === widest ? '1fr' : `${Math.round(t)}px`)).join(' '), sizes: [] }
        }
        out.grid_rows_grid = size(1, 'fr')
        out.grid_gaps = { unit: 'px', column: String(px(st.columnGap)), row: String(px(st.rowGap)), isLinked: false }
        out.grid_auto_flow = 'row'
      } else {
        const row = st.display.includes('flex') && st.flexDirection.startsWith('row')
        out.flex_direction = st.display.includes('flex') ? st.flexDirection : 'column'
        out.flex_wrap = st.flexWrap === 'wrap' ? 'wrap' : 'nowrap'
        out.flex_justify_content = FLEX_MAP[st.justifyContent] || 'flex-start'
        out.flex_align_items = st.display.includes('flex') ? (FLEX_MAP[st.alignItems] || 'stretch') : 'stretch'
        out.flex_gap = { unit: 'px', column: String(px(st.columnGap) || 0), row: String(px(st.rowGap) || 0), isLinked: false, size: px(row ? st.columnGap : st.rowGap) || 0 }
      }
      const minH = px(st.minHeight)
      if (minH > 0) out.min_height = size(minH)
      // A box sized by aspect-ratio (e.g. a 16:9 video frame) keeps its height on each device.
      if (st.aspectRatio && st.aspectRatio !== 'auto' && x.rect.h > 0) out.min_height = size(Math.round(x.rect.h))
      // A block holding only inline content (a link in a list item) is one line tall - its
      // line-height - even when that content is shorter; as a flex container it would shrink to it.
      const kids = (x.children || []).filter((c) => !c.hidden)
      if (!st.display.includes('flex') && !st.display.includes('grid') && kids.length && kids.every((c) => /^inline/.test(c.style.display)) && x.rect.h > Math.max(...kids.map((c) => c.rect.h)) + 1) {
        out.min_height = size(Math.round(x.rect.h))
        out.flex_justify_content = 'center'
      }
      if (st.overflowX === 'hidden' || st.overflowY === 'hidden') out.overflow = 'hidden'
      return out
    }))
    if (isGrid && settings.container_type !== 'grid') settings.container_type = 'grid'
    // Fixed and absolute boxes do not stretch with the page: give them their measured size
    // (fixed: share of the viewport, so full-width bars stay full width).
    if (['fixed', 'absolute'].includes(s.position)) {
      Object.assign(settings, responsive(nodes, (x, device) => {
        if (x.hidden || x.rect.w === 0) return {}
        const out = { width: x.style.position === 'fixed' ? size(Math.round((x.rect.w / VIEWPORTS[device]) * 10000) / 100, 'vw') : size(Math.round(x.rect.w)) }
        // Empty boxes, and absolute overlays (e.g. inset-0 centring a play button), keep their height.
        if (!children.length || x.style.position === 'absolute') out.min_height = size(Math.round(x.rect.h))
        // A fixed full-window layer (e.g. the page's glow backdrop, whose shapes are all positioned
        // inside it) is as tall as the window, whatever its size; captured in a 900px-high window.
        if (x.style.position === 'fixed' && x.rect.h >= CAPTURE_HEIGHT * 0.9) out.min_height = size(100, 'vh')
        return out
      }))
    }
    if (n.tag === 'a' && n.attrs && n.attrs.href && !this.linkDepth) {
      settings.html_tag = 'a'
      settings.link = linkSetting(this.transformLink(n.attrs.href))
    } else if (['section', 'header', 'footer', 'nav', 'article', 'aside', 'main'].includes(n.tag)) {
      settings.html_tag = n.tag
    }
    // Containers default to 10px padding in Elementor; state the real value (often 0).
    if (!settings.padding) settings.padding = { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: true }
    const isLink = settings.html_tag === 'a'
    if (isLink) this.linkDepth = (this.linkDepth || 0) + 1
    const elements = children.flatMap((c) => this.convert(trees, c, n))
    if (isLink) this.linkDepth -= 1
    return { id: elementId(seed), elType: 'container', settings, elements, isInner: !top }
  }

  textWidget(nodes, n, parents, seed) {
    const s = n.style
    const html = this.linkDepth ? this.transformText(n.html || '').replace(/<\/?a(?:\s[^>]*)?>/g, '') : this.transformText(n.html || '')
    const align = ALIGN_TEXT[s.textAlign] || 'left'
    const common = mergeSettings(boxSettings(nodes, this.ds, true), widthSettings(nodes, parents, true))
    const alignResp = responsive(nodes, (x) => ({ align: ALIGN_TEXT[x.style.textAlign] || 'left' }))
    if (n.kind === 'link' && isButtonLike(s)) {
      // Button: background/border/padding belong to the button itself, not the widget wrapper.
      const settings = {
        text: n.text,
        ...(this.linkDepth ? {} : { link: linkSetting(this.transformLink(n.attrs.href || '#')) }),
        align: 'left',
        ...typographySettings(nodes, this.ds),
        ...responsive(nodes, (x) => ({ text_padding: box(x.style, 'padding') })),
        border_radius: radius(s),
      }
      colorSetting('button_text_color', hexColor(s.color), this.ds, settings)
      const bg = parseGradient(s.backgroundImage)
      if (bg && bg.gradient) {
        Object.assign(settings, { background_background: 'gradient', background_color: bg.gradient.a, background_color_b: bg.gradient.b, background_gradient_angle: size(bg.gradient.angle, 'deg') })
      } else if (!isTransparent(s.backgroundColor)) {
        settings.background_background = 'classic'
        colorSetting('background_color', hexColor(s.backgroundColor), this.ds, settings)
      } else {
        settings.background_background = 'classic'
        settings.background_color = '#00000000'
      }
      if (px(s.borderTopWidth) > 0) {
        settings.border_border = s.borderTopStyle
        settings.border_width = { unit: 'px', top: String(px(s.borderTopWidth)), right: String(px(s.borderRightWidth)), bottom: String(px(s.borderBottomWidth)), left: String(px(s.borderLeftWidth)), isLinked: false }
        colorSetting('border_color', hexColor(s.borderTopColor), this.ds, settings)
      }
      const sh = parseShadow(s.boxShadow)
      if (sh && !sh.css) Object.assign(settings, { button_box_shadow_box_shadow_type: 'yes', button_box_shadow_box_shadow: sh })
      const margins = responsive(nodes, (x) => { const m = box(x.style, 'margin'); return isZeroBox(m) ? {} : { _margin: m } })
      const extraCss = []
      // One-line buttons stay one line (font metrics can differ by a pixel).
      const lineHeight = s.lineHeight === 'normal' ? px(s.fontSize) * 1.2 : px(s.lineHeight)
      if (n.rect.h - px(s.paddingTop) - px(s.paddingBottom) - px(s.borderTopWidth) * 2 < lineHeight * 1.6) extraCss.push('white-space:nowrap')
      if (sh && sh.css) extraCss.push(`box-shadow:${sh.css}`)
      if (s.backdropFilter && s.backdropFilter !== 'none') extraCss.push(`backdrop-filter:${s.backdropFilter}`)
      // In a plain block (not a flex/grid row) the text alignment places the button, e.g. a centred
      // "Enroll Now" under a section: the widget spans the row and aligns the button inside it.
      const inBlock = parents.desktop && !/flex|grid/.test(parents.desktop.style.display)
      return widget('button', seed, {
        ...settings,
        ...margins,
        ...(inBlock ? alignResp : widthSettings(nodes, parents, true)),
        ...Object.fromEntries(DEVICES.filter((d) => !nodes[d] || nodes[d].hidden).map((d) => [`hide_${d}`, `hidden-${d}`])),
        ...(extraCss.length ? { custom_css: `selector .elementor-button{${extraCss.join(';')}}` } : {}),
      })
    }
    const gradientText = (s.webkitBackgroundClip || s.backgroundClip) === 'text' && s.backgroundImage !== 'none'
    // Text cut to a few lines with an ellipsis (e.g. card excerpts); with a "Read more" after it,
    // the plugin's Read more (acv-readmore) clamps it and adds the toggle instead.
    const readMore = n.kind !== 'heading' && Number(s.webkitLineClamp) > 0 && n.attrs && n.attrs.readmore ? Number(s.webkitLineClamp) : 0
    const lines = Number(s.webkitLineClamp) > 0 && !readMore ? Number(s.webkitLineClamp) : 0
    const clamp = (target) => (lines ? `selector ${target}{display:-webkit-box;-webkit-line-clamp:${lines};-webkit-box-orient:vertical;overflow:hidden}` : '')
    if (n.kind === 'heading') {
      const settings = mergeSettings({ title: html, header_size: n.tag }, alignResp, typographySettings(nodes, this.ds), common)
      colorSetting('title_color', hexColor(s.color), this.ds, settings)
      if (n.attrs.href && !this.linkDepth) settings.link = linkSetting(this.transformLink(n.attrs.href))
      if (gradientText) {
        delete settings._background_background
        settings.custom_css = `selector .elementor-heading-title{background-image:${s.backgroundImage};-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}`
      }
      if (lines) settings.custom_css = `${settings.custom_css || ''}${clamp('.elementor-heading-title')}`
      return widget('heading', seed, settings)
    }
    // Paragraphs, labels and plain text links.
    let body = html
    const blockTag = ['p', 'li', 'blockquote', 'figcaption', 'label', 'dt', 'dd'].includes(n.tag) ? n.tag : 'p'
    if (n.kind === 'link' && n.attrs.href && !this.linkDepth) body = `<a href="${this.transformLink(n.attrs.href)}">${html}</a>`
    const settings = mergeSettings({ editor: `<${blockTag === 'li' ? 'p' : blockTag}>${body}</${blockTag === 'li' ? 'p' : blockTag}>` }, alignResp, typographySettings(nodes, this.ds), common)
    colorSetting('text_color', hexColor(s.color), this.ds, settings)
    // Paragraph margins inside Text Editors are reset once for the whole Main Website (design.php,
    // MAIN_BASE_CSS) rather than per widget: thousands of per-widget CSS blocks make the editor slow.
    if (gradientText) settings.custom_css = `${settings.custom_css || ''}selector .elementor-widget-container{background-image:${s.backgroundImage};-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}`
    // On the paragraph, or on the widget when WordPress printed a lone field shortcode without one.
    if (lines) settings.custom_css = `${settings.custom_css || ''}${clamp('p')}${clamp('').replace('selector {', 'selector:not(:has(p)){')}`
    if (readMore) {
      settings._css_classes = 'acv-readmore'
      if (readMore !== 6) settings.custom_css = `${settings.custom_css || ''}selector{--acv-lines:${readMore}}`
      // Another label than "Read more" (Advanced > Attributes).
      if (!/^read more$/i.test(n.attrs.readmore)) settings._attributes = `data-more|${n.attrs.readmore}`
    }
    return widget('text-editor', seed, settings)
  }

  imageWidget(nodes, n, parents, seed) {
    const s = n.style
    const src = this.transformImage(n.attrs.src || '', n.attrs.alt || '')
    const settings = {
      image: { url: src.url, id: src.id || '', alt: n.attrs.alt || '', source: 'library' },
      image_size: 'full',
      align: 'left',
      ...boxSettings(nodes, this.ds, true),
      ...widthSettings(nodes, parents, true),
      ...responsive(nodes, (x) => ({ width: size(x.rect.w), height: size(x.rect.h) })),
    }
    // "Fill" images (absolutely positioned over their whole box) become normal full-size images.
    const box0 = parents.desktop && !parents.desktop.hidden ? parents.desktop.rect : null
    if (['absolute', 'fixed'].includes(s.position) && box0 && Math.abs(box0.w - n.rect.w) <= 3 && Math.abs(box0.h - n.rect.h) <= 3) {
      for (const k of ['_position', '_offset_orientation_h', '_offset_x', '_offset_x_end', '_offset_orientation_v', '_offset_y', '_offset_y_end', '_z_index']) delete settings[k]
      settings._element_width = 'initial'
      settings._element_custom_width = size(100, '%')
    }
    if (s.objectFit && s.objectFit !== 'fill') settings['object-fit'] = s.objectFit
    const r = radius(s)
    if (!isZeroBox(r)) settings.image_border_radius = r
    if (n.attrs.href && !this.linkDepth) {
      settings.link_to = 'custom'
      settings.link = linkSetting(this.transformLink(n.attrs.href))
    }
    return widget('image', seed, settings)
  }

  /**
   * A video -> Elementor's Video widget (self-hosted file): the poster is its image overlay with a
   * play icon, and clicking it plays the video, as the Main Website's "Play Video" button does.
   */
  videoWidget(nodes, n, parents, seed) {
    const a = n.attrs
    const ratio = n.rect.h > 0 ? n.rect.w / n.rect.h : 16 / 9
    const ratios = { 169: 16 / 9, 219: 21 / 9, 43: 4 / 3, 32: 3 / 2, 11: 1, 916: 9 / 16 }
    const aspect = Object.keys(ratios).sort((x, y) => Math.abs(ratios[x] - ratio) - Math.abs(ratios[y] - ratio))[0]
    const settings = {
      video_type: 'hosted',
      insert_url: 'yes',
      external_url: { url: this.transformLink(a.src), is_external: '', nofollow: '' },
      autoplay: a.autoplay ? 'yes' : '',
      mute: a.muted ? 'yes' : '',
      loop: a.loop ? 'yes' : '',
      controls: 'yes',
      aspect_ratio: aspect,
      ...boxSettings(nodes, this.ds, true),
      ...widthSettings(nodes, parents, true),
    }
    if (a.poster && !a.autoplay) {
      const poster = this.transformImage(a.poster, '')
      Object.assign(settings, { show_image_overlay: 'yes', image_overlay: { url: poster.url, id: poster.id || '' }, image_overlay_size: 'full', show_play_icon: 'yes', lightbox: '' })
    }
    const r = radius(n.style)
    if (!isZeroBox(r)) Object.assign(settings, { _border_radius: r, custom_css: 'selector .elementor-wrapper{border-radius:inherit;overflow:hidden}' })
    return widget('video', seed, settings)
  }

  /**
   * An accordion (FAQ, course modules) -> Elementor's Accordion widget: one item per question, the
   * answer in a Text Editor inside the item. Opening/closing works as on the Main Website.
   */
  accordionWidget(nodes, n, parents, seed) {
    const a = n.accordion
    // Padding of two boxes added side by side (missing values count as 0).
    const sumDims = (a1, a2) => {
      const v = (s, side) => px((s || {})[`padding${side}`] || '0px')
      return { unit: 'px', top: String(v(a1, 'Top') + v(a2, 'Top')), right: String(v(a1, 'Right') + v(a2, 'Right')), bottom: String(v(a1, 'Bottom') + v(a2, 'Bottom')), left: String(v(a1, 'Left') + v(a2, 'Left')), isLinked: false }
    }
    const radius = px(a.item.borderTopLeftRadius)
    // A subtitle under the title ("70 Days | Focus: …") stays in the title row as a second line,
    // visible while the item is closed; Elementor keeps a <span> in the title.
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    const items = a.items.map((it, i) => ({ item_title: it.subtitle ? `${esc(it.title)}<span class="acv-acc-sub">${esc(it.subtitle)}</span>` : it.title, _id: elementId(`${seed}:item${i}`).slice(0, 7) }))
    const sub = (a.items.find((it) => it.subtitleStyle) || {}).subtitleStyle
    const subCss = sub ? `selector .acv-acc-sub{display:block;margin-top:${sub.marginTop === '0px' ? '4px' : sub.marginTop};color:${sub.color};font-size:${sub.fontSize};font-weight:${sub.fontWeight};line-height:${sub.lineHeight}}` : ''
    const children = a.items.map((it, i) => ({
      id: elementId(`${seed}:panel${i}`),
      elType: 'container',
      isInner: true,
      settings: { content_width: 'full', _title: it.title.slice(0, 60) },
      elements: [widget('text-editor', `${seed}:answer${i}`, { editor: this.transformText(it.html), text_color: a.content.color, typography_typography: 'custom', typography_font_size: size(px(a.content.fontSize)), typography_line_height: size(px(a.content.lineHeight)), custom_css: 'selector p{margin:0 0 .75em}selector p:last-child{margin-bottom:0}' + cardsCss(it.cards) })],
    }))
    const settings = {
      items,
      default_state: a.firstOpen ? 'expanded' : 'all_collapsed',
      max_items_expended: a.multiple ? 'multiple' : 'one',
      title_tag: ['h2', 'h3', 'h4', 'h5'].includes(a.titleTag) ? a.titleTag : 'div',
      faq_schema: '', // the page keeps the Main Website's own FAQ structured data
      accordion_item_title_space_between: size(px(a.gap)),
      accordion_item_title_distance_from_content: size(0),
      // The item card's own padding (e.g. p-6 around the question and answer) goes round both the
      // title and the answer; the answer also keeps its distance below the title.
      accordion_padding: sumDims(a.button, a.item),
      content_padding: sumDims(a.content, { ...a.item, paddingTop: a.content.marginTop || '0px' }),
      accordion_border_radius: { unit: 'px', top: String(radius), right: String(radius), bottom: String(radius), left: String(radius), isLinked: true },
      content_border_radius: { unit: 'px', top: '0', right: '0', bottom: String(radius), left: String(radius), isLinked: false },
      title_typography_typography: 'custom',
      title_typography_font_family: fontFamily(a.title.fontFamily),
      title_typography_font_size: size(px(a.title.fontSize)),
      title_typography_font_weight: String(a.title.fontWeight),
      title_typography_line_height: size(px(a.title.lineHeight)),
      normal_title_color: a.title.color,
      hover_title_color: a.title.color,
      active_title_color: a.title.color,
      normal_icon_color: a.title.color,
      active_icon_color: a.title.color,
      // Title across the row, chevron at the end; the open panel has no frame of its own.
      accordion_item_title_position_horizontal: 'stretch',
      accordion_item_title_icon_position: 'end',
      content_border_border: 'none',
      accordion_item_title_icon: { value: 'fas fa-chevron-down', library: 'fa-solid' },
      accordion_item_title_icon_active: { value: 'fas fa-chevron-up', library: 'fa-solid' },
      ...boxSettings(nodes, this.ds, true),
      ...widthSettings(nodes, parents, true),
    }
    if (!isTransparent(a.item.backgroundColor)) {
      for (const state of ['normal', 'hover', 'active']) Object.assign(settings, { [`accordion_background_${state}_background`]: 'classic', [`accordion_background_${state}_color`]: hexColor(a.item.backgroundColor) })
    }
    if (px(a.item.borderTopWidth) > 0) {
      for (const state of ['normal', 'hover', 'active']) Object.assign(settings, { [`accordion_border_${state}_border`]: 'solid', [`accordion_border_${state}_width`]: { unit: 'px', top: String(px(a.item.borderTopWidth)), right: String(px(a.item.borderTopWidth)), bottom: String(px(a.item.borderTopWidth)), left: String(px(a.item.borderTopWidth)), isLinked: true }, [`accordion_border_${state}_color`]: hexColor(a.item.borderTopColor) })
    }
    if (subCss) settings.custom_css = `${settings.custom_css || ''}${subCss}`
    return { id: elementId(seed), elType: 'widget', widgetType: 'nested-accordion', settings, elements: children, isInner: false }
  }

  /** A scrolling logo strip (marquee) -> Elementor's Image Carousel, each logo once, auto-scrolling. */
  carouselWidget(nodes, n, parents, seed) {
    const imgs = []
    const seen = new Set()
    const walkImgs = (x) => { if (x.kind === 'image' && x.attrs.src && !seen.has(x.attrs.src)) { seen.add(x.attrs.src); imgs.push(x) } (x.children || []).forEach(walkImgs) }
    walkImgs(n)
    // Measure from a logo that was actually drawn (one still loading measures 0 x 0).
    const first = imgs.find((x) => x.rect.h > 0) || { rect: { w: 120, h: px(imgs[0].style.height) || 40 } }
    // Logos per row as on the Main Website: the visible width over the strip's average item (each
    // item with its own padding, plus the gap), measured on each device; the first logo alone
    // misjudged strips whose logos differ in width.
    const slideOn = (x) => {
      const items = x && !x.hidden ? (x.children || []).filter((c) => !c.hidden && c.rect.w > 0) : []
      const gap = x ? px(x.style.columnGap) : 0
      return items.length ? items.reduce((sum, c) => sum + c.rect.w, 0) / items.length + gap : first.rect.w + px(n.style.columnGap)
    }
    const perView = (d) => { const x = nodes[d]; const w = parents[d] && !parents[d].hidden ? parents[d].rect.w : (x ? x.rect.w : VIEWPORTS[d]); return String(Math.max(2, Math.min(imgs.length - 1, Math.round(w / Math.max(40, slideOn(x) || slideOn(n)))))) }
    const reverse = /reverse/i.test(n.cls || '') || /reverse/i.test(n.style.animationName || '')
    return widget('image-carousel', seed, {
      carousel: imgs.map((x) => { const m = this.transformImage(x.attrs.src, x.attrs.alt); return { id: m.id, url: m.url, alt: x.attrs.alt || '' } }),
      thumbnail_size: 'full',
      slides_to_show: perView('desktop'),
      slides_to_show_tablet: perView('tablet'),
      slides_to_show_mobile: perView('mobile'),
      slides_to_scroll: '1',
      navigation: 'none',
      autoplay: 'yes',
      autoplay_speed: 0,
      speed: 3000,
      infinite: 'yes',
      pause_on_hover: 'no',
      pause_on_interaction: 'no',
      direction: reverse ? 'rtl' : 'ltr',
      image_spacing: 'custom',
      image_spacing_custom: size(px(n.style.columnGap) || 24),
      link_to: 'none',
      // Logos keep their own height and proportions, as in the strip.
      custom_css: `selector .swiper-slide-image{height:${first.rect.h}px;width:auto;max-width:100%;object-fit:contain;margin:0 auto}selector .swiper-wrapper{transition-timing-function:linear!important}`,
      ...widthSettings(nodes, parents, true),
    })
  }

  htmlWidget(nodes, n, parents, seed) {
    let html = n.html || ''
    if (n.kind === 'svg') {
      // Keep the icon's rendered size and colour (it usually inherits currentColor).
      html = `<span class="acv-icon" style="display:inline-flex;width:${n.rect.w}px;height:${n.rect.h}px;color:${n.style.color}">${html.replace(/<svg/, '<svg width="100%" height="100%"')}</span>`
      if (n.attrs.href && !this.linkDepth) html = `<a href="${this.transformLink(n.attrs.href)}" style="display:inline-flex;color:inherit">${html}</a>`
    }
    // An embedded frame (e.g. a Google map) sized by the Main Website's classes keeps its measured
    // height and corners; without them a frame is the browser's default 150px.
    if (n.kind === 'embed' && /^<iframe/i.test(html) && n.rect.h > 0) {
      const style = `width:100%;height:${Math.round(n.rect.h)}px;border:0;display:block${px(n.style.borderTopLeftRadius) ? `;border-radius:${n.style.borderTopLeftRadius}` : ''}`
      html = html.replace(/\sstyle="[^"]*"/i, '').replace(/^<iframe/i, `<iframe style="${style}"`)
    }
    if (n.kind === 'form') {
      const shortcode = leadFormShortcode(html, this.formType, n.attrs.fieldRows || [])
      if (shortcode) return widget('shortcode', seed, { shortcode, ...boxSettings(nodes, this.ds, true), ...widthSettings(nodes, parents, true) })
      this.notes.push(`form at ${n.attrs.action || '(no action)'} kept as HTML; connect it to the enquiry form`)
    }
    return widget('html', seed, { html, ...boxSettings(nodes, this.ds, true), ...widthSettings(nodes, parents, true) })
  }
}
