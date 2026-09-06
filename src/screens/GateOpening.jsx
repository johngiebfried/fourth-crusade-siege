/**
 * The gate opens from the inside and one anonymous figure walks through.
 * Used after the round-three bribery is confirmed.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { LandTerrain } from '../three/LandScene.jsx'
import { LANE, GATE_CAMERA } from '../three/lane.js'
import { Pawn } from '../three/geometry/Pawn.jsx'
import { RENDERER_PROPS, configureRenderer, DPR, shadowMapSize } from '../three/renderer.js'
import { Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'
import { Atmosphere } from '../three/geometry/Sky.jsx'

/**
 * Stands in front of the gate and pushes slowly in on it.
 *
 * This camera used to sit a unit and a half west of the gate at z = 26. That
 * was fine when the gate wall was fifteen units long; once it ran a hundred
 * and fifty, the camera was pressed against the masonry twenty units to the
 * side of the arch, with the wall itself between it and the gate. It has to be
 * square in front of the opening, in the ground between the inner wall and the
 * gate.
 */
// Standing inside the city, looking back at the gate as it is opened and the
// first crusader walks through toward us. The ground between the inner wall
// and the gate is under seven units deep — nowhere near enough to frame the
// gate from outside — and this is the better shot anyway: the city is what is
// being entered, so the city is where the camera should be.
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

/** Two leaves swinging inward. */
function GateDoors({ open }) {
  const left = useRef()
  const right = useRef()
  useFrame((_, delta) => {
    const angle = open ? Math.PI * 0.42 : 0
    if (left.current) {
      left.current.rotation.y = THREE.MathUtils.damp(left.current.rotation.y, -angle, 1.1, delta)
    }
    if (right.current) {
      right.current.rotation.y = THREE.MathUtils.damp(right.current.rotation.y, angle, 1.1, delta)
    }
  })

  const Leaf = ({ side, innerRef }) => (
    <group ref={innerRef} position={[LANE.gateX, 0, side * 1.28]}>
      <mesh position={[0, 1.5, (side * 1.28) / -1 + side * 0.64]}>
        <boxGeometry args={[0.28, 3.0, 1.28]} />
        <meshLambertMaterial color="#5f432c" flatShading />
      </mesh>
    </group>
  )

  return (
    <group>
      <Leaf side={-1} innerRef={left} />
      <Leaf side={1} innerRef={right} />
    </group>
  )
}

export default function GateOpening({ onDone }) {
  const gloss = useMemo(() => pickLore('chronicle'), [])

  const [open, setOpen] = useState(false)
  const [walked, setWalked] = useState(false)

  useEffect(() => {
    const a = setTimeout(() => setOpen(true), 1400)
    const b = setTimeout(() => setWalked(true), 3200)
    const c = setTimeout(() => onDone?.(), 8200)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
      clearTimeout(c)
    }
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
        <directionalLight
          position={[26, 30, 18]}
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

        <LandTerrain />
        <GateDoors open={open} />

        {/* One anonymous figure, walking in. No name plate. */}
        <Pawn
          name=""
          showName={false}
          position={walked ? [LANE.gateX + 3.4, 0, 0.4] : [LANE.gateX - 3.2, 0, 0.4]}
          travelSpeed={0.42}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-8">
        <div className="manuscript-scope vellum ink-frame max-w-2xl px-10 py-5 text-center">
          <div className="display text-3xl font-bold" style={{ color: 'var(--rubric)' }}>
            The gate is opened from within.
          </div>
          <div className="mt-2 text-lg" style={{ color: 'var(--ink-soft)' }}>
            Constantinople falls — not to a breach, but to a bribe.
          </div>
          {/* The last of the three waiting beats, and the one where a man who
              was there has most to say. */}
          <Marginalia entry={gloss} />
        </div>
      </div>

      <button onClick={onDone} className="quill-button absolute bottom-6 right-8 px-7 py-3 text-lg">
        Continue
      </button>
    </div>
  )
}
