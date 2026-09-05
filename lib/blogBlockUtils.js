export function buildTocFromBlocks(blocks = []) {
  return blocks
    .map((block, index) => {
      if (block.block_type !== 'heading') return null
      const text = String(block.content_json?.text || '').trim()
      if (!text) return null
      // Fallback id must match BlogBlocksRenderer's own fallback (`block-${index}`) for the
      // same block - otherwise a TOC link built here points at an id nothing on the page has,
      // and clicking it silently does nothing.
      return {
        id: block.id || `block-${index}`,
        title: text,
      }
    })
    .filter(Boolean)
}

export function estimateReadingMinutes({ text = '', blocks = [] }) {
  const wordsFromText = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const wordsFromBlocks = blocks
    .map((block) => {
      const json = block.content_json || {}
      if (block.block_type === 'list' && Array.isArray(json.items)) return json.items.join(' ')
      return [json.text, json.caption, json.alt, json.author, json.label].filter(Boolean).join(' ')
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

  const total = wordsFromText + wordsFromBlocks
  return Math.max(1, Math.ceil(total / 220))
}
