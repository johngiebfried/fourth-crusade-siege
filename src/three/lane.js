/**
 * The numbers that define the two assault lanes.
 *
 * These live apart from the scene components on purpose. They are the world's
 * dimensions — where each wall stands, how tall it is, where the camera
 * watches from, where a ladder's foot goes — and they are what the scene
 * checks in `scripts/check-scene.mjs` assert against. A plain `.js` module can
 * be imported by Node; a `.jsx` component file cannot.
 *
 * This split exists because of a real bug: the gate-opening camera was written
 * against a fifteen-unit gate wall, the wall later grew to a hundred and
 * fifty, and the camera ended up buried in masonry with nothing to check it.
 */

/* ------------------------------------------------------------- land lane */

/** Lane landmarks, in world X. Everything else positions off these. */
export const LANE = {
  campX: -20,
  /**
   * Where the army forms up, and the spacing of its rows.
   *
   * Held back from the counterscarp rather than crowding it. Men waiting to
   * go in do not stand on the lip of the ditch — they stand off it, out of
   * bowshot of the wall head, and come forward when it is their turn.
   */
  musterX: -23.2,
  musterRow: 1.9,
  moatX: -13,
  moatWidth: 3.4,
  outerWallX: -8,
  outerWallWidth: 1.4,
  terraceX: -4,
  innerWallX: 0,
  innerWallWidth: 2.2,
  gateX: 9,
  gateWidth: 2.4,
  cityX: 14,
  /** Wall length along Z. Deliberately far longer than the camera sees, so no
   *  end of the chain is ever in frame. */
  laneDepth: 150,
}

/**
 * The city gate: the third barrier, at `LANE.gateX`, dead on the lane's centre
 * line. Shared by the land assault, where it stays shut, and by the bribery's
 * close-up, where it is opened from within — so both screens are looking at
 * the same gatehouse rather than two different ideas of one.
 */
export const CITY_GATE = {
  z: 0,
  /** Half the opening: a doorway two crusaders wide, not a breach. */
  halfGap: 1.3,
  towerRadius: 1.55,
}

export const HEIGHTS = {
  outerWall: 3.4,
  innerWall: 7.4,
  outerTower: 5.0,
  tower: 9.8,
  gate: 6.2,
}

/**
 * Towers march along each wall; the outer line's are smaller and interleaved.
 *
 * Counts rather than spacings, because the wall length is what they divide.
 * Set about a third further apart than they first were — close together, as
 * the real circuit is, but not shoulder to shoulder.
 */
/**
 * The gate the assault goes in at.
 *
 * The army did not pick a stretch of blank curtain. In 1203 they fought at the
 * north end of the land walls, up by the Blachernae, and a gate is where an
 * assault concentrates: it is the one place the wall can be opened rather than
 * climbed, the causeway across the ditch is already built, and the ground in
 * front of it is a road rather than a slope. This stands in for the Gate of
 * Charisius — the Adrianople Gate — the northernmost of the great gates and
 * the one nearest the fighting of the year before.
 *
 * Off the centre line on purpose: dead centre it would sit behind the roll
 * readout and split the muster in two.
 */
export const LAND_GATE = {
  z: -14.5,
  /**
   * Half the opening in each wall line.
   *
   * Small, but not so small that the men going through it look like mice.
   * The first version used 3.4 on a wall 7.4 high — a seven-unit hole in a
   * seven-and-a-half-unit wall, which is a breach, not a gate. The correction
   * then overshot: at 0.95 the opening was narrower than two crusaders
   * abreast. This sits between, and still reads as a doorway in a wall rather
   * than a gap in one.
   */
  innerHalf: 1.35,
  outerHalf: 1.15,
}

/**
 * Towers along the lane's 150 units.
 *
 * Nineteen apiece was far too many: it put one every eight units against a
 * tower three units wide, so the wall read as a row of buttresses with slots
 * between them. The real ratio is nothing like that — ninety-six towers over
 * five and a half kilometres is one every fifty-odd metres, against a tower
 * some five metres wide — and the Byzantium 1200 renders show long unbroken
 * runs of curtain with a big tower standing clear at intervals.
 *
 * Nine gives one every sixteen or so, which is about three in frame at the
 * lane camera's framing. The two lines still interleave by half a spacing, so
 * an outer tower always covers the gap between two inner ones.
 */
export const INNER_TOWERS = 9
export const OUTER_TOWERS = 9

export const LAND_FOV = 22

/**
 * From the watched point back to the camera: out on the attackers' side, well
 * up, and round toward +Z so the line of the walls runs across the frame.
 */
export const LAND_OFFSET = [-0.62, 0.5, 0.6]

/**
 * Each stage names the point it watches and how much *vertical* world space
 * must be in frame. Height rather than width, because the wall chain stacks up
 * the screen; solving from width crops it on the wide displays a projector is.
 */
/**
 * `height` is the vertical extent the frame must contain; the camera distance
 * is solved from it.
 *
 * The later stages are pulled in. Stage one has the whole army on the ground
 * and needs the width, but by stage two only the survivors are left and the
 * frame was still sized for the crowd — so a handful of men stood tiny in the
 * middle of a lot of masonry and sky, at exactly the point where the class is
 * watching individuals rather than an army.
 */
export const LAND_FRAMINGS = {
  'first-wall': { at: [-10.5, 3.0, 0], height: 29 },
  'second-wall': { at: [-3.0, 4.4, 0], height: 25 },
  'city-gates': { at: [5.0, 4.2, 0], height: 26 },
  wide: { at: [-4, 4.0, 0], height: 42 },
}

/* --------------------------------------------------------------- ladders */

export const LADDER_LEAN = 0.34 // ~20 degrees off vertical, about right

/**
 * A ladder long enough to clear the parapet, with its foot set back exactly
 * far enough that leaning it puts the head on the wall face rather than inside
 * the masonry.
 *
 * `behind` is how much clear ground lies behind the foot. If the ladder is
 * longer than that it cannot be laid flat and toppled up without sweeping
 * through whatever is back there, so it swings up along the wall instead.
 */
export function placeLadder({ wallX, wallWidth, wallHeight, obstacleX = null, z = 0 }) {
  const faceX = wallX - wallWidth / 2
  const topY = wallHeight + 0.55 // clear the parapet so you can step off
  const length = topY / Math.cos(LADDER_LEAN)
  const footX = faceX - length * Math.sin(LADDER_LEAN)
  const behind = obstacleX === null ? Infinity : footX - obstacleX
  return {
    position: [footX, 0, z],
    height: length,
    lean: LADDER_LEAN,
    alongWall: length > behind,
    faceX,
    topY,
  }
}

export function ladderFor(stageKey, z) {
  if (stageKey === 'first-wall') {
    // Open field behind — room to topple a ladder up the ordinary way.
    return placeLadder({
      wallX: LANE.outerWallX,
      wallWidth: LANE.outerWallWidth,
      wallHeight: HEIGHTS.outerWall,
      obstacleX: null,
      z,
    })
  }
  if (stageKey === 'second-wall') {
    // The terrace, hemmed in by the back of the outer wall.
    return placeLadder({
      wallX: LANE.innerWallX,
      wallWidth: LANE.innerWallWidth,
      wallHeight: HEIGHTS.innerWall,
      obstacleX: LANE.outerWallX + LANE.outerWallWidth / 2,
      z,
    })
  }
  return null
}

/* ---------------------------------------------------------- gate opening */

/**
 * Standing just outside the gate, in the ground between it and the inner wall,
 * looking up at it and through it into the city.
 *
 * This used to stand inside the city looking back, on the reasoning that the
 * ground out here — under seven units — was too shallow to frame the gate. It
 * is shallow, but a low camera with a wide lens looking up frames a doorway
 * well, and the view from inside had two faults the move fixes. It showed the
 * gatehouse's back: the towers, arch rings and relieving arch all face the
 * field, so from the city the gate was a plain wall with a hole in it. And it
 * showed the wrong thing through the opening — more wall. From out here the
 * doors swing away from the camera and the city appears behind them, which is
 * the crusaders' view, and the students are the crusaders.
 */
export const GATE_CAMERA = {
  start: [LANE.gateX - 6.3, 1.55, 1.1],
  end: [LANE.gateX - 5.1, 1.5, 0.45],
  look: [LANE.gateX, 3.3, 0],
  fov: 64,
}

/** The street kept clear in front of the gate, so the camera has ground. */
export const GATE_STREET = { halfWidth: 11, untilX: 32 }

/* -------------------------------------------------------------- sea lane */

/**
 * The sea lane reads across the Horn, not along it: the far bank at the near
 * end, the water, then the city wall. The ships start drawn up on that bank
 * and row the whole way over, which is what makes the crossing legible.
 *
 * The channel is deliberately narrower than it first was. The Golden Horn is
 * an inlet a few hundred metres across, not an open sea, and at the old width
 * the ships spent the whole animation as specks in the middle of it.
 */
export const SEA_LANE = {
  /** Where the Galata bank ends and the water begins. */
  shoreX: -38,
  /** Ships drawn up on the beach, before they push off. */
  stagingX: -34,
  /** Mid-channel — where a ship that founders goes down. */
  approachX: -21,
  atWallX: -7.4,
  wallX: 0,
  wallWidth: 1.9,
  insideX: 7,
  laneDepth: 150,
}

export const SEA_HEIGHTS = {
  wall: 5.8,
  tower: 8.0,
  water: 0,
}

/**
 * Ship dimensions the assault needs to reason about: where the deck is, where
 * the flying bridge sits between the mast-heads, and the gangway run from
 * there down onto the parapet.
 *
 * Here rather than in the screen so the scene checks can assert that a
 * boarder's path really is along the plank — up to the bridge, then across —
 * instead of a diagonal leap from the deck at the wall.
 */
export const SEA_SHIP = {
  mastLocalX: 0.2,
  mastBaseY: 1.7,
  mastHeight: 6.2,
  pairMid: 1.175,
  deckY: 1.78,
}

export const MAST_TOP_Y = SEA_SHIP.mastBaseY + SEA_SHIP.mastHeight * 0.86

/** The gangway, run out from the bridge and dropped on the parapet. */
export function gangwayGeometry() {
  const mastX = SEA_LANE.atWallX + SEA_SHIP.mastLocalX
  const wallFaceX = SEA_LANE.wallX - SEA_LANE.wallWidth / 2
  const run = wallFaceX - mastX
  const drop = MAST_TOP_Y - (SEA_HEIGHTS.wall + 0.35)
  return {
    fromX: mastX,
    fromY: MAST_TOP_Y,
    toX: wallFaceX,
    toY: SEA_HEIGHTS.wall + 0.35,
    length: Math.hypot(run, drop) + 0.5,
    drop: Math.atan2(drop, run),
  }
}

export const SEA_TOWERS = 12
export const SEA_TOWER_RADIUS = 1.25

/** Tower centres along the sea wall, in the order SeaScene builds them. */
export function seaTowerZs() {
  const spacing = SEA_LANE.laneDepth / SEA_TOWERS
  const out = []
  for (let i = 0; i < SEA_TOWERS; i++) {
    out.push(-SEA_LANE.laneDepth / 2 + spacing * (i + 0.5))
  }
  return out
}

/** The tower whose centre is nearest a given depth. */
export function nearestSeaTower(z) {
  let best = null
  for (const tz of seaTowerZs()) {
    if (best === null || Math.abs(tz - z) < Math.abs(best - z)) best = tz
  }
  return best
}

/**
 * Push a depth clear of the towers, which stand proud of the wall face.
 *
 * A gangway is dropped straight in along X, so wherever a ship lies is where
 * its men land. Put a ship opposite a tower and the plank runs into masonry
 * and the boarder ends up standing inside it — which is exactly what happened.
 */
export function clearOfSeaTowers(z, margin = 1.1) {
  const keep = SEA_TOWER_RADIUS + margin
  const tz = nearestSeaTower(z)
  const d = z - tz
  if (Math.abs(d) >= keep) return z
  return tz + (d >= 0 ? keep : -keep)
}

/**
 * Where each ship lies across the Horn.
 *
 * Narrower than it was: at the old spread the outermost ship of a five-ship
 * fleet sat outside the frame on a laptop, because the camera looks along the
 * lane rather than square across it and the near end of the line runs out of
 * the bottom corner.
 *
 * The line is then slid bodily along the wall to the offset that keeps every
 * berth as far from a tower as it can. Pushing ships *individually* clear of
 * the towers was tried first and is worse: with a large fleet the pushes
 * bunch neighbours together until hulls overlap. Sliding the whole line keeps
 * the spacing exactly even and still lands most berths in a bay.
 */
export const HULL_PAIR_WIDTH = 2.6

export function seaFleetZs(count) {
  // Narrow for the frame, but never so narrow that hulls interpenetrate.
  const spread = Math.max(Math.min(24, Math.max(8, count * 7)), (count - 1) * HULL_PAIR_WIDTH)
  const raw = []
  for (let i = 0; i < count; i++) {
    raw.push(count === 1 ? 0 : -spread / 2 + (spread * i) / Math.max(1, count - 1))
  }

  const spacing = SEA_LANE.laneDepth / SEA_TOWERS
  const worstFor = (bias) => {
    let worst = Infinity
    for (const z of raw) {
      const gz = z + bias + SEA_SHIP.pairMid
      worst = Math.min(worst, Math.abs(gz - nearestSeaTower(gz)))
    }
    return worst
  }

  // The least shift that gets every berth clear; failing that, the shift that
  // gets closest. Keeping the bias small matters — a big slide takes the far
  // end of the line out of frame, which is the other half of this problem.
  const keep = SEA_TOWER_RADIUS + 1.1
  let bias = 0
  let best = -Infinity
  // Half a bay either way is enough; beyond that the pattern repeats.
  for (let b = -spacing / 2; b <= spacing / 2; b += 0.05) {
    const w = worstFor(b)
    const clears = w >= keep
    const bestClears = best >= keep
    if (clears && bestClears) {
      if (Math.abs(b) < Math.abs(bias)) [best, bias] = [w, b]
    } else if (clears || w > best) {
      ;[best, bias] = [w, b]
    }
  }
  return raw.map((z) => z + bias)
}

export function seaShipZ(index, count) {
  return seaFleetZs(count)[index]
}

/** The depth the gangway is hinged at: the middle of the lashed pair. */
export function gangwayHeadZ(shipZ, lane = 0) {
  return shipZ + SEA_SHIP.pairMid + lane
}

/**
 * Where the far end of the gangway is laid down.
 *
 * Straight across from its head, except where that would drop it on a tower —
 * with a crowded fleet a berth can end up opposite one. There the plank is
 * swung a few degrees to land beside the tower instead, which is what men
 * would do with it, and which keeps the walk a walk: the boarder still goes
 * from the head of the plank to its foot in a straight line, because the line
 * he follows is the plank.
 */
export function gangwayFootZ(shipZ, lane = 0) {
  return clearOfSeaTowers(gangwayHeadZ(shipZ, lane), 0.75)
}

/** How far the plank is swung off square, in radians. */
export function gangwaySkew(shipZ) {
  const g = gangwayGeometry()
  const across = gangwayFootZ(shipZ) - gangwayHeadZ(shipZ)
  return Math.atan2(across, g.toX - g.fromX)
}

/** Where a boarder steps off the gangway onto the parapet. */
export function boardingSpot(shipZ, lane = 0) {
  const g = gangwayGeometry()
  return [g.toX + 0.35, SEA_HEIGHTS.wall + 0.65, gangwayFootZ(shipZ, lane)]
}

/** Where a boarder waits at the head of the gangway, up on the flying bridge. */
export function bridgeSpot(shipX, shipZ, lane = 0) {
  return [shipX + SEA_SHIP.mastLocalX, MAST_TOP_Y + 0.2, gangwayHeadZ(shipZ, lane)]
}
export const SEA_FOV = 32

/**
 * Lower than the land lane, and deliberately so. At the land lane's thirty
 * degrees the horizon sits outside the top of the frame, which is fine over a
 * field but wrong here: it hides the far shore, and the point of this lane is
 * that the fleet is inside the Golden Horn with Galata opposite.
 */
export const SEA_OFFSET = [-0.7, 0.33, 0.63]

export const SEA_FRAMINGS = {
  approach: { at: [-19, 4.5, 0], height: 40 },
  piloting: { at: [-18, 4.5, 0], height: 38 },
  boarding: { at: [-5.0, 5.6, 0], height: 29 },
  breaking: { at: [2.0, 5.4, 0], height: 29 },
}

/* --------------------------------------------------------------- helpers */

const norm = ([x, y, z]) => {
  const m = Math.hypot(x, y, z)
  return [x / m, y / m, z / m]
}

/**
 * Where a stage's camera ends up: distance solved from the vertical extent it
 * must show, then stepped back along the offset direction.
 */
export function cameraFor({ framing, offset, fov, aspect = 16 / 9, clamp = [26, 200] }) {
  const halfFov = (fov * Math.PI) / 360
  const widthRelief = aspect < 1.2 ? 1.2 / Math.max(0.6, aspect) : 1
  const raw = (framing.height / 2 / Math.tan(halfFov)) * widthRelief
  const dist = Math.min(clamp[1], Math.max(clamp[0], raw))
  const u = norm(offset)
  return {
    position: [
      framing.at[0] + u[0] * dist,
      framing.at[1] + u[1] * dist,
      framing.at[2] + u[2] * dist,
    ],
    look: framing.at,
    dist,
  }
}

/** The slabs a camera must never be standing inside. */
export function landWallSlabs() {
  return [
    {
      name: 'outer wall',
      x: [LANE.outerWallX - LANE.outerWallWidth / 2, LANE.outerWallX + LANE.outerWallWidth / 2],
      top: HEIGHTS.tower,
    },
    {
      name: 'inner wall',
      x: [LANE.innerWallX - LANE.innerWallWidth / 2, LANE.innerWallX + LANE.innerWallWidth / 2],
      top: HEIGHTS.tower,
    },
    {
      name: 'gate wall',
      x: [LANE.gateX - LANE.gateWidth / 2, LANE.gateX + LANE.gateWidth / 2],
      top: HEIGHTS.gate + 1.2,
    },
  ]
}

export function seaWallSlabs() {
  return [
    {
      name: 'sea wall',
      x: [SEA_LANE.wallX - SEA_LANE.wallWidth / 2, SEA_LANE.wallX + SEA_LANE.wallWidth / 2],
      top: SEA_HEIGHTS.tower,
    },
  ]
}
