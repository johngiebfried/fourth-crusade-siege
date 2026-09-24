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
import { TIERS } from '../game/siege.js'

/**
 * The sack order in its four tiers, each under its own heading.
 *
 * It used to be one numbered list with the tier repeated as a label on every
 * row — thirty or fifty rows, most of them reading "Outside the walls". The
 * list was correct and illegible: the one thing a class needs from this page is
 * to see *why* the order is what it is, and a column of identical labels hid
 * the only structure it had. Grouped, the reason is the heading.
 */
const TIER_NOTES = {
  inside: 'In the order they got in.',
  walls: 'Stood on the second land wall or the sea wall. Highest roll first.',
  fama: 'Everyone else, by fama.',
  shipwrecked: 'Their ships went down. They choose last.',
}

function SackTier({ tier, entries }) {
  // Long tiers go to two columns, filled down the first and then the second,
  // so the order still reads top to bottom.
  const columns = entries.length > 10 ? 'md:columns-2 md:gap-6' : ''
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-3 border-b border-red-900/30 pb-1">
        <h3 className="rubric text-base">{tier.label}</h3>
        <span className="tally text-sm" style={{ color: 'var(--ink-soft)' }}>
          {entries.length}
        </span>
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
        {TIER_NOTES[tier.key]}
      </p>
      <ol className={`mt-2 ${columns}`}>
        {entries.map((entry) => (
          <li
            key={entry.position}
            className="flex break-inside-avoid items-baseline gap-3 border-b border-red-900/10 py-1.5"
          >
            <span className="tally w-8 shrink-0 text-right text-lg font-bold text-red-900">
              {entry.position}
            </span>
            <span className="min-w-0 flex-1 text-lg leading-snug text-stone-900">{entry.name}</span>
            <span className="shrink-0 text-sm text-stone-600">{entry.faction}</span>
          </li>
        ))}
      </ol>
    </section>
  )
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
                The order in which crusaders choose a region to plunder.
              </p>
              {TIERS.map((tier) => {
                const entries = sackOrder.filter((e) => e.tier === tier.key)
                return entries.length ? <SackTier key={tier.key} tier={tier} entries={entries} /> : null
              })}
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
