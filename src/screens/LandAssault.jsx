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
import { LandTerrain } from '../three/LandScene.jsx'
import {
  LANE,
  HEIGHTS,
  LAND_FRAMINGS,
  LAND_OFFSET,
  LAND_FOV,
  cameraFor,
  ladderFor,
} from '../three/lane.js'
import { Pawn, DissolveBurst, plateLayout } from '../three/geometry/Pawn.jsx'
import { SiegeLadder } from '../three/geometry/SiegeLadder.jsx'
import { Die } from '../three/geometry/Die.jsx'
import { RENDERER_PROPS, configureRenderer, DPR, shadowMapSize } from '../three/renderer.js'
import { StageBanner, RollReadout, Prompt } from './AssaultHud.jsx'
import { Atmosphere } from '../three/geometry/Sky.jsx'

/* ---------------------------------------------------------------- timing */

/** Cinematic pacing. The siege is the centrepiece of the class period. */
const BEAT = {
  tumble: 1250, // die in the air
  hold: 1300, // settled number held on screen
  // The climb, lengthened from 1400. The engines loose as it begins and their
  // stone is in the air for about six-tenths of a second; a shorter ascent had
  // the crusader on the parapet before the shot arrived, which reads as the
  // machines firing at a wall nobody is attacking any more.
  resolve: 1750,
}

/* -------------------------------------------------------------- geometry */

const LEVELS = {
  camp: 0,
  outer: 1,
  inner: 2,
  inside: 3,
}

/** Where a pawn stands, given how far it has got and its slot in the line. */
/**
 * Resolve the next unresolved token from the keyboard.
 *
 * A teacher runs this while talking to a room, often from the back of it with
 * a clicker rather than a mouse. Space or Enter takes the next man in fama
 * order — which is the order the manual has them attack in anyway — so the
 * whole stage can be played without ever finding a two-centimetre figure on a
 * projected image.
 *
 * Deliberately not a way to choose *who*: picking a specific crusader is what
 * the mouse is for, and a keyboard shortcut that silently picked the wrong
 * student would be worse than no shortcut.
 */
export function useResolveNextKey(nextId, resolve, enabled) {
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      if (e.target instanceof HTMLElement && /input|textarea|button/i.test(e.target.tagName)) return
      e.preventDefault()
      if (nextId !== null && nextId !== undefined) resolve(nextId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextId, resolve, enabled])
}

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
      // A loose block on the open ground, staggered across the approach, and
      // held well back from the counterscarp. At 2.6 apart and starting at the
      // camp line, the third row landed on the narrow ledge between that low
      // wall and the lip of the ditch, with a third of the army standing
      // inside the masonry.
      const row = index % 3
      return [LANE.musterX + row * LANE.musterRow, 0, z + (row - 1) * 1.4]
    }
  }
}

/**
 * The wall a stage is fought against, and the ladder that gets raised for it.
 * The gates are a gate — nothing to scale — so that stage raises none.
 */
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
/**
 * The camera stands out on the attackers' side and looks back along the line
 * of the walls. Square-on, a wall is a slab seen end-first and reads as a
 * cross-section — the cutaway look.
 *
 * Its numbers live in `three/lane.js` so `scripts/check-scene.mjs` can assert
 * that no framing ever puts the camera inside masonry, at any aspect ratio.
 */
function CameraRig({ focus }) {
  const camRef = useRef()
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)
  const aspect = Math.max(0.5, size.width / Math.max(1, size.height))

  const frame = useMemo(() => {
    const f = LAND_FRAMINGS[focus] || LAND_FRAMINGS.wide
    const solved = cameraFor({
      framing: f,
      offset: LAND_OFFSET,
      fov: LAND_FOV,
      aspect,
      clamp: [30, 190],
    })
    return {
      pos: new THREE.Vector3(...solved.position),
      look: new THREE.Vector3(...solved.look),
    }
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
      fov={LAND_FOV}
      near={0.1}
      far={400}
      position={[-58, 48, 52]}
    />
  )
}

/**
 * Round two is later in the day, and over ground the army has already been
 * thrown off once.
 *
 * The two rounds looked identical, which quietly undercut the thing the phase
 * is for: the manual has students told that if the first attack fails they
 * *must* attack again "or risk the total failure of the crusade", and the
 * screen should carry some of that. The sun is lower and redder, the shadows
 * longer, the light flatter.
 */
function Lighting({ round = 1 }) {
  const late = round > 1
  return (
    <>
      {/* A low April sun coming over the Golden Horn; lower still on a second
          assault, when the day has worn on. */}
      <directionalLight
        position={late ? [-40, 17, 22] : [-34, 30, 16]}
        intensity={late ? 1.35 : 1.65}
        color={late ? '#ffd9a8' : '#fff2d8'}
        castShadow
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
      <hemisphereLight args={late ? ['#b9bcc6', '#6d6448', 0.55] : ['#c4d6ea', '#7b7256', 0.68]} />
      <ambientLight intensity={late ? 0.3 : 0.22} />
      {/* Sky and aerial perspective from one palette, so the far towers fade
          into the colour that is actually behind them. */}
      <Atmosphere mood={round > 1 ? 'late' : 'day'} near={38} far={165} radius={330} />
    </>
  )
}

/* ------------------------------------------------------------------ scene */

function AssaultScene({ pawns, ladders, activeRoll, bursts, focus, round, engineFire, onPawnClick }) {
  return (
    <>
      <CameraRig focus={focus} />
      <Lighting round={round} />
      <LandTerrain engineFire={engineFire} />

      {pawns.map((p) => (
        <Pawn
          key={p.id}
          name={p.name}
          position={p.position}
          clickable={p.clickable}
          dissolving={p.dissolving}
          plateLift={p.lift}
          plateHeight={p.height}
          // A little slower up the ladder than the default, so the engines'
          // stone arrives while he is still climbing rather than after he has
          // arrived. The sea lane keeps its own rate: crew there have to move
          // at the ship's, or they slide off it.
          travelSpeed={1.9}
          faction={p.faction}
          bearer={p.bearer}
          onClick={() => onPawnClick(p.id)}
        />
      ))}

      {ladders.map((l) => (
        <SiegeLadder
          key={l.key}
          position={l.position}
          height={l.height}
          lean={l.lean}
          alongWall={l.alongWall}
          phase={l.phase}
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

/* ------------------------------------------------------------- the screen */

export default function LandAssault({ stages, round = 1, onComplete }) {
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

  // Identity lookup across every stage, so a pawn keeps its name, colours and
  // standing as it advances.
  const whoById = useMemo(() => {
    const seen = new Map()
    for (const s of stages) {
      for (const e of s.entries) {
        if (!seen.has(e.playerId)) {
          seen.set(e.playerId, { name: e.player, faction: e.faction, fama: e.fama })
        }
      }
    }
    return seen
  }, [stages])

  /**
   * The one man in each contingent who carries its banner: the highest fama
   * present. Ties break on id so it is stable from render to render.
   */
  const bannerBearers = useMemo(() => {
    const best = new Map()
    for (const [id, w] of whoById) {
      const held = best.get(w.faction)
      if (!held || w.fama > held.fama || (w.fama === held.fama && id < held.id)) {
        best.set(w.faction, { id, fama: w.fama })
      }
    }
    return new Set([...best.values()].map((b) => b.id))
  }, [whoById])

  // Stable slot per pawn for this stage. Keyed off the stage's own entry order
  // so a pawn's position never shifts because a neighbour dissolved.
  const slots = useMemo(() => {
    const m = new Map()
    if (!stage) return m
    // Lay contingents out together rather than in roll order, so the army
    // reads as a set of followings rather than a queue. Ordering here is
    // presentation only — it does not touch who rolls what.
    const ordered = [...stage.entries].sort((a, b) => {
      if (a.faction !== b.faction) return a.faction < b.faction ? -1 : 1
      if (a.fama !== b.fama) return b.fama - a.fama
      return a.playerId - b.playerId
    })
    ordered.forEach((e, i) => m.set(e.playerId, i))
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
          name: whoById.get(id)?.name ?? '',
          faction: whoById.get(id)?.faction ?? 'Indeterminate',
          bearer: bannerBearers.has(id),
          position: positionFor(level, slots.get(id) ?? 0, count),
          ...plateLayout(slots.get(id) ?? 0, count),
          clickable: !busy && !resolvedIds.has(id),
          dissolving: dissolvingIds.has(id),
        }
      })
  }, [stageIds, goneIds, levels, resolvedIds, dissolvingIds, slots, busy, whoById, bannerBearers])


  const advanceStage = useCallback(() => {
    if (stageIndex + 1 >= stages.length) {
      // Sequence over. Hand back everything that happened.
      setTimeout(() => onComplete?.(), 900)
      return
    }
    setResolvedIds(new Set())
    setStageIndex(stageIndex + 1)
  }, [stageIndex, stages.length, onComplete])

  // The next man in the stage's own order, which is fama order.
  const nextUnresolved = useMemo(
    () => stage?.entries.find((e) => !resolvedIds.has(e.playerId))?.playerId ?? null,
    [stage, resolvedIds]
  )

  // Bumped on every attempt, which is what looses the engines. They fire
  // alongside the die rather than before it: an extra beat per crusader would
  // add a couple of minutes across a class of twenty-four.
  const [engineFire, setEngineFire] = useState(0)

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
        // The engines loose as the man starts up the ladder, so the stone is
        // over the wall while he is on it. Fired on the click instead, it
        // landed during the dice and was long forgotten by the time he moved.
        setEngineFire((n) => n + 1)

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

  useResolveNextKey(nextUnresolved, handlePawnClick, !busy && Boolean(stage))

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
        dpr={DPR}
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
          round={round}
          engineFire={engineFire}
          onPawnClick={handlePawnClick}
        />
      </Canvas>

      <StageBanner stage={stage} remaining={remaining} total={stageIds.length} />
      <RollReadout activeRoll={activeRoll} />
      <Prompt show={!activeRoll && remaining > 0} remaining={remaining} />
    </div>
  )
}
