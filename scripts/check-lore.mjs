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
check(
  'the general sets carry no false attribution',
  ['siegecraft', 'walls', 'city', 'aftermath', 'fleet'].every((k) =>
    lore.SETS[k].every((e) => !e.source)
  )
)
check('no passage appears in two sets', new Set(all.map((e) => e.text)).size === all.length)

// The picker must exhaust a set before repeating, or a class sees the same
// line twice in one sitting and never sees a third of them.
{
  const n = lore.SIEGECRAFT.length
  const seen = new Set()
  for (let i = 0; i < n; i++) seen.add(lore.pickLore('siegecraft').text)
  check('a set is exhausted before anything repeats', seen.size === n, `${seen.size} of ${n}`)
  check('the picker keeps going once a set is used up', Boolean(lore.pickLore('siegecraft')))
  check('an unknown set returns nothing rather than throwing', lore.pickLore('nope') === null)
}

console.log('')
if (failures) {
  console.error(`${failures} lore check(s) failed`)
  process.exit(1)
}
console.log('The textbook holds.')
