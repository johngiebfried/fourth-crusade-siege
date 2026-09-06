/**
 * Differential test: this port against the original game, roll for roll.
 *
 * Every other suite here tests *my reading* of the rules. That is the wrong
 * thing to test. The brief was to preserve the dice logic of the original
 * `index.html` exactly, so the only test that actually proves it is one that
 * runs the original code beside the port on the same dice and compares the
 * output. A misreading would otherwise be enshrined by its own test.
 *
 * How it works. Both implementations call a bare `rollDice()`. Neither can be
 * monkey-patched from outside — in the original it is a closure variable, in
 * the port an ESM binding — so instead both function *sources* are extracted
 * as text and evaluated in one sandbox that supplies a single shared, seeded
 * `rollDice`. Same stream of dice into both, then the queues are compared item
 * by item.
 *
 * The original lives in `reference/original-index.html`, vendored unchanged.
 * It is the authority. If this ever fails, the port is wrong.
 */

import fs from 'node:fs'
import path from 'node:path'

const base = new URL('..', import.meta.url).pathname
const chars = JSON.parse(fs.readFileSync(path.join(base, 'src/data/characters.json'), 'utf8'))
const original = fs.readFileSync(path.join(base, 'reference/original-index.html'), 'utf8')
const port = fs.readFileSync(path.join(base, 'src/game/rules.js'), 'utf8')

/* ------------------------------------------------------ source extraction */

/**
 * Pull `const NAME = (...) => { ... }` out of a blob by brace-matching from
 * the arrow. Regexes cannot do this: the bodies contain braces in template
 * literals and object literals.
 */
function extractArrowConst(src, name) {
  const start = src.indexOf(`const ${name} = (`)
  if (start === -1) throw new Error(`cannot find ${name}`)
  const bodyStart = src.indexOf('{', src.indexOf('=>', start))
  let depth = 0
  let inStr = null
  for (let i = bodyStart; i < src.length; i++) {
    const c = src[i]
    const prev = src[i - 1]
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') inStr = c
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return src.slice(start, i + 1)
    }
  }
  throw new Error(`unbalanced body for ${name}`)
}

const originalLand = extractArrowConst(original, 'addLandAttackRolls')
const originalSea = extractArrowConst(original, 'addSeaAttackRolls')

// The port declares the same two as exported arrow consts. Strip `export`
// so the same extractor works, and take `formShips` too, which the port
// factored out of the sea routine.
const portSrc = port.replace(/^export /gm, '')
const portLand = extractArrowConst(portSrc, 'addLandAttackRolls')
const portSea = extractArrowConst(portSrc, 'addSeaAttackRolls')
const portShips = extractArrowConst(portSrc, 'formShips')

/* ------------------------------------------------------------- the sandbox */

/** Deterministic dice. Both sides draw from one stream, in the same order. */
function makeDice(seed) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return (s % 6) + 1
  }
}

function buildRunner(sources) {
  // eslint-disable-next-line no-new-func
  return new Function(
    'rollDice',
    'MAX_PASSENGERS_PER_SHIP',
    'canCaptain',
    `${sources.join('\n')}
     return { addLandAttackRolls, addSeaAttackRolls }`
  )
}

const canCaptain = (p) => p.faction === 'Venetian' || p.name === 'Oberto II of Biandrate'

const runOriginal = buildRunner([originalLand, originalSea])
const runPort = buildRunner([portShips, portLand, portSea])

/* ------------------------------------------------------------ comparison */

/**
 * Compare only what the dice logic decides. The two differ deliberately in
 * their announcement copy — the port drops the original's emoji headers and
 * carries faction and fama on each entry for the 3D layer — so the comparison
 * is over the roll items, which are the rules.
 */
const ROLL_KEYS = [
  'type',
  'stage',
  'playerId',
  'player',
  'roll',
  'bonus',
  'total',
  'threshold',
  'success',
  'message',
  'enteredCity',
  'shipSunk',
]

const rollsOf = (queue) =>
  queue
    .filter((q) => q.type === 'roll')
    .map((q) => {
      const out = {}
      for (const k of ROLL_KEYS) if (q[k] !== undefined) out[k] = q[k]
      return out
    })

let failures = 0
const report = (label, a, b, seed, n) => {
  const ja = JSON.stringify(a)
  const jb = JSON.stringify(b)
  if (ja === jb) return true
  failures++
  if (failures <= 3) {
    console.log(`  FAIL ${label} — seed ${seed}, ${n} attackers`)
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
        console.log(`    original: ${JSON.stringify(a[i])}`)
        console.log(`    port:     ${JSON.stringify(b[i])}`)
        break
      }
    }
  }
  return false
}

console.log('\nDifferential: the port against the original, on identical dice')

let landCompared = 0
let seaCompared = 0
let landRolls = 0
let seaRolls = 0

for (let seed = 1; seed <= 3000; seed++) {
  const n = 1 + (seed % 14)
  // A deterministic shuffle, so both sides get exactly the same roster.
  const pickDice = makeDice(seed * 7919)
  const pool = [...chars]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (pickDice() * pickDice() * (i + 1)) % (i + 1)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const attackers = pool.slice(0, n).map((c) => ({ ...c }))

  // Land. The original sorts its attackers before calling; both are handed
  // the same already-sorted list so the comparison is of the routine itself.
  const sorted = [...attackers].sort((a, b) => b.fama - a.fama)
  {
    const qa = []
    const qb = []
    runOriginal(makeDice(seed), 3, canCaptain).addLandAttackRolls(qa, sorted)
    runPort(makeDice(seed), 3, canCaptain).addLandAttackRolls(qb, sorted)
    const ra = rollsOf(qa)
    const rb = rollsOf(qb)
    landRolls += ra.length
    if (report('land', ra, rb, seed, n)) landCompared++
  }

  // Sea.
  {
    const qa = []
    const qb = []
    runOriginal(makeDice(seed + 500000), 3, canCaptain).addSeaAttackRolls(qa, attackers)
    runPort(makeDice(seed + 500000), 3, canCaptain).addSeaAttackRolls(qb, attackers)
    const ra = rollsOf(qa)
    const rb = rollsOf(qb)
    seaRolls += ra.length
    if (report('sea', ra, rb, seed, n)) seaCompared++
  }
}

console.log(`  land: ${landCompared}/3000 rounds identical (${landRolls} rolls compared)`)
console.log(`  sea:  ${seaCompared}/3000 rounds identical (${seaRolls} rolls compared)`)

if (landRolls === 0 || seaRolls === 0) {
  console.error('\nThe comparison ran but compared nothing — extraction is broken.')
  process.exit(1)
}
if (failures) {
  console.error(`\n${failures} round(s) diverged from the original. The port is wrong.`)
  process.exit(1)
}
console.log('\nThe port matches the original, roll for roll.')
