/**
 * The sea wall lane, viewed side-on across the Golden Horn.
 *
 * By April 1204 the fleet is already operating inside the Horn — the chain
 * across its mouth was broken the year before — so this is the Horn-facing
 * wall, not the Marmara coast: calmer water, and Galata on the far shore.
 *
 * The sea wall is a single, lower line rather than the land walls' double
 * system, because the water was itself the outer barrier. Same banded
 * stone-and-brick masonry.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from './palette.js'
import { buildBandedWall, buildTower, buildGround } from './geometry/wallBuilder.js'
import { RampartGarrison } from './geometry/Defender.jsx'

export const SEA_LANE = {
  stagingX: -26,
  approachX: -13,
  atWallX: -5.6,
  wallX: 0,
  insideX: 6.5,
  laneDepth: 15,
}

export const SEA_HEIGHTS = {
  wall: 5.6,
  tower: 7.6,
  water: 0,
}

function SeaWall() {
  const wall = useMemo(
    () =>
      buildBandedWall({
        width: 1.9,
        depth: SEA_LANE.laneDepth,
        height: SEA_HEIGHTS.wall,
        merlonWidth: 0.58,
        merlonGap: 0.48,
        merlonHeight: 0.55,
      }),
    []
  )

  const towers = useMemo(() => {
    const out = []
    const spacing = SEA_LANE.laneDepth / 3
    for (let i = 0; i < 3; i++) {
      const z = -SEA_LANE.laneDepth / 2 + spacing * (i + 0.5)
      out.push({
        z,
        geometry: buildTower({
          radius: 1.35,
          height: SEA_HEIGHTS.tower,
          polygonal: i % 2 === 1,
        }),
      })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={wall} position={[SEA_LANE.wallX, 0, 0]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {towers.map((t, i) => (
        <mesh
          key={i}
          geometry={t.geometry}
          position={[SEA_LANE.wallX, 0, t.z]}
          castShadow
          receiveShadow
        >
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}

      {/* A rubble apron where the wall meets the water. */}
      <mesh position={[SEA_LANE.wallX - 1.4, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.5, SEA_LANE.laneDepth]} />
        <meshLambertMaterial color="#9c968a" flatShading />
      </mesh>
    </group>
  )
}

function Water() {
  const surface = useMemo(
    () =>
      buildGround({
        width: 80,
        depth: 120,
        hex: PALETTE.hornWater,
        x: SEA_LANE.wallX - 41,
        y: 0,
      }),
    []
  )
  return (
    <mesh geometry={surface} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}

function CityShore() {
  const ground = useMemo(
    () =>
      buildGround({
        width: 60,
        depth: 120,
        hex: PALETTE.fieldDirt,
        x: SEA_LANE.wallX + 31,
        y: 0,
      }),
    []
  )

  const buildings = useMemo(() => {
    const out = []
    const rand = (n) => Math.abs((Math.sin(n * 91.7) * 43758.5453) % 1)
    for (let i = 0; i < 12; i++) {
      const a = rand(i)
      const b = rand(i + 31)
      out.push({
        x: SEA_LANE.insideX + 1 + a * 16,
        z: -16 + b * 30,
        w: 1.5 + a * 2.2,
        h: 1.5 + b * 2.4,
        domed: i % 3 !== 2,
        domeR: 0.65 + a * 0.6,
      })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshLambertMaterial color={PALETTE.cityWall} flatShading />
          </mesh>
          {b.domed ? (
            <>
              <mesh position={[0, b.h + 0.26, 0]}>
                <cylinderGeometry args={[b.domeR, b.domeR, 0.52, 12]} />
                <meshLambertMaterial color={PALETTE.cityWall} flatShading />
              </mesh>
              <mesh position={[0, b.h + 0.52, 0]} scale={[1, 0.5, 1]}>
                <sphereGeometry args={[b.domeR * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshLambertMaterial color={PALETTE.domeLead} flatShading />
              </mesh>
            </>
          ) : (
            <mesh position={[0, b.h + 0.28, 0]}>
              <boxGeometry args={[b.w * 1.05, 0.56, b.w * 1.05]} />
              <meshLambertMaterial color={PALETTE.cityRoof} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/** Galata on the far shore, low and hazy across the Horn. */
function GalataShore() {
  const shore = useMemo(
    () =>
      buildGround({
        width: 70,
        depth: 26,
        hex: '#6f7355',
        x: SEA_LANE.wallX - 24,
        y: 0.05,
        z: -46,
      }),
    []
  )

  const town = useMemo(() => {
    const out = []
    const rand = (n) => Math.abs((Math.sin(n * 55.3) * 43758.5453) % 1)
    for (let i = 0; i < 10; i++) {
      const a = rand(i)
      out.push({ x: -46 + a * 44, w: 1.4 + a * 1.8, h: 1.2 + rand(i + 11) * 2.0 })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={shore} receiveShadow>
        <meshLambertMaterial vertexColors />
      </mesh>
      {town.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, -44 + (i % 3) * 2]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshLambertMaterial color="#b3aa93" flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** Static scenery for the sea lane. Contains no game state. */
export function SeaTerrain() {
  return (
    <group>
      <Water />
      <GalataShore />
      <CityShore />
      <SeaWall />

      <RampartGarrison
        x={SEA_LANE.wallX}
        y={SEA_HEIGHTS.wall}
        zFrom={-6}
        zTo={6}
        count={6}
        seed={4}
        banners={2}
      />
    </group>
  )
}
