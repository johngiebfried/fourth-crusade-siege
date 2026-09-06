/**
 * The siege engines' firing cycle.
 *
 * This exists because every fault in the mangonel was found by squinting at a
 * still frame, and stills are the wrong instrument. The preview harness
 * throttles animation to roughly a frame a second, so the swing, the release
 * and the winch were never actually watched — they were inferred, badly, and
 * shipped three times with the beam launching its stone from the wrong side of
 * the axle, stopping half a unit above the crossbeam it is meant to strike, and
 * standing in a hole with its sling buried in the turf.
 *
 * So the motion was pulled out of the component into `mangonelMotion`, and this
 * samples it across the whole cycle and asserts the things a screenshot cannot.
 */

import fs from 'node:fs'

const base = new URL('..', import.meta.url).pathname
const camp = await import(base + 'src/three/geometry/siegeCamp.js')
const lane = await import(base + 'src/three/lane.js')

const { MANGONEL: M, mangonelMotion, MANGONEL_CYCLE, MANGONEL_IMPACT } = camp

let failures = 0
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`)
  }
}

const ORIGIN = [lane.LANE.campX - 5, 0, -16]
const TARGET = [lane.LANE.outerWallX, lane.HEIGHTS.outerWall + 0.3, -18.5]
const at = (t) => mangonelMotion(t, { facing: -1, origin: ORIGIN, target: TARGET })

// Sample the cycle finely enough to catch a dip of a few centimetres.
const STEP = 0.004
const samples = []
for (let t = 0; t <= MANGONEL_CYCLE + 0.4; t += STEP) samples.push({ t, ...at(t) })

console.log(`\nThe engine's cycle (${MANGONEL_CYCLE.toFixed(2)}s, ${samples.length} samples)`)

/* ------------------------------------------------- nothing in the ground */

{
  // The head of the long arm, and the stone hanging in the sling below it.
  let worstHead = Infinity
  let worstStone = Infinity
  for (const s of samples) {
    worstHead = Math.min(worstHead, s.head[1])
    // The sling hangs from the head, rotating with the beam.
    const stoneY = ORIGIN[1] + M.axleY + Math.sin(s.angle) * M.longArm - M.slingDrop * Math.cos(s.angle)
    worstStone = Math.min(worstStone, stoneY)
  }
  check('the head of the arm never goes below ground', worstHead > 0.05, `lowest ${worstHead.toFixed(2)}`)
  check(
    'the stone in the sling never goes below ground',
    worstStone > 0.05,
    `lowest ${worstStone.toFixed(2)}`
  )
}

/* ------------------------------------------------------- the swing itself */

{
  const swing = samples.filter((s) => s.t <= M.swing)
  const monotonic = swing.every((s, i) => i === 0 || s.angle >= swing[i - 1].angle - 1e-9)
  check('the beam only travels one way through the swing', monotonic)

  // A hauled beam accelerates. Compare the first third of the travel against
  // the last: eased *out* the wall of it happens early, which is what made it
  // look like the arm was being lowered rather than thrown.
  const third = Math.floor(swing.length / 3)
  const early = swing[third].angle - swing[0].angle
  const late = swing[swing.length - 1].angle - swing[swing.length - 1 - third].angle
  check(
    'the swing accelerates rather than eases out',
    late > early * 2,
    `first third ${early.toFixed(2)} rad, last third ${late.toFixed(2)} rad`
  )

  check(
    'the beam reaches its stop',
    Math.abs(at(M.swing).angle - M.loosed) < 1e-9,
    `${at(M.swing).angle.toFixed(4)} against ${M.loosed}`
  )
}

/* ----------------------------------------------- the beam meets the stop */

{
  /*
   * Does the beam actually meet timber?
   *
   * Recomputing the stop's height from the same constant the builder uses
   * proves nothing — move the constant and both sides move together, which is
   * why the first version of this passed with the crossbeam anywhere at all.
   * So this walks the *built frame geometry* and asks whether there is
   * anything solid along the line the arm comes to rest on.
   */
  const frame = camp.buildMangonelFrame({ facing: -1 })
  const pos = frame.attributes.position

  const slope = Math.sin(M.loosed) / -Math.cos(M.loosed)
  const armYAt = (x) => M.axleY + slope * x

  /*
   * The *vertical* gap between the arm's resting line and the timber under it,
   * measured only out where the crossbeam lives.
   *
   * A straight-line distance was too forgiving: with the stop back at its old
   * hard-coded height it clipped a corner of the box diagonally at 0.265 and
   * squeaked past. What matters is whether there is something directly beneath
   * the arm holding it up, so this asks for the vertical gap — and only beyond
   * x = 0.7, because closer in the A-frame collar sits near the line by
   * coincidence and would pass for a crossbeam.
   */
  let nearest = Infinity
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    if (Math.abs(pos.getZ(i)) > 1.3) continue
    if (x < 0.7 || x > M.longArm) continue
    if (y < M.axleY + 0.2) continue
    nearest = Math.min(nearest, Math.abs(y - armYAt(x)))
  }

  check(
    'the beam comes to rest on the crossbeam',
    nearest < 0.15,
    `crossbeam sits ${nearest.toFixed(2)} from the resting arm`
  )
}

/* --------------------------------------------------------------- recoil */

{
  const rebound = samples.filter((s) => s.t > M.swing && s.t < M.swing + M.recoil)
  const dip = Math.min(...rebound.map((s) => s.angle))
  check(
    'it rebounds off the stop rather than freezing',
    dip < M.loosed - 0.02 && dip > M.loosed - 0.5,
    `lowest ${dip.toFixed(2)} against ${M.loosed}`
  )
  const settled = at(M.swing + M.recoil + 0.01)
  check('and settles back onto the stop', Math.abs(settled.angle - M.loosed) < 0.02)
}

/* ----------------------------------------------------------- the shot */

{
  const flying = samples.filter((s) => s.stone)
  check('a stone is loosed', flying.length > 20, `${flying.length} samples in flight`)

  // It must leave from the head of the arm, not from thin air beside it.
  //
  // The expected head is worked out here from first principles rather than
  // asked of the module: the beam's local +x maps to world −x under the
  // quarter turn the machine is built with, so for `facing: -1` the head sits
  // at origin.x MINUS the cosine. Asking `mangonelMotion` for its own idea of
  // where the head is made this check self-consistent and blind — it passed
  // happily with the sign flipped, which is exactly the bug that shipped.
  const first = flying[0]
  const relAngle = M.cocked + (M.loosed - M.cocked) * Math.pow(M.release, 3)
  const expectedHead = [
    ORIGIN[0] - Math.cos(relAngle) * M.longArm,
    ORIGIN[1] + M.axleY + Math.sin(relAngle) * M.longArm,
    ORIGIN[2],
  ]
  const gap = Math.hypot(
    first.stone[0] - expectedHead[0],
    first.stone[1] - expectedHead[1],
    first.stone[2] - expectedHead[2]
  )
  check('it leaves from the head of the arm', gap < 0.3, `${gap.toFixed(2)} away`)

  // And arrive on the target.
  const last = flying[flying.length - 1]
  const miss = Math.hypot(
    last.stone[0] - TARGET[0],
    last.stone[1] - TARGET[1],
    last.stone[2] - TARGET[2]
  )
  check('it lands on the wall it was aimed at', miss < 0.4, `${miss.toFixed(2)} off`)

  // Travelling toward the wall the whole way, and never through the ground.
  const forward = flying.every((s, i) => i === 0 || s.stone[0] >= flying[i - 1].stone[0] - 1e-9)
  check('it travels toward the wall throughout', forward)
  check('it never passes through the ground', Math.min(...flying.map((s) => s.stone[1])) > 0.5)

  // It must arc: a stone on a straight line reads as a thrown dart.
  const straightAt = (ft) => first.stone[1] + (last.stone[1] - first.stone[1]) * ft
  const midway = flying[Math.floor(flying.length / 2)]
  check(
    'it arcs rather than flying flat',
    midway.stone[1] - straightAt(0.5) > 1.5,
    `rise over the chord ${(midway.stone[1] - straightAt(0.5)).toFixed(2)}`
  )

  // It must clear the counterscarp and the ditch on its way in.
  const outerLip = lane.LANE.moatX - lane.LANE.moatWidth / 2
  const overMoat = flying.filter((s) => s.stone[0] > outerLip - 1 && s.stone[0] < lane.LANE.moatX + 2)
  check(
    'it passes well over the ditch rather than into it',
    overMoat.length === 0 || Math.min(...overMoat.map((s) => s.stone[1])) > 3,
    overMoat.length ? `lowest ${Math.min(...overMoat.map((s) => s.stone[1])).toFixed(2)}` : 'n/a'
  )
}

/* ------------------------------------------------------ the winch, and time */

{
  const winchStart = M.swing + M.rest
  const winch = samples.filter((s) => s.t > winchStart && s.t < winchStart + M.winch)
  const backwards = winch.every((s, i) => i === 0 || s.angle <= winch[i - 1].angle + 1e-9)
  check('the crew wind it back down without it climbing again', backwards)

  const end = at(MANGONEL_CYCLE + 0.05)
  check('it finishes cocked and ready', Math.abs(end.angle - M.cocked) < 1e-6 && end.done)

  // It must be back down before it is wanted again. The engines fire on the
  // first attempt and every third after it.
  const src = fs.readFileSync(base + 'src/screens/LandAssault.jsx', 'utf8')
  const num = (k) => Number(src.match(new RegExp(k + ':\\s*(\\d+)'))[1])
  const every = Number(src.match(/ENGINE_EVERY = (\d+)/)[1])
  const attempt = (num('tumble') + num('hold') + num('impact') + num('resolve')) / 1000
  const gap = attempt * every
  check(
    'it is cocked again before the next volley',
    MANGONEL_CYCLE < gap,
    `cycle ${MANGONEL_CYCLE.toFixed(2)}s against ${gap.toFixed(2)}s between volleys`
  )

  // And the stone must strike while the man is on the ladder, not before he
  // starts or after he arrives.
  const climb = num('resolve') / 1000
  check(
    'the stone strikes during the climb, not before or after it',
    MANGONEL_IMPACT > 0.1 && MANGONEL_IMPACT < climb * 0.75,
    `impact ${MANGONEL_IMPACT.toFixed(2)}s into a ${climb.toFixed(2)}s climb`
  )
  check(
    'the beat the app waits for matches the engine',
    Math.abs(num('impact') / 1000 - MANGONEL_IMPACT) < 0.06,
    `BEAT.impact ${num('impact')}ms vs ${(MANGONEL_IMPACT * 1000).toFixed(0)}ms`
  )
}

console.log('')
if (failures) {
  console.error(`${failures} engine check(s) failed`)
  process.exit(1)
}
console.log('The engines work.')
