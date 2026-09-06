/**
 * Screen flow for the siege module.
 *
 *   character select -> attack declaration -> land assault [-> sea assault]
 *   -> first to enter -> results,  or round two, or round three's bribery.
 *
 * The round progression, sit-out penalties, shipwreck fama loss and sack-order
 * calculation are carried over from the original implementation unchanged.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildLandAssault, buildSeaAssault, buildSeaStages } from './game/stages.js'
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
  const [roundQueue, setRoundQueue] = useState([])
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

/**
 * The final stage of each lane, by the label `rules.js` stamps on its rolls.
 * A man who rolled here and failed was on the wall when he did it.
 */
const FINAL_STAGES = new Set(['City Gates', 'Breaking Through'])


  /**
   * Sack order, per the instructor's manual.
   *
   * Four tiers, not three. Everyone who got *into* the city comes first, then
   * everyone who got onto the second land wall or the sea wall without getting
   * in, then everyone else by fama, then the shipwrecked last.
   *
   * That third tier was missing, and it is the one that credits the men who
   * did the dangerous part and fell short. The manual has these students roll
   * afresh against each other; we rank them on the roll they already made,
   * which needs no extra step at the table and rewards the same thing.
   *
   * The fama ordering of the last tier is the point of the whole exercise —
   * it reproduces Robert of Clari's complaint that the rich lords took the
   * spoils and left the common knights nothing.
   */
  const calculateSackOrder = useCallback((playerList) => {
    const insiders = playerList.filter((p) => p.status === 'inside')
    const onWalls = playerList
      .filter((p) => p.status === 'walls')
      .sort((a, b) => (b.wallRoll ?? 0) - (a.wallRoll ?? 0) || b.fama - a.fama)
    const others = playerList.filter(
      (p) => p.status !== 'inside' && p.status !== 'walls' && p.status !== 'shipwrecked'
    )
    const shipwrecked = playerList.filter((p) => p.status === 'shipwrecked')

    const sorted = [
      ...insiders,
      ...onWalls,
      ...others.sort((a, b) => b.fama - a.fama),
      ...shipwrecked,
    ]

    setSackOrder(
      sorted.map((p, idx) => ({
        position: idx + 1,
        name: p.name,
        faction: p.faction,
        status: p.status,
      }))
    )
  }, [])

  const finishRound = useCallback(
    (queue) => {
      const updatedPlayers = players.map((p) => ({ ...p }))
      let firstName = firstToEnter
      let firstLane = 'land'

      queue.forEach((item) => {
        if (item.type === 'roll' && item.playerId) {
          const idx = updatedPlayers.findIndex((p) => p.id === item.playerId)
          if (idx === -1) return
          updatedPlayers[idx].rollHistory.push(item)

          if (item.enteredCity) {
            updatedPlayers[idx].status = 'inside'
            if (!firstName) {
              firstName = updatedPlayers[idx].name
              firstLane = item.stage === 'Breaking Through' ? 'sea' : 'land'
            }
          } else if (item.shipSunk) {
            updatedPlayers[idx].status = 'shipwrecked'
            updatedPlayers[idx].fama = Math.max(0, updatedPlayers[idx].fama - 1)
          } else if (FINAL_STAGES.has(item.stage)) {
            // He rolled in the last stage, so he was standing on the second
            // land wall or on the sea wall when he failed. That is further
            // than anyone below him got, and the sack order should say so.
            if (updatedPlayers[idx].status === 'ready') {
              updatedPlayers[idx].status = 'walls'
              updatedPlayers[idx].wallRoll = item.total ?? item.roll ?? 0
            }
          }
        }
      })

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
        const penalizedPlayers = updatedPlayers.map((p) => {
          if (p.attackChoice === 'sit_out') {
            return { ...p, fama: Math.max(0, p.fama - 1), attackChoice: null }
          }
          return { ...p, attackChoice: null }
        })
        setPlayers(penalizedPlayers)
        setCurrentRound((r) => r + 1)
        setGameState('opening')
      } else {
        setPlayers(updatedPlayers)
        setGameState('bribery')
      }
    },
    [players, currentRound, firstToEnter, calculateSackOrder]
  )

  /* --------------------------------------------------------- execution */

  const executeAttack = useCallback((source) => {
    const attackers = source.filter((p) => p.attackChoice !== 'sit_out')

    if (attackers.length === 0) {
      setFinalSummary(['No one attacked! The crusade has failed.'])
      setGameState('results')
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
    setRoundQueue(queue)
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
      finishRound(queue)
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
      finishRound(roundQueue)
    } else {
      setGameState(SEQUENCE_SCREENS[rest[0]])
    }
  }, [pendingSequences, finishRound, roundQueue])



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
    setRoundQueue([])
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
