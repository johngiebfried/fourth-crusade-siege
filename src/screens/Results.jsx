/**
 * Results and sack order — the hand-off to the Sack phase.
 *
 * The last thing the class sees before the module changes gear, so it gets the
 * city behind it like everything else rather than reverting to a form.
 */

import { useMemo } from 'react'
import { CityBackdrop } from './CityBackdrop.jsx'
import { GhostButton } from './ui.jsx'
import { ManuscriptBordered, Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'

const STATUS = {
  inside: { label: 'Entered the city', tone: 'text-emerald-800' },
  // Got onto the second land wall or the sea wall and no further. The manual
  // ranks these men above everyone who never left the ground.
  walls: { label: 'Reached the walls', tone: 'text-amber-800' },
  shipwrecked: { label: 'Shipwrecked', tone: 'text-sky-800' },
  ready: { label: 'Outside the walls', tone: 'text-stone-500' },
}

export default function Results({ cityFallen, firstToEnter, finalSummary, sackOrder, onReset }) {
  // The last screen the class sees, so it looks past the siege: what the sack
  // cost if the city fell, and what the crusade came to if it did not.
  const gloss = useMemo(() => pickLore(cityFallen ? 'aftermath' : 'walls'), [cityFallen])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-2 py-8">
        {/* Treatment three: the decorated leaf, vine-scroll down both edges.
            The most ornamental and the most expensive in width, which is why
            it is kept for the closing page. */}
        <ManuscriptBordered
          wide
          eyebrow={cityFallen ? 'The city has fallen' : 'The assault is over'}
          heading={cityFallen ? 'Constantinople Has Fallen' : 'The Walls Have Held'}
          palette={cityFallen ? 'vermilion' : 'lapis'}
        >
          {firstToEnter && (
            <div className="mb-5 border border-red-900/30 bg-[#eadcbc]/70 px-5 py-3 text-center">
              <span className="rubric">
                First to enter
              </span>
              <div className="mt-1 text-2xl font-bold text-red-900">{firstToEnter}</div>
            </div>
          )}

          <div className="space-y-2 text-lg leading-relaxed text-stone-800">
            {finalSummary.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>

          {cityFallen && sackOrder.length > 0 && (
            <div className="mt-8">
              <div className="rubric">
                Sack order
              </div>
              <p className="mt-2 text-base text-stone-600">
                Order of priority for choosing a region to plunder. Those who entered the city
                come first, then those who reached the walls, then the rest by fama, then the
                shipwrecked.
              </p>
              <ol className="mt-4 divide-y divide-red-900/15 border border-red-900/25 bg-[#eadcbc]/60">
                {sackOrder.map((entry) => {
                  const status = STATUS[entry.status] ?? STATUS.ready
                  return (
                    <li key={entry.position} className="flex items-center gap-4 px-4 py-2.5">
                      <span className="tally w-9 shrink-0 text-right text-xl font-bold text-red-900">
                        {entry.position}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-medium text-stone-900">
                          {entry.name}
                        </span>
                        <span className="text-sm text-stone-600">{entry.faction}</span>
                      </span>
                      <span className={`shrink-0 text-sm ${status.tone}`}>{status.label}</span>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          <Marginalia entry={gloss} />

          <div className="mt-8 text-center">
            <GhostButton onClick={onReset}>Begin a new siege</GhostButton>
          </div>
        </ManuscriptBordered>
      </div>
    </div>
  )
}
