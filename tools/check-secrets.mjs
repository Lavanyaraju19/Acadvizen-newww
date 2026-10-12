// Secret guard for this public repository. Never prints a secret: only file, line and kind.
//   node tools/check-secrets.mjs --staged   lines being committed (used by .githooks/pre-commit)
//   node tools/check-secrets.mjs --all      every tracked file (used by .github/workflows/secret-scan.yml)
// A line can be allowed on purpose with the comment "secret-scan: allow" (local-only defaults).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
const mode = process.argv.includes('--all') ? 'all' : 'staged'

// A value is a placeholder or a reference when it reads like one; anything else is treated as real.
const PLACEHOLDER = /^(\$\{|\$[A-Z_]|%[A-Z_]+%|process\.env|<|\*+$|x{3,}|\.\.\.)|your[-_ ]|example|placeholder|change[-_ ]?me|dummy|redacted|not[-_]?set|replace|here$/i
const LOCAL_DEFAULTS = /^(postgres|password|supabase|admin|root|test|secret)$/i
// Made-up values in unit tests and documentation examples (real keys are JWTs or sb_secret_…, caught above).
const TEST_VALUES = /^(service[-_]role|test[-_]|fake|mock|sample|ci[-_])|^[a-z]+(-[a-z]+)+$/i

const RULES = [
  { kind: 'JWT (Supabase key or similar)', re: /eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/ },
  { kind: 'Supabase secret key', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { kind: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/ },
  { kind: 'private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { kind: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { kind: 'Vercel token', re: /\bvercel_[A-Za-z0-9]{20,}|VERCEL_TOKEN\s*=\s*['"]?[A-Za-z0-9]{20,}/ },
  { kind: 'password in a connection URL', re: /postgres(?:ql)?:\/\/[^:\s/'"]+:([^@\s'"]+)@/, value: 1 },
  // A quoted literal assigned to a password-like name (code), or NAME=value (env files, batch "set").
  { kind: 'hard-coded password', re: /(?:password|passwd|pwd)\w*['"]?\s*[:=]\s*['"]([^'"\s]{6,})['"]/i, value: 1 },
  { kind: 'hard-coded password', re: /^\s*(?:export\s+|set\s+)?[A-Z_]*(?:PASSWORD|PASS|PWD)\s*=\s*([^\s'"%$<]{6,})\s*$/i, value: 1 },
  { kind: 'hard-coded service-role / secret key', re: /(?:SERVICE_ROLE_KEY|SECRET_KEY|WEBHOOK_SECRET|API_SECRET)['"]?\s*[:=]\s*['"]([^'"\s]{16,})['"]/, value: 1 },
  { kind: 'hard-coded service-role / secret key', re: /^\s*(?:export\s+|set\s+)?[A-Z_]*(?:SERVICE_ROLE_KEY|SECRET_KEY|WEBHOOK_SECRET|API_SECRET)\s*=\s*([^\s'"%$<]{16,})\s*$/i, value: 1 },
]

function findingsIn(file, lines) {
  const out = []
  for (const { number, text } of lines) {
    if (/secret-scan:\s*allow/.test(text)) continue
    for (const rule of RULES) {
      const m = text.match(rule.re)
      if (!m) continue
      if (rule.value) {
        const value = m[rule.value]
        if (PLACEHOLDER.test(value) || LOCAL_DEFAULTS.test(value) || TEST_VALUES.test(value)) continue
      }
      out.push(`${file}:${number}  ${rule.kind}`)
    }
  }
  return out
}

const isEnvFile = (f) => /(^|\/)\.env(\.|$)/.test(f) && !/\.env\.example/.test(f)
const findings = []

if (mode === 'all') {
  for (const file of git(['ls-files']).split(/\r?\n/).filter(Boolean)) {
    if (isEnvFile(file)) { findings.push(`${file}  environment file is tracked`); continue }
    let buf
    try { buf = fs.readFileSync(file) } catch { continue }
    if (buf.includes(0) || /package-lock\.json$/.test(file)) continue
    findings.push(...findingsIn(file, buf.toString('utf8').split(/\r?\n/).map((text, i) => ({ number: i + 1, text }))))
  }
} else {
  for (const file of git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split(/\r?\n/).filter(Boolean)) {
    if (isEnvFile(file)) { findings.push(`${file}  environment files must never be committed`); continue }
    if (/package-lock\.json$/.test(file)) continue
    const diff = git(['diff', '--cached', '-U0', '--', file])
    const lines = []
    let number = 0
    for (const line of diff.split(/\r?\n/)) {
      const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/)
      if (hunk) { number = Number(hunk[1]); continue }
      if (line.startsWith('+') && !line.startsWith('+++')) lines.push({ number: number++, text: line.slice(1) })
    }
    findings.push(...findingsIn(file, lines))
  }
}

if (findings.length) {
  console.error(`Possible secrets (${findings.length}). Move them to an environment variable or the private credentials file:`)
  for (const f of findings) console.error(`  ${f}`)
  process.exit(1)
}
console.log(`No secrets found (${mode === 'all' ? 'all tracked files' : 'staged changes'}).`)
