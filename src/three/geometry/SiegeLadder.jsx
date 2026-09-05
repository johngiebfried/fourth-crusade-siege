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

/** Lying flat on the ground, pointing away from the wall. */
const DOWN_ANGLE = 1.5
/** Leaning against the wall face. */
const UP_ANGLE = -0.16

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

  for (const off of [-0.22, 0.22]) {
    const rail = new THREE.CylinderGeometry(0.055, 0.06, height, 6)
    rail.translate(off, height / 2, 0)
    parts.push(paint(rail, colour))
  }
  for (let y = 0.42; y < height - 0.15; y += 0.42) {
    const rung = new THREE.CylinderGeometry(0.038, 0.038, 0.44, 5)
    rung.rotateZ(Math.PI / 2)
    rung.translate(0, y, 0)
    parts.push(paint(rung, dark))
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * @param {'rising'|'up'|'falling'} phase
 */
export function SiegeLadder({ position, height = 4.4, phase = 'rising' }) {
  const pivot = useRef()
  const geometry = useMemo(() => buildLadderGeometry(height), [height])

  useFrame((_, delta) => {
    const g = pivot.current
    if (!g) return
    const target = phase === 'falling' ? DOWN_ANGLE : UP_ANGLE
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
