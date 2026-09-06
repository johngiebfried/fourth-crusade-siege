/**
 * Overlay shared by the land and sea sequences.
 *
 * Kept as HTML over the canvas rather than in-scene text: it has to stay
 * crisp and readable from the back of a room on a projector, at whatever
 * size the display happens to be.
 *
 * Styled as vellum strips laid over the page rather than as web cards. This is
 * the furniture that is on screen for most of the game, so if anything had to
 * stop looking modern it was this: the emerald/red success panels in
 * particular were pure 2015 web, and success and failure now read as ink and
 * vermilion, which is how a manuscript marks anything.
 */

import { LineFiller } from './ui.jsx'

/**
 * A stage's threshold is usually one number. The sea breakthrough is the
 * exception — it depends on how many of a given ship's passengers made the
 * rampart — so it can vary within the stage and travels on each entry instead.
 */
export function StageBanner({ stage, remaining, total }) {
  if (!stage) return null
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center pt-3">
      <div className="manuscript-scope vellum ink-frame mx-4 max-w-2xl px-8 py-2.5 text-center">
        <div className="display text-2xl font-bold" style={{ color: 'var(--rubric)' }}>
          {stage.heading}
        </div>
        <div className="mt-0.5 text-base" style={{ color: 'var(--ink-soft)' }}>
          {stage.blurb}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-5 text-sm">
          <span
            className="tally px-3 py-1 font-bold"
            style={{ background: 'var(--rubric)', color: 'var(--vellum-lit)' }}
          >
            {stage.thresholdLabel
              ? stage.thresholdLabel
              : stage.key === 'piloting'
                ? 'A 1 sinks the ship'
                : `Roll ${stage.threshold}+`}
          </span>
          <span className="tally" style={{ color: 'var(--ink-soft)' }}>
            {total - remaining} of {total} resolved
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Rules messages arrive with their own decoration: a leading tick or cross,
 * and in the triumphant ones an emoji. Both are stripped for display — the
 * strings in `rules.js` are the original author's and are not edited, but a
 * 2015 colour bitmap sitting on a vellum page undoes the whole treatment.
 */
const stripMarker = (message) =>
  message
    .replace(/^[✓✗]\s*/, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    // The exclamation mark in this hand is a near-vertical stroke that reads
    // as an l or an I: "Crusade!" comes out "Crusadel". The emphasis is
    // carried by the rubric colour anyway.
    .replace(/!+/g, '')
    .trim()

/**
 * The readout after a roll.
 *
 * ── The gloss that used to live here ─────────────────────────────────────
 *
 * A failed roll drew a fact from `siegecraft` or `walls` and printed it under
 * the result. It is removed, and the reasons are worth keeping:
 *
 *   It was **in the way**. The readout sits at the foot of the frame, and the
 *   engines throw across exactly that ground. A volley the class is meant to
 *   watch went on behind a panel three lines deeper than it needed to be.
 *
 *   It was **on screen too briefly to read**. A resolution holds for about a
 *   second and a half. That is long enough for a name and a number and not
 *   nearly long enough for three lines of prose, so the passage was scenery.
 *
 * The sets, their lane tagging and the picker all remain, and both are still
 * drawn on the first-to-enter and results screens, where a reader has time.
 * Putting it back is a `pickLore('siegecraft', { lane })` and a block in this
 * component — but somewhere it can be read.
 */
export function RollReadout({ activeRoll }) {
  if (!activeRoll || activeRoll.phase === 'tumbling') return null
  const { entry } = activeRoll
  const good = entry.success

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div
        className="manuscript-scope vellum ink-frame mx-4 max-w-xl px-10 py-5 text-center"
        style={{ borderColor: good ? 'var(--ink)' : 'var(--rubric-deep)', borderWidth: 3 }}
      >
        <div className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          {entry.player}
        </div>
        <div
          className="mt-2 flex items-center justify-center gap-3 text-xl"
          style={{ color: 'var(--ink-soft)' }}
        >
          <span className="tally text-4xl font-black" style={{ color: 'var(--ink)' }}>
            {entry.roll}
          </span>
          {entry.bonus > 0 && <span className="tally">+ {entry.bonus}</span>}
          <span style={{ opacity: 0.55 }}>vs</span>
          <span className="tally">
            {entry.threshold === 2 ? 'a 1 sinks' : `${entry.threshold}+`}
          </span>
        </div>
        <div
          className="mt-3 text-2xl font-bold"
          style={{ color: good ? 'var(--ink)' : 'var(--rubric)' }}
        >
          {stripMarker(entry.message)}
        </div>
      </div>
    </div>
  )
}

export function Prompt({ show, remaining, noun = 'crusader' }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div
        className="manuscript-scope vellum ink-frame-light mx-4 px-8 py-3 text-center text-xl"
        style={{ color: 'var(--ink)' }}
      >
        <span>
          Click a {noun} to resolve their attempt —{' '}
          <span className="tally" style={{ color: 'var(--rubric)', fontWeight: 700 }}>
            {remaining}
          </span>{' '}
          left in this
          stage
        </span>
      </div>
    </div>
  )
}

/** Shown when a sea assault has no Venetian or Oberto to pilot. */
export function CancelledNotice({ lines, onContinue }) {
  return (
    <button
      onClick={onContinue}
      className="manuscript-scope vellum fixed inset-0 z-50 flex w-screen cursor-pointer flex-col items-center justify-center px-8 text-center"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={i === 0 ? 'display text-4xl font-bold' : 'mt-4 max-w-2xl text-xl'}
          style={{ color: i === 0 ? 'var(--rubric)' : 'var(--ink-soft)' }}
        >
          {line}
        </div>
      ))}
      <div className="mt-10 w-64">
        <LineFiller />
      </div>
      <div className="mt-6 text-lg" style={{ color: 'var(--ink-soft)' }}>
        Click to continue
      </div>
    </button>
  )
}
