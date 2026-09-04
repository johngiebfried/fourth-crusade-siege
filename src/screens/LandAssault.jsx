/**
 * Land wall assault — the interactive sequence.
 *
 * Outcomes are pre-computed by rules.js when the stage begins. Clicking a
 * token reveals a decision already made: the die tumbles and settles on the
 * face that was rolled, then the token climbs or dissolves. Tokens in the
 * current stage may be clicked in any order; no turn order is enforced.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { LandTerrain, LANE, HEIGHTS } from '../three/LandScene.jsx'
import { Pawn, DissolveBurst } from '../three/geometry/Pawn.jsx'
import { Die } from '../three/geometry/Die.jsx'
import { RENDERER_PROPS, configureRenderer } from '../three/renderer.js'

/* ---------------------------------------------------------------- timing */

/** Cinematic pacing. The siege is the centrepiece of the class period. */
const BEAT = {
  tumble: 1250, // die in the air
  hold: 1300, // settled number held on screen
  resolve: 1400, // climb or dissolve
}

/* -------------------------------------------------------------- geometry */

const LEVELS = {
  camp: 0,
  outer: 1,
  inner: 2,
  inside: 3,
}

/** Where a pawn stands, given how far it has got and its slot in the line. */
function positionFor(level, index, count) {
  // Tokens on a rampart can only be separated in depth, so keep that spread
  // generous and let the yawed camera turn it into screen separation.
  const spread = Math.min(11, Math.max(4, count * 2.0))
  const z = count === 1 ? 0 : -spread / 2 + (spread * index) / Math.max(1, count - 1)

  switch (level) {
    case LEVELS.outer:
      return [LANE.outerWallX, HEIGHTS.outerWall + 0.5, z]
    case LEVELS.inner:
      return [LANE.innerWallX, HEIGHTS.innerWall + 0.7, z]
    case LEVELS.inside:
      return [LANE.gateX + 4.5, 0, z * 0.9]
    case LEVELS.camp:
    default: {
      // Camp is a block, staggered across the lane as well as into depth, so
      // the name plates of neighbouring tokens do not sit on top of each other.
      const row = index % 3
      return [LANE.campX + row * 2.0 - index * 0.35, 0, z]
    }
  }
}

/** Where the die is thrown for a pawn resolving at a given level. */
function diePositionFor(level, pawnPos) {
  const lift = level === LEVELS.camp ? 1.6 : 1.8
  return [pawnPos[0] + 1.7, pawnPos[1] + lift, pawnPos[2] + 2.6]
}

/* ---------------------------------------------------------------- camera */

/**
 * Near-orthographic side-on lane camera that eases between stage framings.
 *
 * The camera is declared here rather than through <Canvas camera={{...}}>.
 * That prop is diffed by object identity, and an inline literal is a new
 * object on every render — R3F then re-applies it and snaps the camera back
 * to its starting position, so no amount of per-frame easing ever survives.
 */
const FOV = 20
const YAW = 0.26 // ~15 degrees: enough that rampart depth reads on screen

/**
 * Each stage is framed by the width of lane it must show, not by a fixed
 * camera distance. Distance is then solved from the viewport's aspect ratio,
 * so a narrow window or an unusual projector shape pulls the camera back
 * instead of cropping the lane and pushing name plates off screen.
 */
const FRAMINGS = {
  'first-wall': { x: -9.6, y: 2.4, span: 23 },
  'second-wall': { x: -3.0, y: 3.8, span: 25 },
  'city-gates': { x: 2.5, y: 3.6, span: 25 },
  wide: { x: -4, y: 3.2, span: 34 },
}

function CameraRig({ focus }) {
  const camRef = useRef()
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)

  const aspect = Math.max(0.5, size.width / Math.max(1, size.height))

  const frame = useMemo(() => {
    const f = FRAMINGS[focus] || FRAMINGS.wide
    const halfFov = (FOV * Math.PI) / 360
    // Distance that puts `span` world units across the frame at this aspect.
    const dist = THREE.MathUtils.clamp(
      f.span / 2 / (Math.tan(halfFov) * aspect),
      22,
      80
    )
    return {
      pos: [f.x + dist * Math.tan(YAW), f.y + dist * 0.14, dist],
      look: [f.x, f.y, 0],
    }
  }, [focus, aspect])

  const targetPos = useMemo(() => new THREE.Vector3(...frame.pos), [frame])
  const lookAt = useMemo(() => new THREE.Vector3(...frame.look), [frame])

  useFrame((_, delta) => {
    const cam = camRef.current
    if (!cam) return
    cam.position.x = THREE.MathUtils.damp(cam.position.x, targetPos.x, 1.5, delta)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, targetPos.y, 1.5, delta)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, targetPos.z, 1.5, delta)
    cam.lookAt(lookAt)

    // Fog tracks the camera. Fixed fog distances wash the whole lane out as
    // soon as a narrow viewport pushes the camera back.
    if (scene.fog) {
      const d = cam.position.distanceTo(lookAt)
      scene.fog.near = d * 0.85
      scene.fog.far = d * 2.4
    }
  })

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={FOV}
      near={0.1}
      far={320}
      position={[0, 8, 44]}
    />
  )
}

function Lighting() {
  return (
    <>
      {/* A low April sun coming over the Golden Horn. */}
      <directionalLight
        position={[-18, 26, 22]}
        intensity={1.5}
        color="#fff2d8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#bcd0e6', '#6b6247', 0.85]} />
      <ambientLight intensity={0.28} />
      <fog attach="fog" args={['#c9c1ac', 46, 96]} />
      <color attach="background" args={['#b9c6d4']} />
    </>
  )
}

/* ------------------------------------------------------------------ scene */

function AssaultScene({ pawns, activeRoll, bursts, focus, onPawnClick }) {
  return (
    <>
      <CameraRig focus={focus} />
      <Lighting />
      <LandTerrain />

      {pawns.map((p) => (
        <Pawn
          key={p.id}
          name={p.name}
          position={p.position}
          clickable={p.clickable}
          dissolving={p.dissolving}
          plateLift={p.plateLift}
          onClick={() => onPawnClick(p.id)}
        />
      ))}

      {bursts.map((b) => (
        <DissolveBurst key={b.key} position={b.position} />
      ))}

      {activeRoll && (
        <Die
          position={activeRoll.diePosition}
          value={activeRoll.entry.roll}
          rolling={activeRoll.phase === 'tumbling'}
          scale={1.15}
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------- HUD */

function StageBanner({ stage, remaining, total }) {
  if (!stage) return null
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center pt-6">
      <div className="rounded-lg border border-amber-900/30 bg-[#f4ead6]/95 px-8 py-4 text-center shadow-xl">
        <div className="text-3xl font-bold tracking-tight text-red-900">{stage.heading}</div>
        <div className="mt-1 text-lg text-stone-700">{stage.blurb}</div>
        <div className="mt-3 flex items-center justify-center gap-6 text-base">
          <span className="rounded bg-red-900 px-3 py-1 font-bold text-amber-50">
            Roll {stage.threshold}+
          </span>
          <span className="text-stone-600">
            {total - remaining} of {total} resolved
          </span>
        </div>
      </div>
    </div>
  )
}

function RollReadout({ activeRoll }) {
  if (!activeRoll || activeRoll.phase === 'tumbling') return null
  const { entry } = activeRoll
  const good = entry.success

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div
        className={`rounded-xl border-2 px-10 py-5 text-center shadow-2xl ${
          good ? 'border-emerald-700 bg-emerald-50/95' : 'border-red-900 bg-red-50/95'
        }`}
      >
        <div className="text-2xl font-bold text-stone-800">{entry.player}</div>
        <div className="mt-2 flex items-center justify-center gap-3 text-xl text-stone-600">
          <span className="text-4xl font-black text-stone-900">{entry.roll}</span>
          {entry.bonus > 0 && <span>+ {entry.bonus}</span>}
          <span className="text-stone-400">vs</span>
          <span>{entry.threshold}+</span>
        </div>
        <div
          className={`mt-3 text-2xl font-bold ${good ? 'text-emerald-800' : 'text-red-900'}`}
        >
          {good ? '✓' : '✗'} {entry.message}
        </div>
      </div>
    </div>
  )
}

function Prompt({ show, remaining }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div className="animate-pulse rounded-lg bg-stone-900/80 px-8 py-4 text-xl font-medium text-amber-50">
        Click a crusader to resolve their attempt — {remaining} left in this stage
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- the screen */

export default function LandAssault({ stages, onComplete }) {
  const [stageIndex, setStageIndex] = useState(0)
  const [levels, setLevels] = useState({}) // playerId -> LEVELS.*
  const [resolvedIds, setResolvedIds] = useState(() => new Set())
  const [dissolvingIds, setDissolvingIds] = useState(() => new Set())
  const [goneIds, setGoneIds] = useState(() => new Set())
  const [activeRoll, setActiveRoll] = useState(null)
  const [bursts, setBursts] = useState([])
  const [busy, setBusy] = useState(false)

  const stage = stages[stageIndex] || null

  // Name lookup across every stage, so a pawn keeps its plate as it advances.
  const nameById = useMemo(() => {
    const seen = new Map()
    for (const s of stages) {
      for (const e of s.entries) {
        if (!seen.has(e.playerId)) seen.set(e.playerId, e.player)
      }
    }
    return seen
  }, [stages])

  // Stable slot per pawn for this stage. Keyed off the stage's own entry order
  // so a pawn's position never shifts because a neighbour dissolved.
  const slots = useMemo(() => {
    const m = new Map()
    if (stage) stage.entries.forEach((e, i) => m.set(e.playerId, i))
    return m
  }, [stage])

  const stageIds = useMemo(
    () => (stage ? stage.entries.map((e) => e.playerId) : []),
    [stage]
  )

  const pawns = useMemo(() => {
    const count = stageIds.length
    return stageIds
      .filter((id) => !goneIds.has(id))
      .map((id) => {
        const level = levels[id] ?? LEVELS.camp
        return {
          id,
          name: nameById.get(id) ?? '',
          position: positionFor(level, slots.get(id) ?? 0, count),
          plateLift: ((slots.get(id) ?? 0) % 5) * 0.7,
          clickable: !busy && !resolvedIds.has(id),
          dissolving: dissolvingIds.has(id),
        }
      })
  }, [stageIds, goneIds, levels, resolvedIds, dissolvingIds, slots, busy, nameById])

  const advanceStage = useCallback(() => {
    if (stageIndex + 1 >= stages.length) {
      // Sequence over. Hand back everything that happened.
      setTimeout(() => onComplete?.(), 900)
      return
    }
    setResolvedIds(new Set())
    setStageIndex(stageIndex + 1)
  }, [stageIndex, stages.length, onComplete])

  const handlePawnClick = useCallback(
    (playerId) => {
      if (busy || !stage) return
      if (resolvedIds.has(playerId)) return

      const entry = stage.entries.find((e) => e.playerId === playerId)
      if (!entry) return

      setBusy(true)

      const level = levels[playerId] ?? LEVELS.camp
      const pawnPos = positionFor(level, slots.get(playerId) ?? 0, stageIds.length)

      setActiveRoll({
        entry,
        phase: 'tumbling',
        diePosition: diePositionFor(level, pawnPos),
      })

      // Die lands, number is held, then the token acts on it.
      setTimeout(() => {
        setActiveRoll((r) => (r ? { ...r, phase: 'settled' } : r))
      }, BEAT.tumble)

      setTimeout(() => {
        if (entry.success) {
          setLevels((l) => ({ ...l, [playerId]: level + 1 }))
        } else {
          setDissolvingIds((d) => new Set(d).add(playerId))
          setBursts((b) => [...b, { key: `${playerId}-${Date.now()}`, position: pawnPos }])
        }
        setResolvedIds((r) => new Set(r).add(playerId))
      }, BEAT.tumble + BEAT.hold)

      setTimeout(() => {
        if (!entry.success) {
          setGoneIds((g) => new Set(g).add(playerId))
          setDissolvingIds((d) => {
            const n = new Set(d)
            n.delete(playerId)
            return n
          })
        }
        setActiveRoll(null)
        setBusy(false)

        // Stage finished once every token in it has been clicked.
        const done = new Set(resolvedIds)
        done.add(playerId)
        if (stageIds.every((id) => done.has(id))) {
          setTimeout(advanceStage, 1100)
        }
      }, BEAT.tumble + BEAT.hold + BEAT.resolve)
    },
    [stage, busy, resolvedIds, levels, slots, stageIds, advanceStage]
  )

  // Retire spent bursts so the particle list cannot grow without bound.
  useEffect(() => {
    if (bursts.length === 0) return
    const t = setTimeout(() => setBursts((b) => b.slice(1)), 1500)
    return () => clearTimeout(t)
  }, [bursts])

  const remaining = stageIds.filter((id) => !resolvedIds.has(id)).length

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-stone-800">
      <Canvas
        shadows
        gl={RENDERER_PROPS}
        onCreated={configureRenderer}
      >
        <AssaultScene
          pawns={pawns}
          activeRoll={activeRoll}
          bursts={bursts}
          focus={stage?.key}
          onPawnClick={handlePawnClick}
        />
      </Canvas>

      <StageBanner stage={stage} remaining={remaining} total={stageIds.length} />
      <RollReadout activeRoll={activeRoll} />
      <Prompt show={!activeRoll && remaining > 0} remaining={remaining} />
    </div>
  )
}
