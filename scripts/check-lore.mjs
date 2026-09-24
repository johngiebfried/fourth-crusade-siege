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
/*
 * No quotations, from anyone.
 *
 * The eyewitness set was removed after it turned out to hold a misattribution,
 * a reversed reading, a conflation of two emperors a year apart and five
 * passages that are in neither chronicle. A paraphrase in quotation form with a
 * name on it is something a student will cite. If quotations ever come back
 * they need a verbatim text and a paragraph reference, and this check will have
 * to be changed on purpose to let them in.
 */
check(
  'no passage is attributed to a writer',
  all.every((e) => !e.source),
  all.filter((e) => e.source).map((e) => `${e.set}[${e.index}] ${e.source}`).join(', ')
)
check(
  'no quotation sets remain',
  !('CHRONICLE' in lore) && !('HELD_BACK' in lore) && !('chronicle' in lore.SETS),
  Object.keys(lore).join(', ')
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
