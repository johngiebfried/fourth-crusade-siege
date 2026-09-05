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
import { FACTIONS, factionFlagTexture } from './factions.js'

import { SEA_LANE, SEA_HEIGHTS, SEA_TOWERS } from './lane.js'

export { SEA_LANE, SEA_HEIGHTS }

/* ------------------------------------------------------------------ water */

function Horn() {
  // Only as wide as the channel actually is: from the far bank to the wall.
  const from = SEA_LANE.shoreX
  const to = SEA_LANE.wallX + 1
  return (
    <RippleWater
      x={(from + to) / 2}
      width={to - from}
      depth={340}
      y={0.02}
      colour={PALETTE.hornWater}
      swell={1.05}
      chop={1.15}
      segmentsX={120}
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
        width: SEA_LANE.wallWidth,
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
 * Galata, the bank the crusaders launch from.
 *
 * It used to sit as a hazy band far off in depth, where the lane camera could
 * barely see it. Putting it at the near end of the crossing instead gives the
 * assault somewhere to start from: the ships are drawn up on this beach, and
 * they row from here to the wall.
 */
/**
 * The contingents' standards, planted on the Galata shore.
 *
 * The fleet is Venetian and flies Venice's colours from every mast-head; the
 * other four followings left their banners on the beach they embarked from.
 * It is a small thing that says who is aboard without dressing the ships in
 * four sets of livery.
 */
function ShoreBanners() {
  const banners = useMemo(
    () =>
      Object.keys(FACTIONS)
        .filter((name) => name !== 'Venetian')
        .map((name, i, all) => ({
          name,
          texture: factionFlagTexture(name),
          z: -10.5 + (21 * i) / Math.max(1, all.length - 1),
        })),
    []
  )

  return (
    <group>
      {banners.map((b) => (
        <group key={b.name} position={[SEA_LANE.shoreX - 2.6, 0.7, b.z]}>
          <mesh position={[0, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 3.8, 6]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
          <group position={[0, 3.15, 0]} rotation={[0, -0.5, 0]}>
            <mesh position={[0.62, 0, 0]}>
              <planeGeometry args={[1.24, 0.9]} />
              <meshBasicMaterial
                map={b.texture}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function GalataBank() {
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

    const edge = SEA_LANE.shoreX

    // The bank itself, running off both ends of the frame.
    const bank = new THREE.BoxGeometry(60, 0.8, 340)
    bank.translate(edge - 30, 0.4, 0)
    parts.push(paint(bank, '#6f7350'))

    // A shingle beach where the ships are drawn up.
    const beach = new THREE.BoxGeometry(3.6, 0.7, 340)
    beach.translate(edge - 1.4, 0.35, 0)
    parts.push(paint(beach, '#8e8a6c'))

    // Houses of Pera, set back from the water.
    for (let i = 0; i < 26; i++) {
      const x = edge - 11 - rand(i) * 13
      const z = -105 + rand(i + 11) * 210
      const w = 0.7 + rand(i + 3) * 1.1
      const h = 0.7 + rand(i + 7) * 1.3
      const body = new THREE.BoxGeometry(w, h, w)
      body.translate(x, 0.8 + h / 2, z)
      parts.push(paint(body, '#c3b79c', 0.9 + rand(i + 19) * 0.2))
      const roof = new THREE.BoxGeometry(w * 1.15, 0.22, w * 1.15)
      roof.translate(x, 0.8 + h + 0.09, z)
      parts.push(paint(roof, '#9d6a4c'))
    }

    // The crusader camp, pitched along the shore.
    for (let i = 0; i < 16; i++) {
      const x = edge - 4 - rand(i + 41) * 6
      const z = -95 + rand(i + 53) * 190
      const r = 0.4 + rand(i + 61) * 0.3
      const h = 0.62 + rand(i + 67) * 0.4
      const tent = new THREE.ConeGeometry(r, h, 7)
      tent.translate(x, 0.8 + h / 2, z)
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
function ChainTower({ position = [SEA_LANE.shoreX - 16, -40] }) {
  const [px, pz] = position
  const base = 0.8
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
        x: SEA_LANE.shoreX - 2 - rand(i) * 3,
        z: -100 + rand(i + 13) * 60,
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
      <GalataBank />
      <ShoreBanners />
      <FleetAtAnchor />
      <SeaWall />
      <CityBehind />
      <SeaGarrison />
    </group>
  )
}
