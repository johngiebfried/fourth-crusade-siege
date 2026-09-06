/**
 * The textbook of the day holds together.
 *
 * Passages get edited far more often than code does, and a set that has gone
 * empty or an entry that has lost its attribution is invisible until it is on
 * a projector in front of a class.
 */

const base = new URL('..', import.meta.url).pathname
const lore = await import(base + 'src/game/lore.js')

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' \u2014 ' + detail : ''}`)
  }
}

const all = lore.allLore()
console.log(`\n${all.length} passages across ${Object.keys(lore.SETS).length} sets`)

for (const [name, set] of Object.entries(lore.SETS)) {
  check(`${name}: enough entries not to repeat in a session`, set.length >= 5, `${set.length}`)
}

check(
  'no passage is empty',
  all.every((e) => typeof e.text === 'string' && e.text.trim().length > 20)
)
check(
  'no passage runs long enough to stop the game',
  all.every((e) => e.text.length <= 300),
  all.filter((e) => e.text.length > 300).map((e) => `${e.set}[${e.index}]`).join(', ')
)
check(
  'every passage in the chronicle set names who said it',
  lore.CHRONICLE.every((e) => e.source && e.source.length > 3)
)

// The set that plays during the siege is the two men who watched the siege.
// Choniates and the rest are about the sack, and a passage about mules in the
// Hagia Sophia answers a question nobody has asked yet.
check(
  'only the two eyewitnesses of the siege are in rotation',
  lore.CHRONICLE.every((e) => /Villehardouin|Robert of Clari/.test(e.source)),
  [...new Set(lore.CHRONICLE.map((e) => e.source))].join(' / ')
)
check(
  'both of them are represented',
  lore.CHRONICLE.some((e) => /Villehardouin/.test(e.source)) &&
    lore.CHRONICLE.some((e) => /Clari/.test(e.source))
)
check(
  'the sack passages are written but out of the picker\'s reach',
  lore.HELD_BACK.sack.length >= 5 && !Object.keys(lore.SETS).includes('sack')
)
check(
  'the general sets carry no false attribution',
  ['siegecraft', 'walls', 'city', 'aftermath', 'fleet'].every((k) =>
    lore.SETS[k].every((e) => !e.source)
  )
)
// The gloss under a failed roll has to match the lane the student just watched.
{
  for (const set of ['siegecraft', 'walls']) {
    check(
      `${set}: every passage says which lane it belongs to`,
      lore.SETS[set].every((e) => ['land', 'sea', 'both'].includes(e.lane)),
      lore.SETS[set].filter((e) => !e.lane).length + ' untagged'
    )
  }
  for (const lane of ['land', 'sea']) {
    for (const set of ['siegecraft', 'walls']) {
      const fits = lore.SETS[set].filter((e) => e.lane === lane || e.lane === 'both')
      check(`${set}: enough passages fit the ${lane} lane`, fits.length >= 4, `${fits.length}`)
      // Drawn a hundred times, nothing from the other lane may come back.
      lore.resetLore()
      const drawn = new Set()
      for (let i = 0; i < 100; i++) drawn.add(lore.pickLore(set, { lane }).lane)
      check(
        `${set}: the ${lane} lane never draws a ${lane === 'land' ? 'sea' : 'land'} passage`,
        !drawn.has(lane === 'land' ? 'sea' : 'land'),
        [...drawn].join(',')
      )
    }
  }
}

check('no passage appears in two sets', new Set(all.map((e) => e.text)).size === all.length)

// The picker must exhaust a set before repeating, or a class sees the same
// line twice in one sitting and never sees a third of them.
lore.resetLore()
{
  // `city` rather than `siegecraft`: the lane checks above have already drawn
  // from the tagged sets, and this has to start from an untouched history.
  const n = lore.CITY.length
  const drawn = new Set()
  for (let i = 0; i < n; i++) drawn.add(lore.pickLore('city').text)
  check('a set is exhausted before anything repeats', drawn.size === n, `${drawn.size} of ${n}`)
  check('the picker keeps going once a set is used up', Boolean(lore.pickLore('city')))
  check('an unknown set returns nothing rather than throwing', lore.pickLore('nope') === null)

  // Each lane keeps its own history, so exhausting one does not wipe the other.
  lore.resetLore()
  const landSeen = new Set()
  const landFits = lore.SIEGECRAFT.filter((e) => e.lane !== 'sea').length
  for (let i = 0; i < landFits; i++) landSeen.add(lore.pickLore('siegecraft', { lane: 'land' }).text)
  check('a lane exhausts its own passages before repeating', landSeen.size === landFits,
    `${landSeen.size} of ${landFits}`)
}

console.log('')
if (failures) {
  console.error(`${failures} lore check(s) failed`)
  process.exit(1)
}
console.log('The textbook holds.')
