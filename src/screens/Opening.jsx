/**
 * The opening: title, then setup, all played over the city shot.
 *
 * The old flow asked for fifty-two checkboxes and then fifty-two land/sea/
 * sit-out choices. This asks four questions instead:
 *
 *   1. How many crusaders are attacking?  The roster is pre-scripted, so a
 *      count of fifteen means the first fifteen names on the list.
 *   2. Does anyone refuse?  Name them.
 *   3. Land walls, sea walls, or split?
 *   4. Only if split: how many each way, then name the smaller group. The
 *      rest go the other way.
 *
 * Round two runs the same flow from step 2, since the roster is already set.
 */

import { useCallback, useMemo, useState } from 'react'
import allCharacters from '../data/characters.json'
import { canCaptain } from '../game/rules.js'
import { CityBackdrop, CrusaderCamPanel } from './CityBackdrop.jsx'

/* -------------------------------------------------------------- fragments */

function Panel({ children, wide = false }) {
  return (
    <div
      className={`pointer-events-auto mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } rounded-xl border border-amber-900/30 bg-[#f4ead6]/94 px-8 py-6 shadow-2xl backdrop-blur-sm`}
    >
      {children}
    </div>
  )
}

function StepHeading({ step, of, title, blurb }) {
  return (
    <div className="text-center">
      {step && (
        <div className="text-xs uppercase tracking-[0.32em] text-amber-800">
          Step {step} of {of}
        </div>
      )}
      <h2 className="mt-2 text-3xl font-bold leading-tight text-red-900 md:text-4xl">{title}</h2>
      {blurb && <p className="mt-2 text-lg text-stone-700">{blurb}</p>}
    </div>
  )
}

function PrimaryButton({ children, disabled, onClick, className = '' }) {
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

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-stone-500/60 px-8 py-4 text-lg font-medium text-stone-700 transition-colors hover:bg-stone-900/10"
    >
      {children}
    </button>
  )
}

/**
 * A dropdown of names that stays open while you pick. A native multi-select is
 * unusable on a projector; this keeps every name at a readable size.
 */
function NameDropdown({ label, people, selected, onToggle, limit }) {
  const [open, setOpen] = useState(false)
  const atLimit = typeof limit === 'number' && selected.length >= limit

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 rounded-lg border-2 border-stone-500/50 bg-white/70 px-5 py-3 text-left text-lg text-stone-800 transition-colors hover:bg-white"
      >
        <span>
          {selected.length === 0
            ? label
            : `${selected.length} selected${typeof limit === 'number' ? ` of ${limit}` : ''}`}
        </span>
        <span className="text-stone-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 max-h-[42vh] w-full overflow-y-auto rounded-lg border-2 border-stone-500/50 bg-[#faf4e8] shadow-2xl">
          {people.map((p) => {
            const isOn = selected.includes(p.id)
            const blocked = !isOn && atLimit
            return (
              <button
                key={p.id}
                disabled={blocked}
                onClick={() => onToggle(p.id)}
                className={`flex w-full items-center gap-3 border-b border-stone-300/60 px-4 py-2.5 text-left transition-colors last:border-0 ${
                  isOn
                    ? 'bg-red-800 text-amber-50'
                    : blocked
                      ? 'cursor-not-allowed text-stone-400'
                      : 'text-stone-800 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    isOn ? 'border-amber-200 bg-amber-200 text-red-900' : 'border-stone-400'
                  }`}
                >
                  {isOn ? '✓' : ''}
                </span>
                <span className="flex-1 text-base font-medium">{p.name}</span>
                <span className={`text-sm ${isOn ? 'text-amber-200' : 'text-stone-500'}`}>
                  {p.faction}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((id) => {
            const p = people.find((q) => q.id === id)
            if (!p) return null
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                className="rounded-full bg-red-800 px-3 py-1 text-sm font-medium text-amber-50 hover:bg-red-700"
              >
                {p.name} ✕
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NumberField({ value, onChange, min = 0, max = 99, autoFocus = false }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-32 rounded-lg border-2 border-stone-500/60 bg-white/80 px-4 py-3 text-center text-3xl font-bold text-stone-900 outline-none focus:border-red-800"
    />
  )
}

/* ------------------------------------------------------------------ screen */

export default function Opening({ round = 1, roster: existingRoster = null, onComplete }) {
  const [step, setStep] = useState(existingRoster ? 'refuse' : 'title')
  const [countText, setCountText] = useState('12')
  const [roster, setRoster] = useState(existingRoster ?? [])
  const [refuserIds, setRefuserIds] = useState([])
  const [landText, setLandText] = useState('')
  const [seaText, setSeaText] = useState('')
  const [smallGroupIds, setSmallGroupIds] = useState([])

  const count = Math.max(1, Math.min(allCharacters.length, parseInt(countText, 10) || 0))

  /** The roster is pre-scripted: a count of N takes the first N on the list. */
  const preview = useMemo(() => allCharacters.slice(0, count), [count])

  const attackers = useMemo(
    () => roster.filter((p) => !refuserIds.includes(p.id)),
    [roster, refuserIds]
  )

  const landCount = parseInt(landText, 10)
  const seaCount = parseInt(seaText, 10)
  const splitValid =
    Number.isFinite(landCount) &&
    Number.isFinite(seaCount) &&
    landCount >= 0 &&
    seaCount >= 0 &&
    landCount + seaCount === attackers.length

  // Name the smaller of the two groups; the rest fall to the other side.
  const smallerSide = splitValid ? (landCount <= seaCount ? 'land' : 'sea') : null
  const smallerCount = splitValid ? Math.min(landCount, seaCount) : 0

  const finish = useCallback(
    (assign) => {
      const players = roster.map((char) => ({
        ...char,
        attackChoice: refuserIds.includes(char.id) ? 'sit_out' : assign(char),
        shipId: null,
        stage: 0,
        status: 'ready',
        rollHistory: [],
      }))
      onComplete(players, roster)
    },
    [roster, refuserIds, onComplete]
  )

  /* --------------------------------------------------------------- steps */

  const body = () => {
    switch (step) {
      case 'title':
        return (
          <Panel>
            <div className="text-center">
              <div className="text-sm uppercase tracking-[0.42em] text-amber-800">
                The Fourth Crusade
              </div>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-red-900 md:text-5xl">
                The Siege of Constantinople
              </h1>
              <div className="mt-2 text-lg text-stone-700">12 April 1204</div>
              <div className="mt-7">
                <PrimaryButton onClick={() => setStep('count')}>Begin the Siege</PrimaryButton>
              </div>
            </div>
          </Panel>
        )

      case 'count':
        return (
          <Panel wide>
            <StepHeading
              step={1}
              of={3}
              title="How many crusaders are attacking?"
              blurb="The roster is set in order, so a count of fifteen means the first fifteen names."
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <NumberField value={countText} onChange={setCountText} min={1} max={52} autoFocus />
              <div className="flex flex-wrap gap-2">
                {[8, 12, 16, 20, 24, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCountText(String(n))}
                    className={`rounded-lg border-2 px-4 py-2 text-lg font-bold transition-colors ${
                      count === n
                        ? 'border-red-800 bg-red-800 text-amber-50'
                        : 'border-stone-400 text-stone-700 hover:bg-white/60'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 max-h-40 overflow-y-auto rounded-lg border border-stone-400/50 bg-white/50 p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-700">
                {preview.map((c, i) => (
                  <span key={c.id}>
                    <span className="text-stone-400">{i + 1}.</span> {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <PrimaryButton
                onClick={() => {
                  setRoster(preview)
                  setStep('refuse')
                }}
              >
                {count} crusader{count === 1 ? '' : 's'} — continue
              </PrimaryButton>
            </div>
          </Panel>
        )

      case 'refuse':
        return (
          <Panel wide>
            <StepHeading
              step={2}
              of={3}
              title="Does anyone refuse to attack?"
              blurb={`Sitting out costs a crusader 1 fama.${
                round > 1 ? ' This is round two — the choice is open again.' : ''
              }`}
            />
            <div className="mt-6">
              <NameDropdown
                label="Name those who refuse…"
                people={roster}
                selected={refuserIds}
                onToggle={(id) =>
                  setRefuserIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <GhostButton
                onClick={() => {
                  setRefuserIds([])
                  setStep('where')
                }}
              >
                No one refuses
              </GhostButton>
              <PrimaryButton
                disabled={refuserIds.length >= roster.length}
                onClick={() => setStep('where')}
              >
                {refuserIds.length === 0
                  ? 'Continue'
                  : `${attackers.length} still attacking — continue`}
              </PrimaryButton>
            </div>
            {refuserIds.length >= roster.length && (
              <p className="mt-3 text-center text-base text-red-900">
                Everyone has refused. At least one crusader must attack.
              </p>
            )}
          </Panel>
        )

      case 'where':
        return (
          <Panel wide>
            <StepHeading
              step={3}
              of={3}
              title="Where do they attack?"
              blurb={`${attackers.length} crusader${attackers.length === 1 ? '' : 's'} ready.`}
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <button
                onClick={() => finish(() => 'land')}
                className="rounded-xl border-2 border-amber-800/40 bg-amber-50/80 px-6 py-7 text-center transition-colors hover:bg-amber-100"
              >
                <div className="text-4xl">🏰</div>
                <div className="mt-2 text-xl font-bold text-red-900">Land Walls</div>
                <div className="mt-1 text-sm text-stone-600">All against the Theodosian walls</div>
              </button>
              <button
                onClick={() => finish(() => 'sea')}
                className="rounded-xl border-2 border-blue-900/30 bg-sky-50/80 px-6 py-7 text-center transition-colors hover:bg-sky-100"
              >
                <div className="text-4xl">🚢</div>
                <div className="mt-2 text-xl font-bold text-red-900">Sea Walls</div>
                <div className="mt-1 text-sm text-stone-600">All into the Golden Horn</div>
              </button>
              <button
                onClick={() => {
                  const half = Math.floor(attackers.length / 2)
                  setLandText(String(attackers.length - half))
                  setSeaText(String(half))
                  setSmallGroupIds([])
                  setStep('split')
                }}
                className="rounded-xl border-2 border-stone-500/40 bg-stone-50/80 px-6 py-7 text-center transition-colors hover:bg-stone-100"
              >
                <div className="text-4xl">⚔️</div>
                <div className="mt-2 text-xl font-bold text-red-900">Split</div>
                <div className="mt-1 text-sm text-stone-600">Some to each</div>
              </button>
            </div>
          </Panel>
        )

      case 'split': {
        const smallPool = attackers
        const chosen = smallGroupIds
        const ready = splitValid && chosen.length === smallerCount

        // The sea assault needs a Venetian, or Oberto, to pilot. Worth saying
        // before the dice are thrown rather than after.
        const seaGroup = ready
          ? smallerSide === 'sea'
            ? smallPool.filter((p) => chosen.includes(p.id))
            : smallPool.filter((p) => !chosen.includes(p.id))
          : []
        const seaHasCaptain = seaGroup.some(canCaptain)

        return (
          <Panel wide>
            <StepHeading
              title="How does the army split?"
              blurb={`${attackers.length} crusader${attackers.length === 1 ? '' : 's'} to divide between the two walls.`}
            />

            <div className="mt-6 flex flex-wrap items-end justify-center gap-8">
              <label className="text-center">
                <div className="mb-2 text-lg font-bold text-stone-700">🏰 Land walls</div>
                <NumberField value={landText} onChange={setLandText} max={attackers.length} />
              </label>
              <label className="text-center">
                <div className="mb-2 text-lg font-bold text-stone-700">🚢 Sea walls</div>
                <NumberField value={seaText} onChange={setSeaText} max={attackers.length} />
              </label>
            </div>

            {!splitValid && (
              <p className="mt-4 text-center text-base text-red-900">
                The two numbers must add up to {attackers.length}.
              </p>
            )}

            {splitValid && smallerCount > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-center text-lg text-stone-700">
                  Name the {smallerCount} going to the{' '}
                  <strong>{smallerSide === 'land' ? 'land walls' : 'sea walls'}</strong>. The other{' '}
                  {attackers.length - smallerCount} take the{' '}
                  {smallerSide === 'land' ? 'sea walls' : 'land walls'}.
                </p>
                <NameDropdown
                  label={`Choose ${smallerCount}…`}
                  people={smallPool}
                  selected={chosen}
                  limit={smallerCount}
                  onToggle={(id) =>
                    setSmallGroupIds((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                  }
                />
              </div>
            )}

            {ready && seaGroup.length > 0 && !seaHasCaptain && (
              <p className="mt-4 rounded-lg bg-amber-200/70 px-4 py-3 text-center text-base text-amber-950">
                No Venetian and no Oberto of Biandrate in the sea party — there is nobody to
                pilot, so the sea assault will be called off.
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <GhostButton onClick={() => setStep('where')}>Back</GhostButton>
              <PrimaryButton
                disabled={!ready}
                onClick={() =>
                  finish((char) => {
                    const inSmall = chosen.includes(char.id)
                    if (smallerSide === 'land') return inSmall ? 'land' : 'sea'
                    return inSmall ? 'sea' : 'land'
                  })
                }
              >
                Execute the attack
              </PrimaryButton>
            </div>
          </Panel>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1c1512]">
      <CityBackdrop />

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto py-8">
        {body()}
      </div>

      {step === 'title' && (
        <CrusaderCamPanel className="absolute bottom-6 left-6 w-[min(40vw,300px)]" />
      )}

      {round > 1 && step !== 'title' && (
        <div className="pointer-events-none absolute left-6 top-6 rounded-lg bg-black/55 px-4 py-2 text-sm uppercase tracking-[0.2em] text-amber-300">
          Round {round}
        </div>
      )}
    </div>
  )
}
