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
import { SiegeLadder } from '../three/geometry/SiegeLadder.jsx'
import { Die } from '../three/geometry/Die.jsx'
import { RENDERER_PROPS, configureRenderer } from '../three/renderer.js'
import { StageBanner, RollReadout, Prompt } from './AssaultHud.jsx'

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
  // Spread along the wall line. Looking down the line, this reads as real
  // separation across the frame rather than a stack of overlapping tokens.
  const spread = Math.min(26, Math.max(6, count * 3.4))
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
      // A loose block on the open ground, staggered across the approach.
      const row = index % 3
      return [LANE.campX + row * 2.6, 0, z + (row - 1) * 1.4]
    }
  }
}

/**
 * The wall a stage is fought against, and the ladder that gets raised for it.
 * The gates are a gate — nothing to scale — so that stage raises none.
 */
function ladderFor(stageKey, z) {
  if (stageKey === 'first-wall') {
    return { position: [LANE.outerWallX - 1.05, 0, z], height: HEIGHTS.outerWall + 1.0 }
  }
  if (stageKey === 'second-wall') {
    return { position: [LANE.innerWallX - 1.55, 0, z], height: HEIGHTS.innerWall + 1.2 }
  }
  return null
}

/** Where the die is thrown for a pawn resolving at a given level. */
function diePositionFor(level, pawnPos) {
  const lift = level === LEVELS.camp ? 1.7 : 2.0
  // Toward the camera side of the token, clear of the wall behind it.
  return [pawnPos[0] - 1.9, pawnPos[1] + lift, pawnPos[2] + 2.2]
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
const FOV = 22

/**
 * The camera stands out on the attackers' side and looks back along the line
 * of the walls, rather than square-on to them.
 *
 * Square-on, a wall is a slab seen end-first and reads as a cross-section — the
 * cutaway look. From here each wall runs as a diagonal across the frame, with
 * the next line standing taller behind it, so the defences read as one
 * continuous chain. `OFFSET` is the direction from the point being watched to
 * the camera: back along -X, up, and round to +Z.
 */
const OFFSET = (() => {
  // From the watched point back to the camera: out on the attackers' side,
  // well up, and round toward +Z so the line of the walls runs across frame.
  // Elevation is a balance: too low and the wall lines overlap into one mass,
  // too high and you look down onto their tops and lose the faces entirely.
  // Thirty degrees keeps the banded face readable while still lifting each
  // line clear of the one in front.
  const v = new THREE.Vector3(-0.62, 0.5, 0.6)
  return v.normalize()
})()

/**
 * Each stage names the point it watches and how much *vertical* world space
 * must be in frame.
 *
 * Height rather than width is deliberate: the wall chain stacks up the screen,
 * one line above the next, so the vertical extent is what has to fit. Solving
 * from width instead would crop the chain on a wide display, which is exactly
 * the shape a classroom projector is. A wider screen simply shows more of the
 * wall running off both edges, which is what keeps the ends out of shot.
 */
const FRAMINGS = {
  'first-wall': { at: [-10.5, 3.0, 0], height: 29 },
  'second-wall': { at: [-3.5, 4.6, 0], height: 31 },
  'city-gates': { at: [5.0, 4.4, 0], height: 33 },
  wide: { at: [-4, 4.0, 0], height: 42 },
}

function CameraRig({ focus }) {
  const camRef = useRef()
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)
  const aspect = Math.max(0.5, size.width / Math.max(1, size.height))

  const frame = useMemo(() => {
    const f = FRAMINGS[focus] || FRAMINGS.wide
    const halfFov = (FOV * Math.PI) / 360
    // On a very narrow window there is not enough width for the wall to run
    // off both edges, so pull back a little further there.
    const widthRelief = aspect < 1.2 ? 1.2 / Math.max(0.6, aspect) : 1
    const dist = THREE.MathUtils.clamp(
      (f.height / 2 / Math.tan(halfFov)) * widthRelief,
      30,
      190
    )
    const look = new THREE.Vector3(...f.at)
    const pos = look.clone().addScaledVector(OFFSET, dist)
    return { pos, look }
  }, [focus, aspect])

  useFrame((_, delta) => {
    const cam = camRef.current
    if (!cam) return
    cam.position.x = THREE.MathUtils.damp(cam.position.x, frame.pos.x, 1.5, delta)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, frame.pos.y, 1.5, delta)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, frame.pos.z, 1.5, delta)
    cam.lookAt(frame.look)

    // Fog tracks the camera; fixed planes wash the lane out as soon as a
    // narrow viewport pushes the camera back.
    if (scene.fog) {
      const d = cam.position.distanceTo(frame.look)
      scene.fog.near = d * 0.95
      scene.fog.far = d * 2.6
    }
  })

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={FOV}
      near={0.1}
      far={400}
      position={[-58, 48, 52]}
    />
  )
}

function Lighting() {
  return (
    <>
      {/* A low April sun coming over the Golden Horn. */}
      <directionalLight
        position={[-34, 30, 16]}
        intensity={2.0}
        color="#fff2d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
      <hemisphereLight args={['#c4d6ea', '#7b7256', 0.68]} />
      <ambientLight intensity={0.22} />
      <fog attach="fog" args={['#c9c1ac', 60, 170]} />
      <color attach="background" args={['#b9c6d4']} />
    </>
  )
}

/* ------------------------------------------------------------------ scene */

function AssaultScene({ pawns, ladders, activeRoll, bursts, focus, onPawnClick }) {
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

      {ladders.map((l) => (
        <SiegeLadder key={l.key} position={l.position} height={l.height} phase={l.phase} />
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

/* ------------------------------------------------------------- the screen */

export default function LandAssault({ stages, onComplete }) {
  const [stageIndex, setStageIndex] = useState(0)
  const [levels, setLevels] = useState({}) // playerId -> LEVELS.*
  const [resolvedIds, setResolvedIds] = useState(() => new Set())
  const [dissolvingIds, setDissolvingIds] = useState(() => new Set())
  const [goneIds, setGoneIds] = useState(() => new Set())
  const [activeRoll, setActiveRoll] = useState(null)
  const [bursts, setBursts] = useState([])
  const [ladders, setLadders] = useState([])
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
          plateLift: ((slots.get(id) ?? 0) % 3) * 0.55,
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

      const ladder = ladderFor(stage.key, pawnPos[2])
      if (ladder) {
        setLadders((l) => [
          ...l,
          { key: `${stage.key}-${playerId}`, playerId, phase: 'rising', ...ladder },
        ])
      }

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
          setLadders((l) =>
            l.map((x) => (x.playerId === playerId && x.phase === 'rising' ? { ...x, phase: 'up' } : x))
          )
        } else {
          setDissolvingIds((d) => new Set(d).add(playerId))
          setBursts((b) => [...b, { key: `${playerId}-${Date.now()}`, position: pawnPos }])
          setLadders((l) =>
            l.map((x) =>
              x.playerId === playerId && x.phase === 'rising' ? { ...x, phase: 'falling' } : x
            )
          )
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
        if (!entry.success) {
          setTimeout(
            () => setLadders((l) => l.filter((x) => !(x.playerId === playerId && x.phase === 'falling'))),
            1400
          )
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
          ladders={ladders}
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
