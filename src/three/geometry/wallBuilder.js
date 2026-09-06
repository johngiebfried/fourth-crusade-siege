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

    // The parapet stands on the outer edge of the wall-walk rather than across
    // its full thickness, so the walk itself reads as a surface men stand on
    // and the merlons throw a shadow across it.
    const parapetW = topW * 0.42
    const parapetX = x - topW * 0.29

    // A course of corbels under the wall head, oversailing the face.
    //
    // The surviving walls carry this and it does a great deal of work at a
    // distance: it puts a hard line of shadow along the top of the masonry, so
    // the wall reads as something built in stages rather than as one extruded
    // slab. Cheap — one small box per merlon pitch.
    for (let i = 0; i < runs; i++) {
      parts.push(
        courseBox(topW * 0.16, merlonWidth * 0.8, 0.13, PALETTE.wallStoneAlt,
          x - topW * 0.52, capY - 0.1, startZ + i * pitch,
          { tone: 1.08 })
      )
    }
    const stringCourse = courseBox(topW * 1.06, depth, 0.1, PALETTE.wallStoneAlt, x, capY - 0.02, z, {
      tone: 1.04,
    })
    parts.push(stringCourse)

    // Walk floor, set a little below the parapet.
    parts.push(
      courseBox(topW, depth, 0.16, PALETTE.towerStone, x, capY + 0.08, z, {
        tone: 0.9,
        aoHeight: 0.5,
      })
    )
    // Inner kerb, so the walk is bounded on both sides.
    parts.push(
      courseBox(topW * 0.2, depth, merlonHeight * 0.5, PALETTE.wallStoneAlt, x + topW * 0.4,
        capY + merlonHeight * 0.25 + 0.16, z, { tone: 0.88, aoHeight: 0.4 })
    )

    for (let i = 0; i < runs; i++) {
      parts.push(
        courseBox(
          parapetW,
          merlonWidth,
          merlonHeight,
          i % 2 === 0 ? PALETTE.wallStone : PALETTE.wallStoneAlt,
          parapetX,
          capY + merlonHeight / 2 + 0.16,
          startZ + i * pitch,
          { tone: 0.96 + rand() * 0.1, aoHeight: 0.4 }
        )
      )
      // An embrasure sill between every pair of merlons — the gap a defender
      // actually shoots and looks through.
      parts.push(
        courseBox(
          parapetW,
          merlonGap,
          merlonHeight * 0.32,
          PALETTE.wallStoneAlt,
          parapetX,
          capY + merlonHeight * 0.16 + 0.16,
          startZ + i * pitch + pitch / 2,
          { tone: 0.82, aoHeight: 0.4 }
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
  // Narrower than the gaps between them. Drawn the other way round the
  // parapet reads as a low wall with slots cut in it; the reconstructions of
  // these walls show the opposite — upright teeth with air between them.
  merlonWidth = 0.44,
  merlonGap = 0.56,
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

  // A cornice at the head, then the tower's own crenellations.
  //
  // Every tower here used to end in a plain slab, which is why the square ones
  // read as featureless blocks — the gate's pair worst of all, since they are
  // the largest. Every tower in the reconstructions is crenellated, and the
  // teeth are most of what makes a tower read as a fighting platform rather
  // than a pillar.
  const crown = polygonal
    ? new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, merlonHeight * 0.5, 7, 1)
    : new THREE.BoxGeometry(radius * 2.05, merlonHeight * 0.5, radius * 2.05)
  crown.translate(x, capY + merlonHeight * 0.25, z)
  paintMasonry(crown, PALETTE.towerStone, { tone: 1.06, aoHeight: 0.4 })
  parts.push(crown)

  const mY = capY + merlonHeight * 0.5
  const mH = merlonHeight * 0.95
  if (polygonal) {
    const ring = radius * 0.88
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      const m = new THREE.BoxGeometry(radius * 0.42, mH, radius * 0.42)
      m.rotateY(-a)
      m.translate(x + Math.sin(a) * ring, mY + mH / 2, z + Math.cos(a) * ring)
      paintMasonry(m, i % 2 ? PALETTE.wallStone : PALETTE.wallStoneAlt, { tone: 1.0 })
      parts.push(m)
    }
  } else {
    const half = radius * 0.78
    const per = 3
    for (const [ax, az] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      for (let i = 0; i < per; i++) {
        const t = (i + 0.5) / per - 0.5
        const m = new THREE.BoxGeometry(radius * 0.4, mH, radius * 0.4)
        m.translate(
          x + ax * half + az * t * half * 2,
          mY + mH / 2,
          z + az * half + ax * t * half * 2
        )
        paintMasonry(m, i % 2 ? PALETTE.wallStone : PALETTE.wallStoneAlt, { tone: 1.0 })
        parts.push(m)
      }
    }
  }

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
  gate = null,
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

  if (gate) parts.push(...buildGatehouse(gate))

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


/**
 * A gatehouse, rebuilt against the Byzantium 1200 reconstruction of the Porta
 * Rhegium — the Silver Gate, the military gate of these walls.
 *
 * The first attempt was wrong in the way beginners draw castles: an enormous
 * arch, nearly seven units wide in a wall seven and a half high, standing open.
 * The reconstruction shows the opposite on every count.
 *
 *   **The opening is small.** A doorway a cart passes through, perhaps a third
 *   of the wall's height. The wall is the point; the gate is a hole in it.
 *
 *   **It is shut.** These are besieged walls. A gate standing open is an
 *   invitation, and the whole third round of this game is about paying someone
 *   to open one.
 *
 *   **It goes through.** The doors are set back a full wall-thickness behind
 *   the face, so the arch reads as the mouth of a passage rather than as a
 *   shape painted on masonry. That depth is most of what was missing.
 *
 *   **The towers are square, large, and behind.** They rise well above the
 *   curtain and read as a pair guarding the road, not as decoration flanking
 *   an arch.
 *
 * There is also a relieving arch above the main one — a second ring carrying
 * the wall's weight off the lintel — which is on the real gates and is the
 * detail that stops the head of the arch looking pasted on.
 */
export function buildGatehouse({
  x,
  z,
  halfGap,
  wallWidth,
  wallHeight,
  towerRadius,
  towerHeight,
  seed = 31,
  doors = true,
}) {
  const rand = jitterer(seed)
  const parts = []
  const inward = -1 // the field is at -x; the passage runs toward +x

  // Flanking towers: square, set just clear of the opening, taller than the
  // curtain's own towers.
  for (const side of [-1, 1]) {
    parts.push(
      ...towerParts({
        radius: towerRadius,
        height: towerHeight,
        x: x - towerRadius * 0.4,
        z: z + side * (halfGap + towerRadius * 1.15),
        polygonal: false,
        rand,
      })
    )
  }

  const springing = wallHeight * 0.3
  const archR = halfGap
  const crown = springing + archR

  // The passage walls, running the full thickness of the curtain.
  for (const side of [-1, 1]) {
    const jamb = new THREE.BoxGeometry(wallWidth * 1.06, crown, 0.5)
    jamb.translate(x, crown / 2, z + side * (halfGap + 0.25))
    parts.push(paintMasonry(jamb, PALETTE.wallStone, { tone: 0.97, aoHeight: crown }))
  }

  // The arch ring at the outer face, and a relieving arch above it.
  const face = x + inward * wallWidth * 0.62
  const ring = new THREE.TorusGeometry(archR, 0.16, 5, 14, Math.PI)
  ring.rotateY(Math.PI / 2)
  ring.translate(face, springing, z)
  parts.push(paintMasonry(ring, PALETTE.wallStoneAlt, { tone: 1.12 }))

  const relieving = new THREE.TorusGeometry(archR * 1.28, 0.11, 5, 14, Math.PI)
  relieving.rotateY(Math.PI / 2)
  relieving.translate(face + 0.02, springing, z)
  parts.push(paintMasonry(relieving, PALETTE.wallBrick, { tone: 1.0 }))

  // The masonry between the two arches, and the wall carried over the top.
  const tymp = new THREE.BoxGeometry(wallWidth * 0.2, archR * 0.3, halfGap * 2)
  tymp.translate(face, crown + archR * 0.16, z)
  parts.push(paintMasonry(tymp, PALETTE.wallStone, { tone: 0.94 }))

  const over = new THREE.BoxGeometry(wallWidth * 1.06, wallHeight - crown - archR * 0.34, halfGap * 2 + 1.0)
  over.translate(x, crown + archR * 0.34 + (wallHeight - crown - archR * 0.34) / 2, z)
  parts.push(paintMasonry(over, PALETTE.wallStone, { tone: 0.99, aoHeight: 1.2 }))

  // The passage floor and its dark vault, so the opening reads as depth
  // rather than as a hole cut in a flat.
  const soffit = new THREE.BoxGeometry(wallWidth * 1.0, 0.14, halfGap * 2)
  soffit.translate(x, crown - 0.05, z)
  parts.push(paintMasonry(soffit, PALETTE.wallStone, { tone: 0.42 }))

  const floor = new THREE.BoxGeometry(wallWidth * 1.2, 0.12, halfGap * 2)
  floor.translate(x, 0.06, z)
  parts.push(paintMasonry(floor, PALETTE.wallStoneAlt, { tone: 0.6 }))

  if (doors) {
    // Shut, and set back a wall-thickness so the passage has depth in front
    // of them. Two leaves, banded with iron.
    const leafW = halfGap - 0.04
    const doorX = x + inward * wallWidth * 0.1
    for (const side of [-1, 1]) {
      const leaf = new THREE.BoxGeometry(0.2, springing + archR * 0.92, leafW)
      leaf.translate(doorX, (springing + archR * 0.92) / 2, z + side * (leafW / 2 + 0.02))
      parts.push(paintMasonry(leaf, PALETTE.hullTimberDark, { tone: 0.7, aoHeight: springing }))

      for (let b = 0; b < 3; b++) {
        const band = new THREE.BoxGeometry(0.24, 0.14, leafW * 0.94)
        band.translate(doorX - 0.02, 0.5 + b * 1.0, z + side * (leafW / 2 + 0.02))
        parts.push(paintMasonry(band, '#3a3630', { tone: 1.0 }))
      }
    }
  }

  return parts
}
