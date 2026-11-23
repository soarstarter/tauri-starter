// Points git at the versioned hooks in .githooks/ (runs on `pnpm install`).
// No-op outside a git checkout and in CI.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (!process.env.CI && existsSync(join(root, '.git'))) {
  try {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root, stdio: 'ignore' })
  } catch {
    // git is unavailable; hooks are a convenience, so skip silently.
  }
}
