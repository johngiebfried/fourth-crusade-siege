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
  const rand = (n) => Math.abs((Math.sin(n * 71.9) * 43758.5453) % 1)

  const tub = new THREE.LatheGeometry(hullProfile(), 16)
  tub.scale(length / 2, depth, beam / 2)
  // Plank the hull: strakes running its length, darker down at the waterline
  // where the timber sits wet. Vertex colour only — no texture map.
  {
    const base = new THREE.Color(PALETTE.hullTimber)
    const pos = tub.attributes.position
    const cols = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const strake = 0.9 + 0.1 * Math.sign(Math.sin(y * 9.5))
      const wet = 0.62 + 0.38 * Math.min(1, Math.max(0, y - 0.25) / (depth * 0.9))
      const f = strake * wet
      cols[i * 3] = base.r * f
      cols[i * 3 + 1] = base.g * f
      cols[i * 3 + 2] = base.b * f
    }
    tub.setAttribute('color', new THREE.BufferAttribute(cols, 3))
  }
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
  parts.push(castle(length * 0.36, length * 0.2, 0.9))
  parts.push(castle(-length * 0.36, length * 0.22, 1.05))

  const rail = (x, w, h) => {
    const g = new THREE.BoxGeometry(w, 0.16, beam * 0.78)
    paint(g, '#8a6642')
    g.translate(x, depth * 1.12 + h + 0.08, 0)
    return g
  }
  parts.push(rail(length * 0.36, length * 0.22, 0.9))
  parts.push(rail(-length * 0.36, length * 0.24, 1.05))

  // Shields hung along the gunwale — period-correct and instantly readable.
  const shieldColours = ['#8c3b2c', '#3f5a7a', '#c9a24a', '#e8e2d2', '#4d6b45']
  for (let i = 0; i < 7; i++) {
    const x = -length * 0.24 + (i / 6) * length * 0.48
    for (const side of [-1, 1]) {
      const sh = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 10)
      sh.rotateX(Math.PI / 2)
      sh.translate(x, depth * 1.2, side * (beam / 2) * 0.98)
      paint(sh, shieldColours[Math.floor(rand(i * 2 + (side > 0 ? 1 : 0)) * shieldColours.length)])
      parts.push(sh)
    }
  }

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

  // Shrouds from the mast-head down to the rail. Lines do more for a ship's
  // silhouette than almost anything else.
  for (const side of [-1, 1]) {
    for (const lean of [0.26, 0.4]) {
      const len = Math.hypot(height * 0.72, beam * 0.55)
      const shroud = new THREE.CylinderGeometry(0.022, 0.022, len, 4)
      shroud.rotateX(side * lean)
      shroud.translate(0, height * 0.5, side * beam * 0.3)
      parts.push(paint(shroud, PALETTE.rigging))
    }
  }
  // Forestay and backstay.
  for (const dir of [-1, 1]) {
    const stay = new THREE.CylinderGeometry(0.022, 0.022, height * 1.05, 4)
    stay.rotateZ(dir * 0.42)
    stay.translate(dir * height * 0.22, height * 0.5, 0)
    parts.push(paint(stay, PALETTE.rigging))
  }

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

/**
 * The boarding gangway.
 *
 * This is run out from the flying bridge at the mast-heads and dropped onto
 * the rampart — not from the bow. The whole point of lashing two ships
 * together and rigging a bridge between their mast-tops was to get men out
 * onto the wall from *above* it; a ramp off the forecastle would be reaching
 * up at the wall from the deck, which is the problem the bridges were built
 * to solve.
 *
 * Hinged at its inboard end, so it swings down onto the parapet.
 */
export function buildGangway({ length = 5.0, width = 1.15 } = {}) {
  const parts = []

  const plank = new THREE.BoxGeometry(length, 0.13, width)
  plank.translate(length / 2, 0, 0)
  parts.push(paint(plank, '#b09055'))

  // Cleats across it, for footing.
  const count = Math.max(3, Math.round(length / 0.55))
  for (let i = 1; i < count; i++) {
    const cleat = new THREE.BoxGeometry(0.08, 0.06, width * 0.92)
    cleat.translate((length * i) / count, 0.09, 0)
    parts.push(paint(cleat, '#8a6642'))
  }

  // Rope rails either side.
  for (const off of [-1, 1]) {
    const rail = new THREE.CylinderGeometry(0.025, 0.025, length, 4)
    rail.rotateZ(Math.PI / 2)
    rail.translate(length / 2, 0.34, (off * width) / 2)
    parts.push(paint(rail, PALETTE.rigging))
    for (let i = 0; i <= 3; i++) {
      const post = new THREE.CylinderGeometry(0.022, 0.022, 0.34, 4)
      post.translate((length * i) / 3, 0.17, (off * width) / 2)
      parts.push(paint(post, PALETTE.rigging))
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
