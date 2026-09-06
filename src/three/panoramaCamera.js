/**
 * The establishing shot's camera.
 *
 * These constants live here rather than in the component because three things
 * need to agree about them: the camera itself, the checks that prove the city
 * stays in frame, and the terrain builder that has to know how far out the
 * world must be dressed. When they lived in `CityBackdrop.jsx` the check read
 * them back out with regexes, which worked until it didn't.
 *
 * The projection maths is deliberately *not* here. `check-scene.mjs` derives
 * it independently from these numbers; a check that calls the same function
 * the component calls only ever proves the function agrees with itself.
 */

/** Units the shot must span across, so the whole subject stays in frame. */
export const CITY_SPAN = 82

/** Vertical units it must cover, as a fraction of the span. */
export const CITY_RISE = 0.56

/**
 * Aimed above the water rather than at it. Lifting the aim point drops the
 * city down the frame, which puts empty sky behind the title panel and the
 * shoreline near the bottom edge instead of the reverse.
 */
export const AIM = [-4.6, 7.7, -2.4]

/** The camera's orbit: distance, height as a fraction of it, and the drift. */
export const ORBIT = { radius: 120, lift: 0.62, angle: Math.PI * 0.22, sweep: 0.09 }

/**
 * The bounds the shot may never see past.
 *
 * Everything inside this rectangle is modelled — land, fields, hills, sea.
 * Outside it the landmasses do continue for a while, but only so that their
 * own cut edges are somewhere the camera cannot reach; nothing out there is
 * dressed, and nothing out there is meant to be looked at.
 *
 * This exists because the framing is solved from the viewport, so an unusual
 * window shape pulls the camera back until it is showing more world than there
 * is. At 1900 × 300 the Asian landmass became a green slab floating in the
 * Marmara with its underside showing. The bounds are the answer to that, and
 * `panoramaZoom` is what enforces them.
 */
export const WORLD = { x: [-126, 96], z: [-132, 104] }

/** The camera position at a point in the drift. `t` is elapsed seconds. */
export function orbitAngle(t) {
  return ORBIT.angle + Math.sin(t * 0.045) * ORBIT.sweep
}

/**
 * Where the frame's corners land on the water, for a given zoom.
 *
 * An orthographic frustum is a box, so a corner of the frame is a ray parallel
 * to the view direction — this walks each of the four down to y = 0.
 */
export function groundQuad(angle, halfWidth, halfHeight) {
  const cam = [
    Math.sin(angle) * ORBIT.radius,
    ORBIT.radius * ORBIT.lift,
    Math.cos(angle) * ORBIT.radius,
  ]
  const f = [AIM[0] - cam[0], AIM[1] - cam[1], AIM[2] - cam[2]]
  const fl = Math.hypot(...f)
  for (let i = 0; i < 3; i++) f[i] /= fl
  // right = forward × up, with up = (0, 1, 0); then true up = right × forward.
  const r = [-f[2], 0, f[0]]
  const rl = Math.hypot(...r)
  for (let i = 0; i < 3; i++) r[i] /= rl
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]

  const out = []
  for (const sx of [-halfWidth, halfWidth]) {
    for (const sy of [-halfHeight, halfHeight]) {
      const o = [
        AIM[0] + sx * r[0] + sy * u[0],
        AIM[1] + sx * r[1] + sy * u[1],
        AIM[2] + sx * r[2] + sy * u[2],
      ]
      const t = -o[1] / f[1]
      out.push([o[0] + t * f[0], o[2] + t * f[2]])
    }
  }
  return out
}

/**
 * The zoom for a viewport: the one that frames the city, unless that would
 * show more world than exists, in which case the world wins and the shot
 * crops instead.
 *
 * Cropping the city is a real cost and it is taken deliberately. It only bites
 * on shapes nothing is taught from — a very tall narrow window, a letterbox
 * strip — and on those the alternative is not a better picture of the city but
 * the edge of the model.
 */
export function panoramaZoom(width, height) {
  const fit = Math.min(width / CITY_SPAN, height / (CITY_SPAN * CITY_RISE))

  /*
   * The frame's footprint on the water shrinks as 1/zoom, but not about the
   * aim point: the aim is 7.7 units in the air, so the centre of the frame
   * lands on the water somewhere else entirely. Scaling the corners about the
   * aim instead of about that landing point is wrong by a constant, and wrong
   * in the direction that clamps shots which did not need clamping.
   */
  let need = 0
  for (let k = -1; k <= 1; k++) {
    const angle = ORBIT.angle + k * ORBIT.sweep
    const [centre] = groundQuad(angle, 0, 0)
    for (const corner of groundQuad(angle, width / 2, height / 2)) {
      const reach = [
        [corner[0] - centre[0], WORLD.x[1] - centre[0]],
        [centre[0] - corner[0], centre[0] - WORLD.x[0]],
        [corner[1] - centre[1], WORLD.z[1] - centre[1]],
        [centre[1] - corner[1], centre[1] - WORLD.z[0]],
      ]
      for (const [span, room] of reach) if (span > 0) need = Math.max(need, span / room)
    }
  }

  return Math.max(2, fit, need)
}
