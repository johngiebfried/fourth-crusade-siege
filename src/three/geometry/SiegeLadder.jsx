/**
 * A scaling ladder, raised during the assault rather than standing there from
 * the start.
 *
 * It comes up out of the grass as the attempt begins, stays against the wall
 * if the crusader gets over, and topples back if they do not — so the wall
 * gradually accumulates the ladders of everyone who made it, which reads as
 * the assault's progress without any extra UI.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'

/**
 * Lying flat on the ground, pointing away from the wall.
 *
 * Everything here rotates about Z, which tips the ladder along X — across the
 * ground and up against the wall face. The rails therefore have to be
 * separated along Z, parallel to the wall. Separating them along X, as this
 * first did, puts the ladder's own plane in the plane of rotation, so it rises
 * edge-on: sideways, and straight through the masonry.
 */
const DOWN_ANGLE = Math.PI / 2 - 0.06

function buildLadderGeometry(height) {
  const parts = []
  const colour = new THREE.Color(PALETTE.hullTimber)
  const dark = new THREE.Color(PALETTE.hullTimberDark)

  const paint = (g, c) => {
    const n = g.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = c.r
      arr[i * 3 + 1] = c.g
      arr[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    return g
  }

  // Rails run up in Y, set apart in Z so the ladder's face is parallel to the
  // wall it will lean against.
  for (const off of [-0.24, 0.24]) {
    const rail = new THREE.CylinderGeometry(0.055, 0.06, height, 6)
    rail.translate(0, height / 2, off)
    parts.push(paint(rail, colour))
  }
  // Rungs span between the rails, so their axis is Z.
  for (let y = 0.42; y < height - 0.15; y += 0.42) {
    const rung = new THREE.CylinderGeometry(0.038, 0.038, 0.48, 5)
    rung.rotateX(Math.PI / 2)
    rung.translate(0, y, 0)
    parts.push(paint(rung, dark))
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * @param {[number,number,number]} position  the ladder's foot
 * @param {number} height  the ladder's length
 * @param {number} lean    radians off vertical when resting on the wall
 * @param {'rising'|'up'|'falling'} phase
 */
export function SiegeLadder({ position, height = 4.4, lean = 0.34, phase = 'rising' }) {
  const pivot = useRef()
  const geometry = useMemo(() => buildLadderGeometry(height), [height])

  useFrame((_, delta) => {
    const g = pivot.current
    if (!g) return
    // Negative tips the head toward +X, which is where the wall is.
    const target = phase === 'falling' ? DOWN_ANGLE : -lean
    // Raising is brisk; toppling back is slower and heavier.
    const rate = phase === 'falling' ? 2.2 : 3.4
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, target, rate, delta)
  })

  return (
    <group position={position}>
      <group ref={pivot} rotation={[0, 0, DOWN_ANGLE]}>
        <mesh geometry={geometry} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      </group>
    </group>
  )
}
