/**
 * Round three. Not a third wall stage — the bribery option.
 *
 * Narrated only. The GM settles who actually contributes live in class, as
 * they do now; there is deliberately no in-app contributor selection.
 */

import { CityBackdrop } from './CityBackdrop.jsx'
import { DarkPanel, Eyebrow, GhostButton, PrimaryButton } from './ui.jsx'

const PRICES = [
  ['Collective contribution', '20 fama'],
  ['If Boniface of Montferrat leads the payment', '15 fama'],
  ['If Anna/Agnes of France leads the payment', '12 fama'],
]

export default function Bribery({ onConfirm, onDecline }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-2 py-8">
        <DarkPanel wide>
          <Eyebrow dark>Round Three</Eyebrow>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-amber-100 md:text-5xl">
            Two assaults have failed.
          </h1>

          <div className="mt-6 space-y-4 text-lg leading-relaxed text-stone-300">
            <p>
              The walls have held twice. The army is battered, the fleet has taken losses, and
              the season is turning. There will be no third climb.
            </p>
            <p>
              There remains one road into the city that does not run over a wall. Money. There
              are men inside who can be paid to open a gate — and the price is paid in
              reputation, not silver.
            </p>
          </div>

          <div className="mt-7 rounded-xl border border-amber-900/50 bg-black/30 p-6">
            <Eyebrow dark>The price</Eyebrow>
            <dl className="mt-4 space-y-3 text-lg">
              {PRICES.map(([label, cost], i) => (
                <div
                  key={label}
                  className={`flex items-baseline justify-between gap-6 ${
                    i < PRICES.length - 1 ? 'border-b border-stone-700 pb-3' : ''
                  }`}
                >
                  <dt className="text-stone-300">{label}</dt>
                  <dd className="shrink-0 text-2xl font-bold text-amber-200">{cost}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-stone-400">
              Settle who contributes, and how much each gives, around the table. The app does
              not track it.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-4">
            <PrimaryButton onClick={onConfirm}>The bribe is paid — open the gate</PrimaryButton>
            <GhostButton dark onClick={onDecline}>
              No one pays
            </GhostButton>
          </div>
        </DarkPanel>
      </div>
    </div>
  )
}
