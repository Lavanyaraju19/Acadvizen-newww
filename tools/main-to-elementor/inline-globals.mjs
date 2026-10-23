/**
 * Writes the Main Website's colour and font values straight into Elementor designs instead of referring to
 * Main entries in Elementor's Site Settings (the kit).
 *
 * The exporter keys a "global" by its value ("Main #CBD5E1", "Main 14/20 400"): one entry per distinct value,
 * not a semantic token. Importing them adds entries to the kit both websites share, and every approval
 * fingerprint includes the kit, so every waiting submission (including other people's) would have to be
 * submitted again. Writing the value in its place renders exactly the same and leaves the kit alone.
 * Only references to the given kit's entries are replaced; any other global (e.g. one of Enrollment's) is kept.
 */

/** Map of kit entry id -> entry, for colours and typography. */
export function kitIndex(kit = {}) {
  const colors = new Map((kit.colors || []).filter((c) => c && c._id).map((c) => [c._id, c]))
  const typography = new Map((kit.typography || []).filter((t) => t && t._id).map((t) => [t._id, t]))
  return { colors, typography }
}

/**
 * One element's settings with its kit references written out. A colour reference "<key>": globals/colors?id=X
 * becomes <key>: <colour>; a typography reference "<prefix>typography_typography": globals/typography?id=X becomes
 * the entry's typography_* fields under <prefix> (e.g. title_typography_font_size). Returns the counts replaced.
 */
export function inlineSettings(settings, index) {
  const counts = { colors: 0, typography: 0 }
  const refs = settings && settings.__globals__
  if (!refs || typeof refs !== 'object') return counts
  for (const [key, ref] of Object.entries(refs)) {
    const m = typeof ref === 'string' && ref.match(/^globals\/(colors|typography)\?id=([A-Za-z0-9_-]+)$/)
    if (!m) continue
    if (m[1] === 'colors' && index.colors.has(m[2])) {
      settings[key] = index.colors.get(m[2]).color
      delete refs[key]
      counts.colors++
    } else if (m[1] === 'typography' && index.typography.has(m[2]) && key.endsWith('typography_typography')) {
      const prefix = key.slice(0, -'typography_typography'.length)
      for (const [field, value] of Object.entries(index.typography.get(m[2]))) {
        if (field.startsWith('typography_')) settings[prefix + field] = value
      }
      delete refs[key]
      counts.typography++
    }
  }
  if (!Object.keys(refs).length) delete settings.__globals__
  return counts
}

/** Every element of an Elementor data tree (and page settings), in place. Returns the counts replaced. */
export function inlineTree(elements, index) {
  const total = { colors: 0, typography: 0 }
  const walk = (list) => {
    for (const el of list || []) {
      if (el && el.settings) {
        const c = inlineSettings(el.settings, index)
        total.colors += c.colors
        total.typography += c.typography
      }
      walk(el && el.elements)
    }
  }
  walk(elements)
  return total
}

/** A bundle's records and templates with the kit's entries written out; the kit itself is emptied. */
export function inlineBundleGlobals(bundle) {
  const index = kitIndex(bundle.kit)
  const total = { colors: 0, typography: 0 }
  for (const item of [...(bundle.records || []), ...(bundle.templates || [])]) {
    const c = inlineTree(item.elementor_data, index)
    total.colors += c.colors
    total.typography += c.typography
    if (item.page_settings) {
      const p = inlineSettings(item.page_settings, index)
      total.colors += p.colors
      total.typography += p.typography
    }
  }
  bundle.kit = {}
  return total
}
