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
  const deckY = 0.55

  // Trestles standing in the ditch.
  const bents = 4
  for (let i = 0; i <= bents; i++) {
    const bx = x - span / 2 + (span * i) / bents
    for (const dz of [-0.85, 0.85]) {
      const leg = new THREE.BoxGeometry(0.18, deckY + 0.7, 0.18)
      leg.rotateZ((rand() - 0.5) * 0.08)
      leg.translate(bx, (deckY + 0.7) / 2 - 0.7, z + dz)
      parts.push(paint(leg, PALETTE.hullTimberDark, 0.9 + rand() * 0.18))
    }
    const brace = new THREE.BoxGeometry(0.14, 0.14, 1.9)
    brace.translate(bx, deckY - 0.28, z)
    parts.push(paint(brace, PALETTE.hullTimberDark))
  }

  // Plank deck, laid across in rough boards.
  const boards = Math.round(span / 0.55)
  for (let i = 0; i < boards; i++) {
    const bx = x - span / 2 + (span * (i + 0.5)) / boards
    const board = new THREE.BoxGeometry(span / boards - 0.04, 0.12, 2.1)
    board.translate(bx, deckY, z + (rand() - 0.5) * 0.06)
    parts.push(paint(board, PALETTE.hullTimber, 0.86 + rand() * 0.26))
  }

  // Handrail down one side.
  for (let i = 0; i <= bents; i++) {
    const bx = x - span / 2 + (span * i) / bents
    const post = new THREE.BoxGeometry(0.12, 0.75, 0.12)
    post.translate(bx, deckY + 0.38, z - 0.95)
    parts.push(paint(post, PALETTE.hullTimberDark))
  }
  const rail = new THREE.BoxGeometry(span, 0.1, 0.12)
  rail.translate(x, deckY + 0.72, z - 0.95)
  parts.push(paint(rail, PALETTE.hullTimber))

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
