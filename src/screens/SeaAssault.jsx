/**
 * Sea wall assault — the interactive sequence.
 *
 * Ships stage out in the Golden Horn, sail in, and are then resolved stage by
 * stage exactly as the land lane is: piloting for every ship, then boarding
 * for every passenger, then breaking through for everyone who made the
 * rampart. Outcomes come from rules.js; a click reveals a decision already
 * taken.
 *
 * The one failure in the module that is not the universal dissolve is here:
 * a ship that rolls a 1 founders, with its own animation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { SeaTerrain } from '../three/SeaScene.jsx'
import { buildGarrison } from '../three/geometry/garrisonBuilder.js'
import {
  SEA_LANE,
  SEA_HEIGHTS,
  SEA_FRAMINGS,
  SEA_OFFSET,
  SEA_FOV,
  SEA_SHIP,
  MAST_TOP_Y,
  gangwayGeometry,
  seaShipZ,
  boardingSpot,
  bridgeSpot,
  gangwaySkew,
  nearestSeaTower,
  cameraFor,
} from '../three/lane.js'
import { Ship, SplashBurst } from '../three/geometry/Ship.jsx'
import { SinkRing, Smoke } from '../three/geometry/Field.jsx'
import { Pawn, DissolveBurst, plateLayout } from '../three/geometry/Pawn.jsx'
import { Die } from '../three/geometry/Die.jsx'
import { PALETTE } from '../three/palette.js'
import { factionFlagTexture } from '../three/factions.js'
import { RENDERER_PROPS, configureRenderer, DPR, shadowMapSize } from '../three/renderer.js'
import { StageBanner, RollReadout, Prompt } from './AssaultHud.jsx'
import { useResolveNextKey } from './LandAssault.jsx'
import { Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'
import { Atmosphere } from '../three/geometry/Sky.jsx'

/* ---------------------------------------------------------------- timing */

const BEAT = {
  sailIn: 2200, // a beat on the beach before anything is resolved
  tumble: 1250,
  hold: 1300,
  resolve: 1500,
  sink: 3200, // a foundering ship gets longer than a dissolve
  climb: 700, // up the rigging to the flying bridge
}

/* -------------------------------------------------------------- geometry */

const PAIR_MID = SEA_SHIP.pairMid
const DECK_Y = SEA_SHIP.deckY // deck level; crew stand here, not in mid-air
const SHIP_DAMP = 0.9 // crew must travel at the ship's rate or slide off it
const GANGWAY = gangwayGeometry()


/**
 * Three stations: drawn up on the Galata beach, mid-channel, and alongside
 * the wall. A ship that founders does so in the middle of the crossing, which
 * is both where it would and where it reads.
 */
function shipStation(stage, index, count) {
  const z = seaShipZ(index, count)
  const x =
    stage === 'beach'
      ? SEA_LANE.stagingX
      : stage === 'mid'
        ? SEA_LANE.approachX
        : SEA_LANE.atWallX
  return [x, 0, z]
}

/**
 * The lane a given man keeps along the plank: he holds it from the moment he
 * reaches the flying bridge until he steps off on the rampart, so his whole
 * path is a straight run in along X. Well inside the gangway's 1.15 width.
 */
function plankLane(slotOnShip, crewCount) {
  if (crewCount <= 1) return 0
  return -0.28 + (0.56 * slotOnShip) / (crewCount - 1)
}

/**
 * A contingent's flag, run up over the tower nearest where its first man got
 * onto the wall. Once it is up it stays up — the wall is taken there, and a
 * standard on a tower is how that was announced.
 */
function TowerFlag({ z, faction }) {
  const texture = useMemo(() => factionFlagTexture(faction), [faction])
  const ref = useRef()
  const raised = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    raised.current = THREE.MathUtils.damp(raised.current, 1, 2.4, delta)
    ref.current.position.y = SEA_HEIGHTS.tower + 0.4 + raised.current * 2.5
  })

  return (
    <group position={[SEA_LANE.wallX - 0.85, 0, z]}>
      <mesh position={[0, SEA_HEIGHTS.tower + 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.8, 6]} />
        <meshLambertMaterial color={PALETTE.hullTimberDark} />
      </mesh>
      <group ref={ref} rotation={[0, -0.5, 0]}>
        <mesh position={[0.58, 0, 0]}>
          <planeGeometry args={[1.16, 0.84]} />
          <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** Where a person stands: on their ship's deck, on the wall, or in the city. */
function crewPosition(level, shipPos, slotOnShip, crewCount, slotOverall, overallCount) {
  switch (level) {
    case 'wall': {
      // At the far end of his own ship's gangway — not at some slot spread
      // along the whole wall. Landing by overall slot was the bug behind the
      // diagonal: a man walked off the plank sideways to a berth that had
      // nothing to do with where his ship lay.
      return boardingSpot(shipPos[2], plankLane(slotOnShip, crewCount))
    }
    case 'inside': {
      const spread = Math.min(20, Math.max(5, overallCount * 3))
      const z =
        overallCount === 1
          ? 0
          : -spread / 2 + (spread * slotOverall) / Math.max(1, overallCount - 1)
      return [SEA_LANE.insideX + 1.5, 0, z * 0.9]
    }
    case 'bridge': {
      // At the inboard end of the gangway, up on the flying bridge between the
      // mast-heads. Boarders are lifted here rather than launched at the wall
      // from the deck, so that what follows is a walk along a plank instead of
      // a diagonal jump across open water.
      return bridgeSpot(shipPos[0], shipPos[2], plankLane(slotOnShip, crewCount))
    }
    case 'deck':
    default: {
      // Spread along the deck between the two lashed hulls.
      const lane = crewCount <= 1 ? 0 : -1.2 + (2.4 * slotOnShip) / (crewCount - 1)
      return [shipPos[0] + lane, DECK_Y, shipPos[2] + PAIR_MID]
    }
  }
}

/* ---------------------------------------------------------------- camera */

/**
 * As on the land lane, the camera looks along the wall rather than square on
 * to it — but lower, because at the land lane's pitch the horizon falls
 * outside the frame and hides the far shore, and this lane is about the fleet
 * being inside the Horn with Galata opposite.
 *
 * Numbers live in `three/lane.js`, where the scene checks can reach them.
 */
function CameraRig({ focus }) {
  const camRef = useRef()
  const size = useThree((state) => state.size)
  const scene = useThree((state) => state.scene)
  const aspect = Math.max(0.5, size.width / Math.max(1, size.height))

  const frame = useMemo(() => {
    const f = SEA_FRAMINGS[focus] || SEA_FRAMINGS.approach
    const solved = cameraFor({
      framing: f,
      offset: SEA_OFFSET,
      fov: SEA_FOV,
      aspect,
      clamp: [30, 200],
    })
    return {
      pos: new THREE.Vector3(...solved.position),
      look: new THREE.Vector3(...solved.look),
    }
  }, [focus, aspect])

  useFrame((_, delta) => {
    const cam = camRef.current
    if (!cam) return
    cam.position.x = THREE.MathUtils.damp(cam.position.x, frame.pos.x, 1.1, delta)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, frame.pos.y, 1.1, delta)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, frame.pos.z, 1.1, delta)
    cam.lookAt(frame.look)

    if (scene.fog) {
      const d = cam.position.distanceTo(frame.look)
      scene.fog.near = d * 0.95
      scene.fog.far = d * 2.8
    }
  })

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={SEA_FOV}
      near={0.1}
      far={520}
      position={[-70, 26, 66]}
    />
  )
}

function Lighting() {
  return (
    <>
      <directionalLight
        position={[-34, 30, 18]}
        intensity={1.6}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[shadowMapSize(), shadowMapSize()]}
        shadow-camera-left={-52}
        shadow-camera-right={52}
        shadow-camera-top={52}
        shadow-camera-bottom={-52}
        shadow-camera-near={1}
        shadow-camera-far={180}
      />
      <hemisphereLight args={['#cddceb', '#4a5a5e', 0.62]} />
      <ambientLight intensity={0.3} />
      <Atmosphere mood="horn" near={34} far={150} radius={420} />
    </>
  )
}

/* ------------------------------------------------------------------ scene */

/**
 * Defenders massing on the stretch of rampart the ships have come alongside.
 *
 * The standing garrison is evenly spaced along the whole wall, which is right
 * while the fleet is still standing in and wrong the moment it arrives. This
 * is a second, denser line over the threatened bays, and it appears only once
 * there is something to defend against.
 */
function ContactGarrison({ zFrom, zTo, active }) {
  const geometry = useMemo(
    () => buildGarrison({
      x: SEA_LANE.wallX,
      y: SEA_HEIGHTS.wall,
      zFrom,
      zTo,
      count: 22,
      banners: 1,
      seed: 77,
    }),
    [zFrom, zTo]
  )
  if (!active) return null
  return (
    <mesh geometry={geometry} castShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

function SeaScene({
  ships,
  crew,
  towerFlags,
  activeRoll,
  bursts,
  splashes,
  focus,
  contact,
  onShipClick,
  onCrewClick,
}) {
  return (
    <>
      <CameraRig focus={focus} />
      <Lighting />
      <SeaTerrain />

      {/* A contingent's colours over the tower nearest where it got up. */}
      {Object.entries(towerFlags ?? {}).map(([z, faction]) => (
        <TowerFlag key={z} z={Number(z)} faction={faction} />
      ))}

      {/* Smoke still standing over the city from the fires of the first
          assault, the year before. */}
      <ContactGarrison zFrom={contact.from} zTo={contact.to} active={contact.active} />

      <Smoke
        plumes={[
          { x: 16, y: 6, z: -26, r: 2.6 },
          { x: 24, y: 7, z: 14, r: 3.2 },
          { x: 12, y: 5.5, z: 42, r: 2.2 },
          { x: 30, y: 8, z: -60, r: 3.6 },
        ]}
      />

      {ships.map((s) => (
        <Ship
          key={s.id}
          name={s.name}
          position={s.position}
          clickable={s.clickable}
          sinking={s.sinking}
          rampDown={s.rampDown}
          moving={s.moving}
          grappleReach={s.grappleReach}
          gangwayLength={GANGWAY.length}
          gangwayDrop={GANGWAY.drop}
          gangwaySkew={s.gangwaySkew}
          plateLift={s.plateLift}
          onClick={() => onShipClick(s.id)}
        />
      ))}

      {crew.map((c) => (
        <Pawn
          key={c.id}
          name={c.name}
          position={c.position}
          clickable={c.clickable}
          dissolving={c.dissolving}
          showName={c.showName !== false}
          plateLift={c.lift}
          plateHeight={c.height}
          faction={c.faction}
          bearer={c.bearer}
          travelSpeed={c.onBridge ? 1.5 : SHIP_DAMP}
          onClick={() => onCrewClick(c.id)}
        />
      ))}

      {bursts.map((b) => (
        <DissolveBurst key={b.key} position={b.position} />
      ))}
      {splashes.map((s) => (
        <group key={s.key}>
          <SplashBurst position={s.position} />
          <SinkRing position={[s.position[0], 0.12, s.position[2]]} />
        </group>
      ))}

      {activeRoll && (
        <Die
          position={activeRoll.diePosition}
          value={activeRoll.entry.roll}
          rolling={activeRoll.phase === 'tumbling'}
          scale={1.3}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------- the screen */

export default function SeaAssault({ sea, stages, onComplete }) {
  const [sailedIn, setSailedIn] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [resolvedIds, setResolvedIds] = useState(() => new Set())
  const [arrivedShips, setArrivedShips] = useState(() => new Set())
  const [underWay, setUnderWay] = useState(() => new Set())
  const [sinkingShips, setSinkingShips] = useState(() => new Set())
  const [sunkShips, setSunkShips] = useState(() => new Set())
  const [levels, setLevels] = useState({}) // playerId -> 'deck' | 'wall' | 'inside'

  // Scheme B: the crossing beat carries a passage on the fleet that made it.
  const standInGloss = useMemo(() => pickLore('fleet'), [])
  const [dissolvingIds, setDissolvingIds] = useState(() => new Set())
  const [goneIds, setGoneIds] = useState(() => new Set())
  const [activeRoll, setActiveRoll] = useState(null)
  const [bursts, setBursts] = useState([])
  const [splashes, setSplashes] = useState([])
  const [busy, setBusy] = useState(false)

  const stage = stages[stageIndex] || null

  // Ships row in from the staging line before anything is resolved.
  useEffect(() => {
    const t = setTimeout(() => setSailedIn(true), 400)
    const u = setTimeout(() => setSailedIn('done'), BEAT.sailIn)
    return () => {
      clearTimeout(t)
      clearTimeout(u)
    }
  }, [])

  const shipOrder = useMemo(() => sea.ships.map((s) => s.id), [sea.ships])
  const shipById = useMemo(() => new Map(sea.ships.map((s) => [s.id, s])), [sea.ships])

  const shipSlot = useCallback((id) => Math.max(0, shipOrder.indexOf(id)), [shipOrder])

  const stageEntries = stage ? stage.entries : []
  const stageIds = useMemo(
    () => stageEntries.map((e) => (stage?.key === 'piloting' ? e.shipId : e.playerId)),
    [stageEntries, stage]
  )

  /* ------------------------------------------------------------- ships */

  const shipViews = useMemo(() => {
    return sea.ships
      .filter((s) => !sunkShips.has(s.id))
      .map((s) => {
        const slot = shipSlot(s.id)
        const arrived = arrivedShips.has(s.id)
        // Beached until its own attempt begins; then mid-channel; then either
        // on to the wall or down where it stands. Named `station` rather than
        // `stage`: the latter shadows the assault stage this component is
        // resolving, which silently made every ship unclickable.
        const station = arrived ? 'wall' : underWay.has(s.id) ? 'mid' : 'beach'
        const position = shipStation(station, slot, sea.ships.length)
        return {
          id: s.id,
          name: s.captain ?? 'Ship',
          position,
          clickable:
            stage?.key === 'piloting' &&
            sailedIn === 'done' &&
            !busy &&
            !resolvedIds.has(s.id),
          sinking: sinkingShips.has(s.id),
          rampDown: arrived,
          gangwaySkew: gangwaySkew(position[2]),
          // Rowing hard while crossing; barely moving once alongside.
          moving: arrived ? 0.2 : underWay.has(s.id) ? 1 : 0.1,
          grappleReach: arrived ? Math.max(0, SEA_LANE.wallX - SEA_LANE.wallWidth / 2 - (SEA_LANE.atWallX + 2.4)) : 0,
          plateLift: (slot % 3) * 0.75,
        }
      })
  }, [
    sea.ships,
    sunkShips,
    arrivedShips,
    sinkingShips,
    sailedIn,
    stage,
    busy,
    resolvedIds,
    shipSlot,
    underWay,
  ])

  const shipPosById = useMemo(() => {
    const m = new Map()
    for (const v of shipViews) m.set(v.id, v.position)
    return m
  }, [shipViews])

  /* -------------------------------------------------------------- crew */

  // Everyone aboard, from the ship manifest rather than from the boarding
  // rolls — passengers of a ship that founders never roll to board, and must
  // still be on deck to go down with it.
  const roster = useMemo(() => {
    const out = new Map()
    for (const s of sea.ships) {
      for (const p of s.manifest.passengers) {
        if (!out.has(p.id)) {
          out.set(p.id, {
            id: p.id,
            name: p.name,
            shipId: s.id,
            faction: p.faction ?? 'Indeterminate',
            fama: p.fama ?? 0,
          })
        }
      }
    }
    return out
  }, [sea.ships])

  // One standard per contingent, carried by its senior man — the same rule the
  // land lane uses. Ties break on id so the bearer never changes between loads.
  const bannerBearers = useMemo(() => {
    const best = new Map()
    for (const [id, r] of roster) {
      const held = best.get(r.faction)
      if (!held || r.fama > held.fama || (r.fama === held.fama && id < held.id)) {
        best.set(r.faction, { id, fama: r.fama })
      }
    }
    return new Set([...best.values()].map((b) => b.id))
  }, [roster])

  // Where each contingent's flag flies. Keyed by the tower nearest the spot
  // its first man stepped off the plank; first arrival holds it, and it stays
  // up once raised even after he has pushed on into the city.
  const [towerFlags, setTowerFlags] = useState({})
  useEffect(() => {
    setTowerFlags((held) => {
      let next = held
      for (const [id, level] of Object.entries(levels)) {
        if (level !== 'wall' && level !== 'inside') continue
        const r = roster.get(Number(id)) ?? roster.get(id)
        if (!r) continue
        const shipZ = shipPosById.get(r.shipId)?.[2]
        if (shipZ === undefined) continue
        const key = String(nearestSeaTower(boardingSpot(shipZ)[2]))
        if (next[key]) continue
        if (next === held) next = { ...held }
        next[key] = r.faction
      }
      return next
    })
  }, [levels, roster, shipPosById])

  const crewViews = useMemo(() => {
    const live = [...roster.values()].filter((r) => !goneIds.has(r.id))
    // Slots within a ship, and overall, both stable across removals.
    const perShip = new Map()
    for (const s of sea.ships) perShip.set(s.id, s.manifest.passengers.map((p) => p.id))
    const overall = [...roster.keys()]

    return live
      .filter((r) => !sunkShips.has(r.shipId))
      .map((r) => {
        const level = levels[r.id] ?? 'deck'
        const shipPos = shipPosById.get(r.shipId) ?? [SEA_LANE.approachX, 0, 0]
        const onShip = perShip.get(r.shipId) ?? []
        const going = sinkingShips.has(r.shipId)

        const base = crewPosition(
          level,
          shipPos,
          Math.max(0, onShip.indexOf(r.id)),
          onShip.length,
          Math.max(0, overall.indexOf(r.id)),
          overall.length
        )

        return {
          id: r.id,
          name: r.name,
          faction: r.faction,
          bearer: bannerBearers.has(r.id),
          // Crew of a foundering ship ride it down rather than dissolving —
          // the sinking is the one failure with its own treatment.
          position: going ? [base[0], base[1] - 6.2, base[2]] : base,
          clickable:
            !busy &&
            sailedIn === 'done' &&
            stage?.key !== 'piloting' &&
            stageIds.includes(r.id) &&
            !resolvedIds.has(r.id),
          dissolving: dissolvingIds.has(r.id),
          onBridge: level === 'bridge' || level === 'wall',
          showName: !going,
          ...plateLayout(Math.max(0, overall.indexOf(r.id)), overall.length),
        }
      })
  }, [
    roster,
    bannerBearers,
    goneIds,
    sunkShips,
    sinkingShips,
    levels,
    shipPosById,
    sea.ships,
    busy,
    sailedIn,
    stage,
    stageIds,
    resolvedIds,
    dissolvingIds,
  ])

  /* --------------------------------------------------------- resolution */

  const advanceStage = useCallback(() => {
    if (stageIndex + 1 >= stages.length) {
      setTimeout(() => onComplete?.(), 1000)
      return
    }
    setResolvedIds(new Set())
    setStageIndex(stageIndex + 1)
  }, [stageIndex, stages.length, onComplete])

  const finishIfStageDone = useCallback(
    (justResolved) => {
      const done = new Set(resolvedIds)
      done.add(justResolved)
      if (stageIds.every((id) => done.has(id))) {
        setTimeout(advanceStage, 1200)
      }
    },
    [resolvedIds, stageIds, advanceStage]
  )

  const resolvePiloting = useCallback(
    (shipId) => {
      if (busy || !stage) return
      if (resolvedIds.has(shipId)) return
      const entry = stage.entries.find((e) => e.shipId === shipId)
      if (!entry) return

      setBusy(true)
      // Push off the beach the moment the attempt begins, so the die is thrown
      // while the ship is actually crossing.
      setUnderWay((u) => new Set(u).add(shipId))
      const pos = shipPosById.get(shipId) ?? [SEA_LANE.approachX, 0, 0]
      setActiveRoll({
        entry,
        phase: 'tumbling',
        diePosition: [SEA_LANE.approachX + 2.4, 7.2, pos[2] + PAIR_MID + 3.6],
      })

      setTimeout(() => setActiveRoll((r) => (r ? { ...r, phase: 'settled' } : r)), BEAT.tumble)

      setTimeout(() => {
        if (entry.success) {
          setArrivedShips((a) => new Set(a).add(shipId))
        } else {
          setSinkingShips((s) => new Set(s).add(shipId))
          setSplashes((s) => [
            ...s,
            {
              key: `${shipId}-${Date.now()}`,
              // Down in mid-channel, where it had got to.
              position: [SEA_LANE.approachX, 0.2, pos[2] + PAIR_MID],
            },
          ])
        }
        setResolvedIds((r) => new Set(r).add(shipId))
      }, BEAT.tumble + BEAT.hold)

      const tail = entry.success ? BEAT.resolve : BEAT.sink
      setTimeout(() => {
        if (!entry.success) {
          setSunkShips((s) => new Set(s).add(shipId))
          setSinkingShips((s) => {
            const n = new Set(s)
            n.delete(shipId)
            return n
          })
        }
        setActiveRoll(null)
        setBusy(false)
        finishIfStageDone(shipId)
      }, BEAT.tumble + BEAT.hold + tail)
    },
    [busy, stage, resolvedIds, shipPosById, finishIfStageDone]
  )

  const resolveCrew = useCallback(
    (playerId) => {
      if (busy || !stage || stage.key === 'piloting') return
      if (resolvedIds.has(playerId)) return
      const entry = stage.entries.find((e) => e.playerId === playerId)
      if (!entry) return

      setBusy(true)
      const view = crewViews.find((c) => c.id === playerId)
      const pos = view ? view.position : [SEA_LANE.approachX, 3, 0]

      setActiveRoll({
        entry,
        phase: 'tumbling',
        diePosition: [pos[0] + 1.6, pos[1] + 2.1, pos[2] + 2.6],
      })

      setTimeout(() => setActiveRoll((r) => (r ? { ...r, phase: 'settled' } : r)), BEAT.tumble)

      setTimeout(() => {
        if (entry.success) {
          if (stage.key === 'boarding') {
            // Up the rigging to the flying bridge, then along the plank. The
            // two steps matter: launching straight at the wall from the deck
            // read as a jump across open water.
            setLevels((l) => ({ ...l, [playerId]: 'bridge' }))
            setTimeout(
              () => setLevels((l) => ({ ...l, [playerId]: 'wall' })),
              BEAT.climb
            )
          } else {
            setLevels((l) => ({ ...l, [playerId]: 'inside' }))
          }
        } else {
          setDissolvingIds((d) => new Set(d).add(playerId))
          setBursts((b) => [...b, { key: `${playerId}-${Date.now()}`, position: pos }])
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
        finishIfStageDone(playerId)
      }, BEAT.tumble + BEAT.hold + BEAT.resolve)
    },
    [busy, stage, resolvedIds, crewViews, finishIfStageDone]
  )

  // Space or Enter takes the next in the stage's own order. During the
  // piloting stage that is the next ship; afterwards, the next man.
  const nextUnresolved = useMemo(() => {
    const id = stageIds.find((x) => !resolvedIds.has(x))
    return id ?? null
  }, [stageIds, resolvedIds])

  useResolveNextKey(
    nextUnresolved,
    stage?.key === 'piloting' ? resolvePiloting : resolveCrew,
    !busy && sailedIn === 'done' && Boolean(stage)
  )

  // Retire spent particle effects.
  useEffect(() => {
    if (bursts.length === 0) return
    const t = setTimeout(() => setBursts((b) => b.slice(1)), 1500)
    return () => clearTimeout(t)
  }, [bursts])

  useEffect(() => {
    if (splashes.length === 0) return
    const t = setTimeout(() => setSplashes((s) => s.slice(1)), 2800)
    return () => clearTimeout(t)
  }, [splashes])

  const remaining = stageIds.filter((id) => !resolvedIds.has(id)).length
  const focus = sailedIn === 'done' ? stage?.key : 'approach'

  // The stretch of wall the ships have actually come alongside.
  const contact = useMemo(() => {
    const zs = shipViews.filter((s) => s.rampDown).map((s) => s.position[2])
    const active = zs.length > 0 && (stage?.key === 'boarding' || stage?.key === 'breaking')
    const from = zs.length ? Math.min(...zs) - 5 : -8
    const to = zs.length ? Math.max(...zs) + 7 : 8
    return { active, from, to }
  }, [shipViews, stage])

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: '#1c1512' }}>
      <Canvas shadows dpr={DPR} gl={RENDERER_PROPS} onCreated={configureRenderer}>
        <SeaScene
          ships={shipViews}
          crew={crewViews}
          towerFlags={towerFlags}
          activeRoll={activeRoll}
          bursts={bursts}
          splashes={splashes}
          focus={focus}
          contact={contact}
          onShipClick={resolvePiloting}
          onCrewClick={resolveCrew}
        />
      </Canvas>

      {sailedIn !== 'done' ? (
        <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center pt-6">
          <div className="manuscript-scope vellum ink-frame max-w-2xl px-9 py-4 text-center">
            <div className="display text-3xl font-bold" style={{ color: 'var(--rubric)' }}>
              The Fleet Stands In
            </div>
            <div className="mt-1 text-lg" style={{ color: 'var(--ink-soft)' }}>
              {sea.ships.length} ship{sea.ships.length === 1 ? '' : 's'} row for the Golden Horn
              wall, lashed in pairs with bridges rigged between the mast-tops.
            </div>
            {/* A beat the game already spends waiting, so it earns its keep. */}
            <Marginalia entry={standInGloss} />
          </div>
        </div>
      ) : (
        <>
          <StageBanner stage={stage} remaining={remaining} total={stageIds.length} />
          <RollReadout activeRoll={activeRoll} />
          <Prompt
            show={!activeRoll && remaining > 0}
            remaining={remaining}
            noun={stage?.key === 'piloting' ? 'ship' : 'crusader'}
          />
        </>
      )}
    </div>
  )
}
