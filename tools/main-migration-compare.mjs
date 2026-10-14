#!/usr/bin/env node
/**
 * Compares two route inventories of the Main Website (tools/main-route-inventory.mjs --text):
 * before and after moving pages into WordPress/Elementor. Per address: status, title, description,
 * canonical, robots, H1, structured data, forms, and how much of the original visible text is
 * still on the page.
 *
 *   node tools/main-migration-compare.mjs before.json after.json [--md report.md] [--min-text 1]
 *
 * Exit code 1 when any address fails a check (a lower text coverage than --min-text fails it).
 */
import fs from 'node:fs'

/**
 * Share of the original text lines that appear on the migrated page. Where a line breaks is layout,
 * not content (two buttons side by side read as one line on one page and two on the other), so a
 * line also counts when it appears across the page's lines with the breaks removed.
 */
export function textCoverage(beforeLines = [], afterLines = []) {
  if (!beforeLines.length) return 1
  const haystack = afterLines.join('\n')
  const joined = afterLines.join('')
  return beforeLines.filter((line) => haystack.includes(line) || joined.includes(line)).length / beforeLines.length
}

/** Same text however its characters were written in HTML (&#039; or &#x27; or ', &amp; or &). */
export function sameText(x = '', y = '') {
  const norm = (s) => String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim()
  return norm(x) === norm(y)
}

/** Every check for one address (before → after). */
export function compareRow(b, a, minText = 1) {
  const after = a || { status: 0, title: '', description: '', canonical: '', robots: '', h1: '', json_ld: 0, forms: 0, text: [] }
  const coverage = textCoverage(b.text, after.text)
  // Content visitors did not see before (e.g. a section switched off on Main shown after migration).
  const extraShare = 1 - textCoverage(after.text, b.text)
  const checks = {
    status: after.status === b.status,
    title: sameText(after.title, b.title),
    description: sameText(after.description, b.description),
    canonical: after.canonical === b.canonical,
    robots: (after.robots || '') === (b.robots || ''),
    // Main draws some headings in the browser only (no <h1> in its HTML); the migrated page sending
    // the same visible heading as an <h1> is kept, not a difference.
    h1: sameText(after.h1, b.h1) || (!b.h1 && Boolean(after.h1) && ((b.text || []).some((line) => sameText(line, after.h1)) || sameText(String(b.title || '').split('|')[0], after.h1))),
    json_ld: after.json_ld > 0 || b.json_ld === 0,
    forms: after.forms >= b.forms,
    text: coverage >= minText,
    extra: extraShare <= 0.05,
    // The browser could not read one side (e.g. a timeout): not a pass; read that address again.
    readable: !b.text_unread && !after.text_unread,
  }
  const haystack = (after.text || []).join('\n')
  return {
    path: b.path,
    family: b.family,
    coverage: Math.round(coverage * 1000) / 10,
    extra: Math.round(extraShare * 1000) / 10,
    failed: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name),
    missing: (b.text || []).filter((line) => !haystack.includes(line) && !(after.text || []).join('').includes(line)).slice(0, 3),
    added: (after.text || []).filter((line) => !(b.text || []).join('\n').includes(line) && !(b.text || []).join('').includes(line)).slice(0, 3),
  }
}

function main() {
  const [beforeFile, afterFile, ...rest] = process.argv.slice(2)
  const args = Object.fromEntries(rest.reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []))
  if (!beforeFile || !afterFile) {
    console.log('usage: node tools/main-migration-compare.mjs before.json after.json [--md report.md] [--min-text 1]')
    process.exit(2)
  }
  const minText = args['min-text'] !== undefined ? Number(args['min-text']) : 1
  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'))
  const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'))
  const afterByPath = new Map(after.rows.map((r) => [r.path, r]))
  const rows = before.rows.map((b) => compareRow(b, afterByPath.get(b.path), minText))
  const failing = rows.filter((r) => r.failed.length)
  console.log(`${rows.length} addresses compared; ${rows.length - failing.length} identical on every check, ${failing.length} with differences`)
  const byCheck = {}
  for (const r of failing) for (const f of r.failed) byCheck[f] = (byCheck[f] || 0) + 1
  for (const [name, n] of Object.entries(byCheck)) console.log(`  ${name}: ${n}`)
  if (args.md) {
    const lines = [`Before: ${before.main} at ${before.read_at}; after: ${after.main} at ${after.read_at}. Text kept = share of the original visible text lines still on the page.`, '', '| Path | Family | Text kept | New text | Differences |', '|---|---|---|---|---|']
    for (const r of rows) lines.push(`| \`${r.path}\` | ${r.family} | ${r.coverage}% | ${r.extra}% | ${r.failed.length ? r.failed.join(', ') + (r.missing.length ? ` (missing e.g. "${r.missing[0].slice(0, 60).replace(/\|/g, '\\|')}")` : '') + (r.failed.includes('extra') && r.added.length ? ` (new e.g. "${r.added[0].slice(0, 60).replace(/\|/g, '\\|')}")` : '') : 'none'} |`)
    fs.writeFileSync(String(args.md), lines.join('\n') + '\n')
  }
  process.exitCode = failing.length ? 1 : 0
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tools/main-migration-compare.mjs')) main()
