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
import * as kit from './geometry/buildingKit.js'
import { buildCypresses } from './geometry/landmarks.js'

import { SEA_LANE, SEA_HEIGHTS, SEA_TOWERS } from './lane.js'
import { buildCityQuarter } from './geometry/landmarks.js'

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

/**
 * A hint of foreshore at the foot of the sea wall.
 *
 * The reconstructions show the Horn wall standing more or less in the water,
 * but not quite: there is a narrow strip of rock and rubbish at its foot, a
 * landing stage or two, and the odd boat pulled up. It is what stops the wall
 * reading as a slab dropped into a pond.
 *
 * Deliberately narrow. The ships come in to `atWallX` and their gangways
 * reach the wall face, so anything projecting more than a metre or so from the
 * masonry would foul the one piece of staging the whole sequence depends on.
 */
function Foreshore() {
  const geometry = useMemo(() => {
    const rand = (n) => Math.abs((Math.sin(n * 91.7) * 43758.5453) % 1)
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

    const face = SEA_LANE.wallX - SEA_LANE.wallWidth / 2

    // A shelf of rubble along the base, barely proud of the water.
    const shelf = new THREE.BoxGeometry(1.1, 0.34, 300)
    shelf.translate(face - 0.5, 0.05, 0)
    parts.push(paint(shelf, '#8b8368', 0.96))

    // Boulders along it, at intervals rather than evenly.
    for (let i = 0; i < 90; i++) {
      const z = -140 + rand(i) * 280
      const r = 0.12 + rand(i + 7) * 0.26
      const rock = new THREE.BoxGeometry(r * 1.6, r * 1.3, r * 1.8)
      rock.rotateY(rand(i + 13) * Math.PI)
      rock.rotateX((rand(i + 17) - 0.5) * 0.5)
      rock.translate(face - 0.35 - rand(i + 19) * 0.55, 0.12 + r * 0.4, z)
      parts.push(paint(rock, '#7e7761', 0.82 + rand(i + 23) * 0.3))
    }

    // Two small landing stages on piles, of the kind every stretch of this
    // wall had a postern and a jetty for.
    for (const z of [-38, 46]) {
      const deck = new THREE.BoxGeometry(2.2, 0.12, 1.5)
      deck.translate(face - 1.2, 0.5, z)
      parts.push(paint(deck, PALETTE.hullTimber, 1.02))
      for (const dz of [-0.55, 0.55]) {
        for (const dx of [-0.8, 0.3]) {
          const pile = new THREE.CylinderGeometry(0.06, 0.07, 1.0, 5)
          pile.translate(face - 1.2 + dx, 0.05, z + dz)
          parts.push(paint(pile, PALETTE.hullTimberDark, 0.9))
        }
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

/* ------------------------------------------------------------------- city */

/** The city rising behind the sea wall, merged into one geometry. */
function CityBehind() {
  const geometry = useMemo(
    () =>
      buildCityQuarter({
        seed: 11,
        count: 230,
        fromX: SEA_LANE.insideX + 1,
        toX: SEA_LANE.insideX + 28,
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

/* ----------------------------------------------------------------- Galata */

/**
 * Galata, the bank the crusaders launch from.
 *
 * It used to sit as a hazy band far off in depth, where the lane camera could
 * barely see it. Putting it at the near end of the crossing instead gives the
 * assault somewhere to start from: the ships are drawn up on this beach, and
 * they row from here to the wall.
 */
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

    // Pera, set back from the water.
    //
    // This was twenty-six boxes with a flat slab on each, which read as a
    // shanty rather than as the Genoese and Amalfitan quarter it was. Built
    // from the kit now — pitched roofs, eaves, the odd domed church — and
    // there are more of them, gathered into a settlement rather than
    // scattered across the whole bank.
    const town = []
    for (let i = 0; i < 64; i++) {
      const x = edge - 8 - rand(i) * 17
      const z = -100 + rand(i + 11) * 200
      const roll = rand(i + 29)
      const w = 1.0 + rand(i + 3) * 1.5
      const tone = 0.88 + rand(i + 19) * 0.26

      const g =
        roll > 0.88
          ? kit.church({
              r: 0.7 + rand(i + 5) * 0.4,
              h: 1.5 + rand(i + 9) * 0.8,
              wallHex: '#cdc2a6',
              roofHex: '#9d6a4c',
              domeHex: PALETTE.domeLead,
              tone,
            })
          : kit.house({
              w,
              d: w * (0.7 + rand(i + 13) * 0.5),
              h: 0.9 + rand(i + 7) * 1.5,
              wallHex: rand(i + 23) > 0.5 ? '#c3b79c' : '#d2c6aa',
              roofHex: '#9d6a4c',
              tone,
              roofPitch: 0.3 + rand(i + 31) * 0.2,
            })
      g.rotateY(rand(i + 37) * Math.PI)
      g.translate(x, 0.8, z)
      town.push(g)
    }

    // Cypresses through it, as on the city side.
    const trees = []
    for (let i = 0; i < 40; i++) {
      trees.push({
        x: edge - 7 - rand(i + 101) * 18,
        z: -100 + rand(i + 113) * 200,
        y: 0.8,
        h: 1.6 + rand(i + 127) * 1.2,
        tone: 0.85 + rand(i + 131) * 0.3,
      })
    }
    town.push(buildCypresses(trees))
    parts.push(...town)

    // The crusader camp, pitched along the shore between the town and the
    // beach the fleet is drawn up on.
    for (let i = 0; i < 22; i++) {
      const x = edge - 3.4 - rand(i + 41) * 4.2
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
      <FleetAtAnchor />
      <Foreshore />
      <SeaWall />
      <CityBehind />
      <SeaGarrison />
    </group>
  )
}
