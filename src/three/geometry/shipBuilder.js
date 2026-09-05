/**
 * Venetian nave geometry.
 *
 * A round-hulled transport with raised castles fore and aft, a single mast and
 * a square sail — not a longship, not a multi-bank oar galley, and nothing
 * resembling a later galleon.
 *
 * The hull is a LatheGeometry tub, squashed along Z, which gives the tubby
 * round-bellied section a nave actually had. The castles are where the height
 * for the flying bridges came from, so they are built proud of the deck.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'

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

/** Hull profile, from keel up to the sheer strake. */
function hullProfile() {
  return [
    new THREE.Vector2(0.04, 0),
    new THREE.Vector2(0.44, 0.16),
    new THREE.Vector2(0.74, 0.42),
    new THREE.Vector2(0.92, 0.74),
    new THREE.Vector2(1.0, 1.05),
    new THREE.Vector2(0.99, 1.18),
    new THREE.Vector2(0.86, 1.16),
  ]
}

/**
 * One hull, its long axis along X, bow toward +X.
 * Returns a merged, vertex-coloured geometry.
 */
export function buildHull({ length = 5.2, beam = 1.9, depth = 1.5 } = {}) {
  const parts = []

  const tub = new THREE.LatheGeometry(hullProfile(), 16)
  tub.scale(length / 2, depth, beam / 2)
  paint(tub, PALETTE.hullTimber)
  parts.push(tub)

  // Wale: a darker rubbing strake around the sheer.
  const wale = new THREE.TorusGeometry(1.0, 0.06, 6, 20)
  wale.rotateX(Math.PI / 2)
  wale.scale(length / 2, 1, beam / 2)
  wale.translate(0, depth * 1.1, 0)
  paint(wale, PALETTE.hullTimberDark)
  parts.push(wale)

  // Deck.
  const deck = new THREE.CylinderGeometry(1, 1, 0.1, 16)
  deck.scale(length / 2.25, 1, beam / 2.3)
  deck.translate(0, depth * 1.12, 0)
  paint(deck, '#9a7550')
  parts.push(deck)

  // Fore and aft castles — the height the flying bridge was rigged from.
  const castle = (x, w, h) => {
    const g = new THREE.BoxGeometry(w, h, beam * 0.72)
    paint(g, PALETTE.hullTimberDark)
    g.translate(x, depth * 1.12 + h / 2, 0)
    return g
  }
  parts.push(castle(length * 0.36, length * 0.2, 0.9)) // forecastle
  parts.push(castle(-length * 0.36, length * 0.22, 1.05)) // sterncastle

  // Castle parapets, so they read as fighting platforms rather than crates.
  const rail = (x, w, h) => {
    const g = new THREE.BoxGeometry(w, 0.16, beam * 0.78)
    paint(g, '#8a6642')
    g.translate(x, depth * 1.12 + h + 0.08, 0)
    return g
  }
  parts.push(rail(length * 0.36, length * 0.22, 0.9))
  parts.push(rail(-length * 0.36, length * 0.24, 1.05))

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Mast, yard and furled square sail for one hull. */
export function buildMast({ height = 6.2, beam = 1.9 } = {}) {
  const parts = []

  const mast = new THREE.CylinderGeometry(0.11, 0.14, height, 8)
  mast.translate(0, height / 2, 0)
  paint(mast, PALETTE.hullTimber)
  parts.push(mast)

  // Yard, crossed near the head.
  const yard = new THREE.CylinderGeometry(0.07, 0.07, beam * 2.1, 6)
  yard.rotateX(Math.PI / 2)
  yard.translate(0, height * 0.78, 0)
  paint(yard, PALETTE.hullTimberDark)
  parts.push(yard)

  // Fighting top.
  const top = new THREE.CylinderGeometry(0.42, 0.32, 0.28, 10)
  top.translate(0, height * 0.88, 0)
  paint(top, PALETTE.hullTimberDark)
  parts.push(top)

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * The flying bridge: the rigged plank walkway run between the mast-tops of two
 * lashed ships. This, not a freestanding siege tower, is what Clari and
 * Villehardouin describe at the sea walls.
 */
export function buildFlyingBridge({ span = 4.2, height = 5.4 } = {}) {
  const parts = []

  const plank = new THREE.BoxGeometry(0.85, 0.12, span)
  paint(plank, '#a8874f')
  plank.translate(0, height, 0)
  parts.push(plank)

  // Rope rails either side.
  for (const off of [-0.45, 0.45]) {
    const rail = new THREE.CylinderGeometry(0.035, 0.035, span, 5)
    rail.rotateX(Math.PI / 2)
    rail.translate(off, height + 0.42, 0)
    paint(rail, PALETTE.rigging)
    parts.push(rail)
  }

  // Stanchions.
  const count = 5
  for (let i = 0; i < count; i++) {
    const z = -span / 2 + (span * (i + 0.5)) / count
    for (const off of [-0.45, 0.45]) {
      const post = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 5)
      post.translate(off, height + 0.21, z)
      paint(post, PALETTE.rigging)
      parts.push(post)
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Boarding ramp dropped from the forecastle onto the rampart. */
export function buildRamp({ length = 3.4, width = 1.1 } = {}) {
  const g = new THREE.BoxGeometry(length, 0.14, width)
  paint(g, '#b09055')
  g.translate(length / 2, 0, 0)
  g.computeVertexNormals()
  return g
}
