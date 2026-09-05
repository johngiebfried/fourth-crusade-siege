/**
 * The first crusader through, land or sea.
 *
 * The dramatic peak of the module, so it gets the city behind it rather than a
 * flat colour, and the name at the size it deserves.
 */

import { useMemo } from 'react'
import { CityBackdrop } from './CityBackdrop.jsx'
import { PrimaryButton } from './ui.jsx'
import { ManuscriptLeaf, Marginalia } from './manuscript.jsx'
import { pickLore } from '../game/lore.js'

export default function FirstToEnter({ name, onContinue }) {
  // The honour of being first is the thing this screen is about, and the
  // siegecraft set is where that is explained.
  const gloss = useMemo(() => pickLore('siegecraft'), [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
        {/* Treatment one: the presentation leaf. Gold-ground initial and a
            rubricated incipit — the most decorated of the three, kept for the
            one moment in the sequence worth stopping at. */}
        <ManuscriptLeaf
          wide
          eyebrow="First to Enter"
          palette="vermilion"
          body={`${name} was the first crusader over the wall and into Constantinople, before whom no man of this army had set foot inside the city.`}
        >
          <Marginalia entry={gloss} />
          <div className="mt-8 text-center">
            <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
          </div>
        </ManuscriptLeaf>
      </div>
    </div>
  )
}
