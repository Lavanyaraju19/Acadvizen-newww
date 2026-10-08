/**
 * Helpers for working with Elementor element JSON (search, text/link substitution, replacement).
 */
import { elementId } from './convert.mjs'

export function walk(elements, fn, parent = null) {
  for (const el of elements) {
    fn(el, parent)
    walk(el.elements || [], fn, el)
  }
}

export const widgetText = (el) => {
  const s = el.settings || {}
  return String(s.title || s.editor || s.text || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
}

export function textsOf(el) {
  const out = []
  walk([el], (x) => { if (x.elType === 'widget') out.push(widgetText(x)) })
  return out.filter(Boolean)
}

/** Replaces visible text (exact, case-sensitive) in text-bearing widgets. */
export function replaceText(elements, from, to) {
  if (!from) return 0
  const variants = [from, from.replace(/&/g, '&amp;')]
  let n = 0
  walk(elements, (el) => {
    const s = el.settings || {}
    for (const key of ['title', 'editor', 'text']) {
      if (typeof s[key] !== 'string') continue
      for (const v of variants) {
        if (s[key].includes(v)) {
          s[key] = s[key].split(v).join(to)
          n++
        }
      }
    }
  })
  return n
}

export function replaceLinks(elements, predicate, url) {
  walk(elements, (el) => {
    const s = el.settings || {}
    if (s.link && predicate(s.link.url || '')) s.link = { ...s.link, url }
    if (typeof s.editor === 'string') s.editor = s.editor.replace(/href="([^"]*)"/g, (m, h) => (predicate(h) ? `href="${url}"` : m))
  })
}

export function findContainer(elements, predicate) {
  let found = null
  walk(elements, (el, parent) => { if (!found && el.elType === 'container' && predicate(el, parent)) found = { el, parent } })
  return found
}

/** The innermost container matching the predicate. */
export function findDeepestContainer(elements, predicate) {
  let found = null
  walk(elements, (el, parent) => { if (el.elType === 'container' && predicate(el, parent)) found = { el, parent } })
  return found
}

/** A widget taking a container's place (e.g. a loop for a card grid) keeps its outer margins. */
export function keepMargins(target, replacement) {
  const list = [].concat(replacement)
  if (list.length !== 1 || !target || target.elType !== 'container' || !list[0] || list[0].elType !== 'widget') return
  for (const d of ['', '_tablet', '_mobile']) {
    if (target.settings && target.settings[`margin${d}`] && !list[0].settings[`_margin${d}`]) list[0].settings[`_margin${d}`] = target.settings[`margin${d}`]
  }
}

export function replaceElement(elements, target, replacement) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i] === target) {
      keepMargins(target, replacement)
      elements.splice(i, 1, ...[].concat(replacement))
      return true
    }
    if (replaceElement(elements[i].elements || [], target, replacement)) return true
  }
  return false
}

export function shortcodeWidget(seed, shortcode, extra = {}) {
  return { id: elementId(seed), elType: 'widget', widgetType: 'shortcode', settings: { shortcode, ...extra }, elements: [], isInner: false }
}

export function textWidget(seed, html, extra = {}) {
  return { id: elementId(seed), elType: 'widget', widgetType: 'text-editor', settings: { editor: html, ...extra }, elements: [], isInner: false }
}
