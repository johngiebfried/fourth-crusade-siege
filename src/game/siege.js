/**
 * What the dice mean for the siege: who got where, who pays, and the sack order.
 *
 * `rules.js` rolls the dice and must stay identical to the original app —
 * `check-oracle.mjs` holds it to that, roll for roll. This module is everything
 * the game does *with* those rolls, and it is where the original had faults:
 *
 * - **A foundered ship marked only its captain.** The passengers of a sunk ship
 *   never roll, so a loop over the rolls never saw them. They kept their fama
 *   and were ranked by it — a Boniface aboard a sunk ship could be handed near
 *   the first pick of the sack instead of the last. The manual, and the app's
 *   own "All aboard lose 1 fama", both say everyone aboard.
 * - **The sack order ignored the order men got in.** Everyone inside was listed
 *   in roster order, so in about one siege in six with several entrants, the
 *   first place in the sack went to someone other than the man the screen had
 *   just crowned First to Enter. The manual gives first place to the first man
 *   in, without exception.
 *
 * Pure functions, so `check-siege.mjs` can play thousands of whole sieges
 * through them — which is the only kind of test that could have caught either.
 */

/**
 * The final stage of each lane, by the label `rules.js` stamps on its rolls.
 * A man who rolled here and failed was on the wall when he did it.
 */
export const FINAL_STAGES = new Set(['City Gates', 'Breaking Through'])

/**
 * Apply one round's rolls to the players.
 *
 * `ships` are the sea assault's ships with their crew manifests. They are the
 * only record of who was aboard a ship that went down, because nobody aboard
 * one rolls again.
 *
 * Returns the updated players and the first man into the city, if any.
 */
export function resolveRound(players, queue, { ships = [] } = {}) {
  const out = players.map((p) => ({ ...p, rollHistory: [...(p.rollHistory ?? [])] }))
  const byId = new Map(out.map((p) => [p.id, p]))

  let first = null
  let entered = 0
  const sunk = []

  for (const item of queue) {
    if (item.type !== 'roll' || item.playerId == null) continue
    const p = byId.get(item.playerId)
    if (!p) continue
    p.rollHistory.push(item)

    if (item.enteredCity) {
      p.status = 'inside'
      // The order men got in, which is the order the sack takes them in.
      p.enteredAt = entered++
      if (!first) first = { name: p.name, lane: item.stage === 'Breaking Through' ? 'sea' : 'land' }
    } else if (item.shipSunk) {
      sunk.push(item)
    } else if (FINAL_STAGES.has(item.stage) && p.status === 'ready') {
      // He rolled in the last stage, so he was standing on the second land
      // wall or on the sea wall when he failed — further than anyone below.
      p.status = 'walls'
      p.wallRoll = item.total ?? item.roll ?? 0
    }
  }

  // Everyone aboard a ship that went down: its captain and every passenger.
  // If a manifest is somehow missing, the captain who rolled is still marked.
  for (const item of sunk) {
    const ship = ships.find((s) => s.id === item.shipId)
    const crew = ship?.manifest
      ? [ship.manifest.captain, ...ship.manifest.passengers]
      : [{ id: item.playerId }]
    for (const member of crew) {
      const p = member && byId.get(member.id)
      if (!p) continue
      p.status = 'shipwrecked'
      p.fama = Math.max(0, p.fama - 1)
    }
  }

  return { players: out, first }
}

/** The sack's four tiers, in the order the manual takes them. */
export const TIERS = [
  { key: 'inside', label: 'Entered the city' },
  { key: 'walls', label: 'Reached the walls' },
  { key: 'fama', label: 'Outside the walls, by fama' },
  { key: 'shipwrecked', label: 'Shipwrecked' },
]

/**
 * The order in which crusaders choose a region to sack, per the manual.
 *
 * First the men who got in, in the order they got in — so the first man over
 * the wall always takes first place. Then those who reached the second land
 * wall or the sea wall, highest roll first (the manual has them roll afresh;
 * the roll they already made rewards the same thing without an extra step).
 * Then everyone else by fama, which is the point of the exercise: it reproduces
 * Robert of Clari's complaint that the rich lords took the spoils and left the
 * common knights nothing. The shipwrecked go last.
 */
export function sackOrder(players) {
  const inside = players
    .filter((p) => p.status === 'inside')
    .sort((a, b) => (a.enteredAt ?? Infinity) - (b.enteredAt ?? Infinity))
  const walls = players
    .filter((p) => p.status === 'walls')
    .sort((a, b) => (b.wallRoll ?? 0) - (a.wallRoll ?? 0) || b.fama - a.fama)
  const rest = players
    .filter((p) => !['inside', 'walls', 'shipwrecked'].includes(p.status))
    .sort((a, b) => b.fama - a.fama)
  const wrecked = players.filter((p) => p.status === 'shipwrecked')

  const tierOf = (p) =>
    p.status === 'inside' ? 'inside' : p.status === 'walls' ? 'walls' : p.status === 'shipwrecked' ? 'shipwrecked' : 'fama'

  return [...inside, ...walls, ...rest, ...wrecked].map((p, i) => ({
    position: i + 1,
    name: p.name,
    faction: p.faction,
    status: p.status,
    tier: tierOf(p),
  }))
}

/* ------------------------------------------------------- the round boundary */

/**
 * What survives a round, and what does not.
 *
 * A siege runs up to two assaults, and round two goes back through the setup
 * screens — which rebuild the player list from the roster. That made the round
 * boundary a place where state could silently vanish, and it did: `status` and
 * `wallRoll` were blanked and fama was rebuilt from a roster written before
 * round one rolled a die, so everyone arrived at the sack order marked
 * "Outside the walls".
 *
 * - **Per-round**: where a man is attacking, which ship he is on, how far up the
 *   stages he has climbed *this* round. Reset.
 * - **The siege's memory**: fama, and how far he ever got — `status` and the
 *   roll that got him there. Kept, because the sack order is built from them.
 */

/**
 * The end of a first assault that failed.
 *
 * The manual's rule: "In the first attack, any player may join in the attack,
 * knowing that if they fail, they will each lose 1 fama." So joining round one
 * is a gamble and refusing it is free — the reverse of the original app, which
 * charged the men who sat out. Only called when round one did not take the
 * city; a round one that succeeds goes straight to the sack with no penalty.
 *
 * "Attacked" means chose a wall. A man whose ship sank has already lost a point
 * for that and loses this one too: the manual states the two penalties
 * separately and does not excuse one for the other.
 */
export function carryRound(players) {
  return players.map((p) => ({
    ...p,
    fama: p.attackChoice === 'land' || p.attackChoice === 'sea' ? Math.max(0, p.fama - 1) : p.fama,
    attackChoice: null,
  }))
}

/** Start of a round: put a man back in the field without forgetting him. */
export function enlist(char, attackChoice) {
  return {
    ...char,
    attackChoice,
    shipId: null,
    stage: 0,
    status: char.status ?? 'ready',
    wallRoll: char.wallRoll,
    // Copied, not shared: the resolver pushes onto this array in place.
    rollHistory: char.rollHistory ? [...char.rollHistory] : [],
  }
}
