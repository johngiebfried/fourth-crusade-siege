/**
 * The round boundary.
 *
 * A siege runs up to two assaults, and the second goes back through the setup
 * screens — which rebuild the player list from the roster. That makes the round
 * boundary the one place where the whole siege's results can silently vanish,
 * and they did.
 *
 * Round two blanked `status` and `wallRoll`, and rebuilt fama from a roster
 * last written before round one had rolled a single die. So every crusader
 * arrived at the sack order marked "Outside the walls" — the one distinction
 * the sack order exists to make — the shipwrecked were no longer shipwrecked,
 * and both fama penalties were quietly refunded.
 *
 * Nothing caught it. Every suite here tested a screen or a die in isolation,
 * and the fault was in the seam between two rounds. It took playing a whole
 * siege through to the end and reading the final list.
 *
 * So the two halves of that seam are pure functions now, `carryRound` and
 * `enlist` in `game/siege.js`, and this asserts what each is for.
 */

const base = new URL('..', import.meta.url).pathname
const { carryRound, enlist } = await import(base + 'src/game/siege.js')

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

console.log('\nWhat a round remembers')

// The end of a round one that actually happened: a man left on the walls, a
// man whose ship went down, a man who sat it out, and a man who just failed.
const afterRoundOne = [
  {
    id: 1, name: 'On the walls', fama: 7, status: 'walls', wallRoll: 5,
    attackChoice: 'land', stage: 3, shipId: null, rollHistory: [{ roll: 5 }],
  },
  {
    id: 2, name: 'Shipwrecked', fama: 6, status: 'shipwrecked',
    attackChoice: 'sea', stage: 1, shipId: 2, rollHistory: [{ roll: 1 }],
  },
  {
    id: 3, name: 'Sat it out', fama: 9, status: 'ready',
    attackChoice: 'sit_out', stage: 0, shipId: null, rollHistory: [],
  },
  {
    id: 4, name: 'Failed', fama: 4, status: 'ready',
    attackChoice: 'land', stage: 1, shipId: null, rollHistory: [{ roll: 2 }],
  },
]

const carried = carryRound(afterRoundOne)
const of = (list, n) => list.find((p) => p.name === n)

// The manual's rule: a failed first assault costs everyone who joined it a
// point, and refusing it costs nothing. (The original app had it backwards.)
check(
  'a failed first assault costs each man who joined it 1 fama, and the refuser nothing',
  of(carried, 'Sat it out').fama === 9 &&
    of(carried, 'On the walls').fama === 6 &&
    of(carried, 'Failed').fama === 3,
  carried.map((p) => `${p.name} ${p.fama}`).join(', ')
)
check(
  'nobody is still assigned to a wall once the round is over',
  carried.every((p) => p.attackChoice === null)
)

// Round two enlists them again. This is where it was all being lost.
const roundTwo = carried.map((p) => enlist(p, p.name === 'Sat it out' ? 'sit_out' : 'land'))

check(
  'reaching the walls in round one still counts in round two',
  of(roundTwo, 'On the walls').status === 'walls' && of(roundTwo, 'On the walls').wallRoll === 5,
  `status ${of(roundTwo, 'On the walls').status}, roll ${of(roundTwo, 'On the walls').wallRoll}`
)
check('a shipwreck in round one is still a shipwreck', of(roundTwo, 'Shipwrecked').status === 'shipwrecked')
check(
  'fama carries across the round rather than being refunded',
  of(roundTwo, 'Failed').fama === 3 && of(roundTwo, 'On the walls').fama === 6,
  `${of(roundTwo, 'Failed').fama}, ${of(roundTwo, 'On the walls').fama}`
)
check('a man who never got anywhere is still ready', of(roundTwo, 'Failed').status === 'ready')

// And the per-round fields genuinely do reset, or round two would begin with
// everyone standing where round one left them.
check(
  'where a man is attacking, and how far he climbed, do reset',
  roundTwo.every((p) => p.stage === 0 && p.shipId === null) &&
    of(roundTwo, 'On the walls').attackChoice === 'land',
  roundTwo.map((p) => `${p.name} stage ${p.stage}`).join(', ')
)

// The history is copied, not shared. The resolver pushes onto it in place, so
// a shared array would write round two's rolls into round one's record.
const before = of(carried, 'On the walls').rollHistory.length
of(roundTwo, 'On the walls').rollHistory.push({ roll: 6 })
check(
  'a new round does not write back into the last one',
  of(carried, 'On the walls').rollHistory.length === before,
  `${of(carried, 'On the walls').rollHistory.length} against ${before}`
)

console.log('')
if (failures) {
  console.error(`${failures} round-boundary check(s) failed`)
  process.exit(1)
}
console.log('The siege remembers its first round.')
