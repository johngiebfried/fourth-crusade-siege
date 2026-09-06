/**
 * The buildings that carry the skyline.
 *
 * These were assembled from twenty-odd separate meshes each, which is both a
 * draw call apiece and no way to bake shading into. Each is now one merged
 * geometry built from the architectural kit — cheaper *and* more detailed,
 * which is the usual result of merging.
 *
 * Byzantium 1200 is the reference. We are not going to reach it: those are
 * offline renders by a specialist with per-monument research behind them. What
 * is reachable is the right *vocabulary* — the semi-domes and exedrae that
 * make the Hagia Sophia that building and not a dome on a box, the sphendone
 * that makes the Hippodrome a hippodrome — at a level of finish that reads
 * correctly from across a room.
 */

import * as THREE from 'three'
import {
  paint,
  merge,
  domeOnDrum,
  apse,
  buttress,
  column,
  arcade,
  pitchedRoof,
  house,
  church,
} from './buildingKit.js'
import { rng } from './cityBuilder.js'
import { PALETTE } from '../palette.js'

const MARBLE = '#e6dcc4'
const MARBLE_DEEP = '#dcd1b6'
const PORPHYRY = '#7d5560'

/**
 * The Great Church.
 *
 * The parts that matter, west to east: a narthex, then the great dome on its
 * windowed drum, braced along the long axis by two semi-domes, each of those
 * in turn carried on a pair of exedrae — the smaller half-domes that step the
 * mass down. Buttresses to north and south take the thrust; an apse closes the
 * east end. Getting that sequence right is the whole difference between this
 * building and a dome on a box.
 */
export function buildHagiaSophia() {
  const parts = []

  // Podium and the naos block.
  const podium = new THREE.BoxGeometry(8.2, 1.4, 7.4)
  podium.translate(0, 0.7, 0)
  parts.push(paint(podium, MARBLE_DEEP, { ao: 0.3, aoFrom: 0, aoTo: 1.4 }))

  const naos = new THREE.BoxGeometry(6.4, 3.0, 5.6)
  naos.translate(0, 2.9, 0)
  parts.push(paint(naos, MARBLE, { ao: 0.26, aoFrom: 1.4, aoTo: 3.2 }))

  // A string course where the podium meets the naos: the horizontal line that
  // stops the two blocks reading as one tall box.
  const course = new THREE.BoxGeometry(6.7, 0.14, 5.9)
  course.translate(0, 1.46, 0)
  parts.push(paint(course, MARBLE, { tone: 1.16 }))

  // Narthex, low across the west front, with a blind arcade on its face.
  const narthex = new THREE.BoxGeometry(1.5, 2.2, 6.0)
  narthex.translate(-3.7, 1.1, 0)
  parts.push(paint(narthex, MARBLE_DEEP, { ao: 0.3, aoFrom: 0, aoTo: 2.2 }))

  const front = arcade({ bays: 5, bayW: 1.05, h: 2.0, hex: MARBLE, tone: 0.97, depth: 0.22 })
  front.rotateY(-Math.PI / 2)
  front.translate(-4.46, 0, 0)
  parts.push(front)

  // The two semi-domes, flat faces to the centre, stepping down from the drum.
  for (const side of [-1, 1]) {
    const half = new THREE.SphereGeometry(2.05, 18, 10, 0, Math.PI, 0, Math.PI / 2)
    half.scale(1, 0.6, 1)
    half.rotateY(side > 0 ? -Math.PI / 2 : Math.PI / 2)
    half.translate(side * 2.55, 4.3, 0)
    parts.push(paint(half, PALETTE.hagiaDome, { tone: 0.97 }))

    // The drum each semi-dome sits on.
    const sub = new THREE.CylinderGeometry(2.05, 2.1, 0.5, 16, 1, false, side > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI)
    sub.translate(side * 2.55, 4.05, 0)
    parts.push(paint(sub, MARBLE, { tone: 0.95 }))

    // Exedrae: the smaller half-domes at the corners of each semi-dome, which
    // are what actually steps the mass down to the aisle roofs.
    for (const z of [-1, 1]) {
      const ex = new THREE.SphereGeometry(0.95, 12, 7, 0, Math.PI, 0, Math.PI / 2)
      ex.scale(1, 0.62, 1)
      ex.rotateY(side > 0 ? -Math.PI / 2 : Math.PI / 2)
      ex.translate(side * 3.5, 3.5, z * 1.45)
      parts.push(paint(ex, PALETTE.hagiaDome, { tone: 0.9 }))
    }
  }

  // The great dome: drum, forty windows in the round, cornice, then the dome.
  const great = domeOnDrum({
    r: 2.42,
    drumH: 1.35,
    windows: 20,
    wallHex: '#e8dfc8',
    domeHex: PALETTE.hagiaDome,
  })
  great.translate(0, 4.4, 0)
  parts.push(great)

  const finial = new THREE.SphereGeometry(0.17, 8, 6)
  finial.translate(0, 7.05, 0)
  parts.push(paint(finial, PALETTE.imperialGold, { tone: 1.2 }))

  // Buttresses north and south, taking the dome's thrust.
  for (const bx of [-1, 1]) {
    for (const bz of [-1, 1]) {
      const b = buttress({ w: 1.05, d: 1.15, h: 3.4, hex: '#d8ccb0', tone: 0.98 })
      b.translate(bx * 3.5, 0, bz * 3.2)
      parts.push(b)
    }
  }

  // The apse, closing the east end.
  const a = apse({ r: 1.5, h: 2.6, wallHex: MARBLE_DEEP, domeHex: PALETTE.hagiaDome })
  a.rotateY(Math.PI / 2)
  a.translate(3.6, 0, 0)
  parts.push(a)

  return merge(parts)
}

/**
 * The Hippodrome.
 *
 * The sphendone — the curved end that carried the seating out over the slope —
 * is the shape that makes it recognisable, and the monuments on the spina are
 * what a crusader would actually have gawped at. Two of the three are still
 * standing in Istanbul today; the third, the Serpent Column, is a stump.
 */
export function buildHippodrome() {
  const parts = []

  // The seating bank, and the sphendone curving round the southern end.
  const bank = new THREE.BoxGeometry(9.5, 0.9, 4.0)
  bank.translate(0, 0.45, 0)
  parts.push(paint(bank, '#cfc3a6', { ao: 0.24, aoFrom: 0, aoTo: 0.9 }))

  const sphendone = new THREE.CylinderGeometry(2.0, 2.0, 0.9, 18, 1, false, Math.PI / 2, Math.PI)
  sphendone.translate(-4.75, 0.45, 0)
  parts.push(paint(sphendone, '#cfc3a6', { ao: 0.24, aoFrom: 0, aoTo: 0.9 }))

  // An arcade round the outside of the sphendone: the substructure that holds
  // the seating up where the ground falls away, and the detail that says this
  // is a building rather than a mound.
  for (let i = 0; i < 9; i++) {
    const a = Math.PI / 2 + (i / 8) * Math.PI
    const pier = new THREE.BoxGeometry(0.22, 0.86, 0.5)
    pier.rotateY(-a)
    pier.translate(-4.75 + Math.sin(a) * 2.02, 0.43, Math.cos(a) * 2.02)
    parts.push(paint(pier, '#c3b797', { tone: 0.92, ao: 0.3, aoFrom: 0, aoTo: 0.86 }))
  }

  // The track surface and the spina down the middle.
  const track = new THREE.BoxGeometry(8.4, 0.1, 2.9)
  track.translate(0, 0.92, 0)
  parts.push(paint(track, '#b3a684'))

  const spina = new THREE.BoxGeometry(6.4, 0.2, 0.5)
  spina.translate(0, 1.05, 0)
  parts.push(paint(spina, '#c2b592', { tone: 1.04 }))

  // Obelisk of Theodosius: Egyptian granite on its carved Roman base.
  const base = new THREE.BoxGeometry(0.62, 0.4, 0.62)
  base.translate(1.6, 1.35, 0)
  parts.push(paint(base, '#b9ac8b', { tone: 0.95 }))
  const shaft = new THREE.CylinderGeometry(0.16, 0.26, 2.2, 4)
  shaft.rotateY(Math.PI / 4)
  shaft.translate(1.6, 2.65, 0)
  parts.push(paint(shaft, '#a4785f'))
  const cap = new THREE.ConeGeometry(0.2, 0.32, 4)
  cap.rotateY(Math.PI / 4)
  cap.translate(1.6, 3.9, 0)
  parts.push(paint(cap, '#a4785f', { tone: 1.1 }))

  // The Walled Obelisk, rougher and a little shorter.
  const walled = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 4)
  walled.rotateY(Math.PI / 4)
  walled.translate(-2.0, 2.35, 0)
  parts.push(paint(walled, '#c8bda0', { ao: 0.2, aoFrom: 1.15, aoTo: 2.4 }))

  // The Serpent Column from Delphi: bronze, and by 1204 a stump.
  const serpent = new THREE.CylinderGeometry(0.1, 0.13, 0.9, 6)
  serpent.translate(-0.2, 1.6, 0)
  parts.push(paint(serpent, '#6f7d63'))

  // A row of columns along the spina, which is what the Byzantines actually
  // crowded it with — statuary and trophies the whole length.
  for (let i = 0; i < 7; i++) {
    const c = column({ h: 0.7 + (i % 3) * 0.12, r: 0.055, hex: MARBLE, tone: 0.96 })
    c.translate(-3.0 + i * 0.95, 1.1, 0)
    parts.push(c)
  }

  return merge(parts)
}

/**
 * The Great Palace: terraces stepping down the slope to the Marmara, with the
 * Chrysotriklinos golden-domed above them.
 */
export function buildGreatPalace() {
  const parts = []

  const lower = new THREE.BoxGeometry(4.6, 1.6, 3.2)
  lower.translate(0, 0.8, 0)
  parts.push(paint(lower, '#e0d5ba', { ao: 0.3, aoFrom: 0, aoTo: 1.6 }))

  // A terrace arcade facing the sea, which is how the palace actually
  // presented itself to anyone arriving by water.
  const face = arcade({ bays: 6, bayW: 0.72, h: 1.5, hex: '#e6dcc4', tone: 0.97, depth: 0.2 })
  face.translate(0, 0, 1.66)
  parts.push(face)

  const upper = new THREE.BoxGeometry(2.0, 1.0, 2.2)
  upper.translate(1.2, 2.1, 0)
  parts.push(paint(upper, '#e6dcc4', { ao: 0.2, aoFrom: 1.6, aoTo: 2.6 }))

  const golden = domeOnDrum({
    r: 1.0,
    drumH: 0.5,
    windows: 8,
    wallHex: '#e6dcc4',
    domeHex: PALETTE.domeGold,
  })
  golden.translate(1.2, 2.6, 0)
  parts.push(golden)

  // A porphyry column at the terrace edge: the imperial stone, and a scale cue.
  const c = column({ h: 1.5, r: 0.09, hex: PORPHYRY })
  c.translate(-1.9, 1.6, 1.3)
  parts.push(c)

  // Pitched roofs over the ranges either side.
  for (const side of [-1, 1]) {
    const r = pitchedRoof({ w: 1.6, d: 1.4, h: 0.42, hex: PALETTE.cityRoof, tone: 0.98 })
    r.translate(-1.2, 1.6, side * 0.85)
    parts.push(r)
  }

  return merge(parts)
}


/**
 * Cypresses.
 *
 * Scale cues are a large part of why a reconstruction reads as a place rather
 * than a maquette: the eye needs something whose size it already knows. A
 * cypress is the right choice here — it is the tree of this coast, it is
 * strongly vertical so it survives being two pixels wide, and it is
 * everywhere in Ottoman and Byzantine views of the city.
 *
 * Returned as one merged geometry rather than instanced: at these counts the
 * merge is a single draw call either way, and merging lets each tree carry its
 * own baked tone so a stand of them does not read as one tree stamped out.
 */
export function buildCypresses(spots) {
  const parts = []
  for (const { x, y, z, h, tone } of spots) {
    const trunk = new THREE.CylinderGeometry(0.018, 0.03, h * 0.3, 5)
    trunk.translate(x, y + h * 0.15, z)
    parts.push(paint(trunk, '#5a4432', { tone }))

    // Two stacked cones rather than one: a single cone is a party hat, and the
    // break between them is what gives the silhouette its cypress kink.
    const lower = new THREE.ConeGeometry(h * 0.15, h * 0.6, 6)
    lower.translate(x, y + h * 0.42, z)
    parts.push(paint(lower, '#3f5138', { tone: tone * 0.94, ao: 0.3, aoFrom: y, aoTo: y + h * 0.6 }))

    const upper = new THREE.ConeGeometry(h * 0.105, h * 0.46, 6)
    upper.translate(x, y + h * 0.74, z)
    parts.push(paint(upper, '#47593d', { tone: tone * 1.06 }))
  }
  return merge(parts)
}


/**
 * A city quarter seen close, for the ground behind the walls in the two siege
 * lanes.
 *
 * This is the part of the city the class stares at for the whole sequence —
 * it fills the top third of both assault screens — and it was a hundred and
 * fifty boxes with a slab or a drum on top. At lane scale a building is three
 * or four units across rather than half a unit, so every part of the kit
 * actually reads: the pitch of a roof, the shadow under an eave, the ring of
 * windows in a drum.
 *
 * `keepClear` takes predicates so a caller can hold a street open — the land
 * lane needs one in front of its gate, both because a gate needs a road and
 * because it is the only ground the bribery camera has to stand on.
 */
export function buildCityQuarter({
  seed = 3,
  count = 210,
  fromX,
  toX,
  fromZ = -95,
  toZ = 95,
  keepClear = () => false,
  cypresses = 60,
}) {
  const rand = rng(seed)
  const parts = []

  const spot = () => {
    for (let tries = 0; tries < 24; tries++) {
      const x = fromX + rand() * (toX - fromX)
      const z = fromZ + rand() * (toZ - fromZ)
      if (!keepClear(x, z)) return [x, z]
    }
    return null
  }

  for (let i = 0; i < count; i++) {
    const at = spot()
    if (!at) continue
    const [x, z] = at
    const tone = 0.86 + rand() * 0.28
    const roll = rand()

    if (roll > 0.82) {
      // A church: dome on a windowed drum, lean-to aisles, an apse.
      const g = church({
        r: 1.1 + rand() * 0.9,
        h: 2.2 + rand() * 1.6,
        wallHex: PALETTE.cityWall,
        roofHex: PALETTE.cityRoof,
        domeHex: rand() > 0.78 ? PALETTE.domeGold : PALETTE.domeLead,
        tone,
      })
      g.rotateY(rand() * Math.PI * 2)
      g.translate(x, 0, z)
      parts.push(g)
    } else if (roll > 0.72) {
      // A larger public building, presenting an arcade to the street.
      const w = 4.5 + rand() * 3
      const h = 2.4 + rand() * 1.4
      const block = new THREE.BoxGeometry(w, h, 3 + rand() * 2)
      block.translate(0, h / 2, 0)
      const g = merge([
        paint(block, '#ddd0b4', { tone, ao: 0.3, aoFrom: 0, aoTo: h * 0.6 }),
        (() => {
          const a = arcade({
            bays: Math.max(3, Math.round(w / 1.3)),
            bayW: 1.25,
            h: h * 0.8,
            hex: '#e4d8bd',
            tone,
            depth: 0.3,
          })
          a.translate(0, 0, 1.7 + rand())
          return a
        })(),
      ])
      g.rotateY(rand() * Math.PI * 2)
      g.translate(x, 0, z)
      parts.push(g)
    } else {
      const w = 1.8 + rand() * 2.6
      const g = house({
        w,
        d: w * (0.7 + rand() * 0.6),
        h: 1.6 + rand() * 2.6,
        wallHex: rand() > 0.45 ? PALETTE.cityWall : '#d9ccae',
        roofHex: PALETTE.cityRoof,
        tone,
        roofPitch: 0.3 + rand() * 0.22,
      })
      g.rotateY(rand() * Math.PI)
      g.translate(x, 0, z)
      parts.push(g)
    }
  }

  const trees = []
  for (let i = 0; i < cypresses * 6 && trees.length < cypresses; i++) {
    const at = spot()
    if (!at) continue
    trees.push({ x: at[0], z: at[1], y: 0, h: 3.4 + rand() * 2.4, tone: 0.85 + rand() * 0.3 })
  }
  if (trees.length) parts.push(buildCypresses(trees))

  return merge(parts)
}
