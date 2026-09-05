/**
 * The Byzantine garrison on the ramparts, built as one merged geometry.
 *
 * These figures never move, so there is no reason for each to be its own mesh.
 * A hundred defenders as separate components was six hundred draw calls, which
 * is the sort of thing that turns a lecture-room laptop into a slideshow.
 * Merged, the whole garrison costs one.
 *
 * Kit follows the brief: scale or lamellar (the klivanion) predominating
 * rather than mail, and roughly one in three a Varangian with the long-hafted
 * Danish axe. Banners are purple and gold with a cross — deliberately no
 * double-headed eagle, which is a Palaiologan emblem from after 1261.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paint(g, hex, tone = 1) {
  const c = new THREE.Color(hex)
  const n = g.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r * tone
    arr[i * 3 + 1] = c.g * tone
    arr[i * 3 + 2] = c.b * tone
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}

/**
 * One defender, posed. `lean` tips them forward over the parapet, which is
 * what a man watching an assault actually does.
 */
function defenderParts({ x, y, z, scale, varangian, lean, tone, rand }) {
  const parts = []
  const push = (g, hex, t = tone) => {
    g.scale(scale, scale, scale)
    // Lean about the feet, then place.
    if (lean) g.rotateZ(lean)
    g.translate(x, y, z)
    parts.push(paint(g, hex, t))
  }

  // Legs, slightly apart.
  for (const off of [-0.13, 0.13]) {
    const leg = new THREE.BoxGeometry(0.16, 0.5, 0.18)
    leg.translate(off, 0.25, 0)
    push(leg, '#4b4136')
  }

  // Lamellar torso, and the skirt of lamellae below it.
  const torso = new THREE.BoxGeometry(0.52, 0.56, 0.34)
  torso.translate(0, 0.78, 0)
  push(torso, PALETTE.byzantineLamellar)

  const skirt = new THREE.CylinderGeometry(0.3, 0.38, 0.3, 8)
  skirt.translate(0, 0.4, 0)
  push(skirt, PALETTE.byzantinePurple)

  // Shoulders and head.
  const shoulders = new THREE.BoxGeometry(0.58, 0.16, 0.36)
  shoulders.translate(0, 1.04, 0)
  push(shoulders, PALETTE.byzantineLamellar, tone * 1.06)

  const head = new THREE.SphereGeometry(0.15, 8, 6)
  head.translate(0, 1.24, 0)
  push(head, '#a98a6d')

  const helm = new THREE.CylinderGeometry(0.16, 0.18, 0.18, 8)
  helm.translate(0, 1.33, 0)
  push(helm, PALETTE.byzantineLamellar, tone * 1.1)

  const crest = new THREE.ConeGeometry(0.13, 0.16, 8)
  crest.translate(0, 1.48, 0)
  push(crest, PALETTE.byzantineLamellar, tone * 1.1)

  if (varangian) {
    // Long-hafted Danish axe, the Varangian Guard's signature.
    const haft = new THREE.CylinderGeometry(0.035, 0.035, 1.9, 5)
    haft.rotateZ(-0.22)
    haft.translate(0.3, 0.95, 0.06)
    push(haft, PALETTE.hullTimberDark)

    const head1 = new THREE.BoxGeometry(0.34, 0.4, 0.05)
    head1.rotateZ(0.16)
    head1.translate(0.52, 1.78, 0.06)
    push(head1, PALETTE.varangianAxe, tone * 1.12)
  } else {
    // Round shield, resting on the parapet, and a spear.
    const shield = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12)
    shield.rotateX(Math.PI / 2)
    shield.rotateZ(0.1)
    shield.translate(-0.3, 0.78, 0.24)
    push(shield, rand() > 0.5 ? PALETTE.byzantinePurple : '#6b4a2f')

    const boss = new THREE.SphereGeometry(0.07, 6, 5)
    boss.translate(-0.3, 0.78, 0.3)
    push(boss, PALETTE.varangianAxe, tone * 1.1)

    const spear = new THREE.CylinderGeometry(0.03, 0.03, 2.0, 5)
    spear.rotateZ(-0.1)
    spear.translate(0.3, 1.0, -0.05)
    push(spear, PALETTE.hullTimberDark)

    const point = new THREE.ConeGeometry(0.06, 0.22, 6)
    point.rotateZ(-0.1)
    point.translate(0.4, 2.05, -0.05)
    push(point, '#b9bcc0', tone * 1.1)
  }

  return parts
}

function bannerParts({ x, y, z, scale, height = 2.6 }) {
  const parts = []
  const push = (g, hex) => {
    g.scale(scale, scale, scale)
    g.translate(x, y, z)
    parts.push(paint(g, hex))
  }

  const pole = new THREE.CylinderGeometry(0.05, 0.05, height, 6)
  pole.translate(0, height / 2, 0)
  push(pole, PALETTE.hullTimberDark)

  const field = new THREE.BoxGeometry(0.02, 0.66, 0.84)
  field.translate(0, height - 0.5, 0.42)
  push(field, PALETTE.byzantinePurple)

  const barV = new THREE.BoxGeometry(0.03, 0.5, 0.15)
  barV.translate(0, height - 0.5, 0.42)
  push(barV, PALETTE.imperialGold)

  const barH = new THREE.BoxGeometry(0.03, 0.15, 0.52)
  barH.translate(0, height - 0.42, 0.42)
  push(barH, PALETTE.imperialGold)

  return parts
}

/**
 * A line of defenders along a rampart running in Z, merged into one geometry.
 */
export function buildGarrison({
  x,
  y,
  zFrom,
  zTo,
  count = 12,
  banners = 2,
  scale = 0.42,
  seed = 3,
}) {
  const rand = rng(seed)
  const parts = []
  const span = zTo - zFrom

  for (let i = 0; i < count; i++) {
    const t = (i + 0.35 + rand() * 0.3) / count
    parts.push(
      ...defenderParts({
        x: x + (rand() - 0.5) * 0.5,
        y,
        z: zFrom + span * t,
        scale: scale * (0.94 + rand() * 0.14),
        varangian: rand() < 0.34,
        lean: (rand() - 0.35) * 0.16,
        tone: 0.86 + rand() * 0.28,
        rand,
      })
    )
  }

  for (let b = 0; b < banners; b++) {
    parts.push(
      ...bannerParts({
        x: x - 0.25,
        y,
        z: zFrom + (span * (b + 1)) / (banners + 1),
        scale,
      })
    )
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
