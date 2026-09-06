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

/* --------------------------------------------------------------- the fields */

/**
 * One block of strip fields: a run of parallel strips sharing a headland, the
 * unit a medieval field system is actually built from.
 */
function fieldBlock(cx, cz, angle, width, depth, strips, rand, onLand) {
  const parts = []
  const stripW = width / strips

  /*
   * `rotateY` sends the box's long axis (local +z) to (sin θ, cos θ), so the
   * strips have to be laid out along the perpendicular of *that*, which is
   * (cos θ, −sin θ). Offsetting along (cos θ, sin θ) instead — the obvious
   * thing to write, and what was written — is only perpendicular at θ = 0.
   * Everywhere else the strips walk diagonally across each other, which is
   * why the first version of this scattered planks over Thrace instead of
   * ploughing it.
   */
  const ax = Math.cos(angle)
  const az = -Math.sin(angle)

  // One tone for the block, varied strip by strip. A field system is one crop
  // in one season; six colours inside one block reads as a harlequin.
  const crop = CROPS[Math.floor(rand() * CROPS.length)]

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
    g.translate(x, SHORE_Y + 0.05, z)
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
 */
const ZONES = [
  {
    // Thrace, west of the Theodosian walls. The big one.
    name: 'thrace',
    x: [-120, -38],
    z: [-40, 56],
    clear: ([x, z]) => x > -40 && z > -26 && z < 32,
    blocks: 110,
    orchards: 30,
  },
  {
    // Pera, the slopes behind Galata. North of the camp, which sits on the
    // shore at about z −32, and north of the town behind it.
    name: 'pera',
    x: [-56, 46],
    z: [-96, -46],
    clear: () => false,
    blocks: 62,
    orchards: 20,
  },
  {
    // The Asian side behind Chalcedon and Chrysopolis.
    name: 'chalcedon',
    // Starting east of Chalcedon and Chrysopolis, which stand at x 54–66.
    x: [70, 118],
    z: [-70, 84],
    clear: () => false,
    blocks: 58,
    orchards: 16,
  },
]

/**
 * All the farmland, as one geometry.
 *
 * Everything is tested against the coastline before it is placed — a field in
 * the Marmara is worse than no field at all — and `wellInside` is used rather
 * than a plain point test so nothing is laid over the cliff edge the landmass
 * is extruded with.
 */
export function buildCountryside({ seed = 91 } = {}) {
  const rand = rng(seed)
  const parts = []

  for (const zone of ZONES) {
    const land = zone.name === 'chalcedon' ? ASIA : EUROPE
    const onLand = (x, z) => wellInside(land, x, z, 2.5) && !zone.clear([x, z])

    for (let i = 0; i < zone.blocks; i++) {
      const cx = zone.x[0] + rand() * (zone.x[1] - zone.x[0])
      const cz = zone.z[0] + rand() * (zone.z[1] - zone.z[0])
      if (!onLand(cx, cz)) continue
      parts.push(
        ...fieldBlock(
          cx,
          cz,
          rand() * Math.PI,
          7 + rand() * 9,
          6 + rand() * 8,
          3 + Math.floor(rand() * 4),
          rand,
          onLand
        )
      )
    }

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
  // West: the Thracian hills, along the far side of the farmland.
  { from: [-120, -110], to: [-108, 66], n: 24, r: [14, 26], h: [1.6, 3.4] },
  // A second, lower line inside it, so the rim has depth rather than being a
  // single row of domes standing in a line.
  { from: [-96, -96], to: [-86, 56], n: 16, r: [12, 22], h: [1.1, 2.4] },
  // North-west and north, behind Pera.
  { from: [-114, -116], to: [34, -106], n: 22, r: [13, 24], h: [1.5, 3.2] },
  { from: [-90, -96], to: [26, -86], n: 14, r: [11, 20], h: [1.0, 2.2] },
  // North-east, closing the Bosphorus.
  { from: [46, -112], to: [98, -94], n: 10, r: [12, 22], h: [1.4, 3.0] },
  // East: the Asian hills behind Chalcedon, which really are there.
  { from: [108, -84], to: [116, 84], n: 20, r: [13, 24], h: [1.5, 3.2] },
  { from: [86, -70], to: [94, 70], n: 14, r: [11, 20], h: [1.0, 2.2] },
]

export function buildRimHills({ seed = 137 } = {}) {
  const rand = rng(seed)
  const parts = []

  for (const run of RIM) {
    for (let i = 0; i < run.n; i++) {
      const t = run.n === 1 ? 0.5 : i / (run.n - 1)
      // Jittered off the line, or the rim reads as a wall.
      const x = run.from[0] + (run.to[0] - run.from[0]) * t + (rand() - 0.5) * 16
      const z = run.from[1] + (run.to[1] - run.from[1]) * t + (rand() - 0.5) * 16
      const land = x > 50 ? ASIA : EUROPE
      if (!insidePolygon(land, x, z)) continue

      const r = run.r[0] + rand() * (run.r[1] - run.r[0])
      const h = run.h[0] + rand() * (run.h[1] - run.h[0])
      const g = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      g.scale(r, h, r * (0.8 + rand() * 0.6))
      g.rotateY(rand() * Math.PI)
      g.translate(x, SHORE_Y - 0.4, z)
      paint(g, HILL, { tone: 0.9 + rand() * 0.18 })
      parts.push(g)
    }
  }

  return merge(parts)
}
