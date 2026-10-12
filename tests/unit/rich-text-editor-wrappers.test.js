import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// A click inside a <label> also clicks the label's first button. For a RichTextEditor that is the
// Bold button, so every click into the text toggled bold and swallowed the first letter typed.
const root = fileURLToPath(new URL('../../app/', import.meta.url))

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(jsx|tsx|js)$/.test(entry.name) ? [full] : []
  })
}

test('no admin screen puts a RichTextEditor inside a <label>', () => {
  const offenders = []
  for (const file of sourceFiles(root)) {
    const source = fs.readFileSync(file, 'utf8')
    if (!source.includes('<RichTextEditor')) continue
    const tags = source.matchAll(/<(\/?)label\b[^>]*?(\/?)>|<RichTextEditor\b/g)
    let open = 0
    for (const tag of tags) {
      if (tag[0].startsWith('<RichTextEditor')) {
        if (open > 0) offenders.push(path.relative(root, file))
      } else if (tag[2] !== '/') {
        open += tag[1] === '/' ? -1 : 1
      }
    }
  }
  assert.deepEqual(offenders, [])
})
