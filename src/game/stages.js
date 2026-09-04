/**
 * Adapters that reshape the flat roll queue produced by rules.js into the
 * per-stage rounds the 3D sequences need.
 *
 * These functions never decide an outcome. Every roll, total, threshold and
 * success flag is read straight out of the queue that rules.js built.
 */

import { addLandAttackRolls, addSeaAttackRolls } from './rules.js'

const LAND_STAGE_ORDER = ['First Wall', 'Second Wall', 'City Gates']

const LAND_STAGE_META = {
  'First Wall': {
    key: 'first-wall',
    title: 'First Wall',
    heading: 'Stage 1 · The Outer Wall',
    blurb: 'The low outer wall beyond the moat. Roll 5 or higher to get over it.',
  },
  'Second Wall': {
    key: 'second-wall',
    title: 'Second Wall',
    heading: 'Stage 2 · The Inner Wall',
    blurb: 'The great Theodosian inner wall, towers every 55 metres. Only a 6 will do.',
  },
  'City Gates': {
    key: 'city-gates',
    title: 'City Gates',
    heading: 'Stage 3 · The Gates',
    blurb: 'Into the city itself. Numbers help — the more who reach here, the lower the bar.',
  },
}

/**
 * Build the land assault as an ordered list of click-rounds.
 * Returns { stages, queue } where queue is the untouched rules.js output.
 */
export function buildLandAssault(attackers) {
  const queue = []
  addLandAttackRolls(queue, attackers)

  const byStage = new Map()
  for (const item of queue) {
    if (item.type !== 'roll') continue
    if (!byStage.has(item.stage)) byStage.set(item.stage, [])
    byStage.get(item.stage).push(item)
  }

  const stages = []
  for (const stageName of LAND_STAGE_ORDER) {
    const entries = byStage.get(stageName)
    if (!entries || entries.length === 0) continue
    const meta = LAND_STAGE_META[stageName]
    stages.push({
      ...meta,
      stage: stageName,
      threshold: entries[0].threshold,
      entries: entries.map((e) => ({
        playerId: e.playerId,
        player: e.player,
        roll: e.roll,
        bonus: e.bonus,
        total: e.total,
        threshold: e.threshold,
        success: e.success,
        message: e.message,
        enteredCity: Boolean(e.enteredCity),
      })),
    })
  }

  return { stages, queue }
}

/**
 * Build the sea assault grouped by ship, then by stage within each ship.
 * Ships stay in the order rules.js formed them — no fama re-ranking.
 */
export function buildSeaAssault(attackers) {
  const queue = []
  addSeaAttackRolls(queue, attackers)

  const ships = new Map()
  const ensureShip = (shipId) => {
    if (!ships.has(shipId)) {
      ships.set(shipId, {
        id: shipId,
        label: null,
        captain: null,
        piloting: null,
        boarding: [],
        breaking: [],
        breakingThreshold: null,
      })
    }
    return ships.get(shipId)
  }

  for (const item of queue) {
    if (!item.shipId) continue
    const ship = ensureShip(item.shipId)

    if (item.type === 'announcement' && item.message.startsWith('Ship ')) {
      ship.label = item.message
      ship.crewNote = item.subtitle
      continue
    }
    if (item.type !== 'roll') continue

    const entry = {
      playerId: item.playerId,
      player: item.player,
      roll: item.roll,
      bonus: item.bonus,
      total: item.total,
      threshold: item.threshold,
      success: item.success,
      message: item.message,
      enteredCity: Boolean(item.enteredCity),
      shipSunk: Boolean(item.shipSunk),
    }

    if (item.stage === 'Piloting') {
      ship.captain = item.player
      ship.piloting = entry
    } else if (item.stage === 'Boarding') {
      ship.boarding.push(entry)
    } else if (item.stage === 'Breaking Through') {
      ship.breaking.push(entry)
      ship.breakingThreshold = item.threshold
    }
  }

  // A cancelled sea assault (no captains) produces no ship-scoped items at all.
  const cancelled = queue.some(
    (i) => i.type === 'announcement' && i.message === '⚠️ No Ship Captains Available'
  )

  const strandedNotices = queue
    .filter((i) => i.type === 'announcement' && i.message.endsWith(' has no ship'))
    .map((i) => i.message.replace('⚠️ ', ''))

  return { ships: [...ships.values()], queue, cancelled, strandedNotices }
}

/** Everyone who cleared the final stage of either assault, in resolution order. */
export function entrantsFromQueue(queue) {
  return queue.filter((i) => i.type === 'roll' && i.enteredCity)
}
