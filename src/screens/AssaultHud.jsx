/**
 * Overlay shared by the land and sea sequences.
 *
 * Kept as HTML over the canvas rather than in-scene text: it has to stay
 * crisp and readable from the back of a room on a projector, at whatever
 * size the display happens to be.
 */

/**
 * A stage's threshold is usually one number. The sea breakthrough is the
 * exception — it depends on how many of a given ship's passengers made the
 * rampart — so it can vary within the stage and travels on each entry instead.
 */
export function StageBanner({ stage, remaining, total }) {
  if (!stage) return null
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center pt-6">
      <div className="mx-4 max-w-3xl rounded-lg border border-amber-900/30 bg-[#f4ead6]/95 px-8 py-4 text-center shadow-xl">
        <div className="text-3xl font-bold tracking-tight text-red-900">{stage.heading}</div>
        <div className="mt-1 text-lg text-stone-700">{stage.blurb}</div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-base">
          <span className="rounded bg-red-900 px-3 py-1 font-bold text-amber-50">
            {stage.thresholdLabel
              ? stage.thresholdLabel
              : stage.key === 'piloting'
                ? 'A 1 sinks the ship'
                : `Roll ${stage.threshold}+`}
          </span>
          <span className="text-stone-600">
            {total - remaining} of {total} resolved
          </span>
        </div>
      </div>
    </div>
  )
}

/** Some rules messages already carry their own tick or cross; don't double it. */
const stripMarker = (message) => message.replace(/^[✓✗]\s*/, '')

export function RollReadout({ activeRoll }) {
  if (!activeRoll || activeRoll.phase === 'tumbling') return null
  const { entry } = activeRoll
  const good = entry.success

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div
        className={`mx-4 rounded-xl border-2 px-10 py-5 text-center shadow-2xl ${
          good ? 'border-emerald-700 bg-emerald-50/95' : 'border-red-900 bg-red-50/95'
        }`}
      >
        <div className="text-2xl font-bold text-stone-800">{entry.player}</div>
        <div className="mt-2 flex items-center justify-center gap-3 text-xl text-stone-600">
          <span className="text-4xl font-black text-stone-900">{entry.roll}</span>
          {entry.bonus > 0 && <span>+ {entry.bonus}</span>}
          <span className="text-stone-400">vs</span>
          <span>{entry.threshold === 2 ? 'a 1 sinks' : `${entry.threshold}+`}</span>
        </div>
        <div className={`mt-3 text-2xl font-bold ${good ? 'text-emerald-800' : 'text-red-900'}`}>
          {good ? '✓' : '✗'} {stripMarker(entry.message)}
        </div>
      </div>
    </div>
  )
}

export function Prompt({ show, remaining, noun = 'crusader' }) {
  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
      <div className="mx-4 animate-pulse rounded-lg bg-stone-900/80 px-8 py-4 text-center text-xl font-medium text-amber-50">
        Click a {noun} to resolve their attempt — {remaining} left in this stage
      </div>
    </div>
  )
}

/** Shown when a sea assault has no Venetian or Oberto to pilot. */
export function CancelledNotice({ lines, onContinue }) {
  return (
    <button
      onClick={onContinue}
      className="fixed inset-0 z-50 flex w-screen cursor-pointer flex-col items-center justify-center bg-[#1c1512] px-8 text-center"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={i === 0 ? 'text-4xl font-bold text-amber-100' : 'mt-4 text-xl text-stone-400'}
        >
          {line}
        </div>
      ))}
      <div className="mt-14 animate-pulse text-lg text-stone-500">Click to continue</div>
    </button>
  )
}
