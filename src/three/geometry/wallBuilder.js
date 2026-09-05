/**
 * Procedural Theodosian wall geometry.
 *
 * Built as stacked masonry courses merged into a single BufferGeometry with
 * per-vertex colours. The alternating stone/brick banding — the cloisonné
 * levelling-course technique that reads instantly as Byzantine rather than
 * generic medieval — costs nothing but vertex colours. No texture maps.
 *
 * Depth comes from three things painted into those same vertex colours, all
 * free at runtime, which matters because this has to run on whatever machine
 * is wired to the classroom projector:
 *
 *   - ambient occlusion, darkening the courses near the ground and under the
 *     parapet overhang, so the wall sits in the landscape instead of floating;
 *   - weathering, staining the lower wall and streaking it down the face;
 *   - per-course and per-block jitter, so the masonry is not a flat wash.
 *
 * An entire wall line — courses, merlons and every tower along it — merges
 * into one geometry, so a wall of twenty-six towers is one draw call.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE, courseColours } from '../palette.js'

const COURSE_HEIGHT = 0.34

/** Deterministic jitter, so a wall looks the same on every load. */
function jitterer(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Paint a piece of masonry, shading each vertex by where it sits.
 *
 * @param {number} tone      per-block brightness jitter, around 1
 * @param {number} aoHeight  height over which ground contact stops darkening
 * @param {number} capY      y of the wall head, for the shadow under the parapet
 */
function paintMasonry(geometry, hex, { tone = 1, aoHeight = 2.2, capY = null } = {}) {
  const colour = new THREE.Color(hex)
  const pos = geometry.attributes.position
  const count = pos.count
  const colours = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i)
    const z = pos.getZ(i)

    // Ground contact: masonry gathers dirt and shadow at its foot.
    let f = 0.46 + 0.42 * Math.min(1, Math.max(0, y) / aoHeight)

    // The parapet oversails, so the top of the face sits in its shadow.
    if (capY !== null) {
      const under = 1 - Math.min(1, Math.abs(capY - y) / 0.9)
      f *= 1 - under * 0.2
    }

    // Damp streaks running down the face, and general blotching.
    f *= 0.955 + 0.045 * Math.sin(z * 2.7)
    f *= 0.975 + 0.05 * Math.sin(z * 11.3 + y * 5.1)

    f *= tone

    colours[i * 3] = colour.r * f
    colours[i * 3 + 1] = colour.g * f
    colours[i * 3 + 2] = colour.b * f
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  return geometry
}

function courseBox(width, depth, height, hex, x, y, z, opts) {
  const g = new THREE.BoxGeometry(width, height, depth)
  g.translate(x, y, z)
  paintMasonry(g, hex, opts)
  return g
}

/** The stacked courses of a wall, with merlons on top. Returns raw parts. */
function wallParts({
  width,
  depth,
  height,
  x,
  z,
  batter,
  merlons,
  merlonWidth,
  merlonGap,
  merlonHeight,
  rand,
}) {
  const parts = []
  const courseCount = Math.max(1, Math.round(height / COURSE_HEIGHT))
  const colours = courseColours(courseCount)
  const capY = courseCount * COURSE_HEIGHT
  const aoHeight = Math.max(1.4, height * 0.45)

  for (let i = 0; i < courseCount; i++) {
    const t = i / courseCount
    const w = width * (1 - batter * t)
    const y = i * COURSE_HEIGHT + COURSE_HEIGHT / 2
    const isBrick = colours[i] === PALETTE.wallBrick || colours[i] === PALETTE.wallBrickAlt
    // Brick courses sit barely proud of the stone — enough to catch light,
    // not enough to turn the wall into corduroy.
    const tone = 0.94 + rand() * 0.12
    parts.push(
      courseBox(isBrick ? w * 1.012 : w, depth, COURSE_HEIGHT, colours[i], x, y, z, {
        tone,
        aoHeight,
        capY,
      })
    )
  }

  if (merlons) {
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
          capY + merlonHeight / 2,
          startZ + i * pitch,
          { tone: 0.96 + rand() * 0.1, aoHeight: 0.4 }
        )
      )
    }
  }

  return parts
}

/** A banded wall on its own. */
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
  seed = 3,
} = {}) {
  const rand = jitterer(seed)
  const parts = wallParts({
    width,
    depth,
    height,
    x,
    z,
    batter,
    merlons,
    merlonWidth,
    merlonGap,
    merlonHeight,
    rand,
  })
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Tower parts, so a tower can be merged into a wall line. */
function towerParts({ radius, height, x, z, polygonal, rand, merlonHeight = 0.5 }) {
  const parts = []
  const courseCount = Math.max(1, Math.round(height / COURSE_HEIGHT))
  const colours = courseColours(courseCount)
  const capY = courseCount * COURSE_HEIGHT
  const aoHeight = Math.max(1.6, height * 0.4)

  for (let i = 0; i < courseCount; i++) {
    const y = i * COURSE_HEIGHT + COURSE_HEIGHT / 2
    const isBrick = colours[i] === PALETTE.wallBrick || colours[i] === PALETTE.wallBrickAlt
    const r = radius * (isBrick ? 1.012 : 1)
    // Seven-sided drums read as the polygonal towers of the inner circuit;
    // the square ones alternate with them, as on the real wall.
    const g = polygonal
      ? new THREE.CylinderGeometry(r, r, COURSE_HEIGHT, 7, 1)
      : new THREE.BoxGeometry(r * 1.8, COURSE_HEIGHT, r * 1.8)
    g.translate(x, y, z)
    paintMasonry(g, colours[i], { tone: 0.94 + rand() * 0.12, aoHeight, capY })
    parts.push(g)
  }

  const crown = polygonal
    ? new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, merlonHeight, 7, 1)
    : new THREE.BoxGeometry(radius * 2.05, merlonHeight, radius * 2.05)
  crown.translate(x, capY + merlonHeight / 2, z)
  paintMasonry(crown, PALETTE.towerStone, { tone: 1.02, aoHeight: 0.4 })
  parts.push(crown)

  // Arrow slits, on the faces that look out over the field.
  for (const sy of [height * 0.45, height * 0.72]) {
    const slit = new THREE.BoxGeometry(0.12, 0.62, 0.2)
    slit.translate(x - radius * (polygonal ? 1.0 : 0.9), sy, z)
    paintMasonry(slit, '#332a22', { tone: 1, aoHeight: 0.2 })
    parts.push(slit)
  }

  return parts
}

/** A tower on its own. */
export function buildTower({
  radius = 1.5,
  height = 9.5,
  x = 0,
  z = 0,
  polygonal = false,
  merlonHeight = 0.5,
  seed = 11,
} = {}) {
  const rand = jitterer(seed)
  const parts = towerParts({ radius, height, x, z, polygonal, rand, merlonHeight })
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * A whole wall line — courses, merlons, every tower, arrow slits and the
 * rubble at its foot — merged into one geometry, so it costs one draw call
 * however long the wall is.
 */
export function buildWallLine({
  wall,
  towers = [],
  rubble = null,
  seed = 5,
} = {}) {
  const rand = jitterer(seed)
  const parts = wallParts({
    width: wall.width,
    depth: wall.depth,
    height: wall.height,
    x: wall.x ?? 0,
    z: wall.z ?? 0,
    batter: wall.batter ?? 0.12,
    merlons: wall.merlons ?? true,
    merlonWidth: wall.merlonWidth ?? 0.55,
    merlonGap: wall.merlonGap ?? 0.45,
    merlonHeight: wall.merlonHeight ?? 0.55,
    rand,
  })

  for (const t of towers) {
    parts.push(
      ...towerParts({
        radius: t.radius,
        height: t.height,
        x: t.x ?? wall.x ?? 0,
        z: t.z,
        polygonal: t.polygonal,
        rand,
      })
    )
  }

  // Spoil and fallen masonry heaped against the foot of the wall. Cheap, and
  // it stops the wall meeting the ground on a dead straight line.
  if (rubble) {
    const { count = 90, from, to, x } = rubble
    for (let i = 0; i < count; i++) {
      const z = from + rand() * (to - from)
      const s = 0.2 + rand() * 0.45
      // Boxes rather than polyhedra: BoxGeometry is indexed and the polyhedra
      // are not, and mergeGeometries refuses a mix of the two.
      const g = new THREE.BoxGeometry(s, s * (0.5 + rand() * 0.5), s * (0.7 + rand() * 0.6))
      g.rotateY(rand() * Math.PI)
      g.rotateZ((rand() - 0.5) * 0.5)
      g.translate(x + (rand() - 0.5) * 1.2, s * 0.3, z)
      paintMasonry(g, rand() > 0.6 ? PALETTE.wallStoneAlt : PALETTE.towerStone, {
        tone: 0.8 + rand() * 0.2,
        aoHeight: 0.9,
      })
      parts.push(g)
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Flat ground slab, optionally water-coloured, for field and moat. */
export function buildGround({
  width = 60,
  depth = 30,
  hex = PALETTE.fieldGrass,
  x = 0,
  y = 0,
  z = 0,
} = {}) {
  const g = new THREE.BoxGeometry(width, 0.4, depth)
  const colour = new THREE.Color(hex)
  const count = g.attributes.position.count
  const colours = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    colours[i * 3] = colour.r
    colours[i * 3 + 1] = colour.g
    colours[i * 3 + 2] = colour.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  g.translate(x, y - 0.2, z)
  g.computeVertexNormals()
  return g
}
