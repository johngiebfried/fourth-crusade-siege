/**
 * The first crusader through, land or sea.
 *
 * The dramatic peak of the module, so it gets the city behind it rather than a
 * flat colour, and the name at the size it deserves.
 */

import { CityBackdrop } from './CityBackdrop.jsx'
import { DarkPanel, Eyebrow, PrimaryButton } from './ui.jsx'

export default function FirstToEnter({ name, onContinue }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
        <DarkPanel wide className="text-center">
          <div className="text-6xl">👑</div>
          <div className="mt-4">
            <Eyebrow dark>First to Enter</Eyebrow>
          </div>
          <div className="mt-4 text-5xl font-bold leading-tight text-amber-50 md:text-6xl">
            {name}
          </div>
          <div className="mt-4 text-xl text-stone-400">
            is the first crusader into Constantinople
          </div>
          <div className="mt-9">
            <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
          </div>
        </DarkPanel>
      </div>
    </div>
  )
}
