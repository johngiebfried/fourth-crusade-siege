/**
 * The land beyond the city: Thrace outside the walls, the slopes behind
 * Galata, and the hills that close the view on every side.
 *
 * This exists because the shot is framed from the viewport, so an unusual
 * window shape pulls the camera back and shows whatever is out there. What was
 * out there was nothing — bare green plane to the edge of the landmass, and
 * then the landmass's own extruded side hanging over open water.
 *
 * Two things fix that, and they are different jobs. The camera is clamped so
 * it can never frame past `WORLD` (see `panoramaCamera.js`); that is the
 * guarantee. This module is the other half: it makes the ground inside those
 * bounds worth having in frame.
 *
 * ## What is out there, historically
 *
 * The Theodosian walls did not open onto farmland. Immediately outside them
 * ran the ditch and a cleared field of fire, and beyond that the cemeteries —
 * burial was outside the walls by law — and only past those the market
 * gardens, vineyards and grain land that fed a city of several hundred
 * thousand. That order is kept here: a bare glacis, then cultivation.
 *
 * Fields are drawn as strips rather than as blocks. Open-field agriculture is
 * the right idiom for the period and, usefully, strips are also what reads as
 * farmland from three hundred units up — a patchwork of squares reads as a
 * quilt, and a solid tone reads as nothing at all.
 */

import * as THREE from 'three'
import { paint, merge } from './buildingKit.js'
import { EUROPE, ASIA, SHORE_Y, insidePolygon, wellInside, rng } from './cityBuilder.js'

/**
 * Cultivated ground. Ploughed earth, stubble, fallow and vine — four tones
 * close enough together to read as one landscape and far enough apart to show
 * the strips.
 */
const CROPS = ['#7d6c48', '#a2914f', '#8a8b52', '#6e7a45', '#94854c', '#7f8a4e']

/** Hills, going bluer and paler with distance the way fog will take them. */
const HILL = '#7e8250'

/* ------------------------------------------------------------- footprints */

/** The four corners of a block, in plan. */
function corners({ x, z, angle, width, depth }) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const hw = width / 2
  const hd = depth / 2
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([u, v]) => [x + c * u + s * v, z - s * u + c * v])
}

/**
 * Do two convex quads overlap?
 *
 * Separating axes, tested against the edges of both. A bounding-circle test
 * was tried first and is not good enough: a block's reach is half its
 * diagonal, so its circle is far larger than the block, and packing tight
 * enough to look like farmland let fifty-five real overlaps back in.
 */
export function overlaps(a, b) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]
      const q = poly[(i + 1) % poly.length]
      const nx = -(q[1] - p[1])
      const nz = q[0] - p[0]
      let a0 = Infinity
      let a1 = -Infinity
      let b0 = Infinity
      let b1 = -Infinity
      for (const v of a) {
        const d = v[0] * nx + v[1] * nz
        a0 = Math.min(a0, d)
        a1 = Math.max(a1, d)
      }
      for (const v of b) {
        const d = v[0] * nx + v[1] * nz
        b0 = Math.min(b0, d)
        b1 = Math.max(b1, d)
      }
      if (a1 < b0 || b1 < a0) return false
    }
  }
  return true
}

/* --------------------------------------------------------------- the fields */

/**
 * One block of strip fields: a run of parallel strips sharing a headland, the
 * unit a medieval field system is actually built from.
 */
function fieldBlock(block, rand, onLand) {
  const { x: cx, z: cz, angle, width, depth, strips, crop, y } = block
  const parts = []
  const stripW = width / strips

  /*
   * `rotateY` sends the box's long axis (local +z) to (sin θ, cos θ), so the
   * strips have to be laid out along the perpendicular of *that*, which is
   * (cos θ, −sin θ). Offsetting along (cos θ, sin θ) instead — the obvious
   * thing to write, and what was written — is only perpendicular at θ = 0.
   * Everywhere else the strips walk diagonally across each other, which is
   * why the first version of this scattered planks over Thrace.
   */
  const ax = Math.cos(angle)
  const az = -Math.sin(angle)

  for (let i = 0; i < strips; i++) {
    const offset = -width / 2 + stripW * (i + 0.5)
    // Strips are not all the same length; a block ends against whatever it
    // ends against, so each one is trimmed a little differently.
    const len = depth * (0.78 + rand() * 0.22)
    const x = cx + ax * offset
    const z = cz + az * offset
    if (!onLand(x, z)) continue

    const g = new THREE.BoxGeometry(stripW * 0.88, 0.1, len)
    g.rotateY(angle)
    g.translate(x, y, z)
    paint(g, crop, { tone: 0.86 + rand() * 0.3 })
    parts.push(g)
  }

  return parts
}

/** A row of vines or fruit trees: small cones, evenly spaced, on a bank. */
function orchardRow(cx, cz, angle, length, rand, onLand) {
  const parts = []
  const n = Math.max(3, Math.round(length / 1.6))
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1) - 0.5) * length
    const x = cx + Math.cos(angle) * t
    const z = cz + Math.sin(angle) * t
    if (!onLand(x, z)) continue
    const h = 0.9 + rand() * 0.5
    const g = new THREE.ConeGeometry(0.42 + rand() * 0.18, h, 6)
    g.translate(x, SHORE_Y + h / 2, z)
    paint(g, '#5f6d3f', { tone: 0.86 + rand() * 0.28 })
    parts.push(g)
  }
  return parts
}

/**
 * The zones that get cultivated, and how far each keeps off the walls.
 *
 * `clear` is the glacis: the band next to the land walls that stays open. It
 * is not decoration — a besieged city keeps that ground bare, and the whole
 * point of the panorama is that the walls face open country.
 *
 * `tries` is candidates offered, not blocks placed: most are thrown away for
 * landing in the sea, on the glacis, or on a block already there.
 */
const ZONES = [
  {
    // Thrace, west of the Theodosian walls. The big one.
    name: 'thrace',
    x: [-95, -38],
    z: [-46, 50],
    clear: ([x, z]) => x > -40 && z > -26 && z < 32,
    tries: 2200,
    orchards: 34,
  },
  {
    // Pera, the slopes behind Galata. North of the camp, which sits on the
    // shore at about z −32, and north of the town behind it.
    name: 'pera',
    x: [-58, 44],
    z: [-92, -44],
    clear: () => false,
    tries: 1800,
    orchards: 24,
  },
  {
    // The Asian side behind Chalcedon and Chrysopolis, which stand at x 54–66.
    name: 'chalcedon',
    x: [70, 102],
    z: [-64, 78],
    clear: () => false,
    tries: 1800,
    orchards: 20,
  },
]

/*
 * The bands run in order out from the city: glacis, then farmland, then the
 * hills. The first version had the inner hill lines at x −86 to −104 and the
 * Thracian fields from x −38 to −120, so the hills stood in the middle of the
 * farmland — and since ploughing keeps off a hillside, the hills ate the
 * fields. Twenty-three blocks survived out of five thousand eight hundred
 * candidates, most of them on Pera.
 */

export function fieldPlan({ seed = 91, hillSeed = 137 } = {}) {
  const rand = rng(seed)
  const hills = hillPlan({ seed: hillSeed })
  const placed = []

  for (const zone of ZONES) {
    const land = zone.name === 'chalcedon' ? ASIA : EUROPE
    const onLand = (x, z) => wellInside(land, x, z, 2.5) && !zone.clear([x, z])

    for (let i = 0; i < zone.tries; i++) {
      const block = {
        zone: zone.name,
        x: zone.x[0] + rand() * (zone.x[1] - zone.x[0]),
        z: zone.z[0] + rand() * (zone.z[1] - zone.z[0]),
        angle: rand() * Math.PI,
        width: 7 + rand() * 9,
        depth: 6 + rand() * 8,
        strips: 3 + Math.floor(rand() * 4),
        crop: CROPS[Math.floor(rand() * CROPS.length)],
      }

      if (!onLand(block.x, block.z)) continue
      // Ploughing does not go up a hillside here: the hills are hemispheres,
      // so a flat slab laid across one sinks into the near flank and comes out
      // through the far one.
      if (onHill(hills, block.x, block.z)) continue

      const shape = corners(block)
      if (placed.some((b) => overlaps(shape, b.shape))) continue

      block.shape = shape
      // Each block on its own plane. The camera is orthographic, so depth
      // resolution is uniform across the frustum — a few thousandths of a
      // unit is hundreds of times what it takes to separate two surfaces.
      // The 0.06 rather than 0.05 keeps the slab's underside off the ground
      // plane as well. It is a back face and gets culled, so it costs nothing
      // to leave coincident — but nothing is also what it costs to lift.
      block.y = SHORE_Y + 0.06 + placed.length * 0.004
      placed.push(block)
    }
  }

  return placed
}

/**
 * All the farmland, as one geometry.
 *
 * Everything is tested against the coastline before it is placed — a field in
 * the Marmara is worse than no field at all — and `wellInside` is used rather
 * than a plain point test so nothing is laid over the cliff edge the landmass
 * is extruded with.
 */
export function buildCountryside({ seed = 91 } = {}) {
  const rand = rng(seed + 1)
  const parts = []

  for (const block of fieldPlan({ seed })) {
    const zone = ZONES.find((z) => z.name === block.zone)
    const land = zone.name === 'chalcedon' ? ASIA : EUROPE
    const onLand = (x, z) => wellInside(land, x, z, 2.5) && !zone.clear([x, z])
    parts.push(...fieldBlock(block, rand, onLand))
  }

  // Vines and orchards are cones, not slabs, so they have no coplanar faces to
  // fight over. They still keep off the hills, which they would otherwise
  // stand inside up to their necks.
  const hills = hillPlan({})
  for (const zone of ZONES) {
    const land = zone.name === 'chalcedon' ? ASIA : EUROPE
    const onLand = (x, z) =>
      wellInside(land, x, z, 2.5) && !zone.clear([x, z]) && !onHill(hills, x, z, 0)
    for (let i = 0; i < zone.orchards; i++) {
      const cx = zone.x[0] + rand() * (zone.x[1] - zone.x[0])
      const cz = zone.z[0] + rand() * (zone.z[1] - zone.z[0])
      if (!onLand(cx, cz)) continue
      parts.push(...orchardRow(cx, cz, rand() * Math.PI, 5 + rand() * 7, rand, onLand))
    }
  }

  return merge(parts)
}

/* ---------------------------------------------------------------- the hills */

/**
 * The rim: low hills around the outside of the shot.
 *
 * Their job is to stop the land reading as a plane that simply stops. Ground
 * that runs flat to the frame edge looks like an unfinished model however far
 * it runs; ground that rises into hills reads as distance, and the fog then
 * does the rest.
 *
 * They are hemispheres scaled flat, the same trick as the city's own ridge,
 * because a hemisphere has no silhouette edge to give the geometry away.
 */
const RIM = [
  // West: the Thracian hills, beyond the farmland.
  { from: [-124, -112], to: [-116, 70], n: 22, r: [13, 24], h: [1.6, 3.4] },
  // A second, lower line inside it, so the rim has depth rather than being a
  // single row of domes standing in a line.
  { from: [-106, -100], to: [-100, 62], n: 16, r: [11, 19], h: [1.1, 2.4] },
  // North and north-west, behind Pera.
  { from: [-112, -120], to: [36, -112], n: 22, r: [13, 22], h: [1.5, 3.2] },
  { from: [-96, -106], to: [30, -100], n: 15, r: [10, 18], h: [1.0, 2.2] },
  // North-east, closing the Bosphorus.
  { from: [48, -116], to: [100, -98], n: 10, r: [11, 20], h: [1.4, 3.0] },
  // East: the Asian hills behind Chalcedon, which really are there.
  { from: [124, -88], to: [130, 92], n: 20, r: [13, 23], h: [1.5, 3.2] },
  { from: [110, -76], to: [114, 82], n: 15, r: [10, 18], h: [1.0, 2.2] },
]

export function hillPlan({ seed = 137 } = {}) {
  const rand = rng(seed)
  const out = []

  for (const run of RIM) {
    for (let i = 0; i < run.n; i++) {
      const t = run.n === 1 ? 0.5 : i / (run.n - 1)
      // Jittered off the line, or the rim reads as a wall.
      const x = run.from[0] + (run.to[0] - run.from[0]) * t + (rand() - 0.5) * 16
      const z = run.from[1] + (run.to[1] - run.from[1]) * t + (rand() - 0.5) * 16
      const r = run.r[0] + rand() * (run.r[1] - run.r[0])
      const h = run.h[0] + rand() * (run.h[1] - run.h[0])
      const squash = 0.8 + rand() * 0.6
      const angle = rand() * Math.PI
      const tone = 0.9 + rand() * 0.18
      const land = x > 50 ? ASIA : EUROPE
      if (!insidePolygon(land, x, z)) continue
      out.push({ x, z, rx: r, rz: r * squash, h, angle, tone })
    }
  }

  return out
}

/** Is this point on a hill, or close enough to one to be on its skirt? */
function onHill(hills, x, z, margin = 2) {
  for (const hill of hills) {
    const dx = x - hill.x
    const dz = z - hill.z
    const c = Math.cos(-hill.angle)
    const s = Math.sin(-hill.angle)
    const u = (dx * c - dz * s) / (hill.rx + margin)
    const v = (dx * s + dz * c) / (hill.rz + margin)
    if (u * u + v * v < 1) return true
  }
  return false
}

export function buildRimHills({ seed = 137 } = {}) {
  const parts = []
  for (const hill of hillPlan({ seed })) {
    const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    g.scale(hill.rx, hill.h, hill.rz)
    g.rotateY(hill.angle)
    g.translate(hill.x, SHORE_Y - 0.4, hill.z)
    paint(g, HILL, { tone: hill.tone })
    parts.push(g)
  }
  return merge(parts)
}
