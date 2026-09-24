/**
 * Screen flow for the siege module.
 *
 *   character select -> attack declaration -> land assault [-> sea assault]
 *   -> first to enter -> results,  or round two, or round three's bribery.
 *
 * The dice are the original's, unchanged. What the game does with them — who
 * got where, who pays fama, the sack order — lives in `game/siege.js`, where
 * two of the original's faults are fixed and the first-assault fama penalty
 * follows the Instructor's Manual. See that file.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildLandAssault, buildSeaAssault, buildSeaStages } from './game/stages.js'
import { carryRound, resolveRound, sackOrder as orderTheSack } from './game/siege.js'
import Opening from './screens/Opening.jsx'
import LandAssault from './screens/LandAssault.jsx'
import SeaAssault from './screens/SeaAssault.jsx'
import FirstToEnter from './screens/FirstToEnter.jsx'
import Results from './screens/Results.jsx'
import { CancelledNotice } from './screens/AssaultHud.jsx'
import Bribery from './screens/Bribery.jsx'
import GateOpening from './screens/GateOpening.jsx'

/**
 * Runs the round's rolls once, on mount. The opening now decides everything,
 * so there is no screen between choosing and executing.
 */
function RunRound({ players, onRun }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    onRun(players)
  }, [players, onRun])
  return <div className="h-screen w-screen bg-[#1c1512]" />
}

/**
 * A rehearsal jump: `?screen=bribery`, `?screen=results`, and so on.
 *
 * For an instructor setting up before a class, and for anyone working on a
 * screen that sits four minutes of dice behind the title. It has to be typed
 * into the address bar deliberately — no link reaches it — and the screens it
 * lands on have no round behind them, so they show empty state. It cannot be
 * used to skip a real siege: `Begin the Siege` starts a fresh one either way.
 */
const REHEARSAL_SCREENS = new Set([
  'opening',
  'bribery',
  'gate-opening',
  'first-to-enter',
  'results',
])

function rehearsalScreen() {
  if (typeof location === 'undefined') return null
  const want = new URLSearchParams(location.search).get('screen')
  return want && REHEARSAL_SCREENS.has(want) ? want : null
}

export default function App() {
  const [gameState, setGameState] = useState(rehearsalScreen() ?? 'opening')
  const [players, setPlayers] = useState([])
  const [roster, setRoster] = useState(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [cityFallen, setCityFallen] = useState(false)
  const [firstToEnter, setFirstToEnter] = useState(null)
  const [pendingEntrantLane, setPendingEntrantLane] = useState('land')
  const [sackOrder, setSackOrder] = useState([])
  const [finalSummary, setFinalSummary] = useState([])

  const [landStages, setLandStages] = useState([])
  const [seaAssault, setSeaAssault] = useState(null)
  const [seaStages, setSeaStages] = useState([])
  // The round's rolls and the ships they were rolled on, kept together: a sunk
  // ship's passengers appear only in its manifest, never in the rolls.
  const [round, setRound] = useState({ queue: [], ships: [] })
  const [pendingEntrant, setPendingEntrant] = useState(null)
  // Sequences still to play this round, in order. Emptied as each finishes.
  const [pendingSequences, setPendingSequences] = useState([])

  /* ------------------------------------------------------------- setup */

  /**
   * The opening hands back a fully-decided player list: everyone's
   * attackChoice is already 'land', 'sea' or 'sit_out'. There is no separate
   * declaration screen any more.
   */
  const beginRound = useCallback((decidedPlayers, chosenRoster) => {
    setRoster(chosenRoster)
    setPlayers(decidedPlayers)
    setGameState('execute')
  }, [])

  /* ------------------------------------------------- round resolution */

  /** Sack order, per the manual. The rules for it live in `game/siege.js`. */
  const calculateSackOrder = useCallback((playerList) => {
    setSackOrder(orderTheSack(playerList))
  }, [])

  const finishRound = useCallback(
    ({ queue, ships }) => {
      const { players: updatedPlayers, first } = resolveRound(players, queue, { ships })
      const firstName = first?.name ?? null
      const firstLane = first?.lane ?? 'land'

      const insiders = updatedPlayers.filter((p) => p.status === 'inside')

      if (insiders.length > 0) {
        setFirstToEnter(firstName)
        setCityFallen(true)
        calculateSackOrder(updatedPlayers)
        setFinalSummary([
          `${insiders.length} crusader${insiders.length === 1 ? '' : 's'} entered the city`,
          'Constantinople has fallen to the Fourth Crusade.',
        ])
        setPlayers(updatedPlayers)
        setPendingEntrant(firstName)
        setPendingEntrantLane(firstLane)
        setGameState('first-to-enter')
        return
      }

      if (currentRound < 2) {
        // Round one failed: everyone who joined it pays a point, per the manual.
        const penalizedPlayers = carryRound(updatedPlayers)
        setPlayers(penalizedPlayers)
        /*
         * The roster has to carry round one forward, not just the boon.
         *
         * Round two goes back through `Opening`, which rebuilds the player
         * list from whatever roster it is handed. That roster was last set
         * before round one rolled a single die, so everything round one
         * decided — who reached the walls, who was shipwrecked, the fama lost
         * for a failed assault or for losing a ship — was thrown away the moment
         * round two began. Every crusader arrived at the sack order marked
         * "Outside the walls", which is the one thing the sack order exists to
         * distinguish, and the two fama penalties were quietly refunded.
         */
        setRoster(penalizedPlayers)
        setCurrentRound((r) => r + 1)
        setGameState('opening')
      } else {
        setPlayers(updatedPlayers)
        setGameState('bribery')
      }
    },
    [players, currentRound, calculateSackOrder]
  )

  /* --------------------------------------------------------- execution */

  const executeAttack = useCallback((source) => {
    const attackers = source.filter((p) => p.attackChoice !== 'sit_out')

    // An assault nobody joined is a failed assault. It used to end the whole
    // game on the spot — skipping round two, and the bribe, entirely.
    if (attackers.length === 0) {
      finishRound({ queue: [], ships: [] })
      return
    }

    const queue = []
    const sequences = []

    const landAttackers = attackers
      .filter((p) => p.attackChoice === 'land')
      .sort((a, b) => b.fama - a.fama)

    let stages = []
    if (landAttackers.length > 0) {
      const land = buildLandAssault(landAttackers)
      stages = land.stages
      queue.push(...land.queue)
      if (stages.length > 0) sequences.push('land')
    }

    const seaAttackers = attackers.filter((p) => p.attackChoice === 'sea')
    let sea = null
    let seaStageList = []
    if (seaAttackers.length > 0) {
      sea = buildSeaAssault(seaAttackers)
      seaStageList = buildSeaStages(sea)
      queue.push(...sea.queue)
      // A sea attack with no Venetian and no Oberto is cancelled outright by
      // the rules; it gets a notice rather than a sequence.
      sequences.push(sea.cancelled || seaStageList.length === 0 ? 'sea-cancelled' : 'sea')
    }

    setLandStages(stages)
    setSeaAssault(sea)
    setSeaStages(seaStageList)
    const thisRound = { queue, ships: sea?.ships ?? [] }
    setRound(thisRound)
    setPendingSequences(sequences)

    if (sequences.length > 0) {
      setGameState(
        sequences[0] === 'land'
          ? 'land-assault'
          : sequences[0] === 'sea'
            ? 'sea-assault'
            : 'sea-cancelled'
      )
    } else {
      finishRound(thisRound)
    }
  }, [finishRound])

  const SEQUENCE_SCREENS = {
    land: 'land-assault',
    sea: 'sea-assault',
    'sea-cancelled': 'sea-cancelled',
  }

  /**
   * Move to the next sequence of this round, or resolve the round once they
   * have all played. Kept free of side effects inside a state updater, which
   * StrictMode would run twice.
   */
  const nextSequence = useCallback(() => {
    const rest = pendingSequences.slice(1)
    setPendingSequences(rest)
    if (rest.length === 0) {
      finishRound(round)
    } else {
      setGameState(SEQUENCE_SCREENS[rest[0]])
    }
  }, [pendingSequences, finishRound, round])



  /* ----------------------------------------------------------- bribery */

  const confirmBribe = useCallback(() => {
    setGameState('gate-opening')
  }, [])

  const afterGate = useCallback(() => {
    const updated = players.map((p) => ({ ...p }))
    setCityFallen(true)
    calculateSackOrder(updated)
    setFinalSummary([
      'Both assaults failed. The gate was opened by bribery.',
      'Constantinople has fallen to the Fourth Crusade — bought, not stormed.',
      'No crusader claims the honour of being first over the wall.',
    ])
    setGameState('results')
  }, [players, calculateSackOrder])

  const declineBribe = useCallback(() => {
    setFinalSummary([
      'Two attacks have failed and no one would pay.',
      'The crusade faces disaster.',
    ])
    setGameState('results')
  }, [])

  /* ------------------------------------------------------------- reset */

  const resetGame = useCallback(() => {
    setGameState('opening')
    setPlayers([])
    setRoster(null)
    setCurrentRound(1)
    setCityFallen(false)
    setFirstToEnter(null)
    setSackOrder([])
    setFinalSummary([])
    setLandStages([])
    setSeaAssault(null)
    setSeaStages([])
    setRound({ queue: [], ships: [] })
    setPendingSequences([])
    setPendingEntrant(null)
  }, [])

  /* ------------------------------------------------------------ render */

  switch (gameState) {
    case 'opening':
      return (
        <Opening
          key={`round-${currentRound}`}
          round={currentRound}
          roster={roster}
          onComplete={beginRound}
        />
      )

    case 'execute':
      return <RunRound players={players} onRun={executeAttack} />

    case 'land-assault':
      return <LandAssault stages={landStages} round={currentRound} onComplete={nextSequence} />

    case 'sea-assault':
      return (
        <SeaAssault
          sea={seaAssault}
          stages={seaStages}
          round={currentRound}
          onComplete={nextSequence}
        />
      )

    case 'sea-cancelled':
      return (
        <CancelledNotice
          lines={[
            'No ship can be crewed.',
            'The sea assault needs a Venetian captain, or Oberto of Biandrate, to pilot. Without one, the ships stay at their moorings.',
          ]}
          onContinue={nextSequence}
        />
      )

    case 'first-to-enter':
      return (
        <FirstToEnter
          name={pendingEntrant}
          lane={pendingEntrantLane}
          faction={players.find((p) => p.name === pendingEntrant)?.faction}
          onContinue={() => setGameState('results')}
        />
      )

    case 'bribery':
      return <Bribery onConfirm={confirmBribe} onDecline={declineBribe} />

    case 'gate-opening':
      return <GateOpening onDone={afterGate} />

    case 'results':
      return (
        <Results
          cityFallen={cityFallen}
          firstToEnter={firstToEnter}
          finalSummary={finalSummary}
          sackOrder={sackOrder}
          onReset={resetGame}
        />
      )

    default:
      return null
  }
}
