/**
 * The text game that ships, against the text game that is the authority.
 *
 * `reference/original-index.html` is the original Fourth Crusade siege app,
 * vendored unchanged. It is the authority for the dice: `check-oracle.mjs`
 * runs its two roll routines beside the port's on identical dice and compares
 * them roll for roll. Nothing in this project is allowed to edit it.
 *
 * But it cannot be served as it stands. It pulls React, ReactDOM,
 * @babel/standalone and Tailwind from two CDNs on every page load — about 730
 * kilobytes over the wire from three third-party hosts — so a classroom
 * without wi-fi gets a blank page. That is exactly the failure the font file
 * was brought in-repo to avoid.
 *
 * So `public/text/index.html` is a copy with those four URLs pointed at local
 * copies, and nothing else changed. "Nothing else changed" is a claim, and an
 * unchecked claim about two copies of a file is a promise to let them drift.
 * This asserts it: undo the four swaps and strip the added comment, and the
 * two files must be byte-identical.
 */

import { readFile } from 'node:fs/promises'

const base = new URL('..', import.meta.url).pathname

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

console.log('\nThe shipped text game against the original')

const original = await readFile(base + 'reference/original-index.html', 'utf8')
const shipped = await readFile(base + 'public/text/index.html', 'utf8')

/** The four substitutions that are allowed, and the only ones. */
const SWAPS = [
  ['https://unpkg.com/react@18/umd/react.production.min.js', 'vendor/react.production.min.js'],
  ['https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', 'vendor/react-dom.production.min.js'],
  ['https://unpkg.com/@babel/standalone/babel.min.js', 'vendor/babel.min.js'],
  ['https://cdn.tailwindcss.com', 'vendor/tailwind.min.js'],
]

// Put the shipped copy back the way it came, then compare.
let restored = shipped.replace(/<!--\n {2}The original text game[\s\S]*?-->\n/, '')
for (const [remote, local] of SWAPS) {
  check(`the shipped copy uses the local ${local.replace('vendor/', '')}`, shipped.includes(local))
  restored = restored.split(local).join(remote)
}

check(
  'nothing but those four script sources has been changed',
  restored === original,
  restored.length === original.length
    ? 'same length, different content'
    : `${restored.length} bytes against the original's ${original.length}`
)

check(
  'the shipped copy fetches nothing over the network',
  !/https?:\/\//.test(shipped.replace(/<!--[\s\S]*?-->/g, '')),
  (shipped.replace(/<!--[\s\S]*?-->/g, '').match(/https?:\/\/[^"'\s]+/g) ?? []).join(', ')
)

// The vendored scripts have to actually be there, and be the libraries they
// claim to be rather than a CDN error page saved with the right filename.
const VENDOR = [
  ['react.production.min.js', 'createElement', 8000],
  ['react-dom.production.min.js', 'createRoot', 80000],
  ['babel.min.js', 'transform', 500000],
  ['tailwind.min.js', 'tailwind', 100000],
]
for (const [file, marker, least] of VENDOR) {
  let body = ''
  try {
    body = await readFile(base + 'public/text/vendor/' + file, 'utf8')
  } catch {
    /* reported below */
  }
  check(
    `vendor/${file} is present and is what it says it is`,
    body.length > least && body.includes(marker),
    body.length ? `${body.length} bytes, marker ${body.includes(marker)}` : 'missing'
  )
}

console.log('')
if (failures) {
  console.error(`${failures} text-version check(s) failed`)
  process.exit(1)
}
console.log('The text game ships as it was written, and offline.')
