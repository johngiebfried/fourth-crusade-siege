/**
 * Ground detail for the land lane: grass across the open ground, and moving
 * water in the moat.
 *
 * Both are still zero-asset. The grass is one instanced mesh, so several
 * thousand tufts cost a single draw call, and the water is a shader with no
 * textures at all — just code driving vertices and colour.
 */

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** A tuft of a few crossed blades. */
function buildTuft() {
  const parts = []
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.PlaneGeometry(0.055, 0.15, 1, 2)
    // Bend the blade over so it does not read as a card standing on end.
    const pos = blade.attributes.position
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v)
      const t = (y + 0.075) / 0.15
      pos.setZ(v, t * t * 0.05)
    }
    blade.translate(0, 0.075, 0)
    blade.rotateY((i / 3) * Math.PI)
    parts.push(blade)
  }
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
}

/**
 * Grass over a rectangle of ground. Density is deliberately highest near the
 * camera's side of the field, where it actually reads.
 */
export function GrassField({
  xFrom,
  xTo,
  zFrom,
  zTo,
  count = 7000,
  seed = 11,
  colour = '#7f8a55',
}) {
  const ref = useRef()
  const geometry = useMemo(() => buildTuft(), [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    let a = seed >>> 0
    const rand = () => {
      a += 0x6d2b79f5
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    const m = new THREE.Object3D()
    const tint = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const x = xFrom + rand() * (xTo - xFrom)
      const z = zFrom + rand() * (zTo - zFrom)
      const s = 0.75 + rand() * 0.8
      m.position.set(x, 0, z)
      m.rotation.set(0, rand() * Math.PI * 2, (rand() - 0.5) * 0.25)
      m.scale.set(s, s * (0.8 + rand() * 0.6), s)
      m.updateMatrix()
      mesh.setMatrixAt(i, m.matrix)

      // Mottling, so the field is not one flat green.
      const v = 0.82 + rand() * 0.36
      tint.set(colour).multiplyScalar(v)
      mesh.setColorAt(i, tint)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [xFrom, xTo, zFrom, zTo, count, seed, colour])

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]} receiveShadow>
      <meshLambertMaterial color="#ffffff" side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ water */

/**
 * Moving water.
 *
 * Written as a normal lit material with the wave motion injected into its
 * shader, rather than as a raw ShaderMaterial. A raw shader gets no lighting
 * and no fog, which made the moat read as a black trench cut through the field
 * instead of as water sitting in the landscape.
 *
 * Still no textures: the ripples and the glint on the crests are arithmetic.
 * `swell` scales the whole wave system, so the same water serves a ditch a few
 * units across and the open Golden Horn.
 */
export function RippleWater({
  width,
  depth = 320,
  x = 0,
  z = 0,
  y = -0.1,
  colour = '#4e7a72',
  swell = 1,
  segmentsX = 6,
  segmentsZ = 340,
}) {
  const material = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ color: colour })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uSwell = { value: swell }
      shader.vertexShader =
        'uniform float uTime;\nuniform float uSwell;\nvarying float vWave;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float w =
             sin(position.y * 0.85 / uSwell + uTime * 1.05) * 0.05 * uSwell +
             sin(position.x * 2.30 / uSwell - uTime * 0.70) * 0.03 * uSwell +
             sin((position.x + position.y) * 4.10 / uSwell + uTime * 1.90) * 0.015 * uSwell;
           transformed.z += w;
           vWave = w / uSwell;`
        )
      shader.fragmentShader =
        'varying float vWave;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           // Crests catch the morning light; troughs sit darker and greener.
           gl_FragColor.rgb += smoothstep(0.028, 0.062, vWave) * 0.14;
           gl_FragColor.rgb -= smoothstep(-0.020, -0.060, -vWave) * 0.09;`
        )
      m.userData.shader = shader
    }
    return m
  }, [colour, swell])

  useFrame((state) => {
    const shader = material.userData.shader
    if (shader) shader.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[x, y, z]}
      material={material}
      receiveShadow
    >
      <planeGeometry args={[width, depth, segmentsX, segmentsZ]} />
    </mesh>
  )
}

/** The moat: a narrow ditch of the same water. */
export function MoatWater({ x, width, depth = 320, y = -0.1 }) {
  return <RippleWater x={x} width={width} depth={depth} y={y} swell={1} />
}

/* ------------------------------------------------------- water reactions */

/**
 * The disturbance a hull makes: a foam collar at the waterline, and a wake
 * fanning out astern that fades as the ship comes to rest.
 *
 * Both are flat geometry with vertex colour, sitting just above the water
 * surface. No textures, and nothing that needs a transparent sort beyond a
 * single additive-ish layer.
 */
export function ShipWash({ length = 6.2, beam = 4.2, moving = 0 }) {
  const wake = useRef()
  const collar = useRef()

  useFrame((state, delta) => {
    if (wake.current) {
      wake.current.material.opacity = THREE.MathUtils.damp(
        wake.current.material.opacity,
        0.34 * moving,
        3,
        delta
      )
      // Drift the wake backwards so it reads as being left behind.
      wake.current.position.x = -length * 0.55 - moving * 1.2
    }
    if (collar.current) {
      const t = state.clock.elapsedTime
      collar.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.02)
      collar.current.material.opacity = 0.3 + 0.08 * Math.sin(t * 1.6)
    }
  })

  return (
    <group>
      {/* Foam collar at the waterline. */}
      <mesh ref={collar} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <ringGeometry args={[beam * 0.34, beam * 0.52, 28]} />
        <meshBasicMaterial
          color="#cfe0e2"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Wake astern, tapering away. */}
      <mesh ref={wake} rotation={[-Math.PI / 2, 0, 0]} position={[-length * 0.55, 0.08, 0]}>
        <planeGeometry args={[length * 2.4, beam * 1.15]} />
        <meshBasicMaterial
          color="#bcd3d6"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/**
 * The water closing over a ship that has gone down: an expanding ring of
 * disturbed surface, on its own clock.
 */
export function SinkRing({ position }) {
  const ref = useRef()
  const clock = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    clock.current += delta
    const t = Math.min(1, clock.current / 3.4)
    ref.current.scale.setScalar(0.5 + t * 5.5)
    ref.current.material.opacity = 0.5 * (1 - t)
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <ringGeometry args={[0.5, 0.95, 32]} />
      <meshBasicMaterial color="#d8e6e6" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  )
}

/**
 * Smoke drifting over the city from the fires of the earlier assault.
 * Soft geometry rather than a texture: overlapping low-opacity spheres,
 * turning slowly and rising.
 */
export function Smoke({ plumes = [] }) {
  const group = useRef()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.children.forEach((child, i) => {
      child.rotation.y = t * 0.06 + i
      child.position.y = child.userData.baseY + Math.sin(t * 0.25 + i) * 0.5
    })
  })

  return (
    <group ref={group}>
      {plumes.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} userData={{ baseY: p.y }}>
          {[0, 1, 2, 3].map((j) => (
            <mesh
              key={j}
              position={[Math.sin(j * 2.1) * p.r * 0.5, j * p.r * 0.75, Math.cos(j * 1.7) * p.r * 0.5]}
            >
              <sphereGeometry args={[p.r * (1 - j * 0.13), 9, 7]} />
              <meshBasicMaterial
                color="#a9a49b"
                transparent
                opacity={0.16 - j * 0.028}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
