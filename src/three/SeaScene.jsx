/**
 * The sea wall lane, viewed along the face of the wall.
 *
 * By April 1204 the fleet is already operating inside the Golden Horn — the
 * chain across its mouth was broken the year before — so this is the
 * Horn-facing wall, not the Marmara coast: calmer water, and Galata with its
 * chain tower on the far shore.
 *
 * The sea wall is a single, lower line rather than the land walls' double
 * system, because the water was itself the outer barrier. Same banded
 * stone-and-brick masonry, same rule that the wall must run past both edges of
 * the frame so no cut end is ever in shot.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE } from './palette.js'
import { buildWallLine, buildGround } from './geometry/wallBuilder.js'
import { buildGarrison } from './geometry/garrisonBuilder.js'
import { RippleWater } from './geometry/Field.jsx'

export const SEA_LANE = {
  stagingX: -34,
  approachX: -17,
  atWallX: -7.4,
  wallX: 0,
  insideX: 7,
  /** Wall length along Z — far longer than the camera sees. */
  laneDepth: 150,
}

export const SEA_HEIGHTS = {
  wall: 5.8,
  tower: 8.0,
  water: 0,
}

const SEA_TOWERS = 24

/* ------------------------------------------------------------------ water */

function Horn() {
  return (
    <RippleWater
      x={SEA_LANE.wallX - 90}
      width={180}
      depth={340}
      y={0.02}
      colour={PALETTE.hornWater}
      swell={0.85}
      segmentsX={150}
      segmentsZ={300}
    />
  )
}

/* -------------------------------------------------------------------- wall */

function SeaWall() {
  const geometry = useMemo(() => {
    const towers = []
    const spacing = SEA_LANE.laneDepth / SEA_TOWERS
    for (let i = 0; i < SEA_TOWERS; i++) {
      towers.push({
        radius: 1.25,
        height: SEA_HEIGHTS.tower,
        // Proud of the face, which is what breaks the line into bays.
        x: SEA_LANE.wallX - 0.85,
        z: -SEA_LANE.laneDepth / 2 + spacing * (i + 0.5),
        polygonal: i % 2 === 1,
      })
    }
    return buildWallLine({
      wall: {
        width: 1.9,
        depth: SEA_LANE.laneDepth,
        height: SEA_HEIGHTS.wall,
        x: SEA_LANE.wallX,
        merlonWidth: 0.58,
        merlonGap: 0.48,
        merlonHeight: 0.55,
      },
      towers,
      // Fallen masonry and a rubble apron where the wall meets the water.
      rubble: {
        from: -SEA_LANE.laneDepth / 2,
        to: SEA_LANE.laneDepth / 2,
        x: SEA_LANE.wallX - 1.5,
        count: 190,
      },
      seed: 17,
    })
  }, [])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** The shore the wall stands on, and the ground behind it. */
function Shore() {
  const ground = useMemo(
    () =>
      buildGround({
        width: 120,
        depth: 340,
        hex: PALETTE.fieldDirt,
        x: SEA_LANE.wallX + 59,
        y: 0,
      }),
    []
  )
  return (
    <mesh geometry={ground} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  )
}

/* ------------------------------------------------------------------- city */

/** The city rising behind the sea wall, merged into one geometry. */
function CityBehind() {
  const geometry = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 78.233) * 43758.5453) % 1)
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
      const a = rand(i)
      const b = rand(i + 37)
      const x = SEA_LANE.insideX + 1 + a * 26
      const z = -95 + b * 190
      const w = 1.5 + a * 2.4
      const h = 1.6 + b * 3.0
      const tone = 0.88 + rand(i + 71) * 0.24

      const body = new THREE.BoxGeometry(w, h, w)
      body.translate(x, h / 2, z)
      parts.push(paint(body, PALETTE.cityWall, tone))

      if (i % 3 !== 2) {
        const r = 0.65 + a * 0.7
        const drum = new THREE.CylinderGeometry(r, r, 0.52, 12)
        drum.translate(x, h + 0.26, z)
        parts.push(paint(drum, PALETTE.cityWall, tone))
        const dome = new THREE.SphereGeometry(r * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
        dome.scale(1, 0.5, 1)
        dome.translate(x, h + 0.52, z)
        parts.push(paint(dome, rand(i + 5) > 0.85 ? PALETTE.domeGold : PALETTE.domeLead, tone))
      } else {
        const roof = new THREE.BoxGeometry(w * 1.05, 0.56, w * 1.05)
        roof.translate(x, h + 0.28, z)
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

/* ----------------------------------------------------------------- Galata */

/**
 * Galata on the far shore, with the tower that anchored the chain across the
 * mouth of the Horn. The chain itself is not shown — the crusaders broke it in
 * July 1203, which is exactly why the fleet is inside the Horn in this scene.
 *
 * This is also where the crusader camp stands, so it ties the assault to the
 * establishing shot on the title screen.
 */
function GalataShore() {
  const geometry = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 45.164) * 43758.5453) % 1)
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

    const shoreZ = -86

    // The far bank itself.
    const bank = new THREE.BoxGeometry(240, 2.6, 46)
    bank.translate(-40, 1.3, shoreZ - 20)
    parts.push(paint(bank, '#6f7350'))

    // Houses of Pera.
    for (let i = 0; i < 70; i++) {
      const x = -80 + rand(i) * 150
      const z = shoreZ - 4 - rand(i + 11) * 30
      const w = 0.9 + rand(i + 3) * 1.5
      const h = 0.9 + rand(i + 7) * 2.0
      const body = new THREE.BoxGeometry(w, h, w)
      body.translate(x, 2.6 + h / 2, z)
      parts.push(paint(body, '#c3b79c', 0.9 + rand(i + 19) * 0.2))
      const roof = new THREE.BoxGeometry(w * 1.15, 0.2, w * 1.15)
      roof.translate(x, 2.6 + h + 0.1, z)
      parts.push(paint(roof, '#9d6a4c'))
    }

    // Crusader camp tents, pitched along the shore.
    for (let i = 0; i < 34; i++) {
      const x = -34 + rand(i + 41) * 78
      const z = shoreZ - 1 - rand(i + 53) * 12
      const r = 0.5 + rand(i + 61) * 0.4
      const h = 0.8 + rand(i + 67) * 0.5
      const tent = new THREE.ConeGeometry(r, h, 7)
      tent.translate(x, 2.6 + h / 2, z)
      parts.push(paint(tent, '#e0d6bf', 0.9 + rand(i + 71) * 0.18))
    }

    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    merged.computeVertexNormals()
    return merged
  }, [])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <ChainTower />
    </group>
  )
}

/** Galata's great tower, where the chain was made fast. */
function ChainTower({ position = [10, -92] }) {
  const [px, pz] = position
  const base = 2.6
  return (
    <group position={[px, base, pz]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 3.0, 2.2, 12]} />
        <meshLambertMaterial color="#b6ab90" flatShading />
      </mesh>
      <mesh position={[0, 5.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 7.0, 12]} />
        <meshLambertMaterial color="#c8bda1" flatShading />
      </mesh>
      {[3.4, 7.0].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[2.34, 2.34, 0.26, 12]} />
          <meshLambertMaterial color="#ab9f83" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 9.5, 0]} castShadow>
        <cylinderGeometry args={[2.75, 2.25, 1.0, 12]} />
        <meshLambertMaterial color="#c0b498" flatShading />
      </mesh>
      <mesh position={[0, 11.4, 0]} castShadow>
        <coneGeometry args={[2.2, 2.2, 12]} />
        <meshLambertMaterial color="#8d6a4a" flatShading />
      </mesh>
    </group>
  )
}

/** The rest of the fleet, at anchor further down the Horn. */
function FleetAtAnchor() {
  const ships = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 33.77) * 43758.5453) % 1)
    const out = []
    for (let i = 0; i < 18; i++) {
      out.push({
        x: -60 + rand(i) * 44,
        z: -84 + rand(i + 13) * 58,
        r: rand(i + 29) * 0.7 - 0.35,
        s: 0.7 + rand(i + 31) * 0.5,
      })
    }
    return out
  }, [])

  return (
    <group>
      {ships.map((s, i) => (
        <group key={i} position={[s.x, 0.5, s.z]} rotation={[0, s.r, 0]} scale={s.s}>
          <mesh castShadow>
            <capsuleGeometry args={[0.5, 2.4, 4, 8]} />
            <meshLambertMaterial color={PALETTE.hullTimber} flatShading />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 3.6, 5]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Defenders on the sea wall, merged into one geometry. */
function SeaGarrison() {
  const geometry = useMemo(
    () =>
      buildGarrison({
        x: SEA_LANE.wallX,
        y: SEA_HEIGHTS.wall,
        zFrom: -70,
        zTo: 70,
        count: 40,
        banners: 4,
        seed: 4,
      }),
    []
  )
  return (
    <mesh geometry={geometry} castShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** Static scenery for the sea lane. Contains no game state. */
export function SeaTerrain() {
  return (
    <group>
      <Horn />
      <Shore />
      <GalataShore />
      <FleetAtAnchor />
      <SeaWall />
      <CityBehind />
      <SeaGarrison />
    </group>
  )
}
