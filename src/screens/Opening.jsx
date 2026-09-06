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
import { Panel, Eyebrow, Heading, PrimaryButton, GhostButton, InkIcon } from './ui.jsx'
import { FACTIONS } from '../three/factions.js'

/** The five factions, in the order the boon step lists them. */
const FACTION_ORDER = Object.keys(FACTIONS)

/* -------------------------------------------------------------- fragments */

function StepHeading({ step, of, title, blurb }) {
  return (
    <div className="text-center">
      {step && (
        <Eyebrow>
          Step {step} of {of}
        </Eyebrow>
      )}
      <Heading>{title}</Heading>
      {blurb && <p className="mt-2 text-lg text-stone-700">{blurb}</p>}
    </div>
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
        className="quill-button flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-lg font-normal"
      >
        <span>
          {selected.length === 0
            ? label
            : `${selected.length} selected${typeof limit === 'number' ? ` of ${limit}` : ''}`}
        </span>
        <span className="text-stone-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="vellum ink-frame absolute z-20 mt-2 max-h-[42vh] w-full overflow-y-auto">
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
                      ? 'cursor-not-allowed opacity-45'
                      : 'text-stone-800 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
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
                className="quill-button-primary px-3 py-1 text-sm"
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
      className="vellum w-32 border-2 px-4 py-3 text-center text-3xl font-bold outline-none"
      style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
    />
  )
}

/* ------------------------------------------------------------------ screen */

export default function Opening({ round = 1, roster: existingRoster = null, onComplete }) {
  // Scheme B: the title is one of the beats the game already spends waiting,
  // so it carries a passage rather than dead time.

  const [step, setStep] = useState(existingRoster ? 'refuse' : 'title')
  const [countText, setCountText] = useState('12')
  const [roster, setRoster] = useState(existingRoster ?? [])
  const [refuserIds, setRefuserIds] = useState([])
  // The speech boon. Awarded once, before the first attack, and it holds for
  // the whole siege — so on round two it is read back off the roster rather
  // than asked again.
  const [boonFaction, setBoonFaction] = useState(
    existingRoster?.find((c) => c.bonus > 0)?.faction ?? 'none'
  )
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
      // The boon rides on the roster, not on component state: the roster is
      // what comes back as `existingRoster` for round two, so baking it in
      // here is what makes it hold "for the siege" rather than for one round.
      const withBoon = roster.map((char) => ({
        ...char,
        bonus: boonFaction !== 'none' && char.faction === boonFaction ? 1 : 0,
      }))
      const players = withBoon.map((char) => ({
        ...char,
        attackChoice: refuserIds.includes(char.id) ? 'sit_out' : assign(char),
        shipId: null,
        stage: 0,
        status: 'ready',
        rollHistory: [],
      }))
      onComplete(players, withBoon)
    },
    [roster, refuserIds, boonFaction, onComplete]
  )

  /* --------------------------------------------------------------- steps */

  const body = () => {
    switch (step) {
      case 'title':
        return (
          // Deliberately the smallest leaf in the game. It is the only thing
          // between the class and the model of the city they are about to
          // attack, and at 16:9 the full-sized panel covered the Golden Horn
          // and everything north of the Mese.
          <Panel narrow className="py-5">
            <div className="text-center">
              <Eyebrow>The Fourth Crusade</Eyebrow>
              <h1
                className="display mt-2 text-3xl font-bold md:text-4xl"
                style={{ color: 'var(--rubric)' }}
              >
                The Siege of Constantinople
              </h1>
              <div className="mt-1.5" style={{ color: 'var(--ink-soft)' }}>
                12 April 1204
              </div>
              <div className="mt-5">
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
                    className={`quill-button tally px-4 py-2 text-lg ${
                      count === n ? 'quill-button-selected' : ''
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="ink-frame-light mt-5 max-h-40 overflow-y-auto p-3" style={{ background: 'rgba(247,238,217,0.6)' }}>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-700">
                {preview.map((c, i) => (
                  <span key={c.id}>
                    <span style={{ opacity: 0.5 }}>{i + 1}.</span> {c.name}
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
              of={round > 1 ? 3 : 4}
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
                  setStep(round > 1 ? 'where' : 'boon')
                }}
              >
                No one refuses
              </GhostButton>
              <PrimaryButton
                disabled={refuserIds.length >= roster.length}
                onClick={() => setStep(round > 1 ? 'where' : 'boon')}
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

      case 'boon': {
        // The speech before the assault. Whichever faction gave the most
        // rousing one adds 1 to every die its members roll for the whole
        // siege — the mechanical payoff for a piece of student work that
        // otherwise leaves no trace in the model.
        const options = [
          ['none', 'No faction won the boon'],
          ...FACTION_ORDER.map((f) => [f, f]),
        ]
        return (
          <Panel wide>
            <StepHeading
              step={3}
              of={4}
              title="Did a speech win a faction the boon?"
              blurb="The most rousing speech adds 1 to every die that faction rolls, for the whole siege."
            />

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {options.map(([value, label]) => {
                const on = boonFaction === value
                const n = value === 'none' ? 0 : roster.filter((c) => c.faction === value).length
                return (
                  <button
                    key={value}
                    onClick={() => setBoonFaction(value)}
                    className={`quill-button px-5 py-3 text-left text-lg ${
                      on ? 'quill-button-selected' : ''
                    }`}
                  >
                    {label}
                    {value !== 'none' && (
                      <span className="tally ml-2 text-sm opacity-70">
                        {n} in the roster
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="mt-5 text-center text-base" style={{ color: 'var(--ink-soft)' }}>
              A six raised to a seven changes no outcome — it only decides who gets over first.
            </p>

            <div className="mt-7 flex justify-center">
              <PrimaryButton onClick={() => setStep('where')}>
                {boonFaction === 'none'
                  ? 'No boon — continue'
                  : `${boonFaction} carry the boon — continue`}
              </PrimaryButton>
            </div>
          </Panel>
        )
      }

      case 'where':
        return (
          <Panel wide>
            <StepHeading
              step={round > 1 ? 3 : 4}
              of={round > 1 ? 3 : 4}
              title="Where do they attack?"
              blurb={`${attackers.length} crusader${attackers.length === 1 ? '' : 's'} ready.`}
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {/* Drawn in ink, not set in emoji. A colour bitmap from 2015 in
                  the middle of a manuscript is the loudest modern note a page
                  can strike, and no amount of vellum around it helps. */}
              <button onClick={() => finish(() => 'land')} className="quill-button px-6 py-6">
                <InkIcon name="wall" size={58} className="mx-auto" />
                <div className="mt-2 text-xl font-bold">Land Walls</div>
                <div className="mt-1 text-sm opacity-75">All against the Theodosian walls</div>
              </button>
              <button onClick={() => finish(() => 'sea')} className="quill-button px-6 py-6">
                <InkIcon name="ship" size={58} className="mx-auto" />
                <div className="mt-2 text-xl font-bold">Sea Walls</div>
                <div className="mt-1 text-sm opacity-75">All into the Golden Horn</div>
              </button>
              <button
                onClick={() => {
                  const half = Math.floor(attackers.length / 2)
                  setLandText(String(attackers.length - half))
                  setSeaText(String(half))
                  setSmallGroupIds([])
                  setStep('split')
                }}
                className="quill-button px-6 py-6"
              >
                <InkIcon name="swords" size={58} className="mx-auto" />
                <div className="mt-2 text-xl font-bold">Split</div>
                <div className="mt-1 text-sm opacity-75">Some to each</div>
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
              <p className="ink-frame-light mt-4 px-4 py-3 text-center text-base" style={{ background: 'rgba(201,162,74,0.18)' }}>
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

      {/* Bottom left. Both bottom corners cost something — this one hides a
          stretch of sea wall that repeats along the whole shore, the other
          hides Hagia Sophia and the palace on the point, which do not. */}
      {step === 'title' && (
        <CrusaderCamPanel className="absolute bottom-6 left-6 w-[min(40vw,300px)]" />
      )}

      {round > 1 && step !== 'title' && (
        <div className="manuscript-scope vellum ink-frame-light pointer-events-none absolute left-6 top-6 px-4 py-2">
          <span className="rubric">Round {round}</span>
        </div>
      )}
    </div>
  )
}
