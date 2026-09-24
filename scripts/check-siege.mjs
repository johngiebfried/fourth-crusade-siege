/**
 * Whole sieges, played through, held to the Instructor's Manual.
 *
 * Every other suite here tests a piece: the dice against the original, a
 * stage's thresholds, a camera, a ladder. Two faults survived all of them for
 * the whole life of the project, because both lived in what happens *after*
 * the dice — in the step that turns a round of rolls into who got where and
 * who picks first in the sack:
 *
 * - When a ship sank, only its captain was marked. The passengers kept their
 *   fama and were ranked by it, so a man whose ship went down could be handed
 *   near the first pick of the sack instead of the last.
 * - Men who got into the city were listed in roster order, so in about one
 *   siege in six with several entrants, first place in the sack went to someone
 *   other than the man just crowned First to Enter.
 *
 * Neither shows up in a single roll or a single stage. Both show up at once
 * when you play a few thousand whole sieges through the real rules and check
 * the outcome against the manual, which is what this does.
 */

const base = new URL('..', import.meta.url).pathname
const { buildLandAssault, buildSeaAssault } = await import(base + 'src/game/stages.js')
const { resolveRound, sackOrder, carryRound } = await import(base + 'src/game/siege.js')
const chars = (await import(base + 'src/data/characters.json', { with: { type: 'json' } })).default

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

const recruit = (n, choice) =>
  chars.slice(0, n).map((c) => ({ ...c, bonus: 0, status: 'ready', attackChoice: choice, rollHistory: [] }))

/** One round on the given walls, resolved exactly as App does it. */
function playRound(players) {
  const queue = []
  let ships = []
  const land = players.filter((p) => p.attackChoice === 'land').sort((a, b) => b.fama - a.fama)
  if (land.length) queue.push(...buildLandAssault(land).queue)
  const sea = players.filter((p) => p.attackChoice === 'sea')
  if (sea.length) {
    const a = buildSeaAssault(sea)
    queue.push(...a.queue)
    ships = a.ships
  }
  return { ...resolveRound(players, queue, { ships }), queue, ships }
}

/* ---------------------------------------------------------- shipwrecks */

console.log('\nShipwrecks')
{
  let wrecks = 0
  let everyoneAboardMarked = true
  let everyoneAboardPaid = true
  let wreckedBelowTheRest = true
  let sample = ''

  for (let i = 0; i < 4000; i++) {
    const before = recruit(16, 'sea')
    const { players, queue, ships } = playRound(before)
    for (const item of queue.filter((q) => q.shipSunk)) {
      wrecks++
      const ship = ships.find((s) => s.id === item.shipId)
      const aboard = [ship.manifest.captain, ...ship.manifest.passengers]
      for (const m of aboard) {
        const after = players.find((p) => p.id === m.id)
        const was = before.find((p) => p.id === m.id)
        if (after.status !== 'shipwrecked') {
          everyoneAboardMarked = false
          sample ||= `${after.name} was aboard ${ship.id} and is "${after.status}"`
        }
        if (after.fama !== Math.max(0, was.fama - 1)) everyoneAboardPaid = false
      }
    }
    const order = sackOrder(players)
    const firstWreck = order.findIndex((o) => o.status === 'shipwrecked')
    if (firstWreck !== -1 && order.slice(firstWreck).some((o) => o.status !== 'shipwrecked')) {
      wreckedBelowTheRest = false
    }
  }

  check('ships do founder in these runs, so the checks below mean something', wrecks > 200, `${wrecks}`)
  check('everyone aboard a sunk ship is shipwrecked, not only the captain', everyoneAboardMarked, sample)
  check('everyone aboard a sunk ship loses 1 fama', everyoneAboardPaid)
  check('the shipwrecked all come last in the sack', wreckedBelowTheRest)
}

/* ------------------------------------------------- first into the city */

console.log('\nFirst into the city')
{
  let multi = 0
  let crownedIsFirst = true
  let enteredFirst = true
  let tiersInOrder = true
  let sample = ''
  const TIER_RANK = { inside: 0, walls: 1, fama: 2, shipwrecked: 3 }

  for (let i = 0; i < 12000; i++) {
    // Land, sea and split, so an entrant can come from either lane.
    const mode = i % 3
    const before = recruit(24, 'land').map((p, k) => ({
      ...p,
      attackChoice: mode === 0 ? 'land' : mode === 1 ? 'sea' : k % 2 ? 'land' : 'sea',
    }))
    const { players, first } = playRound(before)
    const order = sackOrder(players)
    const inside = order.filter((o) => o.tier === 'inside')

    for (let k = 1; k < order.length; k++) {
      if (TIER_RANK[order[k].tier] < TIER_RANK[order[k - 1].tier]) tiersInOrder = false
    }
    if (!first) continue
    if (order[0].name !== first.name) {
      crownedIsFirst = false
      sample ||= `crowned ${first.name}, sack #1 ${order[0].name}`
    }
    if (inside.length > 1) {
      multi++
      const at = inside.map((o) => players.find((p) => p.name === o.name).enteredAt)
      if (at.some((v, k) => k && v < at[k - 1])) enteredFirst = false
    }
  }

  check('sieges with several men inside do occur', multi > 300, `${multi}`)
  check('first place in the sack is always the man crowned First to Enter', crownedIsFirst, sample)
  check('the men inside are ordered by when they got in', enteredFirst)
  check('the four tiers never interleave', tiersInOrder)
}

/* -------------------------------------------- the first-assault gamble */

console.log('\nThe first-assault fama rule (Instructor\'s Manual)')
{
  const before = [
    { id: 1, name: 'Joined, land', fama: 5, attackChoice: 'land' },
    { id: 2, name: 'Joined, sea', fama: 4, attackChoice: 'sea' },
    { id: 3, name: 'Refused', fama: 6, attackChoice: 'sit_out' },
    { id: 4, name: 'Joined, at zero', fama: 0, attackChoice: 'land' },
  ]
  const after = carryRound(before)
  const f = (n) => after.find((p) => p.name === n).fama
  check('a failed first assault costs every man who joined it 1 fama', f('Joined, land') === 4 && f('Joined, sea') === 3)
  check('refusing the first assault costs nothing', f('Refused') === 6)
  check('fama never goes below zero', f('Joined, at zero') === 0)
  check('nobody is left assigned to a wall', after.every((p) => p.attackChoice === null))
}

console.log('')
if (failures) {
  console.error(`${failures} siege check(s) failed`)
  process.exit(1)
}
console.log('Whole sieges come out the way the manual says.')
