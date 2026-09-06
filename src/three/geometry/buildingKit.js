/**
 * A kit of Byzantine architectural parts.
 *
 * The city was boxes with a coloured slab on top. That is what made the
 * skyline read as a model: real Constantinople has arcades, tiled roofs with
 * eaves and gable ends, domes on drums pierced by rings of windows, half-domes,
 * apses and buttresses — and none of that is expensive. The sea lane runs at
 * 97 draw calls and 213,000 triangles, which is nothing; the constraint on the
 * hardware this has to run on is fill rate and the shadow pass, not geometry.
 *
 * Everything here returns a plain `BufferGeometry` with a baked `color`
 * attribute, ready to be merged into one mesh with its neighbours. Two rules
 * make that work:
 *
 *   1. **Everything must be indexed.** `mergeGeometries` refuses a mix of
 *      indexed and non-indexed inputs. Box, Cylinder, Sphere, Torus and Lathe
 *      are all indexed; Extrude and the polyhedra are not, so an arch here is
 *      built from a torus rather than extruded through a shape with a hole.
 *
 *   2. **Light is baked, not computed.** Flat shading with one directional
 *      light cannot tell that a wall is under an eave or inside a window
 *      reveal. Those are painted in, which is free at runtime and is most of
 *      what makes the result look lit rather than coloured.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* ------------------------------------------------------------------ paint */

/**
 * Bake a colour into a geometry, with optional shading.
 *
 * `ao` darkens the lower part of the piece, which is what a surface does where
 * it meets the ground or sits under something. `tone` is a flat multiplier for
 * per-instance variation, so a street of the same house does not read as a
 * street of one house repeated.
 */
export function paint(geometry, hex, { tone = 1, ao = 0, aoFrom = 0, aoTo = 1 } = {}) {
  const c = new THREE.Color(hex)
  const pos = geometry.attributes.position
  const arr = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i++) {
    let k = tone
    if (ao > 0) {
      // How far up this vertex sits within the band being shaded.
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp((y - aoFrom) / Math.max(1e-6, aoTo - aoFrom), 0, 1)
      k *= 1 - ao * (1 - t)
    }
    arr[i * 3] = c.r * k
    arr[i * 3 + 1] = c.g * k
    arr[i * 3 + 2] = c.b * k
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return geometry
}

/** Merge a pile of parts into one geometry and dispose the originals. */
export function merge(parts) {
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/* ------------------------------------------------------------------ parts */

/**
 * A pitched roof with eaves that oversail the wall below.
 *
 * The overhang is the whole point. A roof flush with the wall reads as a lid;
 * one that projects casts a line of shadow along the top of the facade, and
 * that shadow is most of what says "building" at a distance. It is baked into
 * the wall's own colour by the caller rather than left to the light.
 */
export function pitchedRoof({ w, d, h, overhang = 0.14, hex, tone = 1 }) {
  const W = w + overhang * 2
  const D = d + overhang * 2
  const parts = []

  // Two slopes, each a thin slab tilted from eave to ridge. A four-sided
  // pyramid was tried first and is a *hipped* roof, which is a different and
  // much less common form here — the gable end is half of what says
  // "Mediterranean town" from a distance.
  const angle = Math.atan2(h, W / 2)
  const slope = Math.hypot(W / 2, h)
  for (const side of [-1, 1]) {
    const slab = new THREE.BoxGeometry(slope, 0.05, D)
    slab.rotateZ(side * -angle)
    slab.translate((side * W) / 4, h / 2, 0)
    // The sun is high and to one side, so the two slopes are never the same
    // value; giving them the same one flattens the roof into a single shape.
    parts.push(paint(slab, hex, { tone: tone * (side < 0 ? 1.06 : 0.88) }))
  }

  // Gable ends: a thin triangular prism closing each end of the roof.
  //
  // A three-segment cylinder is a triangular prism, but getting it upright
  // takes care. Its section vertices start at (0, r), (±0.866r, −0.5r) in the
  // XZ plane; `rotateX` lays the axis along Z and leaves the section apex
  // *down*, so `rotateZ(π)` is needed to right it. Then the section is
  // 1.732r wide and 1.5r tall with its centroid at the origin, which is where
  // the scale factors and the third-of-height lift come from.
  for (const side of [-1, 1]) {
    const gable = new THREE.CylinderGeometry(1, 1, 0.04, 3)
    gable.rotateX(Math.PI / 2)
    gable.rotateZ(Math.PI)
    gable.scale(W / 1.732, h / 1.5, 1)
    gable.translate(0, h / 3, (side * D) / 2)
    parts.push(paint(gable, hex, { tone: tone * 0.8 }))
  }

  // The eaves board at the springing: the edge that catches the light and
  // throws the shadow line along the top of the wall.
  const eaves = new THREE.BoxGeometry(W, 0.06, D)
  eaves.translate(0, 0.03, 0)
  parts.push(paint(eaves, hex, { tone: tone * 1.14 }))

  return merge(parts)
}

/**
 * A ring of windows around a drum, cut as recesses rather than holes.
 *
 * True openings would need a boolean subtraction and a non-indexed result.
 * A recessed panel painted dark reads the same at any distance a city block is
 * ever seen from, and merges cleanly.
 */
function drumWindows({ r, y, count, h, hex }) {
  const parts = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const panel = new THREE.BoxGeometry(0.055, h, r * 0.34)
    panel.rotateY(-a)
    panel.translate(Math.cos(a) * r * 0.985, y, Math.sin(a) * r * 0.985)
    parts.push(paint(panel, hex, { tone: 0.42 }))
  }
  return parts
}

/**
 * A dome on a drum: the shape that makes a skyline Byzantine rather than
 * western European. No spires anywhere in this city.
 */
export function domeOnDrum({
  r,
  drumH,
  windows = 8,
  wallHex,
  domeHex,
  tone = 1,
  cornice = true,
}) {
  const parts = []

  const drum = new THREE.CylinderGeometry(r, r, drumH, Math.max(8, Math.round(r * 14)))
  drum.translate(0, drumH / 2, 0)
  parts.push(paint(drum, wallHex, { tone, ao: 0.2, aoFrom: 0, aoTo: drumH }))

  if (windows > 0) {
    parts.push(...drumWindows({ r, y: drumH * 0.55, count: windows, h: drumH * 0.5, hex: wallHex }))
  }

  // A cornice at the head of the drum, where the dome springs.
  if (cornice) {
    const ring = new THREE.CylinderGeometry(r * 1.1, r * 1.06, 0.07, Math.max(8, Math.round(r * 14)))
    ring.translate(0, drumH, 0)
    parts.push(paint(ring, wallHex, { tone: tone * 1.15 }))
  }

  const dome = new THREE.SphereGeometry(r * 1.05, Math.max(8, Math.round(r * 14)), 7, 0, Math.PI * 2, 0, Math.PI / 2)
  dome.scale(1, 0.62, 1)
  dome.translate(0, drumH + 0.02, 0)
  parts.push(paint(dome, domeHex, { tone }))

  return merge(parts)
}

/** Half a dome, for the ends of a domed cross-in-square church. */
export function semiDome({ r, hex, tone = 1, flatten = 0.66 }) {
  const g = new THREE.SphereGeometry(r, 14, 8, 0, Math.PI, 0, Math.PI / 2)
  g.scale(1, flatten, 1)
  return paint(g, hex, { tone })
}

/** An apse: a half-round projection, capped with a half-dome. */
export function apse({ r, h, wallHex, domeHex, tone = 1 }) {
  const parts = []
  const body = new THREE.CylinderGeometry(r, r, h, 12, 1, false, -Math.PI / 2, Math.PI)
  body.translate(0, h / 2, 0)
  parts.push(paint(body, wallHex, { tone, ao: 0.22, aoFrom: 0, aoTo: h }))

  // A full hemisphere rather than half of one. SphereGeometry and
  // CylinderGeometry measure their start angle from different axes, so a
  // half-sphere comes out ninety degrees off the half-cylinder beneath it —
  // the cap sat across the apse as a crescent. The back half of a full
  // hemisphere is buried in the wall the apse projects from, so it costs a
  // few triangles and cannot be misaligned.
  const cap = new THREE.SphereGeometry(r, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2)
  cap.scale(1, 0.7, 1)
  cap.translate(0, h, 0)
  parts.push(paint(cap, domeHex, { tone }))
  return merge(parts)
}

/**
 * An arcade: piers carrying semicircular arches, along the X axis.
 *
 * The arch heads are half-tori. A torus is indexed, which an extruded shape
 * with a hole would not be, and it gives a true semicircular arch rather than
 * a stepped approximation.
 */
export function arcade({ bays, bayW, pierW = 0.16, h, depth = 0.18, hex, tone = 1 }) {
  const parts = []
  const total = bays * bayW
  const springing = h * 0.62
  const archR = (bayW - pierW) / 2

  for (let i = 0; i <= bays; i++) {
    const x = -total / 2 + i * bayW
    const pier = new THREE.BoxGeometry(pierW, springing, depth)
    pier.translate(x, springing / 2, 0)
    parts.push(paint(pier, hex, { tone, ao: 0.24, aoFrom: 0, aoTo: springing }))
  }

  for (let i = 0; i < bays; i++) {
    const x = -total / 2 + bayW * (i + 0.5)
    const arch = new THREE.TorusGeometry(archR, pierW / 2, 4, 10, Math.PI)
    arch.translate(x, springing, 0)
    // Torus lies in XY, which is the plane of the facade — correct as built.
    parts.push(paint(arch, hex, { tone: tone * 1.04 }))

    // The spandrel above, filling between the arch and the entablature.
    const fill = new THREE.BoxGeometry(bayW, h - springing - archR, depth)
    fill.translate(x, springing + archR + (h - springing - archR) / 2, 0)
    parts.push(paint(fill, hex, { tone }))
  }

  // The entablature the arcade carries, oversailing slightly.
  const band = new THREE.BoxGeometry(total + pierW * 2, 0.09, depth * 1.5)
  band.translate(0, h, 0)
  parts.push(paint(band, hex, { tone: tone * 1.14 }))

  return merge(parts)
}

/** A tapering buttress, of the kind that props the Hagia Sophia's dome. */
export function buttress({ w, d, h, hex, tone = 1 }) {
  // A battered pier, not a pyramid: two stacked stages with a capping slab,
  // which is how the Hagia Sophia's actually step back as they rise.
  const parts = []
  const base = new THREE.BoxGeometry(w, h * 0.62, d)
  base.translate(0, h * 0.31, 0)
  parts.push(paint(base, hex, { tone, ao: 0.24, aoFrom: 0, aoTo: h * 0.62 }))

  const upper = new THREE.BoxGeometry(w * 0.66, h * 0.38, d * 0.72)
  upper.translate(0, h * 0.62 + h * 0.19, 0)
  parts.push(paint(upper, hex, { tone: tone * 1.05 }))

  const cap = new THREE.BoxGeometry(w * 0.78, 0.07, d * 0.84)
  cap.translate(0, h, 0)
  parts.push(paint(cap, hex, { tone: tone * 1.16 }))
  return merge(parts)
}

/** A free-standing column with a base and a capital. */
export function column({ h, r = 0.06, hex, tone = 1 }) {
  const parts = []
  const base = new THREE.BoxGeometry(r * 3.4, r * 1.6, r * 3.4)
  base.translate(0, r * 0.8, 0)
  parts.push(paint(base, hex, { tone: tone * 0.94 }))

  const shaft = new THREE.CylinderGeometry(r * 0.86, r, h - r * 3.2, 8)
  shaft.translate(0, r * 1.6 + (h - r * 3.2) / 2, 0)
  parts.push(paint(shaft, hex, { tone }))

  const cap = new THREE.BoxGeometry(r * 3, r * 1.6, r * 3)
  cap.translate(0, h - r * 0.8, 0)
  parts.push(paint(cap, hex, { tone: tone * 1.12 }))
  return merge(parts)
}

/**
 * An ordinary house: walls, a course of shadow under the eaves, and a pitched
 * tiled roof. The AO band along the base is what sits it on the ground rather
 * than letting it hover.
 */
export function house({ w, d, h, wallHex, roofHex, tone = 1, roofPitch = 0.42 }) {
  const parts = []

  const body = new THREE.BoxGeometry(w, h, d)
  body.translate(0, h / 2, 0)
  parts.push(paint(body, wallHex, { tone, ao: 0.3, aoFrom: 0, aoTo: h * 0.55 }))

  // The band of shade the eaves throw on the wall head.
  const shade = new THREE.BoxGeometry(w * 1.002, h * 0.1, d * 1.002)
  shade.translate(0, h - h * 0.05, 0)
  parts.push(paint(shade, wallHex, { tone: tone * 0.74 }))

  const roof = pitchedRoof({ w, d, h: Math.max(0.16, h * roofPitch), hex: roofHex, tone })
  roof.translate(0, h, 0)
  parts.push(roof)

  return merge(parts)
}

/**
 * A neighbourhood church: a boxy naos, an apse to the east, and a dome on a
 * windowed drum. The commonest building in the city after the house, and the
 * one that gives the skyline its rhythm.
 */
export function church({ r, h, wallHex, roofHex, domeHex, tone = 1 }) {
  const parts = []

  const naos = new THREE.BoxGeometry(r * 2.5, h, r * 2.3)
  naos.translate(0, h / 2, 0)
  parts.push(paint(naos, wallHex, { tone, ao: 0.3, aoFrom: 0, aoTo: h * 0.6 }))

  const eaveShade = new THREE.BoxGeometry(r * 2.51, h * 0.09, r * 2.31)
  eaveShade.translate(0, h - h * 0.045, 0)
  parts.push(paint(eaveShade, wallHex, { tone: tone * 0.76 }))

  // Lean-to roofs over the aisles, either side of the drum.
  for (const side of [-1, 1]) {
    const lean = pitchedRoof({ w: r * 0.7, d: r * 2.3, h: r * 0.34, hex: roofHex, tone })
    lean.translate(side * r * 0.9, h, 0)
    parts.push(lean)
  }

  const a = apse({ r: r * 0.52, h: h * 0.72, wallHex, domeHex: roofHex, tone })
  a.rotateY(Math.PI / 2)
  a.translate(r * 1.25, 0, 0)
  parts.push(a)

  const dome = domeOnDrum({
    r: r * 0.6,
    drumH: r * 0.72,
    windows: 8,
    wallHex,
    domeHex,
    tone,
  })
  dome.translate(0, h, 0)
  parts.push(dome)

  return merge(parts)
}
