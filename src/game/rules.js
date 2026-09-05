/**
 * Siege rules — the authoritative six-rule dice logic.
 *
 * `addLandAttackRolls` and `addSeaAttackRolls` are preserved verbatim from the
 * original index.html implementation. Do not alter the roll thresholds, the
 * survivor-gating, the ship formation, or the queue item shapes: the visual
 * layer reads this queue, it does not re-decide anything.
 *
 * The only structural change is that the two functions are exported and the
 * announcement/stage-header items they push are now consumed by 3D scenes
 * rather than by a modal. Their content is unchanged.
 */

export const rollDice = () => Math.floor(Math.random() * 6) + 1

/** Max passengers per ship, excluding the captain. Preserved from index.html. */
export const MAX_PASSENGERS_PER_SHIP = 3

/** Venetians and Oberto II of Biandrate are the only characters who can pilot. */
export const canCaptain = (p) =>
  p.faction === 'Venetian' || p.name === 'Oberto II of Biandrate'

export const addLandAttackRolls = (queue, attackers) => {
  let stage1Survivors = []
  let stage2Survivors = []

  // Stage 1: First Wall
  queue.push({
    type: 'stage-header',
    message: 'Stage 1: First Wall',
    subtitle: 'Need to roll 5 or higher to scale the outer defenses',
  })

  attackers.forEach((attacker) => {
    const roll = rollDice()
    const total = roll + attacker.bonus
    const success = total >= 5

    queue.push({
      type: 'roll',
      player: attacker.name,
      stage: 'First Wall',
      roll: roll,
      bonus: attacker.bonus,
      total: total,
      threshold: 5,
      success: success,
      message: success ? 'Climbs the first wall!' : 'Repelled by defenders!',
      playerId: attacker.id,
    })

    if (success) {
      stage1Survivors.push(attacker)
    }
  })

  if (stage1Survivors.length === 0) {
    queue.push({
      type: 'announcement',
      message: '💀 Attack Failed',
      subtitle: 'No one reached the second wall',
    })
    return
  }

  queue.push({
    type: 'announcement',
    message: '⚡ Breakthrough!',
    subtitle: `${stage1Survivors.length} crusaders reach the second wall`,
  })

  // Stage 2: Second Wall
  queue.push({
    type: 'stage-header',
    message: 'Stage 2: Second Wall',
    subtitle: 'Need to roll 6 to breach the massive inner defenses',
  })

  stage1Survivors.forEach((attacker) => {
    const roll = rollDice()
    const total = roll + attacker.bonus
    const success = total >= 6

    queue.push({
      type: 'roll',
      player: attacker.name,
      stage: 'Second Wall',
      roll: roll,
      bonus: attacker.bonus,
      total: total,
      threshold: 6,
      success: success,
      message: success ? 'Breaches the inner wall!' : 'Thrown back by Greek defenders!',
      playerId: attacker.id,
    })

    if (success) {
      stage2Survivors.push(attacker)
    }
  })

  if (stage2Survivors.length === 0) {
    queue.push({
      type: 'announcement',
      message: '💀 Attack Failed',
      subtitle: 'The inner walls held firm',
    })
    return
  }

  queue.push({
    type: 'announcement',
    message: '⚡ Inner Wall Breached!',
    subtitle: `${stage2Survivors.length} crusaders fight through to the gates`,
  })

  // Stage 3: Into the City
  const threshold = Math.max(3, 6 - stage2Survivors.length)
  queue.push({
    type: 'stage-header',
    message: 'Stage 3: City Gates',
    subtitle: `Need to roll ${threshold} or higher (threshold lowers with more attackers)`,
  })

  let anyoneEntered = false
  stage2Survivors.forEach((attacker) => {
    const roll = rollDice()
    const total = roll + attacker.bonus
    const success = total >= threshold

    queue.push({
      type: 'roll',
      player: attacker.name,
      stage: 'City Gates',
      roll: roll,
      bonus: attacker.bonus,
      total: total,
      threshold: threshold,
      success: success,
      message: success ? '🎊 BREAKS INTO CONSTANTINOPLE!' : 'Held at the final gates!',
      playerId: attacker.id,
      enteredCity: success,
    })

    if (success && !anyoneEntered) {
      anyoneEntered = true
      queue.push({
        type: 'announcement',
        message: '👑 FIRST TO ENTER',
        subtitle: `${attacker.name} is the first crusader into the city!`,
      })
    }
  })
}

/**
 * Form ships from the sea attackers.
 *
 * Extracted verbatim out of addSeaAttackRolls so the visual layer can read the
 * crew manifest directly. This matters for a ship that founders: its
 * passengers produce no boarding rolls at all, so without the manifest they
 * would never appear on screen and could not go down with the ship.
 *
 * Purely deterministic — captains in roster order, passengers filling each
 * ship in turn up to capacity. No dice, and no change to who sails with whom.
 */
export const formShips = (attackers) => {
  const potentialCaptains = attackers.filter(canCaptain)
  const passengers = attackers.filter((p) => !canCaptain(p))

  const ships = potentialCaptains.map((captain, idx) => ({
    id: `ship-${idx}`,
    captain: captain,
    passengers: [],
  }))

  const stranded = []

  // Assign passengers to ships (max 3 per ship)
  let currentShipIndex = 0
  for (const passenger of passengers) {
    if (
      currentShipIndex < ships.length &&
      ships[currentShipIndex].passengers.length >= MAX_PASSENGERS_PER_SHIP
    ) {
      currentShipIndex++
    }

    if (currentShipIndex < ships.length) {
      ships[currentShipIndex].passengers.push(passenger)
    } else {
      stranded.push(passenger)
    }
  }

  return { ships, stranded }
}

export const addSeaAttackRolls = (queue, attackers) => {
  // Venetians AND Oberto can captain ships
  const potentialCaptains = attackers.filter(canCaptain)

  if (potentialCaptains.length === 0) {
    queue.push({
      type: 'announcement',
      message: '⚠️ No Ship Captains Available',
      subtitle:
        'Sea wall attack cancelled - need Venetians or Oberto of Biandrate to pilot ships!',
    })
    return
  }

  const { ships, stranded } = formShips(attackers)

  for (const passenger of stranded) {
    queue.push({
      type: 'announcement',
      message: `⚠️ ${passenger.name} has no ship`,
      subtitle: `All ships are full (max ${MAX_PASSENGERS_PER_SHIP} passengers each)`,
    })
  }

  queue.push({
    type: 'announcement',
    message: '⚓ Ships Formed',
    subtitle: `${ships.length} ships launch toward the sea walls`,
  })

  ships.forEach((ship, shipIdx) => {
    const crew = [ship.captain, ...ship.passengers]

    queue.push({
      type: 'announcement',
      message: `Ship ${shipIdx + 1}: ${ship.captain.name}`,
      subtitle: `${crew.length} crusaders aboard`,
      shipId: ship.id,
    })

    // Ship survival roll
    const pilotRoll = rollDice()
    queue.push({
      type: 'roll',
      player: ship.captain.name,
      stage: 'Piloting',
      roll: pilotRoll,
      bonus: 0,
      total: pilotRoll,
      threshold: 2,
      success: pilotRoll > 1,
      message: pilotRoll === 1 ? '💥 SHIP SINKS!' : '✓ Ship reaches the walls',
      playerId: ship.captain.id,
      shipSunk: pilotRoll === 1,
      shipId: ship.id,
    })

    if (pilotRoll === 1) {
      queue.push({
        type: 'announcement',
        message: '🌊 Ship Lost!',
        subtitle: 'All aboard lose 1 fama',
        shipId: ship.id,
      })
      return
    }

    // Boarding rolls (only passengers attack, captain pilots)
    if (ship.passengers.length === 0) {
      queue.push({
        type: 'announcement',
        message: '⚠️ No Passengers',
        subtitle: `${ship.captain.name} pilots the ship but has no one to attack the walls`,
        shipId: ship.id,
      })
      return
    }

    queue.push({
      type: 'stage-header',
      message: 'Boarding the Sea Walls',
      subtitle: 'Need to roll 6 to climb from ship to ramparts',
      shipId: ship.id,
    })

    const captainTitle =
      ship.captain.faction === 'Venetian' ? 'Venetian captain' : 'Genoese captain'
    queue.push({
      type: 'announcement',
      message: `⚓ ${ship.captain.name} holds the ship steady`,
      subtitle: `${captainTitle} maintains command while passengers attack`,
      shipId: ship.id,
    })

    let boarders = []
    ship.passengers.forEach((member) => {
      const roll = rollDice()
      const total = roll + member.bonus
      const success = total >= 6

      queue.push({
        type: 'roll',
        player: member.name,
        stage: 'Boarding',
        roll: roll,
        bonus: member.bonus,
        total: total,
        threshold: 6,
        success: success,
        message: success ? 'Boards the wall!' : 'Falls back to ship!',
        playerId: member.id,
        shipId: ship.id,
      })

      if (success) boarders.push(member)
    })

    if (boarders.length === 0) {
      queue.push({
        type: 'announcement',
        message: '💀 Boarding Failed',
        subtitle: 'No one from this ship reached the walls',
        shipId: ship.id,
      })
      return
    }

    // Fighting through
    const threshold = Math.max(3, 6 - boarders.length)
    queue.push({
      type: 'stage-header',
      message: 'Fighting Through',
      subtitle: `Need ${threshold}+ to break into the city`,
      shipId: ship.id,
    })

    let anyoneEntered = false
    boarders.forEach((attacker) => {
      const roll = rollDice()
      const total = roll + attacker.bonus
      const success = total >= threshold

      queue.push({
        type: 'roll',
        player: attacker.name,
        stage: 'Breaking Through',
        roll: roll,
        bonus: attacker.bonus,
        total: total,
        threshold: threshold,
        success: success,
        message: success ? '🎊 BREAKS INTO CONSTANTINOPLE!' : 'Held at the breach!',
        playerId: attacker.id,
        enteredCity: success,
        shipId: ship.id,
      })

      if (success && !anyoneEntered) {
        anyoneEntered = true
        queue.push({
          type: 'announcement',
          message: '👑 FIRST TO ENTER',
          subtitle: `${attacker.name} is the first crusader into the city!`,
          shipId: ship.id,
        })
      }
    })
  })
}
