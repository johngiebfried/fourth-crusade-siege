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

/**
 * @param opts.aoHeight  darken the piece toward its foot, over this height. A
 *   masonry face sunk in a ditch is in shadow at the bottom, and painting that
 *   in is the difference between a trench and a slot cut in a lawn.
 */
function paint(g, hex, tone = 1, { aoHeight = 0 } = {}) {
  const c = new THREE.Color(hex)
  const pos = g.attributes.position
  const arr = new Float32Array(pos.count * 3)

  let lowest = Infinity
  if (aoHeight > 0) {
    for (let i = 0; i < pos.count; i++) lowest = Math.min(lowest, pos.getY(i))
  }

  for (let i = 0; i < pos.count; i++) {
    let k = tone
    if (aoHeight > 0) {
      const t = Math.min(1, Math.max(0, (pos.getY(i) - lowest) / aoHeight))
      k *= 0.62 + 0.38 * t
    }
    arr[i * 3] = c.r * k
    arr[i * 3 + 1] = c.g * k
    arr[i * 3 + 2] = c.b * k
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
/**
 * The mangonel, split into a frame that never moves and a beam that does.
 *
 * ── Which way it throws ──────────────────────────────────────────────────
 *
 * It was pointing the wrong way, with the loaded sling on the wall side. A
 * traction trebuchet works like a see-saw: the long arm is hauled *down* on
 * the side away from the target, so the sling and its stone lie on the ground
 * behind the machine, and the crew pull the short arm down to sweep the long
 * arm up, over, and forward. The stone leaves as the head passes the top,
 * flying the way the head was travelling.
 *
 * So the loaded sling belongs on the *camp* side and the padded stop — which
 * the beam strikes at the end of its swing — on the wall side. That is what
 * `facing: -1` gives here, and it is why the machines are built that way.
 */
export const MANGONEL = {
  /*
   * The axle is higher and the cock shallower than they were, because the
   * machine was standing in its own hole: at an axle of 1.95 and a cock of
   * −0.66 the head of a 3.5 arm sits at −0.20 and the stone in its sling at
   * −1.13. Both were underground, so the business end of the engine was buried
   * in the grass.
   *
   * A cocked traction trebuchet rests its stone *on* the ground, which is what
   * these numbers give: head at 0.86, stone at 0.22.
   */
  axleY: 2.35,
  /** Beam angle when cocked: long arm hauled down behind the machine. */
  cocked: -0.44,
  /** Where the beam finishes, having swung up and over toward the wall. */
  loosed: 2.42,
  longArm: 3.5,
}

/** The parts that never move: sills, A-frames, axle, stop, windlass. */
function mangonelFrameParts({ x, z, facing = 1 }) {
  const parts = []
  const add = (g, hex, tone = 1) => {
    g.rotateY(facing > 0 ? 0 : Math.PI)
    g.translate(x, 0, z)
    parts.push(paint(g, hex, tone))
  }

  const axleY = MANGONEL.axleY

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
    const collar = new THREE.BoxGeometry(0.42, 0.24, 0.3)
    collar.translate(0, axleY, dz)
    add(collar, PALETTE.hullTimberDark)
  }

  const axle = new THREE.CylinderGeometry(0.09, 0.09, 2.5, 8)
  axle.rotateX(Math.PI / 2)
  axle.translate(0, axleY, 0)
  add(axle, '#6d7178')

  // The padded crossbeam the beam strikes, on the target side.
  const stop = new THREE.BoxGeometry(0.3, 0.3, 2.3)
  stop.translate(-1.15, axleY + 0.5, 0)
  add(stop, PALETTE.hullTimberDark)
  const padding = new THREE.BoxGeometry(0.34, 0.2, 2.0)
  padding.translate(-1.15, axleY + 0.68, 0)
  add(padding, '#6f5f4a')

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

  return parts
}

/**
 * The beam, sling and hauling ropes, built about the axle at the origin so a
 * parent group can simply rotate them. `withStone` drops the shot once it has
 * been loosed and the ball is flying on its own.
 */
export function buildMangonelBeam({ withStone = true } = {}) {
  const parts = []
  const add = (g, hex, tone = 1) => parts.push(paint(g, hex, tone))
  const L = MANGONEL.longArm

  const longArm = new THREE.BoxGeometry(4.2, 0.22, 0.24)
  longArm.translate(1.55, 0, 0)
  add(longArm, PALETTE.hullTimber, 1.02)

  const shortArm = new THREE.BoxGeometry(1.5, 0.26, 0.28)
  shortArm.translate(-0.75, 0, 0)
  add(shortArm, PALETTE.hullTimberDark)

  // Sling hanging from the head of the long arm. Short, so that at the cocked
  // angle the stone rests on the turf instead of below it.
  for (const dz of [-0.22, 0.22]) {
    const cord = new THREE.CylinderGeometry(0.028, 0.028, 0.55, 4)
    cord.translate(L, -0.3, dz)
    add(cord, PALETTE.rigging)
  }
  const pouch = new THREE.BoxGeometry(0.5, 0.16, 0.5)
  pouch.translate(L, -0.62, 0)
  add(pouch, '#6f5f4a')

  if (withStone) {
    const shot = new THREE.SphereGeometry(0.26, 8, 6)
    shot.translate(L, -0.7, 0)
    add(shot, '#8f8673', 0.95)
  }

  // Hauling ropes bunched at the short arm — this is a traction engine, and
  // the ropes are how it is actually thrown.
  for (let i = 0; i < 6; i++) {
    const dz = -0.6 + (i / 5) * 1.2
    const rope = new THREE.CylinderGeometry(0.022, 0.022, 1.9, 4)
    rope.rotateZ(0.5)
    rope.translate(-1.85, -0.85, dz)
    add(rope, PALETTE.rigging, 0.9 + (i % 2) * 0.14)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((q) => q.dispose())
  merged.computeVertexNormals()
  return merged
}

/** The frame alone, as one geometry. */
export function buildMangonelFrame({ facing = -1 } = {}) {
  const parts = mangonelFrameParts({ x: 0, z: 0, facing })
  const merged = mergeGeometries(parts, false)
  parts.forEach((q) => q.dispose())
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
      parts.push(...mangonelFrameParts({ x: engineX, z, facing: -1 }))
    }
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}


/**
 * The moat as it was actually built: a revetted ditch, not a stream in a field.
 *
 * The Byzantium 1200 reconstructions show what this really was — a masonry-
 * lined trench with a low crenellated counterscarp along the field edge, and
 * **cross-walls dividing it into sections**. That last detail is the
 * interesting one and it answers a question the shape otherwise raises: the
 * ground falls some sixty metres from the Golden Horn to the Marmara, so a
 * single continuous ditch could never have held water. The dams made it a
 * flight of separate basins, each level, each fillable.
 *
 * It is also the right thing to have on screen in a game about crossing it.
 */
export function buildMoatWorks({
  moatX,
  moatWidth,
  from,
  to,
  depth = 1.5,
  seed = 21,
  bays = 9,
  gateZ = null,
  /** How far out into the field the road runs, and where it meets the wall. */
  roadFromX = null,
  roadToX = null,
}) {
  const rand = rng(seed)
  const parts = []
  const inner = moatX + moatWidth / 2
  const outer = moatX - moatWidth / 2

  /*
   * Every length-wise piece of the defence stops at the road.
   *
   * The counterscarp was cut for the causeway but the revetment and its coping
   * were not, so both ran on through the crossing — and the coping, standing a
   * few hundredths proud of the deck, surfaced along it as a line of bumps.
   * Anything that runs along the ditch is now built from this one list of
   * runs, so a gap in the road can only be forgotten in one place.
   */
  const roadHalf = gateZ === null ? 0 : 1.6
  const runs =
    gateZ === null
      ? [[from, to]]
      : [
          [from, gateZ - roadHalf],
          [gateZ + roadHalf, to],
        ]

  // Revetment down both sides, battered slightly so the trench reads as cut
  // masonry rather than as a slot.
  for (const [x, tone] of [
    [inner, 1.0],
    [outer, 0.92],
  ]) {
    for (const [a, b] of runs) {
      if (b - a < 0.2) continue
      const face = new THREE.BoxGeometry(0.34, depth + 0.5, b - a)
      face.translate(x, -depth / 2 + 0.25, (a + b) / 2)
      parts.push(paint(face, PALETTE.wallStone, tone, { aoHeight: depth }))

      const coping = new THREE.BoxGeometry(0.5, 0.16, b - a)
      coping.translate(x, 0.3, (a + b) / 2)
      parts.push(paint(coping, PALETTE.wallStoneAlt, tone * 1.06))
    }
  }

  // The counterscarp: a low wall along the field edge, with its own small
  // merlons. An attacker had to get over this before he even reached the ditch.
  for (const [a, b] of runs) {
    if (b - a < 0.2) continue
    const cs = new THREE.BoxGeometry(0.46, 0.9, b - a)
    cs.translate(outer - 0.6, 0.45, (a + b) / 2)
    parts.push(paint(cs, PALETTE.wallStone, 0.95, { aoHeight: 0.9 }))

    // A pier where the wall stops at the road.
    for (const end of gateZ === null ? [] : [a, b]) {
      if (Math.abs(end - gateZ) > roadHalf + 0.1) continue
      const pier = new THREE.BoxGeometry(0.72, 1.25, 0.72)
      pier.translate(outer - 0.6, 0.62, end)
      parts.push(paint(pier, PALETTE.wallStoneAlt, 1.02, { aoHeight: 1.25 }))
    }

    const merlonPitch = 1.5
    for (let z = a; z < b - merlonPitch * 0.5; z += merlonPitch) {
      const m = new THREE.BoxGeometry(0.5, 0.42, 0.8)
      m.translate(outer - 0.6, 1.1, z + 0.4)
      parts.push(paint(m, PALETTE.wallStoneAlt, 0.9 + rand() * 0.16))
    }
  }

  // The road: out into the field, over the ditch, and up to the gate.
  //
  // It used to stop a couple of units short at each end, so the crossing sat
  // in the middle of a meadow with grass on both sides of it. A gate road is
  // paved for its whole length; that is half of what makes it a road.
  if (gateZ !== null) {
    const a = roadFromX ?? moatX - 9
    const b = roadToX ?? moatX + 4
    const span = b - a
    const mid = (a + b) / 2

    const deck = new THREE.BoxGeometry(span, 0.4, roadHalf * 2 - 0.4)
    deck.translate(mid, 0.12, gateZ)
    parts.push(paint(deck, PALETTE.wallStoneAlt, 1.03))

    // The masonry carrying it across the ditch.
    const skirt = new THREE.BoxGeometry(moatWidth + 2.2, depth + 0.4, roadHalf * 2 - 0.7)
    skirt.translate(moatX - 0.3, -depth / 2 + 0.1, gateZ)
    parts.push(paint(skirt, PALETTE.wallStone, 0.93, { aoHeight: depth }))

    // A parapet along each side, over the ditch only — a road in open field
    // does not have one.
    for (const side of [-1, 1]) {
      const kerb = new THREE.BoxGeometry(moatWidth + 2.6, 0.34, 0.22)
      kerb.translate(moatX - 0.3, 0.42, gateZ + side * (roadHalf - 0.3))
      parts.push(paint(kerb, PALETTE.wallStoneAlt, 1.08))
    }
  }

  // The cross-walls, each one damming a bay of the ditch.
  const step = (to - from) / bays
  for (let i = 1; i < bays; i++) {
    const z = from + step * i
    if (gateZ !== null && Math.abs(z - gateZ) < 2.6) continue
    const dam = new THREE.BoxGeometry(moatWidth + 1.4, depth + 0.7, 0.7)
    dam.translate(moatX - 0.3, -depth / 2 + 0.35, z)
    parts.push(paint(dam, PALETTE.wallStone, 0.97, { aoHeight: depth }))

    const cap = new THREE.BoxGeometry(moatWidth + 1.6, 0.16, 0.9)
    cap.translate(moatX - 0.3, 0.42, z)
    parts.push(paint(cap, PALETTE.wallStoneAlt, 1.05))
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}
