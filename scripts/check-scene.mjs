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
  // The tower anchored the chain across the Horn, so it belongs *at* the
  // water's edge — the check is that it stands on land at all, with just
  // enough margin that a refined coastline cannot leave it paddling.
  check('the chain tower stands on Galata', city.wellInside(city.GALATA, 27, -24.1, 1.2))
}

console.log('\nThe army musters on open ground, not in the ditch')
{
  // The moat works — revetment, counterscarp, dams — occupy real width now.
  // The mustering rows have to stay outside them, and the check exists
  // because the third row silently ended up standing in the counterscarp.
  const outerLip = L.LANE.moatX - L.LANE.moatWidth / 2
  const counterscarp = outerLip - 0.6
  const blockedFrom = counterscarp - 0.25 - 0.35
  const blockedTo = outerLip + 0.35

  for (let row = 0; row < 3; row++) {
    const x = L.LANE.musterX + row * L.LANE.musterRow
    check(
      `muster row ${row} stands clear of the ditch and its counterscarp`,
      x < blockedFrom || x > blockedTo,
      `x ${x.toFixed(2)} vs blocked ${blockedFrom.toFixed(2)}..${blockedTo.toFixed(2)}`
    )
  }
}

console.log('\nA boarder walks the plank in, and lands clear of the towers')
{
  const g = L.gangwayGeometry()
  const keep = L.SEA_TOWER_RADIUS + 0.55

  for (const count of [1, 3, 5, 7, 9, 12]) {
    const zs = L.seaFleetZs(count)

    // The whole point of the mast-top bridge: the boarder's path is the
    // plank. Landing by a slot spread along the whole wall was the bug that
    // made him drift across open water at a diagonal, so what has to hold is
    // that his line and the plank's line are the same line.
    const onPlank = zs.every((z) => {
      const bridge = L.bridgeSpot(L.SEA_LANE.atWallX, z, 0)
      const land = L.boardingSpot(z, 0)
      const walked = Math.atan2(land[2] - bridge[2], land[0] - bridge[0])
      return land[0] > bridge[0] && Math.abs(walked - L.gangwaySkew(z)) < 0.06
    })
    check(`${count} ships: every boarder's path follows the plank`, onPlank)

    check(
      `${count} ships: the plank is never swung more than fifteen degrees`,
      zs.every((z) => Math.abs(L.gangwaySkew(z)) < 0.26),
      `max ${Math.max(...zs.map((z) => Math.abs(L.gangwaySkew(z)) * 57.3)).toFixed(1)}deg`
    )

    const insideTower = zs
      .map((z) => L.boardingSpot(z, 0)[2])
      .filter((lz) => Math.abs(lz - L.nearestSeaTower(lz)) < keep)
    check(`${count} ships: nobody lands inside a tower`, insideTower.length === 0)

    // Hulls must not interpenetrate — the reason the fleet is slid bodily
    // rather than each ship being pushed clear on its own.
    const gaps = zs.slice(1).map((z, i) => z - zs[i])
    check(
      `${count} ships: no two hulls overlap`,
      count === 1 || Math.min(...gaps) >= L.HULL_PAIR_WIDTH - 0.01,
      count === 1 ? '' : `min gap ${Math.min(...gaps).toFixed(2)}`
    )
  }

  check(
    'the boarder steps off level with the parapet, not above or below it',
    Math.abs(L.boardingSpot(0)[1] - (L.SEA_HEIGHTS.wall + 0.65)) < 0.01
  )
  check(
    'the head of the gangway is above the far end of it',
    L.bridgeSpot(L.SEA_LANE.atWallX, 0)[1] > L.boardingSpot(0)[1],
    `${L.bridgeSpot(L.SEA_LANE.atWallX, 0)[1].toFixed(2)} vs ${L.boardingSpot(0)[1].toFixed(2)}`
  )
  check(
    'the gangway reaches from the mast-head to the wall face',
    Math.abs(g.fromX - L.bridgeSpot(L.SEA_LANE.atWallX, 0)[0]) < 0.01
  )
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

/* ------------------------------------------------ the title-screen framing */

/*
 * Does the opening shot actually contain the city, and can it ever see past
 * the edge of the world?
 *
 * Both earlier framings were set by nudging numbers and looking at a still,
 * and both were wrong in ways a still hid: one left a third of the frame as
 * empty Marmara with the peninsula stranded behind the title panel, the other
 * ran the land walls off the left edge and cut the Galata keep in half. A
 * third fault only showed at odd window shapes — the zoom is solved from the
 * viewport, so a letterbox strip pulled the camera back until the Asian
 * landmass was a green slab floating in the sea with its underside showing.
 *
 * The camera module owns the constants. The projection is worked out again
 * here, from those constants, rather than by calling the module's own
 * `groundQuad` — a check that runs the code under test can only ever prove
 * that code agrees with itself, which is how two of the engine checks came to
 * pass on mutants.
 */
{
  const cam = await import(base + 'src/three/panoramaCamera.js')
  const { CITY_SPAN, CITY_RISE, AIM, ORBIT, WORLD, panoramaZoom } = cam

  // The subject: the shoreline, the tallest domes over it, and the keep at
  // Galata — the three things the shot is *of*.
  const subject = []
  for (const [x, z] of city.PENINSULA) {
    subject.push([x, 0, z])
    subject.push([x, 8, z])
  }
  subject.push([27, 14, -24.1])
  subject.push([6, 22, 8])

  /** The camera's screen basis at one point in the drift. */
  const basis = (angle) => {
    const eye = [
      Math.sin(angle) * ORBIT.radius,
      ORBIT.radius * ORBIT.lift,
      Math.cos(angle) * ORBIT.radius,
    ]
    const f = [AIM[0] - eye[0], AIM[1] - eye[1], AIM[2] - eye[2]]
    const fl = Math.hypot(...f)
    for (let i = 0; i < 3; i++) f[i] /= fl
    const r = [-f[2], 0, f[0]]
    const rl = Math.hypot(...r)
    for (let i = 0; i < 3; i++) r[i] /= rl
    const u = [
      r[1] * f[2] - r[2] * f[1],
      r[2] * f[0] - r[0] * f[2],
      r[0] * f[1] - r[1] * f[0],
    ]
    return { f, r, u }
  }

  /** The subject's bounding box in the camera's screen plane. */
  const project = (angle) => {
    const { r, u } = basis(angle)
    let x0 = Infinity
    let x1 = -Infinity
    let y0 = Infinity
    let y1 = -Infinity
    for (const p of subject) {
      const d = [p[0] - AIM[0], p[1] - AIM[1], p[2] - AIM[2]]
      const sx = d[0] * r[0] + d[1] * r[1] + d[2] * r[2]
      const sy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2]
      x0 = Math.min(x0, sx)
      x1 = Math.max(x1, sx)
      y0 = Math.min(y0, sy)
      y1 = Math.max(y1, sy)
    }
    return { x0, x1, y0, y1 }
  }

  /** Where the frame's corners land on the water. */
  const footprint = (angle, halfW, halfH) => {
    const { f, r, u } = basis(angle)
    const out = []
    for (const sx of [-halfW, halfW]) {
      for (const sy of [-halfH, halfH]) {
        const o = [
          AIM[0] + sx * r[0] + sy * u[0],
          AIM[1] + sx * r[1] + sy * u[1],
          AIM[2] + sx * r[2] + sy * u[2],
        ]
        const t = -o[1] / f[1]
        out.push([o[0] + t * f[0], o[2] + t * f[2]])
      }
    }
    return out
  }

  /*
   * The shapes a classroom might actually use, and then some it will not.
   * The wide and narrow extremes are the ones that broke: on those the zoom is
   * clamped and the shot crops instead of pulling back, so they are checked
   * for staying inside the world rather than for showing all of the city.
   */
  const shapes = [
    ['4:3', 1024, 768, true],
    ['16:10', 1680, 1050, true],
    ['16:9', 1920, 1080, true],
    ['21:9', 2560, 1080, true],
    ['32:9', 5120, 1440, true],
    ['a tall window', 800, 1026, true],
    ['a portrait window', 600, 1000, false],
    ['a letterbox strip', 1900, 300, false],
  ]

  for (const [label, w, h, mustFitCity] of shapes) {
    const zoom = panoramaZoom(w, h)
    const halfW = w / zoom / 2
    const halfH = h / zoom / 2

    if (mustFitCity) {
      let worst = Infinity
      let worstEdge = ''
      let lowest = Infinity
      for (let k = -1; k <= 1; k++) {
        const b = project(ORBIT.angle + k * ORBIT.sweep)
        for (const [edge, m] of [
          ['left', halfW + b.x0],
          ['right', halfW - b.x1],
          ['bottom', halfH + b.y0],
          ['top', halfH - b.y1],
        ]) {
          if (m < worst) {
            worst = m
            worstEdge = edge
          }
        }
        lowest = Math.min(lowest, (b.y0 + b.y1) / 2)
      }
      check(
        `the whole city stays in frame at ${label}, across the drift`,
        worst > 0.5,
        `tightest margin ${worst.toFixed(1)} units at the ${worstEdge}`
      )
      // And sitting low, so the title panel lands on sky rather than on rooftops.
      check(
        `the city sits below centre at ${label}`,
        lowest < -0.5,
        `subject centre ${lowest.toFixed(1)} units from the middle`
      )
    }

    // Nothing may ever be framed outside the modelled world — this is the one
    // that has to hold at *every* shape, including the ones that crop.
    let over = 0
    let where = ''
    for (let k = -1; k <= 1; k++) {
      for (const [x, z] of footprint(ORBIT.angle + k * ORBIT.sweep, halfW, halfH)) {
        for (const [amount, edge] of [
          [x - WORLD.x[1], 'east'],
          [WORLD.x[0] - x, 'west'],
          [z - WORLD.z[1], 'south'],
          [WORLD.z[0] - z, 'north'],
        ]) {
          if (amount > over) {
            over = amount
            where = edge
          }
        }
      }
    }
    check(
      `the shot never sees past the world at ${label}`,
      over <= 0.01,
      `${over.toFixed(1)} units over the ${where} edge`
    )
  }

  /*
   * No landmass may show a cut edge inside the world.
   *
   * A landmass is an extruded outline, so wherever its outline runs, there is
   * a vertical face dropping to the sea floor. Along a coast that face is the
   * shore and it is meant to be seen. Along the straight inland lines that
   * close the polygon it is the edge of the model, and seeing it is the whole
   * defect this work is about.
   *
   * The two are easy to tell apart without hand-listing them: `refineCoast`
   * subdivides every coast, so no coastal segment is longer than about six
   * units, while the inland closures are ninety to two hundred and seventy.
   * Anything long is a cut, and no cut may come inside the bounds.
   *
   * Checking min and max of the whole outline instead — which is what this
   * did first — proves nothing: moving one corner of Asia back to its old
   * slab cut left the extremes untouched and the check passed.
   */
  const spans = (a, b, lo, hi) => {
    // Does the segment a→b overlap the slab lo ≤ · ≤ hi on one axis?
    const [p, q] = a <= b ? [a, b] : [b, a]
    return q >= lo && p <= hi
  }
  const crossesWorld = (a, b) => {
    // Cheap and sufficient: the bounds are axis-aligned and the cuts are
    // axis-aligned or nearly so, so overlapping on both axes means it is in.
    if (!spans(a[0], b[0], WORLD.x[0], WORLD.x[1])) return false
    if (!spans(a[1], b[1], WORLD.z[0], WORLD.z[1])) return false
    return true
  }

  for (const [name, outline] of [
    ['Thrace', city.EUROPE],
    ['Asia', city.ASIA],
  ]) {
    let worst = null
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i]
      const b = outline[(i + 1) % outline.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len < 12) continue
      if (crossesWorld(a, b)) worst = { a, b, len }
    }
    check(
      `${name} shows no cut edge inside the shot`,
      worst === null,
      worst
        ? `a ${worst.len.toFixed(0)}-unit straight edge from (${worst.a}) to (${worst.b})`
        : ''
    )
  }

  /*
   * The south is the exception, and deliberately so: there the land stops at
   * the Asian shore and the Marmara runs on to the haze, which is what a sea
   * does. What must not happen is the *water* running out, so the plane has to
   * cover the southern bound with room to spare.
   */
  const backdrop = await readFile(base + 'src/three/CityScene.jsx', 'utf8')
  const [, planeW, planeD] = backdrop.match(/planeGeometry args=\{\[(\d+), (\d+)\]\}/)
  const [, waterZ] = backdrop.match(/position=\{\[0, 0\.25, (-?\d+)\]\}/)
  const southEdge = Number(waterZ) + Number(planeD) / 2
  const eastEdge = Number(planeW) / 2
  check(
    'the sea covers the southern bound, where there is no land to close the view',
    southEdge > WORLD.z[1] + 20 && eastEdge > WORLD.x[1] + 20,
    `water reaches z ${southEdge}, x ${eastEdge}`
  )
}

/* ------------------------------------------------------------ the farmland */

/*
 * Two field blocks may not lie on top of each other on the same plane.
 *
 * This is the flicker. The first version of the countryside scattered blocks
 * at random over zones far too small to hold them and put every strip's top
 * face at exactly the same height, so several thousand times a frame the
 * graphics card had to choose between two surfaces at the same depth. Outside
 * the land walls the ground crawled.
 *
 * The planner now rejects overlaps outright and gives every block its own
 * plane regardless. Both are checked, because either alone would do and
 * neither should be allowed to quietly stop working.
 *
 * The overlap test here is point sampling, not the separating-axis test the
 * planner uses. A check that calls the predicate under test cannot catch that
 * predicate being wrong — and the predicate *was* wrong once: it was a
 * bounding-circle proxy, and it passed fifty-five real overlaps.
 */
{
  const country = await import(base + 'src/three/geometry/countryside.js')
  const plan = country.fieldPlan({})
  const hills = country.hillPlan({})

  check('the countryside is actually dressed', plan.length > 45, `${plan.length} blocks`)

  const zones = new Set(plan.map((b) => b.zone))
  check(
    'every zone got fields — outside the walls, behind Galata, and in Asia',
    ['thrace', 'pera', 'chalcedon'].every((z) => zones.has(z)),
    [...zones].join(', ')
  )

  /** A scatter of points inside a block, in world coordinates. */
  const sample = (b) => {
    const c = Math.cos(b.angle)
    const s = Math.sin(b.angle)
    const out = []
    for (let i = 0; i <= 6; i++) {
      for (let j = 0; j <= 6; j++) {
        const u = (i / 6 - 0.5) * b.width
        const v = (j / 6 - 0.5) * b.depth
        out.push([b.x + c * u + s * v, b.z - s * u + c * v])
      }
    }
    return out
  }
  /** Is a world point inside a block? Rotate it back and compare. */
  const holds = (b, [x, z]) => {
    const c = Math.cos(-b.angle)
    const s = Math.sin(-b.angle)
    const dx = x - b.x
    const dz = z - b.z
    return (
      Math.abs(dx * c + dz * s) <= b.width / 2 + 1e-9 &&
      Math.abs(-dx * s + dz * c) <= b.depth / 2 + 1e-9
    )
  }

  let overlapping = 0
  let coplanar = 0
  let worstGap = Infinity
  const points = plan.map(sample)
  for (let i = 0; i < plan.length; i++) {
    for (let j = i + 1; j < plan.length; j++) {
      const gap = Math.abs(plan[i].y - plan[j].y)
      worstGap = Math.min(worstGap, gap)
      if (gap < 1e-4) coplanar++
      if (points[i].some((p) => holds(plan[j], p)) || points[j].some((p) => holds(plan[i], p))) {
        overlapping++
      }
    }
  }

  check('no two blocks of fields lie on top of each other', overlapping === 0, `${overlapping} pairs`)
  check('no two blocks of fields share a plane', coplanar === 0, `${coplanar} pairs`)
  check(
    'the planes are far enough apart to be told apart',
    worstGap > 1e-3,
    `closest ${worstGap.toExponential(1)} units`
  )

  // And nothing ploughed up a hillside: the hills are hemispheres, so a flat
  // slab laid over one sinks into the near flank and comes out of the far.
  let onHill = 0
  for (const b of plan) {
    for (const h of hills) {
      const c = Math.cos(-h.angle)
      const s = Math.sin(-h.angle)
      const dx = b.x - h.x
      const dz = b.z - h.z
      const u = (dx * c - dz * s) / h.rx
      const v = (dx * s + dz * c) / h.rz
      if (u * u + v * v < 1) onHill++
    }
  }
  check('no field is ploughed across a hill', onHill === 0, `${onHill} on hills`)
}

console.log('')
if (failures) {
  console.error(`${failures} scene invariant(s) failed`)
  process.exit(1)
}
console.log('All scene invariants hold.')
