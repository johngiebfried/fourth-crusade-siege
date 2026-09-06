/**
 * The geography of Constantinople and its waters.
 *
 * The thing that has to be right, because everything else reads off it:
 * Constantinople is not an island. It sits at the eastern end of a European
 * landmass, and the Theodosian land walls exist precisely because there is
 * open ground — Thrace — on the other side of them. Beyond the walls is an
 * army's approach, not water.
 *
 * The Golden Horn is an inlet, not a strait. It opens off the Bosphorus at the
 * east and runs inland to the north-west, where it ends. That means the land
 * north of the Horn — Galata and Pera, where the crusader camp stood — joins
 * the same European landmass around the head of the inlet. Europe is therefore
 * one shape with a notch cut into it, not two shapes with a channel between.
 *
 * East of the Bosphorus is Asia. South of the peninsula is the Sea of Marmara.
 */

import * as THREE from 'three'
import * as kit from './buildingKit.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'

/** Deterministic RNG, so the city is the same city every time it loads. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paint(geometry, hex) {
  const colour = new THREE.Color(hex)
  const count = geometry.attributes.position.count
  const colours = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    colours[i * 3] = colour.r
    colours[i * 3 + 1] = colour.g
    colours[i * 3 + 2] = colour.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  return geometry
}

/* --------------------------------------------------------------- outlines */

/**
 * The European landmass, traced as one closed outline:
 *   Marmara coast running east → Seraglio Point → back west along the Horn's
 *   south shore → around the head of the Horn → east again along its north
 *   shore (Galata) → Galata Point → north up the Bosphorus → far inland.
 * The Golden Horn is the notch this leaves behind.
 */
/* --------------------------------------------------------------- coasts */

/**
 * Turn a handful of control points into a coastline.
 *
 * The geography was laid out as polygons with three or four vertices over
 * seventy units, which is a ruler-drawn shore: the Bosphorus bank ran dead
 * straight for its whole length and the peninsula came out as a wedge. Real
 * coasts have headlands and bays at every scale, and it is the *irregularity*
 * that reads as land rather than as a diagram.
 *
 * Two passes. Chaikin's corner-cutting rounds the polyline — twice, which is
 * enough to lose the facets without turning it to mush. Then each point is
 * displaced along the local normal by two sine waves of different wavelength,
 * which gives bays with headlands inside them. Deterministic, so the shore is
 * the same every load and the placement tests stay meaningful.
 */
function chaikin(points, closed = false) {
  const out = []
  const n = points.length
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const [ax, az] = points[i]
    const [bx, bz] = points[(i + 1) % n]
    out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25])
    out.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75])
  }
  if (!closed) {
    out.unshift(points[0])
    out.push(points[n - 1])
  }
  return out
}

/**
 * @param anchors indices into the *input* that must not move — a headland the
 *   rest of the scene is built against, or the point where a wall meets water.
 */
export function refineCoast(points, { seed = 1, passes = 2, amp = 1.6, closed = false } = {}) {
  const fixed = points.map(([x, z]) => [x, z])
  let pts = fixed
  for (let i = 0; i < passes; i++) pts = chaikin(pts, closed)

  const n = pts.length
  return pts.map(([x, z], i) => {
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    // Outward normal of the local run of shore.
    const dx = next[0] - prev[0]
    const dz = next[1] - prev[1]
    const len = Math.hypot(dx, dz) || 1
    const nx = dz / len
    const nz = -dx / len

    const t = i / n
    // Two wavelengths: broad bays, and headlands within them.
    const wobble =
      Math.sin(t * Math.PI * 2 * 3.7 + seed * 1.7) * 0.62 +
      Math.sin(t * Math.PI * 2 * 11.3 + seed * 4.1) * 0.26 +
      Math.sin(t * Math.PI * 2 * 23.9 + seed * 9.3) * 0.12

    // Ends of an open coast stay put, so refined runs still meet their
    // neighbours; the taper is over the first and last tenth.
    const edge = closed ? 1 : Math.min(1, Math.min(i, n - 1 - i) / (n * 0.1))

    return [x + nx * wobble * amp * edge, z + nz * wobble * amp * edge]
  })
}

/*
 * The peninsula's two water edges, refined once and shared.
 *
 * EUROPE and PENINSULA both describe this shore. Refining them separately
 * would let them drift apart, and the city would end up with buildings in the
 * Marmara — so the shore is generated here and both polygons are composed from
 * the same arrays.
 */
const HORN_SOUTH = refineCoast(
  [
    [-31, -21.5],
    [-24, -20.2],
    [-16, -17.5],
    [-8, -15.8],
    [0, -13.5],
    [7, -12.4],
    [14, -9.5],
    [21, -7.6],
    [27, -5],
    [32, -3],
    [35.5, -1.5],
  ],
  { seed: 3, amp: 1.5 }
)

const MARMARA_NORTH = refineCoast(
  [
    [34, 1],
    [30, 3.8],
    [27, 6.2],
    [22, 9.4],
    // The coast bellies out south of the straight line between its ends,
    // around the harbours of Julian and Theodosius. The city was drawn with
    // this run dead straight and came out as a wedge with a point on it; the
    // belly is most of what stops that, and it is also where the harbours
    // actually were.
    [16, 13.6],
    [9, 17.2],
    [2, 19.4],
    [-5, 21.0],
    [-12, 22.4],
    [-20, 24.0],
    [-26, 24.8],
    [-31, 25.5],
  ],
  { seed: 7, amp: 2.1 }
)

export const PENINSULA = [...HORN_SOUTH, ...MARMARA_NORTH]

/**
 * Europe, from the Marmara round the Horn to the Bosphorus.
 *
 * The land walls face this: open Thracian ground, not water. That was wrong in
 * the first version and is the single most important thing on this map.
 */
export const EUROPE = [
  /*
   * Marmara coast, west to the land walls.
   *
   * It runs a long way further west than anything is meant to be looked at.
   * The shot's bounds are 126 units west of the origin; the coast goes to 168,
   * so that where this landmass genuinely ends — in a straight cut with its
   * extruded side showing — is somewhere the camera cannot be pointed. See
   * `WORLD` in `panoramaCamera.js`.
   */
  ...refineCoast(
    [
      [-168, 74],
      [-150, 65],
      [-134, 58],
      [-118, 52],
      [-104, 48],
      [-88, 44.5],
      [-72, 41],
      [-60, 37],
      [-50, 33],
      [-40, 29],
      [-31, 25.5],
    ],
    { seed: 11, amp: 2.2 }
  ),
  // The peninsula's own shore, reversed: Marmara back east, then round
  // Seraglio Point and west along the Horn.
  ...[...MARMARA_NORTH].reverse(),
  ...[...HORN_SOUTH].reverse(),
  // Golden Horn, south shore continuing west past the walls.
  ...refineCoast(
    [
      [-31, -21.5],
      [-38, -23.4],
      [-45, -25],
      [-51, -26.8],
      [-57, -28.6],
      [-66, -31.2],
    ],
    { seed: 13, amp: 0.85 }
  ),
  // Golden Horn, north shore: back east from the head of the inlet.
  ...refineCoast(
    [
      [-66, -31.2],
      [-62, -35.4],
      [-56, -37.2],
      [-49, -35.8],
      [-42, -35],
      [-34, -33.8],
      [-26, -32.5],
      [-17, -30.8],
      [-8, -29],
      [1, -27.3],
      [10, -25.5],
      [17, -23.8],
      [24, -22],
      [31, -20],
      [36, -18],
    ],
    { seed: 17, amp: 1.0 }
  ),
  // Bosphorus, European bank running north. Straight in the first version for
  // seventy-seven units; the real bank is a run of small bays.
  ...refineCoast(
    [
      [36, -18],
      [38, -24],
      [39, -30],
      [40, -42],
      [41, -56],
      [41, -74],
      [41, -95],
      [42, -118],
      [43, -142],
      [44, -166],
    ],
    { seed: 19, amp: 2.0 }
  ),
  // Inland Thrace. Off the edge of the shot in every direction.
  [-168, -166],
]

/**
 * Asia, across the Bosphorus.
 *
 * Its southern end used to be a straight line at z = 66 between two inland
 * corners, so on a wide frame the whole landmass read as a green slab floating
 * in the Marmara with its cut side showing. That line is where the land does
 * stop — and it stays there — but it is a coast now: the Asian shore of the
 * Marmara, running east-south-east away from Chalcedon toward the Gulf of
 * Nicomedia, which is the direction it actually goes.
 */
export const ASIA = [
  [55, -166],
  [150, -166],
  [150, 108],
  // The Marmara's Asian shore, running back west to Chalcedon.
  ...refineCoast(
    [
      [146, 104],
      [128, 96],
      [112, 88],
      [96, 80],
      [80, 72],
      [70, 68],
      [62, 66],
    ],
    { seed: 31, amp: 2.2 }
  ),
  // The Bosphorus bank, which was four points over a hundred and thirty units.
  ...refineCoast(
    [
      [62, 66],
      [58, 50],
      [56, 34],
      [53, 20],
      [52, 8],
      [53, -3],
      [54, -14],
      [53, -27],
      [52, -40],
      [53, -53],
      [55, -66],
      [55, -80],
      [55, -95],
      [55, -120],
      [55, -145],
      [55, -166],
    ],
    { seed: 23, amp: 2.4 }
  ),
]

/** Galata and Pera, the shore north of the Horn where the camp stood. */
export const GALATA = refineCoast(
  [
    [-34, -34],
    [-26, -32.4],
    [-18, -31],
    [-10, -29.6],
    [-2, -28],
    [6, -26.4],
    [14, -24.8],
    [22, -22.8],
    [31, -20.4],
    [36.5, -18.4],
    [38, -28],
    [30, -30],
    [22, -32],
    [13, -33.8],
    [4, -35.5],
    [-6, -36.8],
    [-16, -38],
    [-25, -39],
    [-34, -40],
  ],
  { seed: 29, amp: 1.3, closed: true }
)

/** Where the land walls stand, and how far they run. */
export const LAND_WALL_X = -31
export const LAND_WALL_FROM = -21.5
export const LAND_WALL_TO = 25.5

/* ---------------------------------------------------------------- terrain */

/** Sea level, and the height of the flat coastal land. */
export const SHORE_Y = 1.6

/**
 * The city stands on a ridge — the "seven hills" — so the ground rises inland
 * from the shore. This is the surface buildings sit on, and it is matched by
 * an actual ridge mesh in the scene so nothing floats above the terrain.
 */
export function groundHeight(x, z) {
  const u = (x - 6) / 27
  const v = (z - 1.5) / 9.5
  const r = 1 - u * u - v * v
  return SHORE_Y + (r > 0 ? Math.sqrt(r) * 0.95 : 0)
}

export const RIDGE = { cx: 6, cz: 1.5, rx: 27, rz: 9.5, height: 0.95 }

/* ------------------------------------------------------------- point tests */

export function insidePolygon(points, x, z) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i]
    const [xj, zj] = points[j]
    const hit = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (hit) inside = !inside
  }
  return inside
}

/** Inside the polygon, and at least `margin` clear of any edge. */
export function wellInside(points, x, z, margin = 2) {
  if (!insidePolygon(points, x, z)) return false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i]
    const [xj, zj] = points[j]
    const dx = xj - xi
    const dz = zj - zi
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz)))
    if (Math.hypot(x - (xi + t * dx), z - (zi + t * dz)) < margin) return false
  }
  return true
}

export const insidePeninsula = (x, z, margin = 2) => wellInside(PENINSULA, x, z, margin)

/* --------------------------------------------------------------- landmass */

/** Extrude a coastline outline into a landmass with cliff edges at the shore. */
export function buildLandmass(points, { thickness = SHORE_Y, hex = '#8d8a63' } = {}) {
  const shape = new THREE.Shape()
  shape.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1])
  shape.closePath()

  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  g.rotateX(Math.PI / 2) // shape is built in XY; lay it flat
  g.translate(0, thickness, 0)
  paint(g, hex)
  g.computeVertexNormals()
  return g
}

/* -------------------------------------------------------------- townscape */

/**
 * The townscape: dense housing with domed churches through it. Merged into one
 * vertex-coloured geometry, so several hundred buildings cost one draw call.
 */
/**
 * Ground the townscape leaves clear: the four landmarks and the open precinct
 * around them. Shared with the cypress planting, so neither ends up growing
 * out of the Hagia Sophia's roof.
 */
export const LANDMARK_KEEP_OFF = [
  [23, -1, 6.2], // Hagia Sophia and the Augustaion
  [8, 5, 6.4], // Hippodrome
  [17, 4.5, 4.4], // Great Palace terraces
  [-27, -16.5, 4.2], // Blachernae
]

export function buildTownscape({ seed = 7, houses = 520, churches = 60 } = {}) {
  const rand = rng(seed)
  const parts = []

  const pick = () => {
    for (let tries = 0; tries < 40; tries++) {
      const x = -31 + rand() * 68
      const z = -22 + rand() * 48
      if (!insidePeninsula(x, z, 1.2)) continue
      // Keep the housing off the ceremonial quarter. This is not only so the
      // landmarks can be seen: the Augustaion, the Hippodrome and the Great
      // Palace were one enormous open precinct, and packing tenements over
      // them would be the same mistake as building on the Forum in Rome.
      if (LANDMARK_KEEP_OFF.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue
      return [x, z]
    }
    return null
  }

  // Houses, from the kit rather than as a box with a slab on top. Each one is
  // walls with a band of shade under the eaves, a ridged roof that oversails,
  // and gable ends — and the AO band along its base is what sets it on the
  // ground instead of letting it hover there.
  for (let i = 0; i < houses; i++) {
    const spot = pick()
    if (!spot) continue
    const [x, z] = spot
    const y = groundHeight(x, z)
    const w = 0.5 + rand() * 0.7
    const d = 0.5 + rand() * 0.7
    const h = 0.5 + rand() * 0.9

    const g = kit.house({
      w,
      d,
      h,
      wallHex: rand() > 0.4 ? PALETTE.cityWall : '#d3c6ad',
      roofHex: PALETTE.cityRoof,
      // Per-house tone, so a street does not read as one house repeated.
      tone: 0.9 + rand() * 0.22,
      roofPitch: 0.3 + rand() * 0.2,
    })
    g.rotateY(rand() * Math.PI)
    g.translate(x, y, z)
    parts.push(g)
  }

  // The shape that makes the skyline Byzantine rather than western European:
  // a drum carrying a shallow dome, now with a windowed drum, a cornice at the
  // springing, lean-to roofs over the aisles and an apse to one end. No spires
  // anywhere in this city.
  for (let i = 0; i < churches; i++) {
    const spot = pick()
    if (!spot) continue
    const [x, z] = spot
    const y = groundHeight(x, z)

    const g = kit.church({
      r: 0.42 + rand() * 0.4,
      h: 0.9 + rand() * 0.8,
      wallHex: PALETTE.cityWall,
      roofHex: PALETTE.cityRoof,
      domeHex: rand() > 0.82 ? PALETTE.domeGold : PALETTE.domeLead,
      tone: 0.94 + rand() * 0.16,
    })
    g.rotateY(rand() * Math.PI * 2)
    g.translate(x, y, z)
    parts.push(g)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Galata's houses, on the far shore. Merged the same way. */
export function buildGalataTown({ seed = 41, houses = 90 } = {}) {
  const rand = rng(seed)
  const parts = []

  for (let i = 0; i < houses; i++) {
    let spot = null
    for (let tries = 0; tries < 30; tries++) {
      const x = -32 + rand() * 68
      const z = -39 + rand() * 20
      if (wellInside(GALATA, x, z, 1.4)) {
        spot = [x, z]
        break
      }
    }
    if (!spot) continue
    const [x, z] = spot
    const w = 0.45 + rand() * 0.6
    const h = 0.45 + rand() * 0.8

    const g = kit.house({
      w,
      d: w * (0.8 + rand() * 0.5),
      h,
      wallHex: rand() > 0.5 ? '#cdc0a4' : '#bfb197',
      roofHex: '#9d6a4c',
      tone: 0.9 + rand() * 0.2,
      roofPitch: 0.3 + rand() * 0.18,
    })
    g.rotateY(rand() * Math.PI)
    g.translate(x, SHORE_Y, z)
    parts.push(g)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
