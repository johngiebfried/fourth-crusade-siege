/**
 * Title screen: the isometric establishing shot of Constantinople, with a
 * crusader-cam inset on the camp and fleet across the Golden Horn.
 *
 * This is the only screen that uses an isometric camera. Both assault lanes
 * use the locked side-on view instead.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { CityPanorama } from '../three/CityScene.jsx'
import { PALETTE } from '../three/palette.js'
import { rng } from '../three/geometry/cityBuilder.js'
import { Pawn } from '../three/geometry/Pawn.jsx'
import { RENDERER_PROPS, configureRenderer } from '../three/renderer.js'

/* ------------------------------------------------------- isometric camera */

/** World units the shot must span, so the whole peninsula stays in frame. */
const CITY_SPAN = 74

function IsoCamera() {
  const camRef = useRef()
  const size = useThree((state) => state.size)

  // An orthographic camera's frustum comes from the viewport, so the zoom that
  // fits the city has to be solved from whichever dimension is tighter.
  const zoom = useMemo(() => {
    const byWidth = size.width / CITY_SPAN
    const byHeight = size.height / (CITY_SPAN * 0.72)
    return Math.max(2, Math.min(byWidth, byHeight))
  }, [size.width, size.height])

  useFrame((state) => {
    const cam = camRef.current
    if (!cam) return
    // A very slow drift, so the shot breathes without becoming a spin.
    const t = state.clock.elapsedTime * 0.045
    const radius = 120
    const angle = Math.PI * 0.22 + Math.sin(t) * 0.09
    cam.position.set(
      Math.sin(angle) * radius,
      radius * 0.62,
      Math.cos(angle) * radius
    )
    cam.zoom = zoom
    cam.updateProjectionMatrix()
    cam.lookAt(2, 0, -2)
  })

  return (
    <OrthographicCamera ref={camRef} makeDefault near={1} far={480} position={[70, 74, 96]} />
  )
}

function CityLighting() {
  return (
    <>
      {/* Morning sun off the Marmara. */}
      <directionalLight
        position={[-70, 90, 60]}
        intensity={1.5}
        color="#fff3dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={260}
      />
      <hemisphereLight args={['#cfe0f0', '#5d5b42', 0.95]} />
      <ambientLight intensity={0.32} />
      <fog attach="fog" args={['#c2cedd', 130, 260]} />
      <color attach="background" args={['#aec2d6']} />
    </>
  )
}

/* --------------------------------------------------------- crusader cam */

/** Tents of the crusader camp at Galata, across the Horn. */
function Camp() {
  const tents = useMemo(() => {
    const rand = rng(5)
    const out = []
    for (let i = 0; i < 9; i++) {
      out.push({
        x: -11 + rand() * 22,
        z: -5 + rand() * 7,
        r: 0.55 + rand() * 0.35,
        h: 0.9 + rand() * 0.5,
      })
    }
    return out
  }, [])

  return (
    <group>
      <mesh position={[0, -0.15, -8]} receiveShadow>
        <boxGeometry args={[140, 0.3, 28]} />
        <meshLambertMaterial color="#7c7d52" />
      </mesh>
      {tents.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <coneGeometry args={[t.r, t.h, 8]} />
            <meshLambertMaterial color={i % 3 === 0 ? '#d8cdb4' : '#c9bda2'} flatShading />
          </mesh>
          <mesh position={[0, t.h + 0.18, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.36, 4]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
          <mesh position={[0.14, t.h + 0.3, 0]}>
            <planeGeometry args={[0.28, 0.18]} />
            <meshBasicMaterial color={PALETTE.crusaderSurcoat} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function CrusaderCamScene() {
  const camRef = useRef()

  // Small fleet hulls, drawn up off the camp. A full-size Ship at this scale
  // put a mast straight through the middle of the panel.
  const moored = useMemo(() => {
    const rand = rng(23)
    const out = []
    for (let i = 0; i < 7; i++) {
      out.push({ x: -13 + rand() * 26, z: 9 + rand() * 6, r: rand() * 0.6 - 0.3 })
    }
    return out
  }, [])

  useFrame((state) => {
    const cam = camRef.current
    if (!cam) return
    const t = state.clock.elapsedTime * 0.11
    cam.position.set(-2 + Math.sin(t) * 2.4, 4.6, 21)
    cam.lookAt(0, 1.0, 1)
  })

  return (
    <>
      <PerspectiveCamera
        ref={camRef}
        makeDefault
        fov={36}
        near={0.1}
        far={140}
        position={[-2, 4.6, 21]}
      />
      <directionalLight position={[-14, 20, 16]} intensity={1.4} color="#fff1d6" />
      <hemisphereLight args={['#cddceb', '#4a5a5e', 0.9]} />
      <ambientLight intensity={0.32} />
      <color attach="background" args={['#9fb6c9']} />
      <fog attach="fog" args={['#9fb6c9', 24, 62]} />

      {/* Water sits just below the shore, so the shore always wins where the
          two overlap rather than the Horn washing over the camp. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 26]} receiveShadow>
        <planeGeometry args={[160, 46]} />
        <meshLambertMaterial color={PALETTE.hornWater} />
      </mesh>

      {moored.map((m, i) => (
        <group key={i} position={[m.x, 0.16, m.z]} rotation={[0, m.r, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.22, 0.95, 3, 8]} />
            <meshLambertMaterial color={PALETTE.hullTimber} flatShading />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 1.5, 5]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        </group>
      ))}

      {/* Rising ground behind the camp, so the panel is not half empty sky. */}
      <mesh position={[0, 1.6, -20]} receiveShadow>
        <boxGeometry args={[160, 7.0, 30]} />
        <meshLambertMaterial color="#6d7049" flatShading />
      </mesh>
      <mesh position={[-16, 3.4, -16]} receiveShadow>
        <boxGeometry args={[24, 3.2, 12]} />
        <meshLambertMaterial color="#767a4f" flatShading />
      </mesh>

      <group position={[0, 0, 0]}>
        <Camp />
        <Pawn name="" showName={false} position={[-4.0, 0, 3.2]} />
        <Pawn name="" showName={false} position={[3.0, 0, 3.6]} />
        <Pawn name="" showName={false} position={[-0.6, 0, 4.4]} />
      </group>
    </>
  )
}

/* ------------------------------------------------------------------ screen */

export default function TitleScreen({ onBegin }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <Canvas shadows gl={RENDERER_PROPS} onCreated={configureRenderer}>
        <IsoCamera />
        <CityLighting />
        <CityPanorama />
      </Canvas>

      {/* Title block */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-6">
        <div className="mx-4 max-w-2xl rounded-xl border border-amber-900/30 bg-[#f4ead6]/92 px-8 py-4 text-center shadow-2xl">
          <div className="text-sm uppercase tracking-[0.42em] text-amber-800">
            The Fourth Crusade
          </div>
          <h1 className="mt-1.5 text-4xl font-bold leading-tight text-red-900 md:text-5xl">
            The Siege of Constantinople
          </h1>
          <div className="mt-1.5 text-lg text-stone-700">12 April 1204</div>
        </div>
      </div>

      {/* Bottom bar: inset, the begin button and the key never overlap. */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
        {/* Crusader cam: the camp and fleet at Galata, across the Horn */}
        <div className="w-[min(46vw,320px)] overflow-hidden rounded-lg border-2 border-amber-900/40 bg-[#1c1512] shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#2a211a] px-3 py-1.5">
            <span className="truncate text-[11px] uppercase tracking-[0.18em] text-amber-500">
              Crusader Camp
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-widest text-red-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              Galata
            </span>
          </div>
          <div className="h-[min(26vw,180px)]">
            <Canvas gl={RENDERER_PROPS} onCreated={configureRenderer}>
              <CrusaderCamScene />
            </Canvas>
          </div>
        </div>

        <button
          onClick={onBegin}
          className="order-last mx-auto rounded-lg bg-red-800 px-12 py-5 text-2xl font-bold text-amber-50 shadow-2xl transition-colors hover:bg-red-700 md:order-none"
        >
          Begin the Siege
        </button>

        {/* Landmark key, so the class can read the shot */}
        <div className="pointer-events-none hidden max-w-xs rounded-lg bg-black/55 px-5 py-4 text-sm leading-relaxed text-stone-200 xl:block">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-400">
            The city, from the north-west
          </div>
          <p>
            The Theodosian land walls close the western base of the peninsula, with the
            Blachernae palace at their northern end. Hagia Sophia and the Hippodrome stand
            near the eastern tip. The Golden Horn lies to the north, the Sea of Marmara to
            the south — and the fleet is already inside the Horn.
          </p>
        </div>
      </div>

    </div>
  )
}
