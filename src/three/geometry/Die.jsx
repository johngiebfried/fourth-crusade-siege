/**
 * A tumbling d6 that settles on a face already decided by rules.js.
 *
 * The outcome is never generated here. The die is handed the number that the
 * roll queue produced when the stage began, and it animates toward showing
 * exactly that face. Pips are geometry, not a texture map.
 */

import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const HALF = 0.5

/** Face normals in the standard arrangement, opposite faces summing to seven. */
const FACE_NORMALS = {
  1: new THREE.Vector3(0, 1, 0),
  6: new THREE.Vector3(0, -1, 0),
  2: new THREE.Vector3(0, 0, 1),
  5: new THREE.Vector3(0, 0, -1),
  3: new THREE.Vector3(1, 0, 0),
  4: new THREE.Vector3(-1, 0, 0),
}

/** Pip layouts in unit-square coordinates on a face. */
const PIP_LAYOUTS = {
  1: [[0, 0]],
  2: [[-0.22, 0.22], [0.22, -0.22]],
  3: [[-0.24, 0.24], [0, 0], [0.24, -0.24]],
  4: [[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]],
  5: [[-0.24, 0.24], [0.24, 0.24], [0, 0], [-0.24, -0.24], [0.24, -0.24]],
  6: [
    [-0.24, 0.26], [0.24, 0.26],
    [-0.24, 0], [0.24, 0],
    [-0.24, -0.26], [0.24, -0.26],
  ],
}

function buildPipGeometry() {
  const parts = []
  const pipRadius = 0.075
  const depth = 0.03

  for (const face of [1, 2, 3, 4, 5, 6]) {
    const normal = FACE_NORMALS[face]
    // Build an orthonormal basis on the face.
    const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
    const u = new THREE.Vector3().crossVectors(up, normal).normalize()
    const v = new THREE.Vector3().crossVectors(normal, u).normalize()

    for (const [a, b] of PIP_LAYOUTS[face]) {
      const g = new THREE.CylinderGeometry(pipRadius, pipRadius, depth, 12)
      // Cylinder's axis is +Y; rotate it onto the face normal.
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      g.applyQuaternion(q)
      const p = new THREE.Vector3()
        .addScaledVector(normal, HALF)
        .addScaledVector(u, a)
        .addScaledVector(v, b)
      g.translate(p.x, p.y, p.z)
      parts.push(g)
    }
  }
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/** Quaternion that brings `face` to point at +Y (toward the camera-ish up). */
function quaternionForFace(face) {
  const normal = FACE_NORMALS[face]
  return new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0))
}

/**
 * @param {number} value      the pre-decided face, 1-6
 * @param {boolean} rolling   true while tumbling, false once it should settle
 * @param {function} onSettle called once the die has come to rest
 */
export function Die({ position = [0, 0, 0], value = 6, rolling = true, onSettle, scale = 1 }) {
  const mesh = useRef()
  const pipGeometry = useMemo(() => buildPipGeometry(), [])
  const target = useMemo(() => quaternionForFace(value), [value])
  const [settled, setSettled] = useState(false)
  const spin = useRef(new THREE.Vector3(6.2, 8.4, 5.1))
  const elapsed = useRef(0)

  useEffect(() => {
    setSettled(false)
    elapsed.current = 0
    spin.current.set(
      4 + Math.random() * 6,
      5 + Math.random() * 7,
      3 + Math.random() * 6
    )
  }, [value, rolling])

  useFrame((state, delta) => {
    if (!mesh.current) return
    elapsed.current += delta

    if (rolling && elapsed.current < 1.15) {
      // Free tumble, decaying.
      const decay = Math.max(0, 1 - elapsed.current / 1.15)
      mesh.current.rotation.x += spin.current.x * delta * decay
      mesh.current.rotation.y += spin.current.y * delta * decay
      mesh.current.rotation.z += spin.current.z * delta * decay
      // Small arc so it reads as thrown, not floating.
      const h = Math.sin((elapsed.current / 1.15) * Math.PI) * 0.7
      mesh.current.position.y = position[1] + h
    } else {
      // Settle onto the decided face.
      mesh.current.quaternion.slerp(target, 1 - Math.pow(0.001, delta))
      mesh.current.position.y = THREE.MathUtils.damp(
        mesh.current.position.y,
        position[1],
        6,
        delta
      )
      if (!settled && mesh.current.quaternion.angleTo(target) < 0.03) {
        setSettled(true)
        onSettle?.()
      }
    }
  })

  return (
    <group position={position} scale={scale}>
      <group ref={mesh}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#f2ead8" flatShading />
        </mesh>
        <mesh geometry={pipGeometry}>
          <meshLambertMaterial color="#3a2b22" />
        </mesh>
      </group>
    </group>
  )
}
