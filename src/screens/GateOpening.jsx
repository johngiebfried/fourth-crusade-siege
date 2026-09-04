/**
 * The gate opens from the inside and one anonymous figure walks through.
 * Used after the round-three bribery is confirmed.
 */

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LandTerrain, LANE, HEIGHTS } from '../three/LandScene.jsx'
import { Pawn } from '../three/geometry/Pawn.jsx'
import { RENDERER_PROPS, configureRenderer } from '../three/renderer.js'

function GateCamera() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(LANE.gateX, 2.6, 0))
  useFrame((state, delta) => {
    // Slow push toward the opening gate.
    const t = state.clock.elapsedTime
    const z = THREE.MathUtils.damp(camera.position.z, 26 - Math.min(6, t * 0.7), 0.8, delta)
    camera.position.set(LANE.gateX - 1.5, 4.2, z)
    camera.lookAt(look.current)
  })
  return null
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
    <div className="relative h-screen w-screen overflow-hidden bg-stone-900">
      <Canvas
        shadows
        gl={RENDERER_PROPS}
        onCreated={configureRenderer}
        camera={{ fov: 28, near: 0.1, far: 200, position: [LANE.gateX - 1.5, 4.2, 26] }}
      >
        <GateCamera />
        <directionalLight position={[-18, 26, 22]} intensity={1.4} color="#ffe9c4" castShadow />
        <hemisphereLight args={['#bcd0e6', '#6b6247', 0.8]} />
        <ambientLight intensity={0.3} />
        <fog attach="fog" args={['#c9c1ac', 40, 90]} />
        <color attach="background" args={['#b9c6d4']} />

        <LandTerrain />
        <GateDoors open={open} />

        {/* One anonymous figure, walking in. No name plate. */}
        <Pawn
          name=""
          showName={false}
          position={walked ? [LANE.gateX + 5.5, 0, 0] : [LANE.gateX - 3.5, 0, 0]}
          travelSpeed={0.55}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-14">
        <div className="rounded-lg bg-black/70 px-10 py-5 text-center">
          <div className="text-3xl font-bold text-amber-100">The gate is opened from within.</div>
          <div className="mt-2 text-lg text-stone-300">
            Constantinople falls — not to a breach, but to a bribe.
          </div>
        </div>
      </div>

      <button
        onClick={onDone}
        className="absolute bottom-6 right-8 rounded-lg border border-stone-600 px-6 py-3 text-stone-300 transition-colors hover:bg-stone-800"
      >
        Continue →
      </button>
    </div>
  )
}
