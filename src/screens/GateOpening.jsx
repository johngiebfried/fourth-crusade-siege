/**
 * The gate opens from the inside and one anonymous figure walks through.
 * Used after the round-three bribery is confirmed.
 */

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { LandTerrain } from '../three/LandScene.jsx'
import { LANE, GATE_CAMERA, CITY_GATE, HEIGHTS } from '../three/lane.js'
import { Pawn } from '../three/geometry/Pawn.jsx'
import { RENDERER_PROPS, configureRenderer, DPR, shadowMapSize } from '../three/renderer.js'
import { Atmosphere } from '../three/geometry/Sky.jsx'

/**
 * Stands just outside the gate and edges in as it opens. The framing, and why
 * it is outside rather than in the city, is in `GATE_CAMERA` in `lane.js`.
 */
const GATE_START = new THREE.Vector3(...GATE_CAMERA.start)
const GATE_END = new THREE.Vector3(...GATE_CAMERA.end)
const GATE_LOOK = new THREE.Vector3(...GATE_CAMERA.look)

function GateCamera() {
  const camRef = useRef()
  useFrame((state, delta) => {
    const cam = camRef.current
    if (!cam) return
    // Slow push toward the opening gate.
    const t = Math.min(1, state.clock.elapsedTime / 9)
    const target = GATE_START.clone().lerp(GATE_END, t * t)
    cam.position.x = THREE.MathUtils.damp(cam.position.x, target.x, 1.4, delta)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, target.y, 1.4, delta)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, target.z, 1.4, delta)
    cam.lookAt(GATE_LOOK)
  })
  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={GATE_CAMERA.fov}
      near={0.1}
      far={320}
      position={GATE_START.toArray()}
    />
  )
}

/**
 * The two leaves, hung on the passage the gatehouse actually has.
 *
 * They used to be two plain boxes placed inside a black recess, so opening them
 * changed nothing anyone could see. Now they hang where the land assault's shut
 * doors hang — set back into the passage, iron-banded — and swing inward, into
 * the city and toward the camera, which is the direction a gate opened from
 * within has to go.
 */
const LEAF_W = CITY_GATE.halfGap - 0.04
const LEAF_H = HEIGHTS.gate * 0.3 + CITY_GATE.halfGap * 0.92
const DOOR_X = LANE.gateX - LANE.gateWidth * 0.1

function Leaf({ side, open }) {
  const hinge = useRef()
  useFrame((_, delta) => {
    if (!hinge.current) return
    // Rotating about the hinge post: for the +z leaf a negative turn carries
    // its free edge toward +x, into the city; the -z leaf mirrors it.
    const target = open ? -side * Math.PI * 0.46 : 0
    hinge.current.rotation.y = THREE.MathUtils.damp(hinge.current.rotation.y, target, 1.3, delta)
  })
  const bands = [0.45, 1.35, 2.25]
  return (
    <group ref={hinge} position={[DOOR_X, 0, side * (LEAF_W + 0.02)]}>
      <mesh position={[0, LEAF_H / 2, (-side * LEAF_W) / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, LEAF_H, LEAF_W]} />
        <meshLambertMaterial color="#5a3f29" flatShading />
      </mesh>
      {bands.map((y) => (
        <mesh key={y} position={[0.02, y, (-side * LEAF_W) / 2]}>
          <boxGeometry args={[0.24, 0.13, LEAF_W * 0.94]} />
          <meshLambertMaterial color="#35312b" flatShading />
        </mesh>
      ))}
      {/* Studs along the meeting edge, so the leaf reads as a door. */}
      {[0.9, 1.8, 2.7].map((y) => (
        <mesh key={`s${y}`} position={[0.13, y, -side * (LEAF_W - 0.14)]}>
          <boxGeometry args={[0.06, 0.1, 0.1]} />
          <meshLambertMaterial color="#2a2621" />
        </mesh>
      ))}
    </group>
  )
}

function GateDoors({ open }) {
  return (
    <group>
      <Leaf side={-1} open={open} />
      <Leaf side={1} open={open} />
    </group>
  )
}

/**
 * The men who come through behind the first. Mixed contingents, no names: the
 * point of this beat is that the city was bought, not who walked in, and the
 * sack order is decided elsewhere. The first of them carries a standard.
 */
const FOLLOWERS = [
  { faction: 'N. French', z: -0.9, delay: 0, bearer: true },
  { faction: 'Venetian', z: 0.95, delay: 1 },
  { faction: 'Imperial', z: -0.35, delay: 2 },
  { faction: 'Clerical', z: 0.5, delay: 3 },
  { faction: 'N. French', z: -1.1, delay: 4 },
]

export default function GateOpening({ onDone }) {
  const [open, setOpen] = useState(false)
  const [walked, setWalked] = useState(false)
  // How many of the followers have started through, one every half second.
  const [through, setThrough] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 1400),
      setTimeout(() => setWalked(true), 3000),
      ...FOLLOWERS.map((f) => setTimeout(() => setThrough((n) => Math.max(n, f.delay + 1)), 3900 + f.delay * 520)),
      setTimeout(() => onDone?.(), 9800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: '#1c1512' }}>
      <Canvas
        dpr={DPR}
        shadows
        gl={RENDERER_PROPS}
        onCreated={configureRenderer}
      >
        <GateCamera />
        {/* From the field side and over the camera's shoulder. With the sun
            behind the gate, as in the land assault, its face — the towers, the
            arch, the relieving arch — stood in its own shadow, and the city
            seen through the opening had its shaded side to us. */}
        <directionalLight
          position={[LANE.gateX - 30, 30, 16]}
          intensity={1.55}
          color="#ffe9c4"
          castShadow
          shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={1}
          shadow-camera-far={120}
        />
        <hemisphereLight args={['#cfe0f0', '#7b7256', 0.85]} />
        <ambientLight intensity={0.36} />
        <Atmosphere mood="day" near={24} far={110} radius={260} />

        <LandTerrain gateDoors={false} />
        <GateDoors open={open} />

        {/* The first man through, and the file behind him. No name plates. */}
        <Pawn
          name=""
          showName={false}
          position={walked ? [LANE.gateX + 5.5, 0, 0.1] : [LANE.gateX - 3.3, 0, 0.1]}
          travelSpeed={0.55}
        />
        {FOLLOWERS.map((f, i) => (
          <Pawn
            key={i}
            name=""
            showName={false}
            faction={f.faction}
            bearer={f.bearer}
            position={
              through > f.delay
                ? [LANE.gateX + 4.4 - f.delay * 0.7, 0, f.z * 0.6]
                : [LANE.gateX - 3.9 - f.delay * 0.25, 0, f.z]
            }
            travelSpeed={0.55}
          />
        ))}
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-8">
        <div className="manuscript-scope vellum ink-frame max-w-2xl px-10 py-5 text-center">
          <div className="display text-3xl font-bold" style={{ color: 'var(--rubric)' }}>
            The gate is opened from within.
          </div>
          <div className="mt-2 text-lg" style={{ color: 'var(--ink-soft)' }}>
            Constantinople falls — not to a breach, but to a bribe.
          </div>
        </div>
      </div>

      <button onClick={onDone} className="quill-button absolute bottom-6 right-8 px-7 py-3 text-lg">
        Continue
      </button>
    </div>
  )
}
