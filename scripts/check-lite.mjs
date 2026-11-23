#!/usr/bin/env node
// Boundary check for Tauri Starter, the open-source edition.
//
// Every rule reads its data from lite-manifest.json, so this script stays free
// of the words and paths it guards against. It checks the files that git would
// commit (tracked plus untracked, minus .gitignore) and fails when:
//
//   1. a path owned by the commercial edition exists,
//   2. a file listed in the manifest is missing (the manifest is stale),
//   3. a forbidden word appears outside the allowlisted files and JSON keys,
//   4. package.json declares a forbidden dependency,
//   5. src-tauri/Cargo.toml declares a forbidden crate,
//   6. the Tauri CSP allows anything but keywords and local sources,
//   7. a Tauri config enables the updater plugin or updater artifacts,
//   8. gitleaks finds a secret (skip with --skip-secrets when gitleaks is not installed).
//
// Usage: pnpm check:lite [--skip-secrets]

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skipSecrets = process.argv.includes('--skip-secrets')
const manifest = JSON.parse(readFileSync(join(root, 'lite-manifest.json'), 'utf8'))

const BINARY_EXTENSIONS = /\.(png|jpe?g|gif|ico|icns|webp|woff2?|ttf|otf|zip|gz)$/i
const failures = []
const fail = (rule, message) => failures.push(`[${rule}] ${message}`)

const listFiles = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
    .toString('utf8')
    .split('\0')
    .filter((file) => file && existsSync(join(root, file)))

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// `dir/` matches everything below dir; `*` matches within one path segment.
const toPathMatcher = (pattern) => {
  if (pattern.endsWith('/')) return (file) => file.startsWith(pattern)
  const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('[^/]*')}$`)
  return (file) => regex.test(file)
}

const files = listFiles()

// 1. Paths owned by the commercial edition.
for (const pattern of manifest.proPaths) {
  const matches = files.filter(toPathMatcher(pattern))
  for (const file of matches) fail('pro-path', `${file} (matches ${pattern})`)
}

// 2. Manifest freshness.
for (const file of [...manifest.sharedFiles, ...manifest.liteOnlyFiles, ...manifest.generatedFiles]) {
  if (!existsSync(join(root, file))) fail('manifest', `${file} is listed in lite-manifest.json but does not exist`)
}

// 3. Forbidden words.
const allow = manifest.forbiddenWordAllowlist
const wordPattern = new RegExp(manifest.forbiddenWords.map(escapeRegExp).join('|'), 'gi')

const stripAllowedKeys = (text, keys) => {
  const data = JSON.parse(text)
  for (const key of keys) delete data[key]
  return JSON.stringify(data, null, 2)
}

for (const file of files) {
  if (allow.files.includes(file) || BINARY_EXTENSIONS.test(file)) continue
  let text = readFileSync(join(root, file), 'utf8')
  if (text.includes('\0')) continue
  const allowedKeys = allow.jsonKeys[file]
  if (allowedKeys) text = stripAllowedKeys(text, allowedKeys)

  text.split('\n').forEach((line, index) => {
    const found = line.match(wordPattern)
    if (found) fail('word', `${file}:${allowedKeys ? '(json)' : index + 1} contains ${[...new Set(found)].join(', ')}`)
  })
}

// 4. npm dependencies.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const name of Object.keys(pkg[field] ?? {})) {
    if (manifest.forbiddenDependencies.includes(name)) fail('dependency', `package.json ${field} declares ${name}`)
  }
}

// 5. Cargo dependencies. Covers [dependencies], [dev-dependencies], [build-dependencies],
// their target-specific and workspace forms, [dependencies.<name>] tables, and renames
// through `package = "<name>"`. Cargo treats `-` and `_` in crate names as equal.
const normalizeCrate = (name) => name.toLowerCase().replace(/_/g, '-')
const forbiddenCrates = new Set(manifest.forbiddenCargoDependencies.map(normalizeCrate))
const DEPENDENCY_TABLE = /^(?:target\..+\.|workspace\.)?(?:dependencies|dev-dependencies|build-dependencies)$/
const cargoPath = 'src-tauri/Cargo.toml'
let cargoTable = null
let cargoSubtable = false

const checkCrate = (name, lineNumber) => {
  if (forbiddenCrates.has(normalizeCrate(name))) fail('cargo', `${cargoPath}:${lineNumber} declares ${name}`)
}

readFileSync(join(root, cargoPath), 'utf8')
  .split('\n')
  .forEach((raw, index) => {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) return
    const header = line.match(/^\[\[?\s*(.+?)\s*\]\]?$/)
    if (header) {
      const parts = header[1].match(/^(.*)\.(?:"([^"]+)"|([A-Za-z0-9_-]+))$/)
      if (parts && DEPENDENCY_TABLE.test(parts[1])) {
        cargoTable = parts[1]
        cargoSubtable = true
        checkCrate(parts[2] ?? parts[3], index + 1)
      } else {
        cargoTable = header[1]
        cargoSubtable = false
      }
      return
    }
    if (!DEPENDENCY_TABLE.test(cargoTable ?? '')) return
    if (!cargoSubtable) {
      const key = line.match(/^"?([A-Za-z0-9_-]+)"?\s*[.=]/)
      if (key) checkCrate(key[1], index + 1)
    }
    const renamed = line.match(/\bpackage\s*=\s*"([^"]+)"/)
    if (renamed) checkCrate(renamed[1], index + 1)
  })

// 6. Tauri CSP. `csp` may only use keywords and the local schemes in the manifest;
// `devCsp` may additionally reach the local dev server.
const tauriConfPath = 'src-tauri/tauri.conf.json'
const tauriConf = JSON.parse(readFileSync(join(root, tauriConfPath), 'utf8'))
const LOCAL_DEV_SOURCE = /^(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::(?:\d+|\*))?\/?$/

const cspDirectives = (policy) =>
  typeof policy === 'string'
    ? policy
        .split(';')
        .map((part) => part.trim().split(/\s+/))
        .filter(([name]) => name)
    : Object.entries(policy).map(([name, sources]) => [
        name,
        ...(Array.isArray(sources) ? sources : String(sources).split(/\s+/)).filter(Boolean),
      ])

const checkCsp = (key, allowLocalDev) => {
  const policy = tauriConf.app?.security?.[key]
  if (policy == null) {
    if (key === 'csp') fail('csp', `${tauriConfPath} has no app.security.csp`)
    return
  }
  for (const [name, ...sources] of cspDirectives(policy)) {
    for (const source of sources) {
      const isKeyword = /^'[a-z0-9-]+'$/.test(source)
      const isLocalDev = allowLocalDev && LOCAL_DEV_SOURCE.test(source)
      if (!isKeyword && !isLocalDev && !manifest.cspAllowedSources.includes(source)) {
        fail(
          'csp',
          `${key} ${name} allows ${source}; only keywords and ${manifest.cspAllowedSources.join(' ')} are allowed`
        )
      }
    }
  }
}

checkCsp('csp', false)
checkCsp('devCsp', true)

// 7. Tauri updater configuration, in the base config and every platform override.
const findKey = (value, key, path = []) => {
  if (value === null || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([name, child]) => [
    ...(name === key ? [[...path, name].join('.')] : []),
    ...findKey(child, key, [...path, name]),
  ])
}

for (const file of files.filter((name) => /^src-tauri\/tauri(?:\.[^/]+)?\.conf\.json$/.test(name))) {
  const config = JSON.parse(readFileSync(join(root, file), 'utf8'))
  if (config.plugins?.updater !== undefined) fail('tauri-config', `${file} configures plugins.updater`)
  for (const path of findKey(config, 'createUpdaterArtifacts')) fail('tauri-config', `${file} sets ${path}`)
}

// 8. Secrets.
if (skipSecrets) {
  console.warn('check:lite: secret scan skipped (--skip-secrets)')
} else if (spawnSync('gitleaks', ['version'], { stdio: 'ignore' }).status !== 0) {
  fail('secrets', 'gitleaks is not installed; install it (https://github.com/gitleaks/gitleaks) or pass --skip-secrets')
} else {
  const staging = mkdtempSync(join(tmpdir(), 'check-lite-'))
  try {
    for (const file of files) {
      mkdirSync(dirname(join(staging, file)), { recursive: true })
      copyFileSync(join(root, file), join(staging, file))
    }
    const scan = spawnSync('gitleaks', ['dir', staging, '--no-banner', '--redact', '--exit-code', '1'], {
      stdio: 'inherit',
    })
    if (scan.status !== 0) fail('secrets', 'gitleaks reported findings (see output above)')
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

if (failures.length > 0) {
  console.error(`check:lite failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(`check:lite passed (${files.length} files checked)`)
