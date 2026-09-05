/**
 * A ship in the assault: two naves lashed together with a flying bridge rigged
 * between their mast-tops.
 *
 * The pairing is visual. The rules treat one ship per captain, exactly as the
 * original code forms them, so the second hull is the lashed partner that
 * makes the bridge read correctly rather than a second unit of play.
 *
 * Motion is internal — the ship damps toward whatever position it is given and
 * runs its own sinking clock — so sailing costs no React render per frame.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../palette.js'
import { nameLabelTexture } from '../textures.js'
import { buildHull, buildMast, buildFlyingBridge, buildRamp } from './shipBuilder.js'

const BEAM = 1.9
const PAIR_GAP = 2.35
const MAST_HEIGHT = 6.2
const SINK_SECONDS = 3.4

function ShipPlate({ name, y }) {
  const { texture, aspect } = useMemo(() => nameLabelTexture(name), [name])
  const height = 0.62
  return (
    <sprite position={[0, y, 0]} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  )
}

/** One nave: hull, mast, sail. */
function Nave({ z }) {
  const hull = useMemo(() => buildHull({ length: 5.2, beam: BEAM, depth: 1.5 }), [])
  const mast = useMemo(() => buildMast({ height: MAST_HEIGHT, beam: BEAM }), [])

  return (
    <group position={[0, 0, z]}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={mast} position={[0.2, 1.7, 0]} castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {/* Sail furled along the yard — ships went to an assault with canvas in,
          and a set sail would blank out the whole fleet at this angle. */}
      <mesh position={[0.2, 6.54, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, BEAM * 1.9, 8]} />
        <meshLambertMaterial color={PALETTE.sailCanvas} flatShading />
      </mesh>
    </group>
  )
}

/**
 * @param {[number,number,number]} position  target position; the ship damps toward it
 * @param {string}  name        captain's name, on the floating plate
 * @param {boolean} clickable   pulsing marker and pointer events
 * @param {boolean} sinking     runs the sinking animation, distinct from the dissolve
 * @param {boolean} rampDown    drops the boarding ramp onto the rampart
 */
export function Ship({
  position = [0, 0, 0],
  name,
  clickable = false,
  sinking = false,
  rampDown = false,
  showName = true,
  onClick,
  plateLift = 0,
}) {
  const group = useRef()
  const listRef = useRef()
  const marker = useRef()
  const rampRef = useRef()
  const plate = useRef()
  const sinkClock = useRef(0)
  const placed = useRef(false)

  const bridge = useMemo(
    () => buildFlyingBridge({ span: PAIR_GAP + BEAM * 0.4, height: MAST_HEIGHT * 0.86 }),
    []
  )
  const ramp = useMemo(() => buildRamp({ length: 3.6, width: 1.15 }), [])

  const target = useMemo(
    () => new THREE.Vector3(position[0], position[1], position[2]),
    [position[0], position[1], position[2]]
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime

    if (!placed.current) {
      g.position.copy(target)
      placed.current = true
    } else {
      g.position.x = THREE.MathUtils.damp(g.position.x, target.x, 0.9, delta)
      g.position.z = THREE.MathUtils.damp(g.position.z, target.z, 0.9, delta)
    }

    if (sinking) {
      // Distinct from the land dissolve: the ship lists hard over, settles by
      // the head and goes down. Nothing fades.
      sinkClock.current += delta
      const p = Math.min(1, sinkClock.current / SINK_SECONDS)
      const eased = p * p
      if (listRef.current) {
        listRef.current.rotation.z = -eased * 0.62
        listRef.current.rotation.x = eased * 0.22
        listRef.current.position.y = target.y - eased * 5.2
      }
    } else {
      // Riding the swell.
      if (listRef.current) {
        listRef.current.position.y = target.y + Math.sin(t * 0.9 + target.x) * 0.11
        listRef.current.rotation.z = Math.sin(t * 0.7 + target.z) * 0.035
        listRef.current.rotation.x = Math.sin(t * 0.55) * 0.02
      }
    }

    if (rampRef.current) {
      const want = rampDown ? -0.12 : -1.0
      rampRef.current.rotation.z = THREE.MathUtils.damp(
        rampRef.current.rotation.z,
        want,
        2.2,
        delta
      )
    }

    if (marker.current) {
      marker.current.material.opacity =
        clickable && !sinking ? 0.4 + Math.sin(t * 3) * 0.22 : 0
    }
    if (plate.current) plate.current.visible = showName && !sinking
  })

  return (
    <group
      ref={group}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation()
              onClick?.()
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={clickable ? () => (document.body.style.cursor = 'auto') : undefined}
    >
      {clickable && (
        <mesh position={[0, 3, PAIR_GAP / 2]} visible={false}>
          <boxGeometry args={[7, 7, 6]} />
        </mesh>
      )}

      <group ref={listRef}>
        {/* The ship of record, and its lashed partner. */}
        <Nave z={0} />
        <Nave z={PAIR_GAP} />

        {/* Flying bridge rigged between the two mast-tops. */}
        <mesh geometry={bridge} position={[0.2, 1.7, PAIR_GAP / 2]} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>

        {/* Lashings holding the pair together. */}
        {[-1.4, 0.4, 2.0].map((x, i) => (
          <mesh key={i} position={[x, 2.5, PAIR_GAP / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, PAIR_GAP, 5]} />
            <meshLambertMaterial color={PALETTE.rigging} />
          </mesh>
        ))}

        {/* Boarding ramp, hinged at the forecastle. Only present once dropped. */}
        {rampDown && (
          <group ref={rampRef} position={[2.5, 3.0, PAIR_GAP / 2]} rotation={[0, 0, -1.0]}>
            <mesh geometry={ramp} castShadow>
              <meshLambertMaterial vertexColors flatShading />
            </mesh>
          </group>
        )}

        {/* Water-line marker ring, for the click target. */}
        <mesh
          ref={marker}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.06, PAIR_GAP / 2]}
        >
          <ringGeometry args={[3.4, 4.1, 32]} />
          <meshBasicMaterial
            color={PALETTE.imperialGold}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={plate} position={[0, 0, PAIR_GAP / 2]}>
        {showName && <ShipPlate name={name} y={7.6 + plateLift} />}
      </group>
    </group>
  )
}

/**
 * Splash thrown up by a foundering ship. Water, not the abstract dissolve —
 * a sinking is the one failure in the module that gets its own animation.
 */
export function SplashBurst({ position }) {
  const points = useRef()
  const clock = useRef(0)
  const count = 90

  const { geometry, velocities } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 0.4 + Math.random() * 2.6
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.1
      pos[i * 3 + 2] = Math.sin(a) * r
      vel[i * 3] = Math.cos(a) * (0.7 + Math.random() * 1.5)
      vel[i * 3 + 1] = 1.6 + Math.random() * 3.4
      vel[i * 3 + 2] = Math.sin(a) * (0.7 + Math.random() * 1.5)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: g, velocities: vel }
  }, [])

  useFrame((_, delta) => {
    if (!points.current) return
    clock.current += delta
    const attr = points.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += velocities[i * 3] * delta
      attr.array[i * 3 + 1] += velocities[i * 3 + 1] * delta
      attr.array[i * 3 + 2] += velocities[i * 3 + 2] * delta
      velocities[i * 3 + 1] -= 6.5 * delta // gravity: the spray falls back
    }
    attr.needsUpdate = true
    points.current.material.opacity = Math.max(0, 0.9 * (1 - clock.current / 2.6))
  })

  return (
    <points ref={points} position={position} geometry={geometry}>
      <pointsMaterial
        size={0.3}
        color="#dce9ea"
        transparent
        opacity={0.9}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
