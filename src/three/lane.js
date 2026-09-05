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

export const HEIGHTS = {
  outerWall: 3.4,
  innerWall: 7.4,
  outerTower: 5.0,
  tower: 9.8,
  gate: 6.2,
}

/** Towers march along each wall; the outer line's are smaller and interleaved. */
export const INNER_TOWERS = 26
export const OUTER_TOWERS = 26

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
export const LAND_FRAMINGS = {
  'first-wall': { at: [-10.5, 3.0, 0], height: 29 },
  'second-wall': { at: [-3.5, 4.6, 0], height: 31 },
  'city-gates': { at: [5.0, 4.4, 0], height: 33 },
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
 * Standing inside the city, looking back at the gate. The ground between the
 * inner wall and the gate is under seven units deep — nowhere near enough to
 * frame the gate from outside — and this is the better shot anyway: the city
 * is what is being entered, so the city is where the camera should be.
 */
export const GATE_CAMERA = {
  start: [LANE.gateX + 15, 5.2, 8.5],
  end: [LANE.gateX + 9.5, 4.0, 5.0],
  look: [LANE.gateX, 2.6, 0],
  fov: 38,
}

/** The street kept clear in front of the gate, so the camera has ground. */
export const GATE_STREET = { halfWidth: 11, untilX: 32 }

/* -------------------------------------------------------------- sea lane */

export const SEA_LANE = {
  stagingX: -34,
  approachX: -17,
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

export const SEA_TOWERS = 24
export const SEA_FOV = 32

/**
 * Lower than the land lane, and deliberately so. At the land lane's thirty
 * degrees the horizon sits outside the top of the frame, which is fine over a
 * field but wrong here: it hides the far shore, and the point of this lane is
 * that the fleet is inside the Golden Horn with Galata opposite.
 */
export const SEA_OFFSET = [-0.7, 0.242, 0.67]

export const SEA_FRAMINGS = {
  approach: { at: [-18, 4.0, 0], height: 34 },
  piloting: { at: [-13, 4.0, 0], height: 30 },
  boarding: { at: [-4.5, 5.2, 0], height: 26 },
  breaking: { at: [2.5, 5.2, 0], height: 27 },
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
