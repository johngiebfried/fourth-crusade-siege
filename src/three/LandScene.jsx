/**
 * The land wall lane, viewed side-on.
 *
 * Reading left to right: the crusader staging camp, open field, the moat, the
 * low outer wall, the terrace, then the great inner wall with its towers, and
 * finally the gate into the city. That triple line — moat, outer wall,
 * terrace, inner wall — is the structure of the Theodosian defences, and the
 * height difference between the outer and inner walls is the part worth
 * getting right even when the detail is coarse.
 */

import { useMemo } from 'react'
import { PALETTE } from './palette.js'
import { buildBandedWall, buildTower, buildGround } from './geometry/wallBuilder.js'
import { RampartGarrison } from './geometry/Defender.jsx'

/** Lane landmarks, in world X. Everything else positions off these. */
export const LANE = {
  campX: -13.5,
  moatX: -9.4,
  outerWallX: -6.2,
  terraceX: -3.4,
  innerWallX: 0,
  gateX: 5.4,
  cityX: 10,
  laneDepth: 13,
}

export const HEIGHTS = {
  outerWall: 3.4,
  innerWall: 7.2,
  tower: 9.6,
  gate: 6.0,
}

function Walls() {
  const outer = useMemo(
    () =>
      buildBandedWall({
        width: 1.3,
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
        width: 2.1,
        depth: LANE.laneDepth,
        height: HEIGHTS.innerWall,
        merlonWidth: 0.6,
        merlonGap: 0.5,
        merlonHeight: 0.6,
      }),
    []
  )

  // Towers alternate square and polygonal along the inner circuit, as in reality.
  const towers = useMemo(() => {
    const out = []
    const spacing = LANE.laneDepth / 3
    for (let i = 0; i < 3; i++) {
      const z = -LANE.laneDepth / 2 + spacing * (i + 0.5)
      out.push({
        z,
        polygonal: i % 2 === 1,
        geometry: buildTower({
          radius: 1.45,
          height: HEIGHTS.tower,
          polygonal: i % 2 === 1,
        }),
      })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={outer} position={[LANE.outerWallX, 0, 0]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      <mesh geometry={inner} position={[LANE.innerWallX, 0, 0]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      {towers.map((t, i) => (
        <mesh
          key={i}
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
      {/* Arched opening, cut visually with a dark recess rather than CSG. */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2.6, 3.0, 2.6]} />
        <meshBasicMaterial color="#241a15" />
      </mesh>
      <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 2.6, 16, 1, false, 0, Math.PI]} />
        <meshBasicMaterial color="#241a15" />
      </mesh>
    </group>
  )
}

function Ground() {
  // Explicit spans, so no slab is drawn over the one next to it.
  const span = (from, to, hex, y = 0) =>
    buildGround({ width: to - from, depth: 110, hex, x: (from + to) / 2, y })

  const moatFrom = LANE.moatX - 1.5
  const moatTo = LANE.moatX + 1.5

  const field = useMemo(() => span(-34, moatFrom, PALETTE.fieldGrass), [])
  const moat = useMemo(() => span(moatFrom, moatTo, PALETTE.moatWater, -0.5), [])
  const terrace = useMemo(
    () => span(moatTo, LANE.innerWallX - 1.05, PALETTE.fieldDirt),
    []
  )
  const inside = useMemo(() => span(LANE.innerWallX + 1.05, 34, PALETTE.fieldDirt), [])

  return (
    <group>
      <mesh geometry={field} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh geometry={moat} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh geometry={terrace} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      <mesh geometry={inside} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
    </group>
  )
}

/** Domed skyline behind the walls — the city the assault is trying to reach. */
function CityBackdrop() {
  const buildings = useMemo(() => {
    const out = []
    const rand = (n) => (Math.sin(n * 127.1) * 43758.5453) % 1
    for (let i = 0; i < 14; i++) {
      const r = Math.abs(rand(i))
      const r2 = Math.abs(rand(i + 40))
      out.push({
        x: LANE.cityX + r * 14,
        z: -14 + r2 * 26,
        w: 1.6 + r * 2.4,
        h: 1.6 + r2 * 2.6,
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
          <mesh position={[0, b.h / 2, 0]}>
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

const rungHeights = (h) => {
  const out = []
  for (let i = 1; i * 0.42 < h; i++) out.push(i * 0.42)
  return out
}

function Ladder({ x, z, height, lean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, 0, lean]}>
      {[-0.22, 0.22].map((off, i) => (
        <mesh key={i} position={[off, height / 2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, height, 6]} />
          <meshLambertMaterial color={PALETTE.hullTimber} />
        </mesh>
      ))}
      {rungHeights(height).map((ry, i) => (
        <mesh key={`r${i}`} position={[0, ry, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 5]} />
          <meshLambertMaterial color={PALETTE.hullTimberDark} />
        </mesh>
      ))}
    </group>
  )
}

/** Siege ladders leaning on each wall, so the climb has something to climb. */
function Ladders() {
  return (
    <group>
      <Ladder x={LANE.outerWallX - 1.0} z={-3.2} height={HEIGHTS.outerWall + 0.9} lean={0.2} />
      <Ladder x={LANE.outerWallX - 1.0} z={3.0} height={HEIGHTS.outerWall + 0.9} lean={0.2} />
      <Ladder x={LANE.innerWallX - 1.5} z={-2.0} height={HEIGHTS.innerWall + 1.1} lean={0.17} />
      <Ladder x={LANE.innerWallX - 1.5} z={4.0} height={HEIGHTS.innerWall + 1.1} lean={0.17} />
    </group>
  )
}

/** Static scenery for the land lane. Contains no game state. */
export function LandTerrain() {
  return (
    <group>
      <Ground />
      <Walls />
      <Gate />
      <Ladders />
      <CityBackdrop />

      {/* Defenders hold both wall lines and the gate. */}
      <RampartGarrison
        x={LANE.outerWallX}
        y={HEIGHTS.outerWall}
        zFrom={-5}
        zTo={5}
        count={4}
        seed={2}
        banners={0}
      />
      <RampartGarrison
        x={LANE.innerWallX}
        y={HEIGHTS.innerWall}
        zFrom={-5.5}
        zTo={5.5}
        count={6}
        seed={5}
        banners={2}
      />
      <RampartGarrison
        x={LANE.gateX}
        y={HEIGHTS.gate}
        zFrom={-4}
        zTo={4}
        count={3}
        seed={9}
        banners={1}
      />
    </group>
  )
}
