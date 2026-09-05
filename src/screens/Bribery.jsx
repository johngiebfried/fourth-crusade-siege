/**
 * Round three. Not a third wall stage — the bribery option.
 *
 * Narrated only. The GM settles who actually contributes live in class, as
 * they do now; there is deliberately no in-app contributor selection.
 */

import { useMemo } from 'react'
import { CityBackdrop } from './CityBackdrop.jsx'
import { GhostButton, PrimaryButton } from './ui.jsx'
import { ManuscriptRuled, Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'

const PRICES = [
  ['Collective contribution', '20 fama'],
  ['If Boniface of Montferrat leads the payment', '15 fama'],
  ['If Anna/Agnes of France leads the payment', '12 fama'],
]

export default function Bribery({ onConfirm, onDecline }) {
  // The bargain, not the fighting — this screen is about the debt the whole
  // crusade ran on, so it takes its gloss from that set.
  const gloss = useMemo(() => pickLore('fleet'), [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-2 py-8">
        {/* Treatment two: the ruled working copy. This screen is mostly a
            price list, and the ruled leaf is the one that holds a table
            without looking crowded. */}
        <ManuscriptRuled
          wide
          rubric="Round Three · The Bargain"
          heading="Two assaults have failed."
          body={
            'The walls have held twice. The army is battered, the fleet has taken losses, ' +
            'and the season is turning. There will be no third climb. There remains one road ' +
            'into the city that does not run over a wall. Money. There are men inside who can ' +
            'be paid to open a gate — and the price is paid in reputation, not silver.'
          }
        >
          <div className="mt-6 border border-red-900/25 bg-[#e9dcc0]/70 p-5">
            <div className="text-xs uppercase tracking-[0.28em] text-red-900/70">The price</div>
            <dl className="mt-3 space-y-2 text-lg">
              {PRICES.map(([label, cost], i) => (
                <div
                  key={label}
                  className={`flex items-baseline justify-between gap-6 ${
                    i < PRICES.length - 1 ? 'border-b border-red-900/15 pb-2' : ''
                  }`}
                >
                  <dt className="text-stone-700">{label}</dt>
                  <dd className="shrink-0 text-2xl font-bold text-red-900">{cost}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-stone-600">
              Settle who contributes, and how much each gives, around the table. The app does
              not track it.
            </p>
          </div>

          <Marginalia entry={gloss} />

          <div className="mt-7 flex flex-wrap gap-4">
            <PrimaryButton onClick={onConfirm}>The bribe is paid — open the gate</PrimaryButton>
            <GhostButton onClick={onDecline}>No one pays</GhostButton>
          </div>
        </ManuscriptRuled>
      </div>
    </div>
  )
}
