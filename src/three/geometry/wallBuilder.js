/**
 * Procedural Theodosian wall geometry.
 *
 * Built as stacked masonry courses merged into a single BufferGeometry with
 * per-vertex colours, so the alternating stone/brick banding — the cloisonné
 * levelling-course technique that reads instantly as Byzantine rather than
 * generic medieval — costs nothing but vertex colours. No texture maps.
 *
 * Towers alternate square and polygonal, as on the real inner wall, rather
 * than the uniform round drums of a Western castle.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE, courseColours } from '../palette.js'

const COURSE_HEIGHT = 0.34

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

function courseBox(width, depth, height, hex, x, y, z) {
  const g = new THREE.BoxGeometry(width, height, depth)
  paint(g, hex)
  g.translate(x, y, z)
  return g
}

/**
 * A banded wall block: stacked courses, slight batter (taper) toward the top,
 * topped with merlons.
 */
export function buildBandedWall({
  width = 1.6,
  depth = 14,
  height = 7,
  x = 0,
  z = 0,
  batter = 0.12,
  merlons = true,
  merlonWidth = 0.55,
  merlonGap = 0.45,
  merlonHeight = 0.55,
} = {}) {
  const parts = []
  const courseCount = Math.max(1, Math.round(height / COURSE_HEIGHT))
  const colours = courseColours(courseCount)

  for (let i = 0; i < courseCount; i++) {
    const t = i / courseCount
    const w = width * (1 - batter * t)
    const y = i * COURSE_HEIGHT + COURSE_HEIGHT / 2
    // Brick levelling courses sit very slightly proud of the stone.
    const isBrick = colours[i] === PALETTE.wallBrick || colours[i] === PALETTE.wallBrickAlt
    // Brick courses sit barely proud of the stone — enough to catch light,
    // not enough to turn the wall into corduroy.
    parts.push(courseBox(isBrick ? w * 1.012 : w, depth, COURSE_HEIGHT, colours[i], x, y, z))
  }

  if (merlons) {
    const topY = courseCount * COURSE_HEIGHT
    const topW = width * (1 - batter)
    const pitch = merlonWidth + merlonGap
    const runs = Math.floor(depth / pitch)
    const startZ = z - (runs * pitch) / 2 + pitch / 2
    for (let i = 0; i < runs; i++) {
      parts.push(
        courseBox(
          topW,
          merlonWidth,
          merlonHeight,
          i % 2 === 0 ? PALETTE.wallStone : PALETTE.wallStoneAlt,
          x,
          topY + merlonHeight / 2,
          startZ + i * pitch
        )
      )
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * A wall tower. `polygonal` gives the faceted plan seen on the inner wall;
 * otherwise a square tower. Towers alternate along the wall in reality, so
 * callers should alternate the flag.
 */
export function buildTower({
  radius = 1.5,
  height = 9.5,
  x = 0,
  z = 0,
  polygonal = false,
  merlonHeight = 0.5,
} = {}) {
  const parts = []
  const courseCount = Math.max(1, Math.round(height / COURSE_HEIGHT))
  const colours = courseColours(courseCount)

  for (let i = 0; i < courseCount; i++) {
    const y = i * COURSE_HEIGHT + COURSE_HEIGHT / 2
    const isBrick = colours[i] === PALETTE.wallBrick || colours[i] === PALETTE.wallBrickAlt
    const r = radius * (isBrick ? 1.02 : 1)
    let g
    if (polygonal) {
      // Seven-sided drum reads as the polygonal towers of the inner circuit.
      g = new THREE.CylinderGeometry(r, r, COURSE_HEIGHT, 7, 1)
    } else {
      g = new THREE.BoxGeometry(r * 1.8, COURSE_HEIGHT, r * 1.8)
    }
    paint(g, colours[i])
    g.translate(x, y, z)
    parts.push(g)
  }

  // Crown: a plain parapet ring rather than merlons, to keep the tower silhouette legible
  const crownY = courseCount * COURSE_HEIGHT + merlonHeight / 2
  const crown = polygonal
    ? new THREE.CylinderGeometry(radius * 1.12, radius * 1.12, merlonHeight, 7, 1)
    : new THREE.BoxGeometry(radius * 2.05, merlonHeight, radius * 2.05)
  paint(crown, PALETTE.towerStone)
  crown.translate(x, crownY, z)
  parts.push(crown)

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Flat ground slab, optionally water-coloured, for field and moat. */
export function buildGround({ width = 60, depth = 30, hex = PALETTE.fieldGrass, x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.BoxGeometry(width, 0.4, depth)
  paint(g, hex)
  g.translate(x, y - 0.2, z)
  g.computeVertexNormals()
  return g
}
