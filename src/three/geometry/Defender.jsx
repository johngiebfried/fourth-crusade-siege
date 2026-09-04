/**
 * Byzantine defenders on the ramparts — static silhouettes, so the walls do
 * not read as unmanned.
 *
 * Kit follows the brief: scale/lamellar (klivanion) rather than mail
 * predominating, and a proportion of Varangians with the long-hafted axe.
 * Banners are purple and gold with a cross motif; deliberately no
 * double-headed eagle, which is a Palaiologan emblem from after 1261.
 */

import { PALETTE } from '../palette.js'

function Defender({ position, varangian = false, facing = -1 }) {
  return (
    <group position={position} scale={0.38} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
      {/* Lamellar torso */}
      <mesh position={[0, 0.82, 0]}>
        <capsuleGeometry args={[0.32, 0.66, 4, 8]} />
        <meshLambertMaterial color={PALETTE.byzantineLamellar} flatShading />
      </mesh>
      {/* Skirt of lamellae */}
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.42, 0.42, 8]} />
        <meshLambertMaterial color={PALETTE.byzantinePurple} flatShading />
      </mesh>
      {/* Rounded helm */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.26, 8, 6]} />
        <meshLambertMaterial color={PALETTE.byzantineLamellar} flatShading />
      </mesh>

      {varangian ? (
        // Long-hafted Danish axe, the Varangian Guard's signature.
        <group position={[0.34, 1.0, 0]} rotation={[0, 0, -0.28]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 2.5, 6]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
          <mesh position={[0.16, 1.16, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.42, 0.5, 0.06]} />
            <meshLambertMaterial color={PALETTE.varangianAxe} flatShading />
          </mesh>
        </group>
      ) : (
        // Round shield and spear.
        <>
          <mesh position={[-0.3, 0.9, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.07, 12]} />
            <meshLambertMaterial color={PALETTE.byzantinePurple} flatShading />
          </mesh>
          <mesh position={[0.32, 1.05, -0.05]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.035, 0.035, 2.3, 6]} />
            <meshLambertMaterial color={PALETTE.hullTimberDark} />
          </mesh>
        </>
      )}
    </group>
  )
}

/** Imperial banner: purple field, gold cross. No eagle. */
function Banner({ position, height = 2.6 }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, height, 6]} />
        <meshLambertMaterial color={PALETTE.hullTimberDark} />
      </mesh>
      <mesh position={[0.42, height - 0.5, 0]}>
        <planeGeometry args={[0.84, 0.66]} />
        <meshLambertMaterial color={PALETTE.byzantinePurple} side={2} />
      </mesh>
      {/* Gold cross on the field */}
      <mesh position={[0.42, height - 0.5, 0.012]}>
        <planeGeometry args={[0.15, 0.5]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={2} />
      </mesh>
      <mesh position={[0.42, height - 0.42, 0.012]}>
        <planeGeometry args={[0.52, 0.15]} />
        <meshBasicMaterial color={PALETTE.imperialGold} side={2} />
      </mesh>
    </group>
  )
}

/**
 * A line of defenders along a rampart running in Z.
 * `seed` keeps the arrangement stable across re-renders.
 */
export function RampartGarrison({ x, y, zFrom, zTo, count = 5, seed = 1, banners = 1 }) {
  const figures = []
  const span = zTo - zFrom
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const jitter = (Math.sin((i + seed) * 12.9898) * 43758.5453) % 1
    const z = zFrom + span * t + jitter * 0.3
    // Roughly one in three is a Varangian.
    figures.push(
      <Defender key={`d${i}`} position={[x, y, z]} varangian={(i + seed) % 3 === 0} />
    )
  }
  for (let b = 0; b < banners; b++) {
    const z = zFrom + (span * (b + 1)) / (banners + 1)
    figures.push(<Banner key={`b${b}`} position={[x - 0.3, y, z]} />)
  }
  return <group>{figures}</group>
}

export { Defender, Banner }
