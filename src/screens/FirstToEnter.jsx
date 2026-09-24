/**
 * The first crusader through, land or sea.
 *
 * The dramatic peak of the module, and it was a small panel: the same leaf as
 * any other step, a line of text with the name in it, and a button. The man
 * whose student has just been first into Constantinople got less screen than
 * the refusal step.
 *
 * So it is a full-screen moment now. The city is dimmed behind a vignette; the
 * man's standard drops and unfurls over his name, which is set at the largest
 * size in the game; and the one consequence that matters is stated plainly —
 * first place in the sack order. The standard is the same canvas-drawn flag
 * the standard-bearers carry in the 3D scenes, so the contingent reads the
 * same here as on the walls.
 */

import { useMemo } from 'react'
import { CityBackdrop } from './CityBackdrop.jsx'
import { PrimaryButton } from './ui.jsx'
import { Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'
import { factionFlagTexture, factionOf } from '../three/factions.js'

/** How he got in, in a line — the lane decides which wall he went over. */
const ROUTE = {
  land: 'Over the land walls and in through the city gate',
  sea: 'From the flying bridge, over the sea wall and down into the city',
}

/** The flag as an image, drawn once by the same code as the 3D standards. */
function useStandard(faction) {
  return useMemo(() => {
    try {
      return factionFlagTexture(faction).image.toDataURL('image/png')
    } catch {
      return null
    }
  }, [faction])
}

export default function FirstToEnter({ name, lane = 'land', faction = 'Indeterminate', onContinue }) {
  // Keyed to the lane he actually came over. Unfiltered, this screen once
  // handed a man who went up a ladder a fact about the harbour chain.
  const gloss = useMemo(() => pickLore('siegecraft', { lane }), [lane])
  const standard = useStandard(faction)
  const colours = factionOf(faction)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      {/* Dim the city so the name stands in front of it, not on it. */}
      <div className="first-vignette pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="first-eyebrow display text-xl tracking-[0.35em] md:text-2xl" style={{ color: 'var(--gold-lit)' }}>
          First into Constantinople
        </div>

        {/* The standard on its staff: drops in from above, then unfurls. */}
        <div className="mt-6 flex items-start justify-center">
          <div className="first-staff relative h-40 w-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #8a6a44, #c8a577 55%, #8a6a44)' }}>
            {/* A gilt finial, so the staff reads against a dark ground. */}
            <div
              className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45"
              style={{ background: 'var(--gold-lit)', boxShadow: '0 0 10px rgba(238,215,122,0.6)' }}
            />
          </div>
          {standard && (
            <img
              src={standard}
              alt={`${colours.label} standard`}
              className="first-flag ml-0.5 h-28 w-36 shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
              style={{ imageRendering: 'auto' }}
            />
          )}
        </div>

        <h1
          className="first-name display mt-6 max-w-[92vw] text-5xl font-bold leading-tight md:text-7xl"
          style={{ color: 'var(--vellum-lit)', textShadow: '0 3px 18px rgba(0,0,0,0.65)' }}
        >
          {name || 'The first man'}
        </h1>

        <div className="first-rule mt-5 h-[3px] w-64 md:w-96" style={{ background: 'var(--gold)' }} />

        <div className="first-detail mt-5 text-lg md:text-2xl" style={{ color: 'var(--vellum)' }}>
          <span style={{ color: colours.cape === '#ece4d4' ? 'var(--vellum-lit)' : 'var(--gold-lit)' }}>
            {colours.label}
          </span>
          <span className="mx-3 opacity-60">·</span>
          {ROUTE[lane] ?? ROUTE.land}
        </div>

        <div
          className="first-detail mt-3 text-base md:text-xl"
          style={{ color: 'var(--vellum)', opacity: 0.85 }}
        >
          Before whom no man of this army had set foot inside the city — and first place in
          the sack order.
        </div>
      </div>

      {/* The gloss and the way on, kept low and quiet under the moment. */}
      <div className="first-footer absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-8">
        {gloss && (
          <div className="manuscript-scope vellum ink-frame-light mb-5 max-w-2xl px-6 py-1">
            <Marginalia entry={gloss} />
          </div>
        )}
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
      </div>
    </div>
  )
}
