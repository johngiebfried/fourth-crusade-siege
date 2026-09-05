import fs from 'node:fs'
const base = new URL('..', import.meta.url).pathname
const { buildLandAssault, buildSeaAssault, entrantsFromQueue } = await import(base + '/src/game/stages.js')
const chars = JSON.parse(fs.readFileSync(base + '/src/data/characters.json', 'utf8'))

let landRuns = 0, seaRuns = 0, entrants = 0, err = 0
const stageCounts = {}

for (let i = 0; i < 4000; i++) {
  const n = 1 + Math.floor(Math.random() * 12)
  const pick = [...chars].sort(() => Math.random() - 0.5).slice(0, n)
  try {
    const land = buildLandAssault(pick.slice().sort((a, b) => b.fama - a.fama))
    landRuns++
    stageCounts[land.stages.length] = (stageCounts[land.stages.length] || 0) + 1

    // each stage's cohort must equal the previous stage's successes
    for (let k = 1; k < land.stages.length; k++) {
      const prevWins = land.stages[k - 1].entries.filter(e => e.success).length
      if (prevWins !== land.stages[k].entries.length) throw new Error('survivor mismatch at stage ' + k)
    }
    // thresholds: 5, then 6, then max(3, 6 - survivors)
    const byKey = Object.fromEntries(land.stages.map(s => [s.key, s]))
    if (byKey['first-wall'] && byKey['first-wall'].threshold !== 5) throw new Error('first wall threshold')
    if (byKey['second-wall'] && byKey['second-wall'].threshold !== 6) throw new Error('second wall threshold')
    const gates = byKey['city-gates']
    if (gates) {
      const expect = Math.max(3, 6 - gates.entries.length)
      if (gates.threshold !== expect) throw new Error('gate threshold ' + gates.threshold + ' expected ' + expect)
    }
    entrants += entrantsFromQueue(land.queue).length

    const sea = buildSeaAssault(pick)
    seaRuns++
    for (const sh of sea.ships) {
      if (sh.piloting && sh.piloting.roll === 1 && (sh.boarding.length || sh.breaking.length))
        throw new Error('sunk ship still boarded')
      if (sh.boarding.length > 3) throw new Error('ship over capacity: ' + sh.boarding.length)
      if (sh.breaking.length) {
        const expect = Math.max(3, 6 - sh.breaking.length)
        if (sh.breakingThreshold !== expect) throw new Error('sea threshold')
      }
      // only passengers board; the captain never rolls to board
      if (sh.boarding.some(b => b.player === sh.captain)) throw new Error('captain boarded')
    }
  } catch (e) {
    err++
    if (err < 4) console.error('FAIL:', e.message)
  }
}
console.log('land runs', landRuns, '| sea runs', seaRuns, '| errors', err)
console.log('stages-reached distribution', stageCounts)
console.log('entrants across 4000 land rounds:', entrants)

// Sea assault with no Venetian and no Oberto must cancel outright.
{
  const { buildSeaAssault, buildSeaStages } = await import(base + 'src/game/stages.js')
  const noCaptains = chars.filter(c => c.faction !== 'Venetian' && c.name !== 'Oberto II of Biandrate').slice(0, 6)
  const sea = buildSeaAssault(noCaptains)
  const stages = buildSeaStages(sea)
  console.log('no-captain sea assault → cancelled:', sea.cancelled, '| ships:', sea.ships.length, '| stages:', stages.length)

  // Every passenger on the manifest must be accounted for, sunk ships included.
  let manifestOk = true
  for (let i = 0; i < 500; i++) {
    const pick = [...chars].sort(() => Math.random() - 0.5).slice(0, 10)
    const s = buildSeaAssault(pick)
    for (const ship of s.ships) {
      const boarded = new Set(ship.boarding.map(e => e.playerId))
      const manifest = new Set(ship.manifest.passengers.map(p => p.id))
      for (const id of boarded) if (!manifest.has(id)) manifestOk = false
      // A ship that survived piloting and carries passengers must roll for each
      if (ship.piloting && ship.piloting.roll !== 1 && manifest.size !== boarded.size) manifestOk = false
    }
  }
  console.log('manifest matches boarding rolls on every surviving ship:', manifestOk)
}
