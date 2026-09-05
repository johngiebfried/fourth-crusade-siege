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

/**
 * A mangonel — the traction stone-thrower of the period.
 *
 * Not a counterweight trebuchet: that machine is later than 1204 for a western
 * army in the field. This is the older kind, where a crew hauls on ropes at
 * the short arm to swing the long one over. So the parts that matter are the
 * A-frames, the axle the beam pivots on, the sling at the beam's head, the
 * bundle of hauling ropes at the other end, and the padded crossbeam the beam
 * slams into at the top of its swing.
 */
function mangonelParts({ x, z, facing = 1 }) {
  const parts = []
  const add = (g, hex, tone = 1) => {
    g.rotateY(facing > 0 ? 0 : Math.PI)
    g.translate(x, 0, z)
    parts.push(paint(g, hex, tone))
  }

  const beamTilt = -0.66 // cocked back, ready to throw
  const axleY = 1.95

  // Ground sills, laid on skids so the machine can be shifted.
  for (const dz of [-1.05, 1.05]) {
    const sill = new THREE.BoxGeometry(3.6, 0.26, 0.3)
    sill.translate(0, 0.13, dz)
    add(sill, PALETTE.hullTimberDark, 0.92)
  }
  for (const dx of [-1.4, 1.4]) {
    const tie = new THREE.BoxGeometry(0.24, 0.2, 2.4)
    tie.translate(dx, 0.1, 0)
    add(tie, PALETTE.hullTimberDark, 0.88)
  }

  // A-frames either side, carrying the axle.
  for (const dz of [-1.05, 1.05]) {
    for (const lean of [-1, 1]) {
      const legLen = Math.hypot(axleY, 0.85)
      const leg = new THREE.BoxGeometry(0.2, legLen, 0.2)
      leg.rotateZ(lean * Math.atan2(0.85, axleY))
      leg.translate(lean * 0.42, axleY / 2, dz)
      add(leg, PALETTE.hullTimber, 0.95)
    }
    // Collar where the two legs meet.
    const collar = new THREE.BoxGeometry(0.42, 0.24, 0.3)
    collar.translate(0, axleY, dz)
    add(collar, PALETTE.hullTimberDark)
  }

  // The axle itself, and the padded crossbeam the throwing arm strikes.
  const axle = new THREE.CylinderGeometry(0.09, 0.09, 2.5, 8)
  axle.rotateX(Math.PI / 2)
  axle.translate(0, axleY, 0)
  add(axle, '#6d7178')

  const stop = new THREE.BoxGeometry(0.3, 0.3, 2.3)
  stop.translate(-1.15, axleY + 0.5, 0)
  add(stop, PALETTE.hullTimberDark)
  const padding = new THREE.BoxGeometry(0.34, 0.2, 2.0)
  padding.translate(-1.15, axleY + 0.68, 0)
  add(padding, '#6f5f4a')

  // Throwing beam: long arm forward and down, short arm cocked up behind.
  const longArm = new THREE.BoxGeometry(4.2, 0.22, 0.24)
  longArm.rotateZ(beamTilt)
  longArm.translate(Math.cos(beamTilt) * 1.55, axleY + Math.sin(beamTilt) * 1.55, 0)
  add(longArm, PALETTE.hullTimber, 1.02)

  const shortArm = new THREE.BoxGeometry(1.5, 0.26, 0.28)
  shortArm.rotateZ(beamTilt)
  shortArm.translate(-Math.cos(beamTilt) * 0.75, axleY - Math.sin(beamTilt) * 0.75, 0)
  add(shortArm, PALETTE.hullTimberDark)

  // Sling hanging from the head of the long arm, with its stone in the pouch.
  const headX = Math.cos(beamTilt) * 3.5
  const headY = axleY + Math.sin(beamTilt) * 3.5
  for (const dz of [-0.22, 0.22]) {
    const cord = new THREE.CylinderGeometry(0.028, 0.028, 1.0, 4)
    cord.translate(headX, headY - 0.5, dz)
    add(cord, PALETTE.rigging)
  }
  const pouch = new THREE.BoxGeometry(0.5, 0.16, 0.5)
  pouch.translate(headX, headY - 1.02, 0)
  add(pouch, '#6f5f4a')
  const shot = new THREE.SphereGeometry(0.26, 8, 6)
  shot.translate(headX, headY - 1.18, 0)
  add(shot, '#8f8673', 0.95)

  // Hauling ropes bunched at the short arm — this is a traction engine, and
  // the ropes are how it is actually thrown.
  const tailX = -Math.cos(beamTilt) * 1.4
  const tailY = axleY - Math.sin(beamTilt) * 1.4
  for (let i = 0; i < 6; i++) {
    const dz = -0.6 + (i / 5) * 1.2
    const rope = new THREE.CylinderGeometry(0.022, 0.022, 1.9, 4)
    rope.rotateZ(0.5)
    rope.translate(tailX - 0.45, tailY - 0.85, dz)
    add(rope, PALETTE.rigging, 0.9 + (i % 2) * 0.14)
  }

  // Windlass for cocking the arm back down.
  const drum = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8)
  drum.rotateX(Math.PI / 2)
  drum.translate(1.5, 0.55, 0)
  add(drum, PALETTE.hullTimber)
  for (const dz of [-0.85, 0.85]) {
    const spoke = new THREE.BoxGeometry(0.08, 0.6, 0.08)
    spoke.rotateX(0.6)
    spoke.translate(1.5, 0.55, dz)
    add(spoke, PALETTE.hullTimberDark)
  }

  // Shot piled ready beside the machine.
  for (let i = 0; i < 6; i++) {
    const r = 0.2 + (i % 3) * 0.045
    const ball = new THREE.SphereGeometry(r, 7, 5)
    ball.translate(1.9 + (i % 3) * 0.5, r * 0.85, -1.7 + Math.floor(i / 3) * 0.55)
    add(ball, '#8f8673', 0.86 + (i % 3) * 0.07)
  }

  return parts
}

/**
 * A timber bridge thrown across the moat.
 *
 * This answers the question the lane otherwise leaves open — how does an army
 * on the near bank get at a wall on the far one — and it is what a besieger
 * actually did: fill or bridge the ditch before you can put a ladder on
 * anything. Rough trestles standing in the water, a plank deck, and a handrail
 * on one side only, because it was built in a hurry.
 */
export function buildMoatBridge({ x, z, span, seed = 3 }) {
  const rand = rng(seed)
  const parts = []
  const deckY = 0.5
  const halfW = 0.52

  // A footbridge, not a causeway. The first version was two units wide with a
  // handrail — wider than a man is tall, and tidier than anything an army
  // throws across a ditch under shot. This one is barely two abreast, and it
  // is meant to look like it was knocked together in a night.
  const bents = 3
  const legTop = (i) => deckY - 0.03 - Math.sin((i / bents) * Math.PI) * 0.06

  for (let i = 0; i <= bents; i++) {
    const bx = x - span / 2 + (span * i) / bents
    for (const dz of [-halfW, halfW]) {
      const h = legTop(i) + 0.62
      const leg = new THREE.BoxGeometry(0.1, h, 0.1)
      // Every trestle leans its own way. Nothing here is plumb.
      leg.rotateZ((rand() - 0.5) * 0.2)
      leg.rotateX((rand() - 0.5) * 0.14)
      leg.translate(bx + (rand() - 0.5) * 0.1, h / 2 - 0.62, z + dz)
      parts.push(paint(leg, PALETTE.hullTimberDark, 0.82 + rand() * 0.3))
    }
    // A cross-brace, skewed, and not on every bent.
    if (i < bents && rand() > 0.25) {
      const brace = new THREE.BoxGeometry(0.075, 0.075, halfW * 2.1)
      brace.rotateX((rand() - 0.5) * 0.3)
      brace.translate(bx + span / bents / 2, deckY - 0.3 - rand() * 0.1, z)
      parts.push(paint(brace, PALETTE.hullTimberDark, 0.8 + rand() * 0.25))
    }
  }

  // Two stringers carrying the boards, sagging a little at midspan.
  for (const dz of [-halfW * 0.72, halfW * 0.72]) {
    const s1 = new THREE.BoxGeometry(span, 0.09, 0.1)
    s1.translate(x, deckY - 0.09, z + dz)
    parts.push(paint(s1, PALETTE.hullTimberDark, 0.9))
  }

  // Salvaged boards: uneven widths, uneven lengths, laid crooked, with gaps
  // where there was nothing left to lay.
  const boards = Math.round(span / 0.34)
  for (let i = 0; i < boards; i++) {
    if (rand() < 0.12) continue // a plank that never got laid
    const bx = x - span / 2 + (span * (i + 0.5)) / boards
    const len = halfW * 2 * (0.82 + rand() * 0.3)
    const board = new THREE.BoxGeometry(span / boards - 0.05 - rand() * 0.05, 0.06, len)
    board.rotateY((rand() - 0.5) * 0.16)
    board.rotateX((rand() - 0.5) * 0.09)
    board.translate(
      bx + (rand() - 0.5) * 0.05,
      deckY - Math.sin(((i + 0.5) / boards) * Math.PI) * 0.05,
      z + (rand() - 0.5) * 0.16
    )
    parts.push(paint(board, PALETTE.hullTimber, 0.78 + rand() * 0.36))
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * The camp: tents in lines, with the engines drawn off to one side of it.
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

  // Two engines, drawn up to one side of the camp rather than strung along
  // the whole line. A battering ram was tried here too and cut: at this scale
  // it was a large box that read as neither ram nor penthouse.
  if (engines) {
    for (const z of [-16, 4]) {
      parts.push(...mangonelParts({ x: engineX, z, facing: 1 }))
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
