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

import { useMemo } from 'react'
import { pickLore } from '../game/lore.js'
import { Drollery } from './ui.jsx'

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
        <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--rubric)' }}>
          {stage.heading}
        </div>
        <div className="mt-0.5 text-base" style={{ color: 'var(--ink-soft)' }}>
          {stage.blurb}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-5 text-sm">
          <span
            className="px-3 py-1 font-bold"
            style={{ background: 'var(--rubric)', color: 'var(--vellum-lit)' }}
          >
            {stage.thresholdLabel
              ? stage.thresholdLabel
              : stage.key === 'piloting'
                ? 'A 1 sinks the ship'
                : `Roll ${stage.threshold}+`}
          </span>
          <span style={{ color: 'var(--ink-soft)' }}>
            {total - remaining} of {total} resolved
          </span>
        </div>
      </div>
    </div>
  )
}

/** Some rules messages already carry their own tick or cross; don't double it. */
const stripMarker = (message) => message.replace(/^[✓✗]\s*/, '')

/**
 * The readout after a roll.
 *
 * A failure carries a gloss: a fact about siegecraft or about these walls,
 * drawn when the roll fails and not otherwise. Failure is when a student
 * actually has the question — why didn't that work? — and it is the one beat
 * in the sequence where nobody is mid-decision. Successes stay clean, because
 * a fact under every single roll becomes wallpaper and stops being read.
 */
export function RollReadout({ activeRoll, lane = 'land' }) {
  const { entry } = activeRoll ?? {}
  const failed = Boolean(entry) && !entry.success

  // Keyed on the entry so a new failure draws a new passage, and re-renders
  // during the same one do not shuffle it.
  const gloss = useMemo(
    () =>
      failed ? pickLore(Math.random() < 0.5 ? 'siegecraft' : 'walls', { lane }) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [failed, lane, entry?.playerId, entry?.player, entry?.roll]
  )

  if (!activeRoll || activeRoll.phase === 'tumbling') return null
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
          <span className="text-4xl font-black" style={{ color: 'var(--ink)' }}>
            {entry.roll}
          </span>
          {entry.bonus > 0 && <span>+ {entry.bonus}</span>}
          <span style={{ opacity: 0.55 }}>vs</span>
          <span>{entry.threshold === 2 ? 'a 1 sinks' : `${entry.threshold}+`}</span>
        </div>
        <div
          className="mt-3 text-2xl font-bold"
          style={{ color: good ? 'var(--ink)' : 'var(--rubric)' }}
        >
          {stripMarker(entry.message)}
        </div>

        {gloss && (
          <div
            className="mt-4 border-t pt-3 text-left text-[0.95rem] italic leading-relaxed"
            style={{ borderColor: 'rgba(43,33,24,0.28)', color: 'var(--ink-soft)' }}
          >
            {gloss.text}
          </div>
        )}
      </div>
    </div>
  )
}

export function Prompt({ show, remaining, noun = 'crusader' }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div
        className="manuscript-scope vellum ink-frame-light mx-4 flex items-center gap-4 px-7 py-3 text-center text-xl"
        style={{ color: 'var(--ink)' }}
      >
        <Drollery which="snail" size={44} />
        <span>
          Click a {noun} to resolve their attempt —{' '}
          <span style={{ color: 'var(--rubric)', fontWeight: 700 }}>{remaining}</span> left in this
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
          className={i === 0 ? 'text-4xl font-bold' : 'mt-4 max-w-2xl text-xl'}
          style={{ color: i === 0 ? 'var(--rubric)' : 'var(--ink-soft)' }}
        >
          {line}
        </div>
      ))}
      <Drollery which="hybrid" size={92} className="mt-10" />
      <div className="mt-6 text-lg" style={{ color: 'var(--ink-soft)' }}>
        Click to continue
      </div>
    </button>
  )
}
