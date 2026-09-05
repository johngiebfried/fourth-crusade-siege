/**
 * The establishing shot: Constantinople on its peninsula, April 1204.
 *
 * Scale here is deliberately stylised rather than true — the whole city is
 * about 65 units across, so a real 12-metre wall would be a tenth of a unit
 * and vanish. Walls and landmarks are sized to read at a glance instead, in
 * the manner of a medieval map. What is kept honest is the shape of things:
 * the triangular peninsula, the Horn to the north and Marmara to the south,
 * the land walls closing the western base with Blachernae at their northern
 * end, and Hagia Sophia dominating the eastern tip beside the Hippodrome.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { PALETTE } from './palette.js'
import { buildBandedWall, buildTower } from './geometry/wallBuilder.js'
import {
  buildPeninsula,
  buildTownscape,
  groundHeight,
  PENINSULA,
  rng,
} from './geometry/cityBuilder.js'

const WALL_X = -31

/* ------------------------------------------------------------------ water */

function Sea() {
  return (
    <group>
      {/* The Horn, the Marmara and the Bosphorus are one body of water here. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} receiveShadow>
        <planeGeometry args={[220, 200]} />
        <meshLambertMaterial color={PALETTE.hornWater} />
      </mesh>
    </group>
  )
}

/** Galata across the Golden Horn, and the Asian shore across the Bosphorus. */
function OppositeShores() {
  const rand = useMemo(() => rng(31), [])

  const galata = useMemo(() => {
    const out = []
    for (let i = 0; i < 26; i++) {
      const x = -26 + rand() * 52
      const z = -40 + rand() * 8
      out.push({ x, z, w: 0.6 + rand() * 0.9, h: 0.5 + rand() * 1.1 })
    }
    return out
  }, [rand])

  const camp = useMemo(() => {
    const out = []
    for (let i = 0; i < 22; i++) {
      out.push({
        x: -20 + rand() * 34,
        z: -32 + rand() * 6,
        r: 0.34 + rand() * 0.22,
        h: 0.5 + rand() * 0.3,
      })
    }
    return out
  }, [rand])

  return (
    <group>
      {/* Galata / Pera, north bank — where the crusader camp stood. */}
      <mesh position={[-10, 0.7, -54]} receiveShadow>
        <boxGeometry args={[260, 1.4, 60]} />
        <meshLambertMaterial color="#79794f" />
      </mesh>
      {galata.map((b, i) => (
        <mesh key={i} position={[b.x, 1.4 + b.h / 2, b.z - 2]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshLambertMaterial color="#c3b79c" flatShading />
        </mesh>
      ))}
      {/* The crusader camp itself, pitched on the Galata shore. */}
      {camp.map((t, i) => (
        <mesh key={`t${i}`} position={[t.x, 1.4 + t.h / 2, t.z]} castShadow>
          <coneGeometry args={[t.r, t.h, 7]} />
          <meshLambertMaterial color="#e0d6bf" flatShading />
        </mesh>
      ))}

      {/* Asian shore, across the Bosphorus to the east. */}
      <mesh position={[88, 0.7, 6]} receiveShadow>
        <boxGeometry args={[80, 1.4, 240]} />
        <meshLambertMaterial color="#6f7350" />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ walls */

/** The Theodosian land walls, closing the western base of the peninsula. */
function LandWalls() {
  const wall = useMemo(
    () =>
      buildBandedWall({
        width: 1.1,
        depth: 41,
        height: 2.2,
        merlonWidth: 0.32,
        merlonGap: 0.26,
        merlonHeight: 0.3,
      }),
    []
  )

  const towers = useMemo(() => {
    const out = []
    for (let i = 0; i < 11; i++) {
      const z = -20 + (41 * i) / 10
      out.push({
        z,
        geometry: buildTower({ radius: 0.62, height: 3.0, polygonal: i % 2 === 1 }),
      })
    }
    return out
  }, [])

  return (
    <group position={[WALL_X, 1.5, 0]}>
      <mesh geometry={wall} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      {towers.map((t, i) => (
        <mesh key={i} geometry={t.geometry} position={[0, 0, t.z]} castShadow>
          <meshLambertMaterial vertexColors flatShading />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Sea walls following the coast — a single lower line, north and south, since
 * the water was itself the outer barrier.
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
          height: 1.15,
          merlonWidth: 0.26,
          merlonGap: 0.22,
          merlonHeight: 0.2,
        }),
      })
    }
    return out
  }, [])

  return (
    <group position={[0, 1.5, 0]}>
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
 * half-domes on the east–west axis. The single dominant landmark, and
 * emphatically domed rather than spired.
 */
function HagiaSophia({ position = [25, 0, -1] }) {
  const y = groundHeight(position[0], position[2])
  const windows = useMemo(() => {
    const out = []
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      out.push([Math.cos(a) * 2.34, Math.sin(a) * 2.34, a])
    }
    return out
  }, [])

  return (
    <group position={[position[0], y, position[2]]}>
      {/* Naos and aisles */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.0, 5.6]} />
        <meshLambertMaterial color="#e6dcc4" flatShading />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[8.2, 1.4, 7.4]} />
        <meshLambertMaterial color="#dcd1b6" flatShading />
      </mesh>

      {/* The two half-domes, east and west of the main dome */}
      {[-2.6, 2.6].map((dx, i) => (
        <mesh key={i} position={[dx, 3.0, 0]} scale={[1, 0.62, 1]} castShadow>
          <sphereGeometry args={[2.0, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshLambertMaterial color={PALETTE.hagiaDome} flatShading />
        </mesh>
      ))}

      {/* Drum, ringed with windows */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[2.3, 2.4, 1.2, 24]} />
        <meshLambertMaterial color="#e8dfc8" flatShading />
      </mesh>
      {windows.map(([wx, wz, a], i) => (
        <mesh key={i} position={[wx, 3.7, wz]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.1, 0.6, 0.22]} />
          <meshBasicMaterial color="#4a4433" />
        </mesh>
      ))}

      {/* The great dome: shallow, not a cupola */}
      <mesh position={[0, 4.2, 0]} scale={[1, 0.52, 1]} castShadow>
        <sphereGeometry args={[2.62, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={PALETTE.hagiaDome} flatShading />
      </mesh>
      <mesh position={[0, 5.6, 0]}>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshLambertMaterial color={PALETTE.imperialGold} />
      </mesh>

      {/* Buttress piers — no minarets: those arrive in 1453, and this is 1204 */}
      {[
        [-3.5, -3.2],
        [3.5, -3.2],
        [-3.5, 3.2],
        [3.5, 3.2],
      ].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 1.2, bz]} castShadow>
          <boxGeometry args={[1.0, 2.4, 1.0]} />
          <meshLambertMaterial color="#d8ccb0" flatShading />
        </mesh>
      ))}
    </group>
  )
}

/**
 * The Hippodrome, just south-west of Hagia Sophia: the long track with its
 * curved sphendone and the obelisks standing on the spina.
 */
function Hippodrome({ position = [18.5, 0, 5.5] }) {
  const y = groundHeight(position[0], position[2])
  return (
    <group position={[position[0], y, position[2]]} rotation={[0, 0.42, 0]}>
      {/* Track terraces */}
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[9.5, 0.9, 4.0]} />
        <meshLambertMaterial color="#cfc3a6" flatShading />
      </mesh>
      {/* Sphendone: the curved southern end */}
      <mesh position={[-4.75, 0.45, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 0.9, 16, 1, false, Math.PI / 2, Math.PI]} />
        <meshLambertMaterial color="#cfc3a6" flatShading />
      </mesh>
      {/* Arena floor */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[8.4, 0.1, 2.9]} />
        <meshLambertMaterial color="#b3a684" flatShading />
      </mesh>

      {/* The spina, with the obelisks on it */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[6.4, 0.2, 0.5]} />
        <meshLambertMaterial color="#c2b592" flatShading />
      </mesh>

      {/* Obelisk of Theodosius: Egyptian granite, tapered, pyramidion on top */}
      <group position={[1.6, 1.15, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.62, 0.4, 0.62]} />
          <meshLambertMaterial color="#b9ac8b" flatShading />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.16, 0.26, 2.2, 4]} />
          <meshLambertMaterial color="#a4785f" flatShading />
        </mesh>
        <mesh position={[0, 2.75, 0]}>
          <coneGeometry args={[0.2, 0.32, 4]} />
          <meshLambertMaterial color="#a4785f" flatShading />
        </mesh>
      </group>

      {/* The Walled Obelisk: rougher masonry, a little shorter */}
      <group position={[-2.0, 1.15, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.22, 0.34, 2.4, 4]} />
          <meshLambertMaterial color="#c8bda0" flatShading />
        </mesh>
      </group>

      {/* Serpent Column, between them */}
      <mesh position={[-0.2, 1.6, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.9, 6]} />
        <meshLambertMaterial color="#6f7d63" flatShading />
      </mesh>
    </group>
  )
}

/** The Great Palace, on the slope down to the Marmara. */
function GreatPalace({ position = [25, 0, 7.5] }) {
  const y = groundHeight(position[0], position[2])
  return (
    <group position={[position[0], y, position[2]]}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.0, 1.6, 3.6]} />
        <meshLambertMaterial color="#e0d5ba" flatShading />
      </mesh>
      <mesh position={[1.4, 1.9, 0]} castShadow>
        <boxGeometry args={[2.2, 1.0, 2.4]} />
        <meshLambertMaterial color="#e6dcc4" flatShading />
      </mesh>
      <mesh position={[1.4, 2.6, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[1.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={PALETTE.domeGold} flatShading />
      </mesh>
    </group>
  )
}

/**
 * The Blachernae palace complex, in the north-west corner where the land
 * walls come down to the Golden Horn.
 */
function Blachernae({ position = [-27.5, 0, -16] }) {
  const y = groundHeight(position[0], position[2])
  return (
    <group position={[position[0], y, position[2]]}>
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
      {/* Imperial banner: purple and gold, cross motif. No double-headed
          eagle — that is a Palaiologan emblem, after 1261. */}
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
        <meshLambertMaterial color="#4a3a2a" />
      </mesh>
      <mesh position={[0.7, 4.9, 0]}>
        <planeGeometry args={[1.3, 0.9]} />
        <meshLambertMaterial color={PALETTE.byzantinePurple} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, 4.9, 0.02]}>
        <planeGeometry args={[0.22, 0.66]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, 5.0, 0.02]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** The Venetian fleet, drawn up inside the Golden Horn. */
function FleetInTheHorn() {
  const ships = useMemo(() => {
    const rand = rng(19)
    const out = []
    for (let i = 0; i < 14; i++) {
      out.push({
        x: -22 + rand() * 40,
        z: -30 + rand() * 7,
        r: rand() * 0.5 - 0.25,
      })
    }
    return out
  }, [])

  return (
    <group>
      {ships.map((s, i) => (
        <group key={i} position={[s.x, 0.35, s.z]} rotation={[0, s.r, 0]}>
          <mesh>
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
  const land = useMemo(() => buildPeninsula({ thickness: 1.6 }), [])
  const town = useMemo(() => buildTownscape({ seed: 7, houses: 520, churches: 60 }), [])

  return (
    <group>
      <Sea />
      <OppositeShores />

      <mesh geometry={land} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>
      <mesh geometry={town} castShadow receiveShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      <SeaWalls />
      <LandWalls />

      <HagiaSophia />
      <Hippodrome />
      <GreatPalace />
      <Blachernae />
      <FleetInTheHorn />
    </group>
  )
}
