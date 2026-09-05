/**
 * Shared furniture for the screens that sit over the city.
 *
 * The opening, the bribery, the first-to-enter callout and the results all use
 * these, so the module reads as one thing rather than as a 3D game with some
 * unrelated web forms bolted to either end.
 */

/** A parchment card over the city. */
export function Panel({ children, wide = false, className = '' }) {
  return (
    <div
      className={`pointer-events-auto mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } rounded-xl border border-amber-900/30 bg-[#f4ead6]/94 px-8 py-6 shadow-2xl backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

/** A dark card, for the moments that want weight rather than parchment. */
export function DarkPanel({ children, wide = false, className = '' }) {
  return (
    <div
      className={`pointer-events-auto mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } rounded-xl border border-amber-900/40 bg-[#1c1512]/92 px-8 py-7 shadow-2xl backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function Eyebrow({ children, dark = false }) {
  return (
    <div
      className={`text-xs uppercase tracking-[0.34em] ${
        dark ? 'text-amber-500' : 'text-amber-800'
      }`}
    >
      {children}
    </div>
  )
}

export function Heading({ children, dark = false, className = '' }) {
  return (
    <h2
      className={`mt-2 text-3xl font-bold leading-tight md:text-4xl ${
        dark ? 'text-amber-100' : 'text-red-900'
      } ${className}`}
    >
      {children}
    </h2>
  )
}

export function PrimaryButton({ children, disabled, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-10 py-4 text-xl font-bold shadow-lg transition-colors ${
        disabled
          ? 'cursor-not-allowed bg-stone-300 text-stone-500'
          : 'bg-red-800 text-amber-50 hover:bg-red-700'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-8 py-4 text-lg font-medium transition-colors ${
        dark
          ? 'border-stone-600 text-stone-300 hover:bg-stone-800/60'
          : 'border-stone-500/60 text-stone-700 hover:bg-stone-900/10'
      }`}
    >
      {children}
    </button>
  )
}

/** Layout for a screen that lays a single card over the city. */
export function OverCity({ children, align = 'center' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex justify-center overflow-y-auto px-2 py-8 ${
        align === 'center' ? 'items-center' : 'items-start'
      }`}
    >
      {children}
    </div>
  )
}
