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
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from './palette.js'
import { buildWallLine, buildGround } from './geometry/wallBuilder.js'
import { buildGarrison } from './geometry/garrisonBuilder.js'
import { GrassField, MoatWater, Smoke } from './geometry/Field.jsx'
import { buildSiegeCamp, buildMoatBridge } from './geometry/siegeCamp.js'

import {
  LANE,
  HEIGHTS,
  INNER_TOWERS,
  OUTER_TOWERS,
  GATE_STREET,
} from './lane.js'

export { LANE, HEIGHTS }

function Walls() {
  const outer = useMemo(() => {
    const towers = []
    const spacing = LANE.laneDepth / OUTER_TOWERS
    for (let i = 0; i < OUTER_TOWERS; i++) {
      towers.push({
        radius: 0.95,
        height: HEIGHTS.outerTower,
        x: LANE.outerWallX - 0.55,
        z: -LANE.laneDepth / 2 + spacing * i,
        polygonal: i % 2 === 0,
      })
    }
    return buildWallLine({
      wall: {
        width: LANE.outerWallWidth,
        depth: LANE.laneDepth,
        height: HEIGHTS.outerWall,
        x: LANE.outerWallX,
        merlonWidth: 0.5,
        merlonGap: 0.42,
        merlonHeight: 0.45,
      },
      towers,
      rubble: {
        from: -LANE.laneDepth / 2,
        to: LANE.laneDepth / 2,
        x: LANE.outerWallX - 1.0,
        count: 150,
      },
      seed: 7,
    })
  }, [])

  const inner = useMemo(() => {
    const towers = []
    const spacing = LANE.laneDepth / INNER_TOWERS
    for (let i = 0; i < INNER_TOWERS; i++) {
      towers.push({
        radius: 1.5,
        height: HEIGHTS.tower,
        x: LANE.innerWallX - 0.9,
        z: -LANE.laneDepth / 2 + spacing * (i + 0.5),
        polygonal: i % 2 === 1,
      })
    }
    return buildWallLine({
      wall: {
        width: LANE.innerWallWidth,
        depth: LANE.laneDepth,
        height: HEIGHTS.innerWall,
        x: LANE.innerWallX,
        merlonWidth: 0.62,
        merlonGap: 0.5,
        merlonHeight: 0.6,
      },
      towers,
      rubble: {
        from: -LANE.laneDepth / 2,
        to: LANE.laneDepth / 2,
        x: LANE.innerWallX - 1.5,
        count: 170,
      },
      seed: 13,
    })
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
  const geometry = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 127.1) * 43758.5453) % 1)
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

    for (let i = 0; i < 150; i++) {
      const r = rand(i)
      const r2 = rand(i + 40)
      const x = LANE.cityX + 1 + r * 24
      const z = -95 + r2 * 190
      // Keep a street clear in front of the gate. A gate needs a road, and it
      // is also the only ground the bribery camera has to stand on.
      if (Math.abs(z) < GATE_STREET.halfWidth && x < GATE_STREET.untilX) continue
      const w = 1.6 + r * 2.4
      const h = 1.6 + r2 * 2.8
      const tone = 0.88 + rand(i + 91) * 0.24

      const body = new THREE.BoxGeometry(w, h, w)
      body.translate(x, h / 2, z)
      parts.push(paint(body, PALETTE.cityWall, tone))

      if (i % 3 !== 2) {
        // Drum ringed with windows, then a shallow dome — the Byzantine
        // church silhouette. Emphatically not a spire.
        const domeR = 0.7 + r * 0.7
        const drum = new THREE.CylinderGeometry(domeR, domeR, 0.56, 12)
        drum.translate(x, h + 0.28, z)
        parts.push(paint(drum, PALETTE.cityWall, tone))

        const dome = new THREE.SphereGeometry(domeR * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
        dome.scale(1, 0.52, 1)
        dome.translate(x, h + 0.56, z)
        parts.push(paint(dome, PALETTE.domeLead, tone))
      } else {
        const roof = new THREE.BoxGeometry(w * 1.05, 0.6, w * 1.05)
        roof.translate(x, h + 0.3, z)
        parts.push(paint(roof, PALETTE.cityRoof, tone))
      }
    }

    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    merged.computeVertexNormals()
    return merged
  }, [])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
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
function MoatBridge() {
  const geometry = useMemo(
    () => buildMoatBridge({ x: LANE.moatX, z: -4, span: LANE.moatWidth + 1.5, seed: 3 }),
    []
  )
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

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
export function LandTerrain() {
  return (
    <group>
      <Ground />
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
      <MoatBridge />
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
