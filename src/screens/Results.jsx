/**
 * Results and sack order — the hand-off to the Sack phase.
 *
 * The last thing the class sees before the module changes gear, so it gets the
 * city behind it like everything else rather than reverting to a form.
 */

import { CityBackdrop } from './CityBackdrop.jsx'
import { DarkPanel, Eyebrow, GhostButton } from './ui.jsx'

const STATUS = {
  inside: { label: 'Entered the city', tone: 'text-emerald-300' },
  shipwrecked: { label: 'Shipwrecked', tone: 'text-sky-300' },
  ready: { label: 'Outside the walls', tone: 'text-stone-400' },
}

export default function Results({ cityFallen, firstToEnter, finalSummary, sackOrder, onReset }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-2 py-8">
        <DarkPanel wide>
          <Eyebrow dark>{cityFallen ? 'The city has fallen' : 'The assault is over'}</Eyebrow>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-amber-100 md:text-5xl">
            {cityFallen ? 'Constantinople Has Fallen' : 'The Walls Have Held'}
          </h1>

          {firstToEnter && (
            <div className="mt-5 rounded-lg border border-amber-800/50 bg-amber-950/40 px-5 py-3">
              <span className="text-sm uppercase tracking-[0.2em] text-amber-500">
                First to enter
              </span>
              <div className="mt-1 text-2xl font-bold text-amber-100">{firstToEnter}</div>
            </div>
          )}

          <div className="mt-6 space-y-2 text-lg leading-relaxed text-stone-300">
            {finalSummary.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          {cityFallen && sackOrder.length > 0 && (
            <div className="mt-8">
              <Eyebrow dark>Sack order</Eyebrow>
              <p className="mt-2 text-base text-stone-400">
                Order of priority for choosing a region to plunder. Those who entered the city
                come first, then the rest by fama, then the shipwrecked.
              </p>
              <ol className="mt-4 divide-y divide-stone-700/70 rounded-lg border border-stone-700/70 bg-black/25">
                {sackOrder.map((entry) => {
                  const status = STATUS[entry.status] ?? STATUS.ready
                  return (
                    <li key={entry.position} className="flex items-center gap-4 px-4 py-2.5">
                      <span className="w-9 shrink-0 text-right text-xl font-bold text-amber-500">
                        {entry.position}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-medium text-amber-50">
                          {entry.name}
                        </span>
                        <span className="text-sm text-stone-500">{entry.faction}</span>
                      </span>
                      <span className={`shrink-0 text-sm ${status.tone}`}>{status.label}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          <div className="mt-8">
            <GhostButton dark onClick={onReset}>
              Begin a new siege
            </GhostButton>
          </div>
        </DarkPanel>
      </div>
    </div>
  )
}
