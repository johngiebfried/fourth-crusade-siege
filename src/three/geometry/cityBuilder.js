/**
 * Constantinople, seen whole.
 *
 * The governing facts, all of which change what shapes you reach for:
 *
 *  - The skyline is domes, not spires. Hundreds of them.
 *  - There are no minarets. They arrive with the Ottoman conquest in 1453,
 *    nearly 250 years after this scene.
 *  - The city sits on a triangular peninsula: the Golden Horn to the north,
 *    the Sea of Marmara to the south, the Theodosian land walls closing the
 *    western base, and Seraglio Point at the eastern tip.
 *  - Hagia Sophia is the one dominant landmark — a shallow dome on a windowed
 *    drum, flanked by two half-domes — standing near the tip beside the
 *    Hippodrome and the Great Palace.
 *  - Blachernae holds the north-west corner, where the land walls meet the
 *    water.
 *
 * The townscape is merged into a single vertex-coloured geometry so several
 * hundred buildings cost one draw call.
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

/** The peninsula outline, west (land walls) to east (Seraglio Point). */
export const PENINSULA = [
  [-31, -20.5],
  [-14, -17.5],
  [4, -13],
  [19, -8.5],
  [31, -2.5],
  [33.5, 1.5],
  [22, 8],
  [6, 13.5],
  [-12, 18],
  [-31, 20.5],
]

/** Land surface of the peninsula, with a little relief inland. */
export function buildPeninsula({ thickness = 1.6 } = {}) {
  const shape = new THREE.Shape()
  shape.moveTo(PENINSULA[0][0], PENINSULA[0][1])
  for (let i = 1; i < PENINSULA.length; i++) shape.lineTo(PENINSULA[i][0], PENINSULA[i][1])
  shape.closePath()

  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  // Shape is built in XY; lay it flat so Y is up.
  g.rotateX(Math.PI / 2)
  g.translate(0, thickness, 0)
  paint(g, '#8d8a63')
  g.computeVertexNormals()
  return g
}

/** Where the ground is, given how far inland — the city sits on a low ridge. */
export function groundHeight(x, z, base = 1.6) {
  const ridge = Math.exp(-Math.pow((z + 1) / 11, 2)) * 2.4
  const rise = Math.exp(-Math.pow((x - 12) / 26, 2)) * 1.1
  return base + ridge + rise
}

/** Is this point inside the peninsula outline? */
export function insidePeninsula(x, z, margin = 2) {
  let inside = false
  for (let i = 0, j = PENINSULA.length - 1; i < PENINSULA.length; j = i++) {
    const [xi, zi] = PENINSULA[i]
    const [xj, zj] = PENINSULA[j]
    const hit = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (hit) inside = !inside
  }
  if (!inside) return false
  // Keep a margin in from the coast so nothing straddles the shoreline.
  for (let i = 0, j = PENINSULA.length - 1; i < PENINSULA.length; j = i++) {
    const [xi, zi] = PENINSULA[i]
    const [xj, zj] = PENINSULA[j]
    const dx = xj - xi
    const dz = zj - zi
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz)))
    const px = xi + t * dx
    const pz = zi + t * dz
    if (Math.hypot(x - px, z - pz) < margin) return false
  }
  return true
}

/**
 * The townscape: dense housing with domed churches scattered through it.
 * Everything merges into one geometry.
 */
export function buildTownscape({ seed = 7, houses = 520, churches = 60 } = {}) {
  const rand = rng(seed)
  const parts = []

  const pick = () => {
    for (let tries = 0; tries < 40; tries++) {
      const x = -31 + rand() * 65
      const z = -21 + rand() * 42
      if (insidePeninsula(x, z, 2.2)) return [x, z]
    }
    return null
  }

  // Ordinary housing: low blocks with tiled roofs.
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

  // Churches: a drum and a shallow dome. This is the shape that makes the
  // skyline read as Byzantine rather than as a western European town.
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
