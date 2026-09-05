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
export function buildTownscape({ seed = 7, houses = 520, churches = 60 } = {}) {
  const rand = rng(seed)
  const parts = []

  const pick = () => {
    for (let tries = 0; tries < 40; tries++) {
      const x = -31 + rand() * 68
      const z = -22 + rand() * 48
      if (insidePeninsula(x, z, 2.0)) return [x, z]
    }
    return null
  }

  for (let i = 0; i < houses; i++) {
    const spot = pick()
    if (!spot) continue
    const [x, z] = spot
    const y = groundHeight(x, z)
    const w = 0.5 + rand() * 0.7
    const d = 0.5 + rand() * 0.7
    const h = 0.5 + rand() * 0.9

    const body = new THREE.BoxGeometry(w, h, d)
    paint(body, rand() > 0.4 ? PALETTE.cityWall : '#d3c6ad')
    body.translate(x, y + h / 2, z)
    parts.push(body)

    const roof = new THREE.BoxGeometry(w * 1.12, 0.16, d * 1.12)
    paint(roof, PALETTE.cityRoof)
    roof.translate(x, y + h + 0.08, z)
    parts.push(roof)
  }

  // The shape that makes the skyline Byzantine rather than western European:
  // a drum carrying a shallow dome. No spires anywhere in this city.
  for (let i = 0; i < churches; i++) {
    const spot = pick()
    if (!spot) continue
    const [x, z] = spot
    const y = groundHeight(x, z)
    const r = 0.42 + rand() * 0.4
    const h = 0.9 + rand() * 0.8

    const naos = new THREE.BoxGeometry(r * 2.6, h, r * 2.6)
    paint(naos, PALETTE.cityWall)
    naos.translate(x, y + h / 2, z)
    parts.push(naos)

    const drum = new THREE.CylinderGeometry(r, r, 0.42, 10)
    paint(drum, '#e2d7bd')
    drum.translate(x, y + h + 0.21, z)
    parts.push(drum)

    const dome = new THREE.SphereGeometry(r * 1.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
    dome.scale(1, 0.55, 1)
    paint(dome, rand() > 0.82 ? PALETTE.domeGold : PALETTE.domeLead)
    dome.translate(x, y + h + 0.42, z)
    parts.push(dome)
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

    const body = new THREE.BoxGeometry(w, h, w)
    paint(body, rand() > 0.5 ? '#cdc0a4' : '#bfb197')
    body.translate(x, SHORE_Y + h / 2, z)
    parts.push(body)

    const roof = new THREE.BoxGeometry(w * 1.15, 0.14, w * 1.15)
    paint(roof, '#9d6a4c')
    roof.translate(x, SHORE_Y + h + 0.07, z)
    parts.push(roof)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
