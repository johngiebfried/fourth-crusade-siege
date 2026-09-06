/**
 * Sky and aerial perspective.
 *
 * Two things separate an architectural reconstruction from a model on a table,
 * and neither is polygon count. The first is that the sky is not one colour —
 * it runs from a deeper blue overhead to a pale, warm band at the horizon,
 * and the sun bleaches the air around it. The second is *aerial perspective*:
 * distance drains contrast and pushes everything toward the horizon colour,
 * so a far tower is paler and bluer than a near one.
 *
 * This lane had flat background fills and, worse, fog set to a colour that did
 * not match them — so distant masonry faded toward a grey that was nowhere in
 * the sky behind it, which reads as haze applied to a photograph rather than
 * as air. The dome and the fog now come from the same palette by construction.
 *
 * The gradient is painted into vertex colours on a sphere rather than sampled
 * from a texture: no fetched asset, no canvas, and it costs one draw call with
 * no lighting work at all.
 */

import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Sky moods. `horizon` is also the fog colour — that identity is the point,
 * and taking both from one entry is what keeps them from drifting apart.
 */
export const SKIES = {
  /** Clear April morning over the Horn. */
  day: {
    zenith: '#5d86b4',
    horizon: '#cfd8dd',
    haze: '#f3e6cc',
    sun: [-0.72, 0.42, 0.35],
  },
  /** Later in the day, over a field the army has already been thrown off. */
  late: {
    zenith: '#7d8ba4',
    horizon: '#e0cdae',
    haze: '#f6d9a6',
    sun: [-0.82, 0.24, 0.42],
  },
  /** Seen from the Galata shore: more water in the air. */
  horn: {
    zenith: '#5f83ad',
    horizon: '#c8d4dc',
    haze: '#eee2cc',
    sun: [-0.6, 0.38, 0.5],
  },
}

/**
 * The dome.
 *
 * `radius` must sit inside the camera's far plane or the sky is clipped away
 * and the scene shows the clear colour instead — which looks like the sky
 * simply failing to render.
 */
export function SkyDome({ mood = 'day', radius = 300 }) {
  const geometry = useMemo(() => {
    const sky = SKIES[mood] ?? SKIES.day
    // Enough bands to keep the gradient smooth; the horizon is where the
    // colour changes fastest, so the sphere is biased toward its lower half.
    const g = new THREE.SphereGeometry(radius, 24, 20)
    const pos = g.attributes.position
    const colours = new Float32Array(pos.count * 3)

    const zenith = new THREE.Color(sky.zenith)
    const horizon = new THREE.Color(sky.horizon)
    const haze = new THREE.Color(sky.haze)
    const sun = new THREE.Vector3(...sky.sun).normalize()
    const v = new THREE.Vector3()
    const c = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize()

      // Height above the horizon, eased so the pale band hugs it tightly the
      // way it does in life rather than washing halfway up the sky.
      const up = Math.max(0, v.y)
      c.copy(horizon).lerp(zenith, Math.pow(up, 0.55))

      // The sun bleaches the air around it. Falls off sharply, and only
      // towards the horizon — an even glow reads as a lens flare, not as air.
      const towardSun = Math.max(0, v.dot(sun))
      c.lerp(haze, Math.pow(towardSun, 5) * 0.75 * (1 - up * 0.5))

      colours[i * 3] = c.r
      colours[i * 3 + 1] = c.g
      colours[i * 3 + 2] = c.b
    }

    g.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    return g
  }, [mood, radius])

  return (
    <mesh geometry={geometry} renderOrder={-1000} frustumCulled={false}>
      {/*
        BackSide so we see the inside of the sphere. Unlit and unfogged: the
        sky is not a surface in the scene, it is what the scene fades into, and
        fogging it would tint it with itself.
      */}
      <meshBasicMaterial
        vertexColors
        side={THREE.BackSide}
        fog={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Sky and matching aerial perspective in one, so a scene cannot set the two
 * from different palettes.
 *
 * `near` and `far` are the distances over which contrast drains away. They
 * want to be tuned to what the scene actually contains: the useful setting is
 * one where the nearest thing is untouched and the furthest is most of the way
 * to the horizon colour, rather than fog as a uniform veil over everything.
 */
export function Atmosphere({ mood = 'day', near = 55, far = 190, radius = 300 }) {
  const sky = SKIES[mood] ?? SKIES.day
  return (
    <>
      <color attach="background" args={[sky.horizon]} />
      <fog attach="fog" args={[sky.horizon, near, far]} />
      <SkyDome mood={mood} radius={radius} />
    </>
  )
}
