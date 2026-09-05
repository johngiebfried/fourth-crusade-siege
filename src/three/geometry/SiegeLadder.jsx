/**
 * A scaling ladder, raised during the assault rather than standing there from
 * the start.
 *
 * It comes up as a crusader's attempt begins, stays against the wall if they
 * get over, and goes back down if they do not — so the wall accumulates the
 * ladders of everyone who made it.
 *
 * Two ways of raising it, chosen by how much room there is behind the foot:
 *
 *   - **Toppling up** from lying flat on the ground, pointing away from the
 *     wall. This is how you raise a ladder when you have the space, and it is
 *     what happens at the outer wall, where there is open field behind.
 *
 *   - **Swinging up along the wall**, from lying parallel to it. The inner
 *     wall needs a ladder of eight and a half units and the terrace in front
 *     of it is barely six wide, so a ladder laid flat there reaches back
 *     through the outer wall — and sweeps through it on the way up. Laid
 *     along the wall instead, it stays in a thin slab of clear ground.
 *
 * Everything rotates about Z, which tips the ladder along X against the wall
 * face, so the rails are set apart in Z, parallel to the wall. Separating them
 * along X puts the ladder's own plane in the plane of rotation and it rises
 * edge-on, sideways through the masonry.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'

/** Lying flat on the ground, pointing away from the wall. */
const FLAT_BACK = Math.PI / 2 - 0.06
/** Lying flat on the ground, pointing along the wall. */
const FLAT_ALONG = Math.PI / 2

const smoothstep = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return x * x * (3 - 2 * x)
}

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
 * @param {number}  height     the ladder's length
 * @param {number}  lean       radians off vertical when resting on the wall
 * @param {boolean} alongWall  swing up parallel to the wall instead of
 *                             toppling up from behind, for confined ground
 * @param {'rising'|'up'|'falling'} phase
 */
export function SiegeLadder({
  position,
  height = 4.4,
  lean = 0.34,
  alongWall = false,
  phase = 'rising',
}) {
  const pivot = useRef()
  const progress = useRef(0)
  const geometry = useMemo(() => buildLadderGeometry(height), [height])

  useFrame((_, delta) => {
    const g = pivot.current
    if (!g) return

    // Raising is brisk; coming back down is slower and heavier.
    const target = phase === 'falling' ? 0 : 1
    const rate = phase === 'falling' ? 0.6 : 1.1
    progress.current += Math.sign(target - progress.current) * rate * delta
    progress.current = Math.min(1, Math.max(0, progress.current))
    const p = progress.current

    if (alongWall) {
      // Swing up out of the plane of the wall first, then tip onto its face.
      g.rotation.x = FLAT_ALONG * (1 - smoothstep(0, 0.68, p))
      g.rotation.z = -lean * smoothstep(0.5, 1, p)
    } else {
      g.rotation.x = 0
      g.rotation.z = THREE.MathUtils.lerp(FLAT_BACK, -lean, smoothstep(0, 1, p))
    }
  })

  return (
    <group position={position}>
      <group ref={pivot} rotation={[alongWall ? FLAT_ALONG : FLAT_BACK, 0, 0]}>
        <mesh geometry={geometry} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      </group>
    </group>
  )
}
