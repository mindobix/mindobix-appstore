#!/usr/bin/env node
// Uploads dist artifacts to the GitHub Release for the current package
// version tag (e.g. v1.0.0). Creates the release if needed.
// Requires: gh CLI authenticated with write access to mindobix/mindobix-appstore.

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO = 'mindobix/mindobix-appstore'
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
)
const tag = `v${pkg.version}`
const DIST_DIR = path.join(__dirname, '..', 'dist')

const artifacts = fs
  .readdirSync(DIST_DIR)
  .filter(f =>
    ['.dmg', '.exe', '.AppImage'].some(ext => f.endsWith(ext)) &&
    !f.includes('blockmap')
  )
  .map(f => path.join(DIST_DIR, f))

if (artifacts.length === 0) {
  console.error('No artifacts found in dist/ — run a dist:* command first.')
  process.exit(1)
}

// Create the release if it doesn't already exist
let exists = false
try {
  execSync(`gh release view ${tag} --repo ${REPO}`, { stdio: 'ignore' })
  exists = true
} catch (_) {}

if (!exists) {
  console.log(`Creating GitHub release ${tag}...`)
  execSync(
    `gh release create ${tag} --title "Mindobix App Store ${tag}" --notes "Release ${tag}" --repo ${REPO}`,
    { stdio: 'inherit' }
  )
}

// Upload (overwrite if already there)
console.log(`Uploading to ${tag}:`)
for (const f of artifacts) {
  console.log(`  ${path.basename(f)}`)
}
execSync(
  `gh release upload ${tag} ${artifacts.map(f => `"${f}"`).join(' ')} --clobber --repo ${REPO}`,
  { stdio: 'inherit' }
)

console.log(`\nDone: https://github.com/${REPO}/releases/tag/${tag}`)
