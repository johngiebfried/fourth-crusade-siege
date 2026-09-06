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
export const EUROPE = [
  // Marmara coast, west to east
  [-104, 48],
  [-72, 41],
  [-50, 33],
  [-31, 25.5],
  [-14, 20.5],
  [2, 16],
  [16, 10.5],
  [27, 5],
  // Seraglio Point — the eastern tip of the peninsula
  [34, 1],
  [35.5, -1.5],
  // Golden Horn, south shore: east back to west
  [27, -5],
  [14, -9.5],
  [0, -13.5],
  [-16, -17.5],
  [-31, -21.5],
  [-45, -25],
  [-56, -28.5],
  // Head of the Horn — the inlet ends here, and the land joins around it
  [-63, -31.5],
  // Golden Horn, north shore: west back to east
  [-56, -36.5],
  [-42, -35],
  [-26, -32.5],
  [-8, -29],
  [10, -25.5],
  [24, -22],
  [31, -20],
  // Galata Point, where the Horn meets the Bosphorus
  [36, -18],
  // Bosphorus, European bank running north
  [39, -30],
  [41, -56],
  [41, -95],
  // Inland
  [-104, -95],
]

/** Asia, across the Bosphorus. */
export const ASIA = [
  [55, -95],
  [112, -95],
  [112, 66],
  [62, 66],
  [56, 34],
  [52, 8],
  [54, -14],
  [52, -40],
  [55, -66],
]

/**
 * The city itself: the peninsula between the Horn and the Marmara, closed at
 * the west by the land walls. Used for placing buildings and running the sea
 * walls — not for the land, which is part of EUROPE.
 */
export const PENINSULA = [
  [-31, -21.5],
  [-16, -17.5],
  [0, -13.5],
  [14, -9.5],
  [27, -5],
  [35.5, -1.5],
  [34, 1],
  [27, 5],
  [16, 10.5],
  [2, 16],
  [-14, 20.5],
  [-31, 25.5],
]

/** Galata and Pera, the shore north of the Horn where the camp stood. */
export const GALATA = [
  [-34, -34],
  [-18, -31],
  [-2, -28],
  [14, -24.8],
  [31, -20.4],
  [36.5, -18.4],
  [38, -28],
  [22, -32],
  [4, -35.5],
  [-16, -38],
  [-34, -40],
]

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
