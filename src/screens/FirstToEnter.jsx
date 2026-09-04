/**
 * Full-screen callout for the first crusader through, land or sea.
 * Reuses the message wording from the existing roll queue.
 */

export default function FirstToEnter({ name, onContinue }) {
  return (
    <button
      onClick={onContinue}
      className="fixed inset-0 z-50 flex w-screen cursor-pointer flex-col items-center justify-center bg-[#1c1512] text-center"
    >
      <div className="text-7xl">👑</div>
      <div className="mt-6 text-sm uppercase tracking-[0.4em] text-amber-500">
        First to Enter
      </div>
      <div className="mt-4 max-w-4xl px-8 text-6xl font-bold leading-tight text-amber-50">
        {name}
      </div>
      <div className="mt-6 text-2xl text-stone-400">
        is the first crusader into the city
      </div>
      <div className="mt-16 animate-pulse text-lg text-stone-500">Click to continue</div>
    </button>
  )
}
