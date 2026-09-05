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
import { PALETTE } from './palette.js'
import { buildBandedWall, buildTower, buildGround } from './geometry/wallBuilder.js'
import { RampartGarrison } from './geometry/Defender.jsx'
import { GrassField, MoatWater } from './geometry/Field.jsx'

/** Lane landmarks, in world X. Everything else positions off these. */
export const LANE = {
  campX: -20,
  moatX: -13,
  moatWidth: 3.4,
  outerWallX: -8,
  terraceX: -4,
  innerWallX: 0,
  gateX: 9,
  cityX: 14,
  /** Wall length along Z. Deliberately far longer than the camera sees,
   *  so no end of the chain is ever in frame. */
  laneDepth: 150,
}

export const HEIGHTS = {
  outerWall: 3.4,
  innerWall: 7.4,
  outerTower: 5.0,
  tower: 9.8,
  gate: 6.2,
}

/** Towers march along the wall; the outer line's are smaller and interleaved. */
const INNER_TOWERS = 26
const OUTER_TOWERS = 26

function Walls() {
  const outer = useMemo(
    () =>
      buildBandedWall({
        width: 1.4,
        depth: LANE.laneDepth,
        height: HEIGHTS.outerWall,
        merlonWidth: 0.5,
        merlonGap: 0.42,
        merlonHeight: 0.45,
      }),
    []
  )

  const inner = useMemo(
    () =>
      buildBandedWall({
        width: 2.2,
        depth: LANE.laneDepth,
        height: HEIGHTS.innerWall,
        merlonWidth: 0.62,
        merlonGap: 0.5,
        merlonHeight: 0.6,
      }),
    []
  )

  const innerTowers = useMemo(() => {
    const out = []
    const spacing = LANE.laneDepth / INNER_TOWERS
    for (let i = 0; i < INNER_TOWERS; i++) {
      const z = -LANE.laneDepth / 2 + spacing * (i + 0.5)
      out.push({
        z,
        geometry: buildTower({ radius: 1.5, height: HEIGHTS.tower, polygonal: i % 2 === 1 }),
      })
    }
    return out
  }, [])

  // Offset half a bay from the inner towers, as on the real circuit.
  const outerTowers = useMemo(() => {
    const out = []
    const spacing = LANE.laneDepth / OUTER_TOWERS
    for (let i = 0; i < OUTER_TOWERS; i++) {
      const z = -LANE.laneDepth / 2 + spacing * i
      out.push({
        z,
        geometry: buildTower({ radius: 0.95, height: HEIGHTS.outerTower, polygonal: i % 2 === 0 }),
      })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={outer} position={[LANE.outerWallX, 0, 0]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {outerTowers.map((t, i) => (
        <mesh
          key={`o${i}`}
          geometry={t.geometry}
          position={[LANE.outerWallX, 0, t.z]}
          castShadow
          receiveShadow
        >
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}

      <mesh geometry={inner} position={[LANE.innerWallX, 0, 0]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {innerTowers.map((t, i) => (
        <mesh
          key={`i${i}`}
          geometry={t.geometry}
          position={[LANE.innerWallX, 0, t.z]}
          castShadow
          receiveShadow
        >
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Gate() {
  const gate = useMemo(
    () =>
      buildBandedWall({
        width: 2.4,
        depth: LANE.laneDepth,
        height: HEIGHTS.gate,
        merlonWidth: 0.55,
        merlonGap: 0.45,
        merlonHeight: 0.5,
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

/** Domed skyline behind the walls — the city the assault is trying to reach. */
function CityBackdrop() {
  const buildings = useMemo(() => {
    const out = []
    const rand = (n) => Math.abs((Math.sin(n * 127.1) * 43758.5453) % 1)
    for (let i = 0; i < 150; i++) {
      const r = rand(i)
      const r2 = rand(i + 40)
      out.push({
        x: LANE.cityX + 1 + r * 24,
        z: -95 + r2 * 190,
        w: 1.6 + r * 2.4,
        h: 1.6 + r2 * 2.8,
        domed: i % 3 !== 2,
        domeR: 0.7 + r * 0.7,
      })
    }
    return out
  }, [])

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshLambertMaterial color={PALETTE.cityWall} flatShading />
          </mesh>
          {b.domed ? (
            <>
              {/* Drum ringed with windows, then a shallow dome — the Byzantine
                  church silhouette. Emphatically not a spire. */}
              <mesh position={[0, b.h + 0.28, 0]}>
                <cylinderGeometry args={[b.domeR, b.domeR, 0.56, 12]} />
                <meshLambertMaterial color={PALETTE.cityWall} flatShading />
              </mesh>
              <mesh position={[0, b.h + 0.56, 0]} scale={[1, 0.52, 1]}>
                <sphereGeometry args={[b.domeR * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshLambertMaterial color={PALETTE.domeLead} flatShading />
              </mesh>
            </>
          ) : (
            <mesh position={[0, b.h + 0.3, 0]}>
              <boxGeometry args={[b.w * 1.05, 0.6, b.w * 1.05]} />
              <meshLambertMaterial color={PALETTE.cityRoof} flatShading />
            </mesh>
          )}
        </group>
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

      <Walls />
      <Gate />
      <CityBackdrop />

      {/* Defenders hold both wall lines and the gate. */}
      <RampartGarrison
        x={LANE.outerWallX}
        y={HEIGHTS.outerWall}
        zFrom={-70}
        zTo={70}
        count={34}
        seed={2}
        banners={0}
      />
      <RampartGarrison
        x={LANE.innerWallX}
        y={HEIGHTS.innerWall}
        zFrom={-72}
        zTo={72}
        count={44}
        seed={5}
        banners={3}
      />
      <RampartGarrison
        x={LANE.gateX}
        y={HEIGHTS.gate}
        zFrom={-60}
        zTo={60}
        count={22}
        seed={9}
        banners={2}
      />
    </group>
  )
}
