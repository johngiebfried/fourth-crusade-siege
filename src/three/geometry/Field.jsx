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
 * The first version displaced the surface but never touched its normals, so
 * the light fell on it as if it were still flat and the waves only existed as
 * a colour trick. That is why it read as silly: the geometry said "sea" and
 * the shading said "painted floor".
 *
 * This sums four wave trains running in different directions, and computes the
 * surface normal analytically from their gradients, so the lighting is the
 * wave. On a Phong material that also gives a real specular glint, which is
 * most of what makes water look wet.
 *
 * Still no textures anywhere — it is all arithmetic.
 */
const WAVE_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uSwell;
  uniform float uChop;
  varying float vWave;

  // One wave train: direction, wavelength, amplitude, speed.
  float waveTrain(vec2 p, vec2 dir, float k, float amp, float speed, inout vec2 grad) {
    vec2 d = normalize(dir);
    float phase = dot(d, p) * k + uTime * speed;
    grad += d * (amp * k * cos(phase));
    return amp * sin(phase);
  }

  float waterHeight(vec2 p, out vec2 grad) {
    grad = vec2(0.0);
    float s = uSwell;
    float h = 0.0;
    h += waveTrain(p, vec2(1.0, 0.18), 0.55 / s, 0.105 * s, 0.85, grad);
    h += waveTrain(p, vec2(0.28, 1.0), 0.87 / s, 0.068 * s, 1.10, grad);
    h += waveTrain(p, vec2(-0.72, 0.58), 1.70 / s, 0.034 * s * uChop, 1.55, grad);
    h += waveTrain(p, vec2(0.9, -0.46), 3.10 / s, 0.017 * s * uChop, 2.15, grad);
    return h;
  }
`

export function RippleWater({
  width,
  depth = 320,
  x = 0,
  z = 0,
  y = -0.1,
  colour = '#3f6a72',
  swell = 1,
  chop = 1,
  segmentsX = 120,
  segmentsZ = 240,
}) {
  const material = useMemo(() => {
    const m = new THREE.MeshPhongMaterial({
      color: colour,
      specular: new THREE.Color('#9fc4cc'),
      shininess: 90,
      flatShading: false,
    })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uSwell = { value: swell }
      shader.uniforms.uChop = { value: chop }

      shader.vertexShader = WAVE_GLSL + shader.vertexShader
        // Take the normal from the wave gradient rather than the flat plane.
        .replace(
          '#include <beginnormal_vertex>',
          `#include <beginnormal_vertex>
           vec2 wGrad;
           float wH = waterHeight(position.xy, wGrad);
           objectNormal = normalize(vec3(-wGrad.x, -wGrad.y, 1.0));
           vWave = wH;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           transformed.z += wH;`
        )

      shader.fragmentShader =
        'varying float vWave;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           // Troughs sit deeper and greener; crests lift toward the sky.
           gl_FragColor.rgb *= 1.0 + clamp(vWave * 1.4, -0.22, 0.30);`
        )

      m.userData.shader = shader
    }
    return m
  }, [colour, swell, chop])

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

/** The moat: a narrow ditch of the same water, running slower and flatter. */
export function MoatWater({ x, width, depth = 320, y = -0.1 }) {
  return (
    <RippleWater
      x={x}
      width={width}
      depth={depth}
      y={y}
      colour="#4a6f68"
      swell={0.7}
      chop={0.6}
      segmentsX={8}
      segmentsZ={300}
    />
  )
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
