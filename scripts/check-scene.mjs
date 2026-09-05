/**
 * Scene invariants.
 *
 * The rules check (`check-rules.mjs`) proves the dice are right. This proves
 * the *world* is right: that cameras are not buried in masonry, that ladders
 * reach the wall face without passing through anything, that the walls run
 * past the edge of the frame, and that landmarks stand on land.
 *
 * Every one of these exists because something broke. The gate-opening camera
 * was written against a fifteen-unit gate wall; when the wall grew to a
 * hundred and fifty the camera was left pressed against the masonry, twenty
 * units to the side of the arch, and nothing caught it for two commits.
 */

import { readFile } from 'node:fs/promises'

const base = new URL('..', import.meta.url).pathname
const L = await import(base + 'src/three/lane.js')
const city = await import(base + 'src/three/geometry/cityBuilder.js')

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`  ok   ${name}`)
  } else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

/** Is this point inside one of the wall slabs (which run the whole lane in Z)? */
const insideSlab = (p, slabs) => {
  for (const s of slabs) {
    if (p[0] >= s.x[0] && p[0] <= s.x[1] && p[1] >= 0 && p[1] <= s.top) return s.name
  }
  return null
}

/** Does the segment a→b cross a slab's X band while below its top? */
const crossesSlab = (a, b, slabs) => {
  const steps = 240
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    const hit = insideSlab(p, slabs)
    if (hit) return hit
  }
  return null
}

console.log('\nLand lane cameras')
{
  const slabs = L.landWallSlabs()
  for (const [key, framing] of Object.entries(L.LAND_FRAMINGS)) {
    for (const aspect of [16 / 9, 4 / 3, 0.75]) {
      const cam = L.cameraFor({
        framing,
        offset: L.LAND_OFFSET,
        fov: L.LAND_FOV,
        aspect,
        clamp: [30, 190],
      })
      const buried = insideSlab(cam.position, slabs)
      check(
        `${key} camera clear of masonry at aspect ${aspect.toFixed(2)}`,
        !buried,
        buried ? `inside ${buried}` : ''
      )
    }
  }
}

console.log('\nLand walls run past the frame')
{
  // The camera must never see either end of a wall. Half the visible width at
  // the far edge of the lane has to fit inside half the wall's length.
  for (const [key, framing] of Object.entries(L.LAND_FRAMINGS)) {
    const cam = L.cameraFor({ framing, offset: L.LAND_OFFSET, fov: L.LAND_FOV, aspect: 21 / 9 })
    const halfVisible = cam.dist * Math.tan((L.LAND_FOV * Math.PI) / 360) * (21 / 9)
    check(
      `${key}: wall half-length ${L.LANE.laneDepth / 2} exceeds visible ${halfVisible.toFixed(0)}`,
      L.LANE.laneDepth / 2 > halfVisible
    )
  }
}

console.log('\nLadders')
{
  for (const stage of ['first-wall', 'second-wall']) {
    const l = L.ladderFor(stage, 0)
    const headX = l.position[0] + l.height * Math.sin(l.lean)
    const headY = l.height * Math.cos(l.lean)
    check(
      `${stage}: head lands on the wall face`,
      Math.abs(headX - l.faceX) < 0.01,
      `head ${headX.toFixed(2)} vs face ${l.faceX.toFixed(2)}`
    )
    check(
      `${stage}: head clears the parapet`,
      headY > (stage === 'first-wall' ? L.HEIGHTS.outerWall : L.HEIGHTS.innerWall),
      `head ${headY.toFixed(2)}`
    )
  }
  // The inner ladder has no room to topple up, and must know it.
  const inner = L.ladderFor('second-wall', 0)
  check('second-wall ladder swings up along the wall, not through the outer one', inner.alongWall)
  const outer = L.ladderFor('first-wall', 0)
  check('first-wall ladder topples up from open ground', !outer.alongWall)
}

console.log('\nGate opening')
{
  const slabs = L.landWallSlabs()
  for (const [name, p] of [
    ['start', L.GATE_CAMERA.start],
    ['end', L.GATE_CAMERA.end],
  ]) {
    const buried = insideSlab(p, slabs)
    check(`camera ${name} clear of masonry`, !buried, buried ? `inside ${buried}` : '')
    check(`camera ${name} stands inside the city`, p[0] > L.LANE.gateX + L.LANE.gateWidth / 2)
  }
  // The camera must be able to see the gate: the sight line may pass through
  // the gate wall only at the arch, which is what it is aimed at.
  const off = L.GATE_CAMERA.look
  check(
    'camera is aimed at the gate itself',
    Math.abs(off[0] - L.LANE.gateX) < 0.01 && Math.abs(off[2]) < 2
  )
  // And the street it stands on must actually be clear of buildings.
  const inStreet = (p) => Math.abs(p[2]) < L.GATE_STREET.halfWidth && p[0] < L.GATE_STREET.untilX
  check('camera start stands on the cleared street', inStreet(L.GATE_CAMERA.start))
  check('camera end stands on the cleared street', inStreet(L.GATE_CAMERA.end))
}

console.log('\nSea lane')
{
  const slabs = L.seaWallSlabs()
  for (const [key, framing] of Object.entries(L.SEA_FRAMINGS)) {
    for (const aspect of [16 / 9, 4 / 3, 0.75]) {
      const cam = L.cameraFor({
        framing,
        offset: L.SEA_OFFSET,
        fov: L.SEA_FOV,
        aspect,
        clamp: [30, 200],
      })
      const buried = insideSlab(cam.position, slabs)
      check(
        `${key} camera clear of masonry at aspect ${aspect.toFixed(2)}`,
        !buried,
        buried ? `inside ${buried}` : ''
      )
    }
    const cam = L.cameraFor({ framing, offset: L.SEA_OFFSET, fov: L.SEA_FOV, aspect: 21 / 9 })
    const halfVisible = cam.dist * Math.tan((L.SEA_FOV * Math.PI) / 360) * (21 / 9)
    check(`${key}: sea wall runs past the frame`, L.SEA_LANE.laneDepth / 2 > halfVisible)
  }

  // The crossing must actually be a crossing: beach, then mid-channel, then
  // the wall, each clear of the next.
  check(
    'ships start on the far bank, not in open water',
    L.SEA_LANE.stagingX > L.SEA_LANE.shoreX,
    `staging ${L.SEA_LANE.stagingX} vs shore ${L.SEA_LANE.shoreX}`
  )
  check(
    'a foundering ship goes down in mid-channel',
    L.SEA_LANE.approachX > L.SEA_LANE.stagingX && L.SEA_LANE.approachX < L.SEA_LANE.atWallX
  )
  const channel = L.SEA_LANE.wallX - L.SEA_LANE.shoreX
  check('the Horn is a channel, not an ocean', channel > 26 && channel < 46, `${channel} units`)

  // A ship at the wall must be clear of it, and its gangway must reach.
  const shipBow = L.SEA_LANE.atWallX + 2.76
  const faceX = L.SEA_LANE.wallX - L.SEA_LANE.wallWidth / 2
  check('ship stops short of the wall', shipBow < faceX, `bow ${shipBow.toFixed(2)} vs face ${faceX.toFixed(2)}`)

  const g = L.gangwayGeometry()
  check('gangway reaches from the mast-heads to the parapet', g.length > Math.hypot(g.toX - g.fromX, g.fromY - g.toY))
  check('gangway comes down, not up', g.fromY > g.toY, `${g.fromY.toFixed(2)} to ${g.toY.toFixed(2)}`)

  // A boarder's route must be along the plank: lifted to the inboard end of
  // the gangway, then walked across it — not launched at the wall from the
  // deck, which read as a jump over open water.
  const bridgeX = L.SEA_LANE.atWallX + L.SEA_SHIP.mastLocalX
  check(
    'the bridge stop sits at the inboard end of the gangway',
    Math.abs(bridgeX - g.fromX) < 0.01
  )
  check(
    'the bridge stop is above the deck, not on it',
    L.MAST_TOP_Y > L.SEA_SHIP.deckY + 3,
    `bridge ${L.MAST_TOP_Y.toFixed(2)} vs deck ${L.SEA_SHIP.deckY}`
  )
  const stepOffX = L.SEA_LANE.wallX - L.SEA_LANE.wallWidth / 2 + 0.35
  check(
    'a boarder steps off onto the parapet, just inboard of the wall face',
    stepOffX > g.toX && stepOffX < g.toX + 0.6,
    `step-off ${stepOffX.toFixed(2)} vs face ${g.toX.toFixed(2)}`
  )
}

console.log('\nCity landmarks stand on land')
{
  const marks = [
    ['Hagia Sophia', 23, -1, 4.3],
    ['Hippodrome', 8, 5, 5.2],
    ['Great Palace', 17, 4.5, 2.8],
    ['Blachernae', -27, -16.5, 2.6],
  ]
  for (const [name, x, z, clear] of marks) {
    check(`${name} is inside the peninsula with ${clear} clear`, city.insidePeninsula(x, z, clear))
  }
  check('west of the land walls is land, not water', city.insidePolygon(city.EUROPE, -45, 0))
  check('the Golden Horn is water', !city.insidePolygon(city.EUROPE, 0, -18))
  check('Galata joins the mainland round the head of the Horn', city.insidePolygon(city.EUROPE, -70, -31))
  check('the chain tower stands on Galata', city.wellInside(city.GALATA, 27, -23.5, 1.2))
}

console.log('\nEvery figure on screen has a livery')
{
  const factions = await import(base + 'src/three/factions.js')
  const stages = await import(base + 'src/game/stages.js')
  const characters = JSON.parse(
    await readFile(base + 'src/data/characters.json', 'utf8')
  )

  const known = Object.keys(factions.FACTIONS)
  const roster = characters.slice(0, 20).map((c) => ({ ...c }))

  check(
    'every character in the roster belongs to a faction we can dress',
    characters.every((c) => known.includes(c.faction)),
    characters.filter((c) => !known.includes(c.faction)).map((c) => c.faction).join(', ')
  )

  // The land lane dresses figures from the stage entries.
  const land = stages.buildLandAssault(roster)
  const landEntries = land.stages.flatMap((s) => s.entries)
  check(
    'every land stage entry carries a faction',
    landEntries.length > 0 && landEntries.every((e) => known.includes(e.faction)),
    `${landEntries.length} entries`
  )

  // The sea lane dresses crew from the ship manifests, not the roll queue —
  // passengers of a foundered ship never roll and would otherwise be liveried
  // as Indeterminate, standing out from their own contingent.
  const sea = stages.buildSeaAssault(roster)
  const passengers = sea.ships.flatMap((s) => s.manifest.passengers)
  check(
    'every ship passenger carries a faction',
    passengers.length > 0 && passengers.every((p) => known.includes(p.faction)),
    `${passengers.length} passengers`
  )
  check(
    'a banner bearer can be picked — passengers carry fama',
    passengers.every((p) => typeof p.fama === 'number')
  )
}

console.log('')
if (failures) {
  console.error(`${failures} scene invariant(s) failed`)
  process.exit(1)
}
console.log('All scene invariants hold.')
