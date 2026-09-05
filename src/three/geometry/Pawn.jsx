/**
 * Crusader pawn — an anonymous generic token, per the v1 brief. No faction
 * colour and no personal device; identity comes from the floating name plate
 * so the instructor can tell whose token is whose when clicking.
 *
 * Kit is period-correct in silhouette only: mail hauberk, surcoat, conical
 * nasal helm, kite shield. No plate — that is a century and more too early.
 *
 * All motion is internal. The pawn damps toward whatever `position` it is
 * given and runs its own dissolve clock, so climbing and fading never cost a
 * React render per frame.
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../palette.js'
import { nameLabelTexture } from '../textures.js'
import { pawnGeometry } from './pawnBuilder.js'
import { factionFlagTexture } from '../factions.js'

const PAWN_SCALE = 0.71
const DISSOLVE_SECONDS = 1.1

/**
 * A contact shadow: a disc that fades out toward its rim.
 *
 * The falloff is vertex alpha, not a texture — three takes a four-component
 * colour attribute, so a circle with an opaque centre vertex and transparent
 * rim vertices gives a soft blob for nothing. This is the cheap part of what
 * people are asking for when they ask for ray tracing: it stops the figures
 * looking pasted onto the ground.
 */
function buildContactShadow(radius = 0.72, segments = 24) {
  const g = new THREE.CircleGeometry(radius, segments)
  const count = g.attributes.position.count
  const colours = new Float32Array(count * 4)
  const pos = g.attributes.position
  for (let i = 0; i < count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i)) / radius
    // Opaque under the feet, gone by the rim.
    const a = Math.pow(1 - Math.min(1, r), 1.5) * 0.44
    colours[i * 4] = 0
    colours[i * 4 + 1] = 0
    colours[i * 4 + 2] = 0
    colours[i * 4 + 3] = a
  }
  g.setAttribute('color', new THREE.BufferAttribute(colours, 4))
  g.rotateX(-Math.PI / 2)
  return g
}

const CONTACT_SHADOW = buildContactShadow()

function NamePlate({ name, y, height = 0.6 }) {
  const { texture, aspect } = useMemo(() => nameLabelTexture(name), [name])
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

/**
 * @param {[number,number,number]} position  target position; the pawn damps toward it
 * @param {string}  name        shown on the floating plate
 * @param {boolean} clickable   draws the pulsing ring and takes pointer events
 * @param {boolean} dissolving  when true, runs the universal failure animation
 * @param {boolean} snap        place immediately rather than travelling
 */
export function Pawn({
  position = [0, 0, 0],
  name,
  clickable = false,
  dissolving = false,
  snap = false,
  onClick,
  showName = true,
  travelSpeed = 2.6,
  plateLift = 0,
  faction = 'Indeterminate',
  showFlag = true,
  bearer = false,
}) {
  const group = useRef()
  const bodyRef = useRef()
  const ring = useRef()
  const plate = useRef()
  const dissolveClock = useRef(0)
  const placed = useRef(false)

  const body = useMemo(() => pawnGeometry(faction), [faction])
  const flag = useMemo(
    () => (showFlag ? factionFlagTexture(faction) : null),
    [faction, showFlag]
  )

  const target = useMemo(
    () => new THREE.Vector3(position[0], position[1], position[2]),
    [position[0], position[1], position[2]]
  )

  useEffect(() => {
    if (!dissolving) dissolveClock.current = 0
  }, [dissolving])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime

    // Place instantly on first frame, or when explicitly snapping.
    if (!placed.current || snap) {
      g.position.copy(target)
      placed.current = true
    } else {
      g.position.x = THREE.MathUtils.damp(g.position.x, target.x, travelSpeed, delta)
      g.position.z = THREE.MathUtils.damp(g.position.z, target.z, travelSpeed, delta)
      // Climbing reads better slightly lagged behind the horizontal move.
      g.position.y = THREE.MathUtils.damp(g.position.y, target.y, travelSpeed * 0.85, delta)
    }

    // Idle sway so a staged army does not look frozen.
    g.rotation.z = Math.sin(t * 1.4 + target.x) * 0.015

    let opacity = 1
    if (dissolving) {
      dissolveClock.current += delta
      const p = Math.min(1, dissolveClock.current / DISSOLVE_SECONDS)
      opacity = 1 - p
      // Drifts upward and apart as it goes.
      g.position.y += p * delta * 1.6
      if (bodyRef.current) bodyRef.current.scale.setScalar(PAWN_SCALE * (1 + p * 0.25))
    } else if (bodyRef.current) {
      bodyRef.current.scale.setScalar(PAWN_SCALE)
    }

    g.traverse((child) => {
      if (child.isMesh && child.material && 'opacity' in child.material) {
        child.material.transparent = true
        child.material.opacity = opacity
      }
    })

    if (plate.current) {
      plate.current.visible = showName && opacity > 0.4
    }
    if (ring.current) {
      ring.current.material.opacity = clickable && !dissolving ? 0.35 + Math.sin(t * 3) * 0.2 : 0
    }
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
      {/* Generous hit target — this gets clicked on a projector, from a distance. */}
      {clickable && (
        <mesh position={[0, 1.0, 0]} visible={false}>
          <boxGeometry args={[1.8, 2.6, 1.8]} />
        </mesh>
      )}

      {/* Contact shadow, under everything. */}
      <mesh geometry={CONTACT_SHADOW} position={[0, 0.015, 0]} renderOrder={-1}>
        <meshBasicMaterial vertexColors transparent opacity={1} depthWrite={false} />
      </mesh>

      {/* Selection ring on the ground */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.8, 1.15, 28]} />
        <meshBasicMaterial
          color={PALETTE.imperialGold}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyRef} scale={PAWN_SCALE}>
        {/* Helmet, cape and spear, merged and lit into its vertex colours. */}
        <mesh geometry={body} castShadow>
          <meshLambertMaterial vertexColors flatShading side={THREE.DoubleSide} />
        </mesh>

        {/* The contingent's flag. A pennon on the spear for most; the man
            with the highest standing in each following carries a full
            standard on a taller staff, which is how a contingent was actually
            picked out on a field. Turned to face the lane camera, because a
            flag edge-on says nothing. */}
        {flag && (
          <group
            position={bearer ? [0.44, 2.42, -0.04] : [0.44, 1.86, -0.04]}
            rotation={[0, -0.5, 0.05]}
          >
            <mesh position={[bearer ? 0.4 : 0.26, 0, 0]}>
              <planeGeometry args={bearer ? [0.78, 0.56] : [0.5, 0.34]} />
              <meshBasicMaterial map={flag} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        )}

        {/* The bearer's staff runs higher than a spear. */}
        {bearer && (
          <mesh position={[0.44, 1.55, -0.04]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 3.1, 6]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        )}
      </group>

      {/* Plate sits outside the scaled group so it keeps a readable world size. */}
      <group ref={plate}>{showName && <NamePlate name={name} y={2.15 + plateLift} />}</group>
    </group>
  )
}

/**
 * Dissolve particles: the single universal failure animation, reused at every
 * stage of both wall types. Deliberately abstract — the token is removed from
 * play, not killed on screen. Self-clocking; unmount it when finished.
 */
export function DissolveBurst({ position }) {
  const points = useRef()
  const clock = useRef(0)
  const count = 44

  const { geometry, velocities } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * 0.28
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.2 + Math.random() * 1.3
      pos[i * 3 + 2] = Math.sin(a) * r
      vel[i * 3] = Math.cos(a) * (0.25 + Math.random() * 0.5)
      vel[i * 3 + 1] = 0.45 + Math.random() * 1.0
      vel[i * 3 + 2] = Math.sin(a) * (0.25 + Math.random() * 0.5)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: g, velocities: vel }
  }, [])

  useFrame((_, delta) => {
    if (!points.current) return
    clock.current += delta
    const attr = points.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += velocities[i * 3] * delta * 0.7
      attr.array[i * 3 + 1] += velocities[i * 3 + 1] * delta * 0.7
      attr.array[i * 3 + 2] += velocities[i * 3 + 2] * delta * 0.7
    }
    attr.needsUpdate = true
    points.current.material.opacity = Math.max(0, 0.85 * (1 - clock.current / 1.3))
  })

  return (
    <points ref={points} position={position} geometry={geometry}>
      <pointsMaterial
        size={0.2}
        color={PALETTE.crusaderMail}
        transparent
        opacity={0.85}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
