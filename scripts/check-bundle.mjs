/**
 * What the first page load actually costs.
 *
 * The chooser exists so that a machine which cannot run the visual siege has
 * somewhere to go — and so that choosing the text siege costs nothing. That
 * second promise is entirely a property of the *build*: `Shell.jsx` reaches
 * `App.jsx` through a dynamic import, and Vite splits three.js out on the
 * strength of that one `import()`.
 *
 * Which means a single careless static import — in `Chooser.jsx`, in `ui.jsx`,
 * anywhere the chooser can reach — silently pulls the whole engine back into
 * the entry chunk. Nothing would look wrong. The chooser would still render,
 * the siege would still play, every other suite would stay green, and a
 * classroom laptop would be downloading and parsing a megabyte of WebGL in
 * order to be offered a text game.
 *
 * So this reads the built output rather than the source. Run it after
 * `npm run build`.
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const base = new URL('..', import.meta.url).pathname
const dist = base + 'dist/'

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

console.log('\nWhat the first load costs')

let html
try {
  html = await readFile(dist + 'index.html', 'utf8')
} catch {
  console.error('\nNo dist/ to inspect. Run `npm run build` first.')
  process.exit(1)
}

/* ------------------------------------------------------------ the entry */

const entryName = html.match(/assets\/[^"']*\.js/)?.[0]
if (!entryName) {
  console.error('\nCould not find the entry script in dist/index.html.')
  process.exit(1)
}
const entry = await readFile(dist + entryName, 'utf8')
const entryGz = gzipSync(entry, { level: 9 }).length

// Markers picked to be unmistakable and stable: these are three.js class
// names, not our own, so they cannot be spelled away by a rename here.
const THREE_MARKERS = ['WebGLRenderer', 'BufferGeometry', 'PerspectiveCamera']
const found = THREE_MARKERS.filter((m) => entry.includes(m))

check(
  'the chooser does not drag the 3D engine in with it',
  found.length === 0,
  found.length ? `entry chunk contains ${found.join(', ')}` : ''
)

/*
 * A budget, not a measurement. The entry is React, the chooser and the error
 * page; it has no business growing. This is loose enough not to fail on a
 * dependency bump and tight enough that three.js arriving cannot fit under it.
 */
const BUDGET_KB = 110
check(
  `the first load stays under ${BUDGET_KB} kB gzipped`,
  entryGz < BUDGET_KB * 1024,
  `${(entryGz / 1024).toFixed(0)} kB`
)

/* ------------------------------------------------------- the lazy chunk */

const assets = await readdir(dist + 'assets')
let engine = null
for (const file of assets.filter((f) => f.endsWith('.js') && !entryName.endsWith(f))) {
  const body = await readFile(dist + 'assets/' + file, 'utf8')
  if (THREE_MARKERS.every((m) => body.includes(m))) engine = { file, body }
}

check(
  'the 3D engine is in a chunk of its own, fetched only when it is chosen',
  Boolean(engine),
  engine ? engine.file : 'no chunk contains three.js at all'
)

if (engine) {
  const engineGz = gzipSync(engine.body, { level: 9 }).length
  console.log(
    `       (engine chunk ${(engineGz / 1024).toFixed(0)} kB gzipped, ` +
      `deferred until the visual siege is chosen)`
  )
}

/* --------------------------------------------------------- the text game */

for (const path of [
  'text/index.html',
  'text/vendor/react.production.min.js',
  'text/vendor/react-dom.production.min.js',
  'text/vendor/babel.min.js',
  'text/vendor/tailwind.min.js',
]) {
  let size = 0
  try {
    size = (await stat(dist + path)).size
  } catch {
    /* reported below */
  }
  check(`${path} ships`, size > 1000, size ? `${(size / 1024).toFixed(0)} kB` : 'missing')
}

const shipped = await readFile(dist + 'text/index.html', 'utf8')
check(
  'the shipped text game still asks the network for nothing',
  !/https?:\/\//.test(shipped.replace(/<!--[\s\S]*?-->/g, ''))
)

console.log('')
if (failures) {
  console.error(`${failures} bundle check(s) failed`)
  process.exit(1)
}
console.log('The chooser is cheap, and the engine waits to be asked.')
