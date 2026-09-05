/**
 * The crusader camp and its engines, on the open ground the army crosses.
 *
 * All merged into one geometry — this is scenery that never changes, and the
 * lane already learned that lesson with the garrison.
 *
 * The engines are the two the sources actually describe at the walls: a
 * mangonel, the beam-and-sling stone-thrower of the period, and a ram swung
 * under a penthouse to keep the men working it off the defenders' hooks.
 * Deliberately no trebuchet with a counterweight — that is a later machine
 * than 1204 for a western army in the field.
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

/** A round pavilion tent with a pole and a pennon. */
function tentParts({ x, z, r, h, tone, flag }) {
  const parts = []
  const cone = new THREE.ConeGeometry(r, h, 9)
  cone.translate(x, h / 2, z)
  parts.push(paint(cone, '#ded3ba', tone))

  const pole = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4)
  pole.translate(x, h + 0.25, z)
  parts.push(paint(pole, PALETTE.hullTimberDark))

  if (flag) {
    const pennon = new THREE.BoxGeometry(0.02, 0.2, 0.42)
    pennon.translate(x, h + 0.4, z + 0.21)
    parts.push(paint(pennon, PALETTE.crusaderSurcoat))
  }
  return parts
}

/** A mangonel: beam, sling, and the frame it pivots in. */
function mangonelParts({ x, z, facing = 1 }) {
  const parts = []
  const add = (g, hex, tone = 1) => {
    g.rotateY(facing > 0 ? 0 : Math.PI)
    g.translate(x, 0, z)
    parts.push(paint(g, hex, tone))
  }

  // Baulk frame.
  for (const dz of [-0.75, 0.75]) {
    const sill = new THREE.BoxGeometry(2.6, 0.24, 0.24)
    sill.translate(0, 0.12, dz)
    add(sill, PALETTE.hullTimberDark)
    const post = new THREE.BoxGeometry(0.22, 1.7, 0.22)
    post.translate(0.1, 0.85, dz)
    add(post, PALETTE.hullTimber)
  }
  const crossbar = new THREE.BoxGeometry(0.2, 0.2, 1.7)
  crossbar.translate(0.1, 1.7, 0)
  add(crossbar, PALETTE.hullTimberDark)

  // Throwing beam, cocked back.
  const beam = new THREE.BoxGeometry(3.4, 0.18, 0.2)
  beam.rotateZ(-0.72)
  beam.translate(-0.5, 1.5, 0)
  add(beam, PALETTE.hullTimber)

  // Sling and stone at the beam's head.
  const stone = new THREE.BoxGeometry(0.34, 0.32, 0.34)
  stone.translate(-1.72, 0.42, 0)
  add(stone, '#8f8673')

  // Crew rope bundle at the short arm.
  const ropes = new THREE.CylinderGeometry(0.16, 0.2, 0.5, 6)
  ropes.translate(0.86, 2.32, 0)
  add(ropes, PALETTE.rigging)

  // Spare shot, piled beside it.
  for (let i = 0; i < 5; i++) {
    const s = 0.22 + (i % 3) * 0.05
    const shot = new THREE.BoxGeometry(s, s, s)
    shot.translate(1.5 + (i % 3) * 0.32, s / 2, -1.3 + Math.floor(i / 3) * 0.42)
    add(shot, '#8f8673', 0.9 + (i % 3) * 0.05)
  }
  return parts
}

/** A ram slung under a penthouse, hides over the roof. */
function ramParts({ x, z }) {
  const parts = []
  const add = (g, hex, tone = 1) => {
    g.translate(x, 0, z)
    parts.push(paint(g, hex, tone))
  }

  // Penthouse frame and pitched roof.
  for (const dz of [-1.0, 1.0]) {
    for (const dx of [-1.6, 0, 1.6]) {
      const post = new THREE.BoxGeometry(0.18, 1.6, 0.18)
      post.translate(dx, 0.8, dz)
      add(post, PALETTE.hullTimber)
    }
  }
  for (const side of [-1, 1]) {
    const roof = new THREE.BoxGeometry(4.2, 0.16, 1.35)
    roof.rotateX(side * 0.42)
    roof.translate(0, 1.85, side * 0.6)
    add(roof, '#6d5136')
  }
  // Wet hides draped over it, which is what kept it from being burned.
  const hides = new THREE.BoxGeometry(4.0, 0.1, 2.5)
  hides.translate(0, 2.05, 0)
  add(hides, '#5f5346', 0.95)

  // The ram itself, slung on ropes.
  const beam = new THREE.CylinderGeometry(0.22, 0.26, 4.6, 8)
  beam.rotateZ(Math.PI / 2)
  beam.translate(0, 0.95, 0)
  add(beam, PALETTE.hullTimber)
  const head = new THREE.CylinderGeometry(0.3, 0.22, 0.5, 8)
  head.rotateZ(Math.PI / 2)
  head.translate(2.5, 0.95, 0)
  add(head, '#6d7178')
  for (const dx of [-1.2, 1.2]) {
    const rope = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 4)
    rope.translate(dx, 1.35, 0)
    add(rope, PALETTE.rigging)
  }
  return parts
}

/**
 * The camp: tents in lines, with the engines drawn up in front of them.
 */
export function buildSiegeCamp({
  campX,
  engineX,
  zFrom = -46,
  zTo = 46,
  tents = 46,
  seed = 5,
  engines = true,
}) {
  const rand = rng(seed)
  const parts = []

  for (let i = 0; i < tents; i++) {
    const row = i % 3
    parts.push(
      ...tentParts({
        x: campX - 4 + row * 3.1 + rand() * 0.8,
        z: zFrom + ((zTo - zFrom) * (i + rand())) / tents,
        r: 0.85 + rand() * 0.5,
        h: 1.5 + rand() * 0.7,
        tone: 0.88 + rand() * 0.22,
        flag: i % 4 === 0,
      })
    )
  }

  // Engines, spaced along the line and stood off from the tents.
  if (engines) {
    const engineZs = [-30, -12, 6, 26]
    engineZs.forEach((z, i) => {
      if (i === 2) parts.push(...ramParts({ x: engineX + 1.5, z }))
      else parts.push(...mangonelParts({ x: engineX, z, facing: 1 }))
    })
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
