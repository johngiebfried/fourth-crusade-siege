/**
 * The city, used as a living backdrop.
 *
 * The opening shot is not just a title card — every setup choice is made over
 * it, so the class is looking at Constantinople the whole time rather than at
 * a form. This module owns the isometric camera, the lighting and the
 * crusader-cam inset; the setup steps are laid over the top.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { CityPanorama } from '../three/CityScene.jsx'
import { PALETTE } from '../three/palette.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { rng } from '../three/geometry/cityBuilder.js'
import { buildSiegeCamp } from '../three/geometry/siegeCamp.js'
import { RippleWater } from '../three/geometry/Field.jsx'
import { Pawn } from '../three/geometry/Pawn.jsx'
import { RENDERER_PROPS, configureRenderer, DPR, shadowMapSize } from '../three/renderer.js'

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
    cam.position.set(Math.sin(angle) * radius, radius * 0.62, Math.cos(angle) * radius)
    cam.zoom = zoom
    cam.updateProjectionMatrix()
    cam.lookAt(2, 0, -2)
  })

  return <OrthographicCamera ref={camRef} makeDefault near={1} far={480} position={[70, 74, 96]} />
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
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={1}
        shadow-camera-far={280}
      />
      <hemisphereLight args={['#cfe0f0', '#5d5b42', 0.95]} />
      <ambientLight intensity={0.32} />
      <fog attach="fog" args={['#c2cedd', 150, 300]} />
      <color attach="background" args={['#aec2d6']} />
    </>
  )
}

/** Full-screen city shot. Purely decorative — it takes no pointer events. */
export function CityBackdrop() {
  return (
    <div className="absolute inset-0">
      <Canvas shadows dpr={DPR} gl={RENDERER_PROPS} onCreated={configureRenderer}>
        <IsoCamera />
        <CityLighting />
        <CityPanorama />
      </Canvas>
    </div>
  )
}

/* --------------------------------------------------------- crusader cam */

/**
 * The crusader cam: the camp at Galata, looking south across the Golden Horn
 * at the city it is about to assault.
 *
 * The earlier version pointed inland at a bare green ridge, which told the
 * class nothing. Pointing it across the water puts the camp in the foreground,
 * the fleet on the Horn, and Constantinople's sea wall and domes on the far
 * bank — so the inset says where the crusaders are *and* what they are looking
 * at, and ties itself to the main shot above it.
 */
function CampForeground() {
  const geometry = useMemo(
    () =>
      // Kept behind the waterline. It used to run from z −22 to +22, which put
      // a third of the tents out in the Horn.
      buildSiegeCamp({
        campX: 0,
        engineX: 0,
        zFrom: 0.5,
        zTo: 12.5,
        tents: 14,
        seed: 12,
        engines: false,
      }),
    []
  )
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** Constantinople on the far bank: sea wall, towers, and the domes behind. */
function CityAcrossTheHorn({ z = -34 }) {
  const geometry = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 51.3) * 43758.5453) % 1)
    const parts = []
    const paint = (g, hex, tone = 1) => {
      const c = new THREE.Color(hex)
      const n = g.attributes.position.count
      const arr = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        arr[i * 3] = c.r * tone
        arr[i * 3 + 1] = c.g * tone
        arr[i * 3 + 2] = c.b * tone
      }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
      return g
    }

    // The bank, and the sea wall standing on it.
    const bank = new THREE.BoxGeometry(140, 1.4, 26)
    bank.translate(0, 0.7, z - 13)
    parts.push(paint(bank, '#7d7f55'))

    const wall = new THREE.BoxGeometry(140, 3.0, 1.6)
    wall.translate(0, 2.2, z)
    parts.push(paint(wall, PALETTE.wallStone, 0.95))
    const band = new THREE.BoxGeometry(140, 0.34, 1.68)
    band.translate(0, 2.5, z)
    parts.push(paint(band, PALETTE.wallBrick, 0.95))

    for (let i = 0; i < 26; i++) {
      const x = -66 + i * 5.2
      const tower = new THREE.BoxGeometry(2.0, 4.4, 2.0)
      tower.translate(x, 2.9, z - 0.3)
      parts.push(paint(tower, PALETTE.towerStone, 0.92 + rand(i) * 0.12))
    }

    // Domes rising behind the wall.
    for (let i = 0; i < 34; i++) {
      const x = -68 + rand(i + 3) * 136
      const dz = z - 4 - rand(i + 9) * 14
      const h = 1.6 + rand(i + 17) * 3.0
      const body = new THREE.BoxGeometry(2.2 + rand(i) * 2, h, 2.2)
      body.translate(x, 1.4 + h / 2, dz)
      parts.push(paint(body, PALETTE.cityWall, 0.9 + rand(i + 5) * 0.2))
      if (i % 3 !== 2) {
        const r = 0.8 + rand(i + 21) * 0.7
        const dome = new THREE.SphereGeometry(r, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2)
        dome.scale(1, 0.5, 1)
        dome.translate(x, 1.4 + h, dz)
        parts.push(paint(dome, rand(i + 31) > 0.85 ? PALETTE.domeGold : PALETTE.domeLead))
      } else {
        const roof = new THREE.BoxGeometry(2.4 + rand(i) * 2, 0.5, 2.4)
        roof.translate(x, 1.4 + h + 0.25, dz)
        parts.push(paint(roof, PALETTE.cityRoof))
      }
    }

    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    merged.computeVertexNormals()
    return merged
  }, [z])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

function CrusaderCamScene() {
  const camRef = useRef()

  const moored = useMemo(() => {
    const rand = rng(23)
    const out = []
    for (let i = 0; i < 9; i++) {
      out.push({ x: -15 + rand() * 30, z: -4 - rand() * 18, r: rand() * 0.5 - 0.25 })
    }
    return out
  }, [])

  useFrame((state) => {
    const cam = camRef.current
    if (!cam) return
    const t = state.clock.elapsedTime * 0.09
    cam.position.set(Math.sin(t) * 4, 5.4, 15)
    cam.lookAt(0, 2.4, -16)
  })

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={38} near={0.1} far={200} position={[0, 5.4, 15]} />
      <directionalLight position={[-16, 22, 14]} intensity={1.5} color="#fff1d6" castShadow />
      <hemisphereLight args={['#cddceb', '#5a5f48', 0.8]} />
      <ambientLight intensity={0.3} />
      <color attach="background" args={['#a8c0d4']} />
      <fog attach="fog" args={['#a8c0d4', 34, 90]} />

      {/*
        The Galata shore, and the Horn in front of it.

        These used to overlap by twelve units — the shore ran from z −9 to +21
        and the water from −31 to +3 — with the water surface four hundredths
        of a unit below the ground. The swell then pushed crests up through the
        turf, and the whole inset read as a light ground floating in a mixture
        of land and water. They now meet at a single waterline at z = 0, with
        the water set low enough that no crest reaches the bank.
      */}
      <mesh position={[0, -0.45, 11]} receiveShadow>
        <boxGeometry args={[150, 0.9, 22]} />
        <meshLambertMaterial color="#6f7350" />
      </mesh>

      {/* A shingle strip along the waterline, as on the sea lane's bank. */}
      <mesh position={[0, -0.42, 0.9]} receiveShadow>
        <boxGeometry args={[150, 0.86, 1.8]} />
        <meshLambertMaterial color="#8e8a6c" />
      </mesh>

      <RippleWater
        x={0}
        z={-17}
        width={160}
        depth={34}
        y={-0.34}
        colour={PALETTE.hornWater}
        swell={0.85}
        segmentsX={90}
        segmentsZ={40}
      />

      <CampForeground />
      <Pawn name="" showName={false} position={[-4.4, 0, 2.6]} />
      <Pawn name="" showName={false} position={[3.6, 0, 3.4]} />
      <Pawn name="" showName={false} position={[-0.4, 0, 4.6]} />

      {moored.map((m, i) => (
        <group key={i} position={[m.x, -0.16, m.z]} rotation={[0, m.r, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.3, 1.5, 3, 8]} />
            <meshLambertMaterial color={PALETTE.hullTimber} flatShading />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.2, 5]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        </group>
      ))}

      <CityAcrossTheHorn />
    </>
  )
}

/** The inset panel showing the camp and fleet at Galata. */
export function CrusaderCamPanel({ className = '' }) {
  return (
    <div
      className={`ink-frame overflow-hidden ${className}`}
      style={{ background: '#1c1512' }}
    >
      <div className="flex items-center justify-between gap-2 bg-[#2a211a] px-3 py-1.5">
        <span className="truncate text-[13px] text-amber-500">
          Crusader Camp
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-red-400">
          <span className="inline-block h-2 w-2 rotate-45" style={{ background: 'var(--rubric)' }} />
          Galata
        </span>
      </div>
      <div className="h-[min(26vw,180px)]">
        <Canvas gl={RENDERER_PROPS} onCreated={configureRenderer}>
          <CrusaderCamScene />
        </Canvas>
      </div>
    </div>
  )
}
