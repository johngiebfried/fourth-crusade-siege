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
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from '../palette.js'
import { nameLabelTexture } from '../textures.js'
import { buildHull, buildMast, buildFlyingBridge, buildGangway } from './shipBuilder.js'
import { ShipWash } from './Field.jsx'

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

const MAST_BASE_Y = 1.7
const MAST_TOP_Y = MAST_BASE_Y + MAST_HEIGHT * 0.86

/**
 * The whole ship — both lashed hulls, both masts, the flying bridge between
 * their tops and the lashings holding the pair together — merged into one
 * geometry. Fifteen separate meshes per ship, drawn twice because they sail in
 * pairs, was a lot of draw calls for something that never changes shape.
 */
function buildShipGeometry() {
  const parts = []
  const hull = buildHull({ length: 5.2, beam: BEAM, depth: 1.5 })
  const mast = buildMast({ height: MAST_HEIGHT, beam: BEAM })

  for (const z of [0, PAIR_GAP]) {
    const h = hull.clone()
    h.translate(0, 0, z)
    parts.push(h)
    const m = mast.clone()
    m.translate(0.2, MAST_BASE_Y, z)
    parts.push(m)
  }
  hull.dispose()
  mast.dispose()

  const bridge = buildFlyingBridge({
    span: PAIR_GAP + BEAM * 0.4,
    height: MAST_HEIGHT * 0.86,
  })
  bridge.translate(0.2, MAST_BASE_Y, PAIR_GAP / 2)
  parts.push(bridge)

  // Lashings holding the pair together.
  const lash = new THREE.Color(PALETTE.rigging)
  for (const x of [-1.4, 0.4, 2.0]) {
    const g = new THREE.CylinderGeometry(0.05, 0.05, PAIR_GAP, 5)
    g.rotateX(Math.PI / 2)
    g.translate(x, 2.5, PAIR_GAP / 2)
    const n = g.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = lash.r
      arr[i * 3 + 1] = lash.g
      arr[i * 3 + 2] = lash.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    parts.push(g)
  }

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()
  return merged
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
  moving = 0,
  grappleReach = 0,
  showName = true,
  onClick,
  plateLift = 0,
  gangwayLength = 5.2,
  gangwayDrop = 0.26,
}) {
  const group = useRef()
  const listRef = useRef()
  const marker = useRef()
  const rampRef = useRef()
  const plate = useRef()
  const sinkClock = useRef(0)
  const placed = useRef(false)

  const shipGeometry = useMemo(() => buildShipGeometry(), [])
  const gangway = useMemo(() => buildGangway({ length: gangwayLength, width: 1.15 }), [gangwayLength])

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
      // Swings down from the bridge onto the parapet.
      const want = rampDown ? -gangwayDrop : 1.0
      rampRef.current.rotation.z = THREE.MathUtils.damp(
        rampRef.current.rotation.z,
        want,
        1.6,
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
        <mesh geometry={shipGeometry} castShadow receiveShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>

        {/* The boarding gangway, run out from the flying bridge at the
            mast-heads and dropped onto the rampart. Only present once it is
            actually run out. */}
        {rampDown && (
          <group
            ref={rampRef}
            position={[0.2, MAST_TOP_Y, PAIR_GAP / 2]}
            rotation={[0, 0, 1.0]}
          >
            <mesh geometry={gangway} castShadow>
              <meshLambertMaterial vertexColors flatShading />
            </mesh>
          </group>
        )}

        {/* Grapples thrown up to the rampart ahead of the boarding party. */}
        {rampDown && grappleReach > 0 && (
          <group position={[2.4, 3.2, PAIR_GAP / 2]}>
            {[-0.9, 0, 0.9].map((dz, i) => {
              const drop = 2.4 + i * 0.15
              const len = Math.hypot(grappleReach, drop)
              return (
                <mesh
                  key={i}
                  position={[grappleReach / 2, drop / 2, dz]}
                  rotation={[0, 0, Math.atan2(drop, grappleReach)]}
                >
                  <cylinderGeometry args={[0.028, 0.028, len, 4]} />
                  <meshLambertMaterial color={PALETTE.rigging} />
                </mesh>
              )
            })}
          </group>
        )}

        {/* Foam collar and wake. */}
        <group position={[0, 0, PAIR_GAP / 2]}>
          <ShipWash length={5.2} beam={PAIR_GAP + BEAM} moving={moving} />
        </group>

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
