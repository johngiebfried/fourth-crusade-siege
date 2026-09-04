/**
 * Round three. Not a third wall stage — the bribery option.
 *
 * Narrated only. The GM handles who actually contributes live in class, as
 * they do now; there is deliberately no in-app contributor selection.
 */

export default function Bribery({ onConfirm, onDecline }) {
  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-[#1c1512] px-8 py-16 text-amber-50">
      <div className="mx-auto max-w-3xl">
        <div className="text-sm uppercase tracking-[0.4em] text-amber-600">Round Three</div>
        <h1 className="mt-4 text-5xl font-bold leading-tight text-amber-100">
          Two assaults have failed.
        </h1>

        <div className="mt-8 space-y-5 text-xl leading-relaxed text-stone-300">
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

        <div className="mt-10 rounded-xl border border-amber-900/50 bg-black/30 p-8">
          <div className="text-lg uppercase tracking-widest text-amber-500">The price</div>
          <dl className="mt-6 space-y-4 text-xl">
            <div className="flex items-baseline justify-between gap-6 border-b border-stone-700 pb-3">
              <dt className="text-stone-300">Collective contribution</dt>
              <dd className="text-3xl font-bold text-amber-200">20 fama</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-b border-stone-700 pb-3">
              <dt className="text-stone-300">If Boniface of Montferrat leads the payment</dt>
              <dd className="text-3xl font-bold text-amber-200">15 fama</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6">
              <dt className="text-stone-300">If Anna/Agnes of France leads the payment</dt>
              <dd className="text-3xl font-bold text-amber-200">12 fama</dd>
            </div>
          </dl>
          <p className="mt-6 text-base text-stone-400">
            Settle who contributes, and how much each gives, around the table. The app does
            not track it.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={onConfirm}
            className="rounded-lg bg-amber-600 px-10 py-5 text-xl font-bold text-stone-900 shadow-lg transition-colors hover:bg-amber-500"
          >
            The bribe is paid — open the gate
          </button>
          <button
            onClick={onDecline}
            className="rounded-lg border border-stone-600 px-10 py-5 text-xl font-medium text-stone-300 transition-colors hover:bg-stone-800"
          >
            No one pays
          </button>
        </div>
      </div>
    </div>
  )
}
