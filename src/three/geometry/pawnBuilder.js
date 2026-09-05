/**
 * The crusader figure, built as one merged geometry per faction.
 *
 * What a viewer actually sees at this camera is a helmet, a cape and a spear.
 * That is the whole silhouette, so that is what this builds. The shield is
 * gone: from the lane angle it was a sliver behind the body, and everything it
 * carried now sits on the cape and the flag instead.
 *
 * The helm is a flat-topped great helm — the enclosing helmet just coming into
 * use around this date, and by far the most recognisable medieval head at
 * small scale, because its silhouette is a flat-topped cylinder and nothing
 * else on the field looks like that.
 *
 * The cape is a deliberate liberty. A garment like this is not what a crusader
 * wore, but the flare from shoulder to hem is what makes a figure read as a
 * figure at forty pixels, and it carries the cross.
 *
 * Light is baked into the vertex colours the same way the walls do it, so a
 * figure is darker at the hem and toward the back, which stops it reading as a
 * flat cut-out.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'
import { factionOf } from '../factions.js'

const MAIL = '#9aa0a6'
const STEEL = '#8d939a'
const LEATHER = '#4a4038'

/**
 * Paint with baked occlusion: darker at the ground, and darker on the side
 * away from the sun, which comes across the lane from the attackers' side.
 */
function paint(geometry, hex, { aoHeight = 1.0, tone = 1 } = {}) {
  const colour = new THREE.Color(hex)
  const pos = geometry.attributes.position
  const count = pos.count
  const colours = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = pos.getY(i)
    const x = pos.getX(i)
    let f = 0.62 + 0.38 * Math.min(1, Math.max(0, y) / aoHeight)
    // The sun rakes from -X, so the +X side sits in the figure's own shadow.
    f *= 0.94 - 0.1 * Math.min(1, Math.max(-1, x / 0.4)) * 0.5 + 0.06
    f *= tone
    colours[i * 3] = colour.r * f
    colours[i * 3 + 1] = colour.g * f
    colours[i * 3 + 2] = colour.b * f
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
  return geometry
}

/** One crusader, in a faction's colours. */
export function buildPawn(factionName) {
  const f = factionOf(factionName)
  const parts = []
  const add = (g, hex, opts) => parts.push(paint(g, hex, opts))

  // Boots below the hem.
  const legs = new THREE.BoxGeometry(0.32, 0.4, 0.26)
  legs.translate(0, 0.2, 0)
  add(legs, LEATHER, { aoHeight: 0.6 })

  // Cape: shoulders to hem, flaring out. The silhouette that does the work.
  const cape = new THREE.CylinderGeometry(0.3, 0.5, 0.92, 12, 1, true)
  cape.translate(0, 0.72, 0)
  add(cape, f.cape, { aoHeight: 1.15 })

  // A closed shoulder cape over the top, so the cone is not an open pipe.
  const shoulders = new THREE.CylinderGeometry(0.26, 0.34, 0.22, 12)
  shoulders.translate(0, 1.12, 0)
  add(shoulders, f.cape, { aoHeight: 1.3, tone: 1.06 })

  // Mail beneath, showing at the neck.
  const neck = new THREE.CylinderGeometry(0.15, 0.19, 0.16, 10)
  neck.translate(0, 1.28, 0)
  add(neck, MAIL, { aoHeight: 1.4 })

  // The cross on the cape.
  //
  // Not on the geometric front: the lane camera looks at the figure from
  // roughly forty-five degrees off it, so a cross squared to +Z sits half
  // turned away and reads as a smudge on the flank. It is set on the facet
  // the camera actually sees, and turned to lie flat against it.
  const CROSS_AZIMUTH = -0.8 // radians, facing the lane camera
  const crossR = 0.35
  const cx = Math.sin(CROSS_AZIMUTH) * crossR
  const cz = Math.cos(CROSS_AZIMUTH) * crossR
  const placeCross = (g, y) => {
    g.rotateY(CROSS_AZIMUTH)
    g.translate(cx, y, cz)
    add(g, f.cross, { aoHeight: 1.2, tone: 1.15 })
  }
  placeCross(new THREE.BoxGeometry(0.13, 0.48, 0.04), 0.88)
  placeCross(new THREE.BoxGeometry(0.38, 0.13, 0.04), 1.0)

  // Great helm: a flat-topped drum, with the reinforcing cross and the
  // ocularium cut across it.
  const helm = new THREE.CylinderGeometry(0.225, 0.235, 0.4, 12)
  helm.translate(0, 1.55, 0)
  add(helm, STEEL, { aoHeight: 1.7, tone: 1.04 })

  const helmTop = new THREE.CylinderGeometry(0.235, 0.225, 0.05, 12)
  helmTop.translate(0, 1.76, 0)
  add(helmTop, STEEL, { aoHeight: 1.8, tone: 1.1 })

  // Vision slit, and the vertical reinforce that crosses it.
  const slit = new THREE.BoxGeometry(0.33, 0.055, 0.06)
  slit.translate(0, 1.62, 0.2)
  add(slit, '#241f1a', { aoHeight: 1.7, tone: 1 })
  const reinforce = new THREE.BoxGeometry(0.055, 0.4, 0.06)
  reinforce.translate(0, 1.55, 0.21)
  add(reinforce, '#767c83', { aoHeight: 1.7, tone: 1.08 })
  // Breaths, low on the face.
  for (const dx of [-0.09, 0, 0.09]) {
    const hole = new THREE.BoxGeometry(0.035, 0.035, 0.05)
    hole.translate(dx, 1.44, 0.205)
    add(hole, '#241f1a', { aoHeight: 1.6 })
  }

  // Spear, carried in the right hand.
  const shaft = new THREE.CylinderGeometry(0.032, 0.032, 2.3, 6)
  shaft.rotateZ(-0.07)
  shaft.translate(0.4, 1.05, -0.04)
  add(shaft, PALETTE.hullTimberDark, { aoHeight: 1.6 })
  const point = new THREE.ConeGeometry(0.062, 0.26, 6)
  point.rotateZ(-0.07)
  point.translate(0.48, 2.28, -0.04)
  add(point, '#b9bcc0', { aoHeight: 2.0, tone: 1.1 })

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

const cache = new Map()

/** Geometry is shared across every figure of a faction. */
export function pawnGeometry(factionName) {
  const key = factionName ?? 'Indeterminate'
  if (!cache.has(key)) cache.set(key, buildPawn(key))
  return cache.get(key)
}
