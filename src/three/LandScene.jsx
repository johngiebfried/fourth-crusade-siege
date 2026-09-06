/**
 * The land wall lane, viewed along the face of the walls.
 *
 * The earlier version looked at the defences end-on, which meant the walls
 * read as cut slabs — a cross-section through a wall rather than a wall. This
 * view sits out on the attackers' side and looks back along the line, so each
 * wall runs as a diagonal across the frame with the next one standing taller
 * behind it. You see the banded masonry face, the towers marching away into
 * the distance, and the ladders going up — a wall chain, not a diagram.
 *
 * For that to work the walls must run off both edges of the frame, so their
 * ends are never visible. Hence a lane depth far longer than the camera sees.
 *
 * Reading from the attackers outward: the staging camp, open ground, the moat,
 * the low outer wall, the terrace, then the great inner wall with its towers,
 * and finally the gate into the city. That sequence — moat, outer wall,
 * terrace, inner wall — is the real structure of the Theodosian defences, and
 * the height difference between the outer and inner walls is the part worth
 * getting right even when the detail is coarse.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from './palette.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildWallLine, buildGround } from './geometry/wallBuilder.js'
import { buildGarrison } from './geometry/garrisonBuilder.js'
import { GrassField, MoatWater, Smoke, Mangonel } from './geometry/Field.jsx'
import { buildSiegeCamp, buildMoatWorks, buildMangonelBeam, MANGONEL } from './geometry/siegeCamp.js'
import { buildCityQuarter } from './geometry/landmarks.js'

import {
  LANE,
  HEIGHTS,
  LAND_GATE,
  INNER_TOWERS,
  OUTER_TOWERS,
  GATE_STREET,
} from './lane.js'

export { LANE, HEIGHTS }

function Walls() {
  /**
   * Each line is built as two runs with the gate between them, rather than as
   * one continuous wall. The regular towers that would have fallen inside the
   * opening are skipped; the gatehouse brings its own, heavier pair.
   */
  const runs = (from, to) => ({ depth: to - from, z: (from + to) / 2 })
  const half = LANE.laneDepth / 2

  /**
   * Keep a curtain tower from crowding the gate's own pair.
   *
   * Skipping towers that fall *inside* the opening is not enough: the next one
   * along can still land a few units from a gate tower, and the two read as a
   * clump rather than as a gate with clear wall either side of it. Anything
   * closer than `keep` is pushed out to that distance, which shifts one tower
   * a little further down the wall and leaves the gate standing on its own.
   */
  const clearOfGate = (z, keep) => {
    const d = z - LAND_GATE.z
    if (Math.abs(d) >= keep) return z
    return LAND_GATE.z + (d >= 0 ? keep : -keep)
  }

  const outer = useMemo(() => {
    const gap = LANE.LAND_GATE_OUTER ?? LAND_GATE.outerHalf
    const towers = []
    const spacing = LANE.laneDepth / OUTER_TOWERS
    for (let i = 0; i < OUTER_TOWERS; i++) {
      const raw = -half + spacing * i
      if (Math.abs(raw - LAND_GATE.z) < gap + 3.4) continue
      towers.push({
        radius: 1.15,
        height: HEIGHTS.outerTower,
        x: LANE.outerWallX - 0.55,
        z: clearOfGate(raw, 11.5),
        polygonal: i % 2 === 0,
      })
    }

    const wallBase = {
      width: LANE.outerWallWidth,
      height: HEIGHTS.outerWall,
      x: LANE.outerWallX,
      merlonWidth: 0.5,
      merlonGap: 0.42,
      merlonHeight: 0.45,
    }

    const merged = [
      buildWallLine({
        wall: { ...wallBase, ...runs(-half, LAND_GATE.z - gap) },
        towers,
        rubble: { from: -half, to: half, x: LANE.outerWallX - 1.0, count: 150 },
        seed: 7,
      }),
      buildWallLine({
        wall: { ...wallBase, ...runs(LAND_GATE.z + gap, half) },
        towers: [],
        seed: 8,
      }),
      buildWallLine({
        wall: { ...wallBase, depth: 0.001, z: LAND_GATE.z, merlons: false },
        towers: [],
        gate: {
          x: LANE.outerWallX,
          z: LAND_GATE.z,
          halfGap: gap,
          wallWidth: LANE.outerWallWidth,
          wallHeight: HEIGHTS.outerWall,
          towerRadius: 1.25,
          towerHeight: HEIGHTS.outerTower + 0.9,
          seed: 41,
        },
        seed: 9,
      }),
    ]
    return mergeGeometries(merged, false)
  }, [])

  const inner = useMemo(() => {
    const gap = LAND_GATE.innerHalf
    const towers = []
    const spacing = LANE.laneDepth / INNER_TOWERS
    for (let i = 0; i < INNER_TOWERS; i++) {
      const raw = -half + spacing * (i + 0.5)
      if (Math.abs(raw - LAND_GATE.z) < gap + 5.2) continue
      towers.push({
        radius: 1.9,
        height: HEIGHTS.tower,
        x: LANE.innerWallX - 0.9,
        z: clearOfGate(raw, 13.0),
        polygonal: i % 2 === 1,
      })
    }

    const wallBase = {
      width: LANE.innerWallWidth,
      height: HEIGHTS.innerWall,
      x: LANE.innerWallX,
      merlonWidth: 0.62,
      merlonGap: 0.5,
      merlonHeight: 0.6,
    }

    const merged = [
      buildWallLine({
        wall: { ...wallBase, ...runs(-half, LAND_GATE.z - gap) },
        towers,
        rubble: { from: -half, to: half, x: LANE.innerWallX - 1.5, count: 170 },
        seed: 13,
      }),
      buildWallLine({
        wall: { ...wallBase, ...runs(LAND_GATE.z + gap, half) },
        towers: [],
        seed: 14,
      }),
      buildWallLine({
        wall: { ...wallBase, depth: 0.001, z: LAND_GATE.z, merlons: false },
        towers: [],
        gate: {
          x: LANE.innerWallX,
          z: LAND_GATE.z,
          halfGap: gap,
          wallWidth: LANE.innerWallWidth,
          wallHeight: HEIGHTS.innerWall,
          towerRadius: 2.15,
          towerHeight: HEIGHTS.tower + 2.2,
          seed: 43,
        },
        seed: 15,
      }),
    ]
    return mergeGeometries(merged, false)
  }, [])

  return (
    <group>
      <mesh geometry={outer} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={inner} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
    </group>
  )
}

function Gate() {
  const gate = useMemo(
    () =>
      buildWallLine({
        wall: {
          width: LANE.gateWidth,
          depth: LANE.laneDepth,
          height: HEIGHTS.gate,
          merlonWidth: 0.55,
          merlonGap: 0.45,
          merlonHeight: 0.5,
        },
        seed: 21,
      }),
    []
  )

  return (
    <group position={[LANE.gateX, 0, 0]}>
      <mesh geometry={gate} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {/* Gate towers flanking the opening */}
      {[-2.6, 2.6].map((z, i) => (
        <mesh key={i} position={[0, HEIGHTS.gate / 2 + 0.6, z]} castShadow>
          <boxGeometry args={[3.0, HEIGHTS.gate + 1.2, 2.0]} />
          <meshLambertMaterial color={PALETTE.towerStone} flatShading />
        </mesh>
      ))}
      {/* Arched opening, cut visually with a dark recess rather than CSG. */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2.7, 3.0, 2.6]} />
        <meshBasicMaterial color="#241a15" />
      </mesh>
      <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 2.7, 16, 1, false, 0, Math.PI]} />
        <meshBasicMaterial color="#241a15" />
      </mesh>
    </group>
  )
}

function Ground() {
  // Explicit spans, so no slab is drawn over the one next to it, and all of
  // them run well past the frame.
  const span = (from, to, hex, y = 0) =>
    buildGround({ width: to - from, depth: 320, hex, x: (from + to) / 2, y })

  const moatFrom = LANE.moatX - LANE.moatWidth / 2
  const moatTo = LANE.moatX + LANE.moatWidth / 2

  const field = useMemo(() => span(-120, moatFrom, PALETTE.fieldGrass), [])
  const moatBed = useMemo(() => span(moatFrom, moatTo, '#3a5148', -0.7), [])
  const berm = useMemo(() => span(moatTo, LANE.outerWallX - 0.7, PALETTE.fieldDirt), [])
  const terrace = useMemo(
    () => span(LANE.outerWallX + 0.7, LANE.innerWallX - 1.1, PALETTE.fieldDirt),
    []
  )
  const inside = useMemo(() => span(LANE.innerWallX + 1.1, 120, PALETTE.fieldDirt), [])

  return (
    <group>
      {[field, moatBed, berm, terrace, inside].map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshLambertMaterial vertexColors />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Domed skyline behind the walls — the city the assault is trying to reach.
 * Merged, because a hundred and fifty buildings as separate meshes is a
 * hundred and fifty draw calls for scenery nobody interacts with.
 */
function CityBackdrop() {
  const geometry = useMemo(
    () =>
      buildCityQuarter({
        seed: 3,
        count: 230,
        fromX: LANE.cityX + 1,
        toX: LANE.cityX + 26,
        // A street kept clear in front of the gate. A gate needs a road, and
        // it is also the only ground the bribery camera has to stand on.
        keepClear: (x, z) => Math.abs(z) < GATE_STREET.halfWidth && x < GATE_STREET.untilX,
        cypresses: 70,
      }),
    []
  )

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/**
 * The ditch itself: revetted sides, a crenellated counterscarp on the field
 * edge, and the cross-walls that divided it into fillable bays.
 */
function MoatWorks() {
  const geometry = useMemo(
    () =>
      buildMoatWorks({
        moatX: LANE.moatX,
        moatWidth: LANE.moatWidth,
        from: -LANE.laneDepth / 2,
        to: LANE.laneDepth / 2,
        gateZ: LAND_GATE.z,
        // Out into the field the army crosses, and right up to the wall face.
        roadFromX: LANE.musterX - 1.5,
        roadToX: LANE.outerWallX - LANE.outerWallWidth / 2,
      }),
    []
  )
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/**
 * The two engines, drawn up in front of the camp and shooting at the wall.
 *
 * Their frames are baked into the camp's merged geometry; only the beams here
 * are live. The engines were also facing the wrong way — see MANGONEL — and
 * are turned round.
 */
function Mangonels({ fire = 0 }) {
  const beam = useMemo(() => buildMangonelBeam({ withStone: true }), [])
  const beamEmpty = useMemo(() => buildMangonelBeam({ withStone: false }), [])

  return (
    <>
      {[-16, 4].map((z, i) => (
        <Mangonel
          key={z}
          position={[LANE.campX - 5, 0, z]}
          facing={-1}
          // The two loose on alternate attempts, so a stone is in the air
          // rather more often than either machine could manage alone.
          fire={Math.floor((fire + (i === 0 ? 1 : 0)) / 2)}
          target={[LANE.outerWallX, HEIGHTS.outerWall + 0.3, z + (i ? 2.5 : -2.5)]}
          beamGeometry={beam}
          beamEmptyGeometry={beamEmpty}
          cocked={MANGONEL.cocked}
          loosed={MANGONEL.loosed}
          longArm={MANGONEL.longArm}
          axleY={MANGONEL.axleY}
        />
      ))}
    </>
  )
}

/** The camp the army came from, and the engines drawn up in front of it. */
function SiegeCamp() {
  const geometry = useMemo(
    () => buildSiegeCamp({ campX: LANE.campX - 11, engineX: LANE.campX - 5, seed: 5 }),
    []
  )
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/**
 * A bridge thrown across the moat, so the army has a way over the ditch.
 *
 * One of them, not a row: a besieging army bridges the ditch where it means to
 * assault, and a single crossing reads as an effort that cost something rather
 * than as fencing along the bank.
 */

/** Defenders on all three lines, merged into one geometry each. */
function Garrisons() {
  const outer = useMemo(
    () =>
      buildGarrison({
        x: LANE.outerWallX,
        y: HEIGHTS.outerWall,
        zFrom: -70,
        zTo: 70,
        count: 34,
        banners: 0,
        seed: 2,
      }),
    []
  )
  const inner = useMemo(
    () =>
      buildGarrison({
        x: LANE.innerWallX,
        y: HEIGHTS.innerWall,
        zFrom: -72,
        zTo: 72,
        count: 44,
        banners: 3,
        seed: 5,
      }),
    []
  )
  const gate = useMemo(
    () =>
      buildGarrison({
        x: LANE.gateX,
        y: HEIGHTS.gate,
        zFrom: -60,
        zTo: 60,
        count: 22,
        banners: 2,
        seed: 9,
      }),
    []
  )

  return (
    <group>
      {[outer, inner, gate].map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Static scenery for the land lane. Contains no game state. */
export function LandTerrain({ engineFire = 0 }) {
  return (
    <group>
      <Ground />
      <MoatWorks />
      <MoatWater x={LANE.moatX} width={LANE.moatWidth} />

      {/* Grass over the ground the army crosses, and on the terrace between
          the two wall lines. */}
      <GrassField
        xFrom={-46}
        xTo={LANE.moatX - LANE.moatWidth / 2 - 0.2}
        zFrom={-70}
        zTo={70}
        count={14000}
        seed={11}
      />
      <GrassField
        xFrom={LANE.moatX + LANE.moatWidth / 2 + 0.3}
        xTo={LANE.outerWallX - 0.9}
        zFrom={-70}
        zTo={70}
        count={3200}
        seed={29}
        colour="#7a7d4c"
      />

      <SiegeCamp />
      <Mangonels fire={engineFire} />
      <Walls />
      <Gate />
      <CityBackdrop />

      <Garrisons />

      {/* Smoke standing over the city from the fires of the first assault. */}
      <Smoke
        plumes={[
          { x: LANE.cityX + 6, y: 6, z: -34, r: 2.8 },
          { x: LANE.cityX + 14, y: 7, z: 10, r: 3.4 },
          { x: LANE.cityX + 4, y: 5.5, z: 46, r: 2.4 },
        ]}
      />
    </group>
  )
}
