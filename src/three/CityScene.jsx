/**
 * The establishing shot: Constantinople on its peninsula, April 1204.
 *
 * Scale is deliberately stylised — the whole city is about 65 units across, so
 * a true 12-metre wall would be a tenth of a unit and vanish. Walls and
 * landmarks are sized to read at a glance, the way a medieval map exaggerates
 * what matters. The geography underneath is not stylised: see cityBuilder.js
 * for the coastlines, and note especially that the land walls face open ground
 * — Thrace — and not water.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from './palette.js'
import { buildBandedWall, buildTower } from './geometry/wallBuilder.js'
import {
  ASIA,
  EUROPE,
  GALATA,
  LAND_WALL_FROM,
  LAND_WALL_TO,
  LAND_WALL_X,
  PENINSULA,
  RIDGE,
  SHORE_Y,
  buildGalataTown,
  buildLandmass,
  buildTownscape,
  LANDMARK_KEEP_OFF,
  groundHeight,
  insidePeninsula,
  rng,
} from './geometry/cityBuilder.js'
import {
  buildHagiaSophia,
  buildHippodrome,
  buildGreatPalace,
  buildCypresses,
} from './geometry/landmarks.js'

/* ------------------------------------------------------------------ water */

function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, -20]} receiveShadow>
      <planeGeometry args={[420, 380]} />
      <meshLambertMaterial color={PALETTE.hornWater} />
    </mesh>
  )
}

/* -------------------------------------------------------------------- land */

function Landmasses() {
  const europe = useMemo(() => buildLandmass(EUROPE, { hex: '#83854f' }), [])
  const asia = useMemo(() => buildLandmass(ASIA, { hex: '#767a4c' }), [])

  // Chalcedon and Chrysopolis, so the Asian shore reads as settled rather
  // than as a bare slab of ground.
  const asianTowns = useMemo(() => {
    const rand = rng(63)
    const out = []
    for (let i = 0; i < 44; i++) {
      const x = 54 + rand() * 12
      const z = -34 + rand() * 60
      out.push({ x, z, w: 0.5 + rand() * 0.7, h: 0.5 + rand() * 0.9, domed: i % 5 === 0 })
    }
    return out
  }, [])

  return (
    <group>
      <mesh geometry={europe} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={asia} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {asianTowns.map((b, i) => (
        <group key={i} position={[b.x, SHORE_Y, b.z]}>
          <mesh position={[0, b.h / 2, 0]} castShadow>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshLambertMaterial color="#c6ba9e" flatShading />
          </mesh>
          <mesh position={[0, b.h + 0.08, 0]}>
            <boxGeometry args={[b.w * 1.1, 0.14, b.w * 1.1]} />
            <meshLambertMaterial color={b.domed ? PALETTE.domeLead : '#9d6a4c'} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * The ridge the city stands on — its hills. This matches `groundHeight`
 * exactly, so the townscape sits on the terrain instead of floating above it.
 */
function CityRidge() {
  return (
    <mesh
      position={[RIDGE.cx, SHORE_Y, RIDGE.cz]}
      scale={[RIDGE.rx, RIDGE.height, RIDGE.rz]}
      receiveShadow
      castShadow
    >
      <sphereGeometry args={[1, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshLambertMaterial color="#8b8d55" flatShading />
    </mesh>
  )
}

/* ------------------------------------------------------------------ walls */

/**
 * The Theodosian land walls, closing the western base of the peninsula. Thrace
 * lies open beyond them — which is the whole reason they exist.
 */
function LandWalls() {
  const length = LAND_WALL_TO - LAND_WALL_FROM
  const wall = useMemo(
    () =>
      buildBandedWall({
        width: 1.2,
        depth: length,
        height: 2.4,
        merlonWidth: 0.32,
        merlonGap: 0.26,
        merlonHeight: 0.3,
      }),
    [length]
  )

  const towers = useMemo(() => {
    const out = []
    const n = 12
    for (let i = 0; i < n; i++) {
      const z = LAND_WALL_FROM + (length * i) / (n - 1)
      out.push({ z, geometry: buildTower({ radius: 0.66, height: 3.2, polygonal: i % 2 === 1 }) })
    }
    return out
  }, [length])

  const midZ = (LAND_WALL_FROM + LAND_WALL_TO) / 2

  return (
    <group position={[LAND_WALL_X, SHORE_Y, midZ]}>
      <mesh geometry={wall} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {towers.map((t, i) => (
        <mesh key={i} geometry={t.geometry} position={[0, 0, t.z - midZ]} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Sea walls following the peninsula's coast — a single lower line, since the
 * water was itself the outer barrier. The western edge is skipped: that is the
 * land walls' ground.
 */
function SeaWalls() {
  const segments = useMemo(() => {
    const out = []
    for (let i = 0; i < PENINSULA.length - 1; i++) {
      const [x1, z1] = PENINSULA[i]
      const [x2, z2] = PENINSULA[i + 1]
      const dx = x2 - x1
      const dz = z2 - z1
      const len = Math.hypot(dx, dz)
      if (len < 1) continue
      out.push({
        x: (x1 + x2) / 2,
        z: (z1 + z2) / 2,
        rotation: Math.atan2(dx, dz),
        geometry: buildBandedWall({
          width: 0.7,
          depth: len,
          height: 1.2,
          merlonWidth: 0.26,
          merlonGap: 0.22,
          merlonHeight: 0.2,
        }),
      })
    }
    return out
  }, [])

  return (
    <group position={[0, SHORE_Y, 0]}>
      {segments.map((s, i) => (
        <mesh
          key={i}
          geometry={s.geometry}
          position={[s.x, 0, s.z]}
          rotation={[0, s.rotation, 0]}
          castShadow
        >
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------- landmarks */

/**
 * Hagia Sophia: a shallow dome on a drum ringed with windows, flanked by two
 * half-domes on the east–west axis. The one dominant landmark, and emphatically
 * domed rather than spired. No minarets — those arrive with the Ottoman
 * conquest in 1453, two and a half centuries after this scene.
 */
/**
 * Cypresses through the city. Placed on the peninsula only, and kept clear of
 * the four landmarks so none grows out of the Hagia Sophia's dome.
 */
function Cypresses({ count = 260, seed = 61 }) {
  const geometry = useMemo(() => {
    const rand = rng(seed)
    const keepOff = LANDMARK_KEEP_OFF
    const spots = []
    for (let i = 0; i < count * 8 && spots.length < count; i++) {
      const x = -31 + rand() * 68
      const z = -22 + rand() * 48
      if (!insidePeninsula(x, z, 1.6)) continue
      if (keepOff.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue
      spots.push({
        x,
        z,
        y: groundHeight(x, z),
        h: 1.1 + rand() * 0.9,
        tone: 0.86 + rand() * 0.3,
      })
    }
    return buildCypresses(spots)
  }, [count, seed])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

function HagiaSophia({ position = [23, -1] }) {
  const [px, pz] = position
  const y = groundHeight(px, pz)
  const geometry = useMemo(() => buildHagiaSophia(), [])
  return (
    <mesh geometry={geometry} position={[px, y, pz]} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** The Hippodrome: the track with its curved sphendone and the obelisks. */
function Hippodrome({ position = [8, 5] }) {
  const [px, pz] = position
  const y = groundHeight(px, pz)
  const geometry = useMemo(() => buildHippodrome(), [])
  return (
    <mesh
      geometry={geometry}
      position={[px, y, pz]}
      rotation={[0, 0.42, 0]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** The Great Palace, on the slope down to the Marmara. */
function GreatPalace({ position = [17, 4.5] }) {
  const [px, pz] = position
  const y = groundHeight(px, pz)
  const geometry = useMemo(() => buildGreatPalace(), [])
  return (
    <mesh geometry={geometry} position={[px, y, pz]} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  )
}

/** Imperial banner: purple and gold, cross motif. No double-headed eagle —
    that is a Palaiologan emblem, after 1261. */
function ImperialBanner({ height = 2.4 }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, height, 6]} />
        <meshLambertMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0.7, height - 0.5, 0]}>
        <planeGeometry args={[1.3, 0.9]} />
        <meshLambertMaterial color={PALETTE.byzantinePurple} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, height - 0.5, 0.02]}>
        <planeGeometry args={[0.22, 0.66]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, height - 0.4, 0.02]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** Blachernae, where the land walls come down to the Golden Horn. */
function Blachernae({ position = [-27, -16.5] }) {
  const [px, pz] = position
  const y = groundHeight(px, pz)
  return (
    <group position={[px, y, pz]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.4, 3.4]} />
        <meshLambertMaterial color="#e3d8bd" flatShading />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <boxGeometry args={[3.0, 0.7, 2.4]} />
        <meshLambertMaterial color={PALETTE.cityRoof} flatShading />
      </mesh>
      {[-1.6, 1.6].map((dx, i) => (
        <mesh key={i} position={[dx, 1.9, -1.4]} castShadow>
          <boxGeometry args={[1.0, 3.8, 1.0]} />
          <meshLambertMaterial color="#d9cdb1" flatShading />
        </mesh>
      ))}
      <group position={[0, 3.8, 0]}>
        <ImperialBanner />
      </group>
    </group>
  )
}

/* --------------------------------------------------------------- Galata */

/**
 * Galata, across the Horn, with its great tower.
 *
 * The tower is the point of the place: it anchored the chain that closed the
 * mouth of the Golden Horn. The chain itself is not shown — the crusaders
 * broke it in July 1203, which is exactly why the fleet is inside the Horn in
 * this scene rather than outside it.
 */
function ChainTower({ position = [27, -24.1] }) {
  const [px, pz] = position

  return (
    <group position={[px, SHORE_Y, pz]}>
      {/* Battered ashlar base */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.25, 2.7, 1.8, 12]} />
        <meshLambertMaterial color="#c4b89c" flatShading />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 5.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.25, 6.4, 12]} />
        <meshLambertMaterial color="#d3c8ac" flatShading />
      </mesh>
      {/* String courses, to give the shaft some scale */}
      {[3.0, 6.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[2.14, 2.14, 0.22, 12]} />
          <meshLambertMaterial color="#b6aa8d" flatShading />
        </mesh>
      ))}
      {/* Machicolated crown, corbelled out */}
      <mesh position={[0, 8.5, 0]} castShadow>
        <cylinderGeometry args={[2.5, 2.05, 0.9, 12]} />
        <meshLambertMaterial color="#c9bda0" flatShading />
      </mesh>
      {/* Merlons round the parapet */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 2.3, 9.35, Math.sin(a) * 2.3]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.42, 0.55, 0.42]} />
            <meshLambertMaterial color="#d3c8ac" flatShading />
          </mesh>
        )
      })}
      {/* Conical roof */}
      <mesh position={[0, 10.4, 0]} castShadow>
        <coneGeometry args={[2.0, 1.9, 12]} />
        <meshLambertMaterial color="#8d6a4a" flatShading />
      </mesh>

      {/* The ring the chain was made fast to, down at the water. The chain
          itself is gone: the crusaders broke it in July 1203, which is why the
          fleet in this scene is inside the Horn rather than shut out of it. */}
      <mesh position={[2.6, -1.2, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.13, 6, 14]} />
        <meshLambertMaterial color="#4b463c" flatShading />
      </mesh>
    </group>
  )
}

/** The crusader camp, pitched on the Galata shore. */
function CrusaderCamp() {
  const tents = useMemo(() => {
    const rand = rng(13)
    const out = []
    for (let i = 0; i < 26; i++) {
      out.push({
        x: -4 + rand() * 30,
        z: -32 + rand() * 7,
        r: 0.34 + rand() * 0.24,
        h: 0.5 + rand() * 0.32,
      })
    }
    return out
  }, [])

  return (
    <group>
      {tents.map((t, i) => (
        <group key={i} position={[t.x, SHORE_Y, t.z]}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <coneGeometry args={[t.r, t.h, 7]} />
            <meshLambertMaterial color="#e0d6bf" flatShading />
          </mesh>
          {i % 4 === 0 && (
            <mesh position={[0.08, t.h + 0.18, 0]}>
              <planeGeometry args={[0.24, 0.16]} />
              <meshBasicMaterial color={PALETTE.crusaderSurcoat} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function GalataShore() {
  const town = useMemo(() => buildGalataTown({ seed: 41, houses: 90 }), [])
  return (
    <group>
      <mesh geometry={town} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <ChainTower />
      <CrusaderCamp />
    </group>
  )
}

/** The Venetian fleet, drawn up inside the Golden Horn. */
function FleetInTheHorn() {
  const ships = useMemo(() => {
    const rand = rng(19)
    const out = []
    for (let i = 0; i < 16; i++) {
      // Between the two shores of the inlet, toward its mouth.
      const t = rand()
      const x = -6 + t * 34
      const northZ = -20 - (1 - t) * 8
      const southZ = -13 - (1 - t) * 6
      const z = northZ + rand() * (southZ - northZ) * 0.7 + 1.5
      out.push({ x, z, r: rand() * 0.5 - 0.25 })
    }
    return out
  }, [])

  return (
    <group>
      {ships.map((s, i) => (
        <group key={i} position={[s.x, 0.45, s.z]} rotation={[0, s.r, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.24, 1.0, 3, 8]} />
            <meshLambertMaterial color={PALETTE.hullTimber} flatShading />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 1.5, 5]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ scene */

export function CityPanorama() {
  const town = useMemo(() => buildTownscape({ seed: 7, houses: 1100, churches: 90 }), [])

  return (
    <group>
      <Water />
      <Landmasses />
      <CityRidge />

      <mesh geometry={town} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      <SeaWalls />
      <LandWalls />

      <Cypresses />
      <HagiaSophia />
      <Hippodrome />
      <GreatPalace />
      <Blachernae />

      <GalataShore />
      <FleetInTheHorn />
    </group>
  )
}
