// Builds the WordPress plugin ZIP (wordpress/acadvizen-cms) from a commit, reproducibly, and verifies it.
//   node tools/build-cms-plugin.mjs            (the plugin as of HEAD)
//   node tools/build-cms-plugin.mjs <commit>
//   node tools/build-cms-plugin.mjs --worktree (current plugin files, via a temporary Git index)
// Output: dist/acadvizen-cms-<version>-<commit>/acadvizen-cms.zip (dist/ is git-ignored), where
// <commit> is the last commit that changed wordpress/acadvizen-cms, or the worktree tree hash prefix.
// Files keep repository line endings and every entry uses the base commit date, not build time.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const git = (...args) => execFileSync('git', args, { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
const text = (...args) => git(...args).toString('utf8').trim()
const sha256 = (data) => createHash('sha256').update(data).digest('hex')
const worktreeBuild = process.argv[2] === '--worktree'
let temporaryIndexDirectory

try {
  let sourceTree
  let sourceLabel
  let commit
  let source

  if (worktreeBuild) {
    temporaryIndexDirectory = mkdtempSync(join(tmpdir(), 'acv-cms-build-'))
    process.env.GIT_INDEX_FILE = join(temporaryIndexDirectory, 'index')
    git('read-tree', 'HEAD')
    git('add', '-A', '--', 'wordpress/acadvizen-cms')
    sourceTree = text('write-tree')
    commit = text('log', '-1', '--format=%h')
    sourceLabel = `worktree-${sourceTree.slice(0, 12)}`
    source = `${sourceTree}:wordpress/acadvizen-cms`
  } else {
    // The last commit that changed the plugin: later commits touching other files give the same package.
    commit = text('log', '-1', '--format=%h', process.argv[2] || 'HEAD', '--', 'wordpress/acadvizen-cms')
    sourceTree = commit
    sourceLabel = commit
    source = `${commit}:wordpress/acadvizen-cms`
  }

  const versionSource = worktreeBuild ? readFileSync('wordpress/acadvizen-cms/acadvizen-cms.php', 'utf8') : text('show', `${commit}:wordpress/acadvizen-cms/acadvizen-cms.php`)
  const version = (versionSource.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1]
  if (!version) throw new Error('Plugin VERSION not found in acadvizen-cms.php')
  const outDir = `dist/acadvizen-cms-${version}-${sourceLabel}`
  const zip = `${outDir}/acadvizen-cms.zip`
  mkdirSync(outDir, { recursive: true })
  git('-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'archive', '--format=zip', '--prefix=acadvizen-cms/',
    `--mtime=${text('log', '-1', '--format=%cI', commit)}`, '-o', zip, source)

  // Verify: every file in the ZIP is byte-identical to its source tree, nothing else is included.
  const expected = new Map(text('ls-tree', '-r', '--name-only', sourceTree, 'wordpress/acadvizen-cms').split('\n')
    .map((path) => [path.replace(/^wordpress\//, ''), sha256(git('show', `${sourceTree}:${path}`))]))
  const data = readFileSync(zip)
  const found = new Map()
  for (let at = data.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])), entries = data.readUInt16LE(at + 10), cd = data.readUInt32LE(at + 16), i = 0; i < entries; i++) {
    const method = data.readUInt16LE(cd + 10), size = data.readUInt32LE(cd + 20), nameLen = data.readUInt16LE(cd + 28)
    const name = data.toString('utf8', cd + 46, cd + 46 + nameLen), local = data.readUInt32LE(cd + 42)
    const start = local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28)
    if (!name.endsWith('/')) {
      const raw = data.subarray(start, start + size)
      found.set(name, sha256(method === 8 ? inflateRawSync(raw) : raw))
    }
    cd += 46 + nameLen + data.readUInt16LE(cd + 30) + data.readUInt16LE(cd + 32)
  }

  const problems = [
    ...[...expected].filter(([name, hash]) => found.get(name) !== hash).map(([name]) => `missing or different: ${name}`),
    ...[...found.keys()].filter((name) => !expected.has(name)).map((name) => `unexpected: ${name}`),
    ...[...found.keys()].filter((name) => /(^|\/)\.env|\.(sql|log|zip)$|secret|dump|backup/i.test(name)).map((name) => `forbidden: ${name}`),
  ]
  if (!found.has('acadvizen-cms/acadvizen-cms.php')) problems.push('acadvizen-cms/acadvizen-cms.php is not at the expected place')
  if (problems.length) {
    throw new Error(`ZIP verification failed:\n  ${problems.join('\n  ')}`)
  }
  console.log(`commit   ${commit}\nsource   ${sourceTree}${worktreeBuild ? ' (current plugin worktree)' : ''}\nversion  ${version}\nzip      ${zip}\nsize     ${statSync(zip).size} bytes\nsha256   ${sha256(data)}\nfiles    ${found.size}, all byte-identical to source`)
} finally {
  if (temporaryIndexDirectory) rmSync(temporaryIndexDirectory, { recursive: true, force: true })
}
