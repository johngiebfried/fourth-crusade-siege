/**
 * Screen flow for the siege module.
 *
 *   character select -> attack declaration -> land assault [-> sea assault]
 *   -> first to enter -> results,  or round two, or round three's bribery.
 *
 * The round progression, sit-out penalties, shipwreck fama loss and sack-order
 * calculation are carried over from the original implementation unchanged.
 */

import { useCallback, useMemo, useState } from 'react'
import allCharacters from './data/characters.json'
import { buildLandAssault, buildSeaAssault } from './game/stages.js'
import CharacterSelect from './screens/CharacterSelect.jsx'
import AttackDeclaration from './screens/AttackDeclaration.jsx'
import LandAssault from './screens/LandAssault.jsx'
import FirstToEnter from './screens/FirstToEnter.jsx'
import Results from './screens/Results.jsx'
import Bribery from './screens/Bribery.jsx'
import GateOpening from './screens/GateOpening.jsx'

export default function App() {
  const [gameState, setGameState] = useState('character-select')
  const [players, setPlayers] = useState([])
  const [currentRound, setCurrentRound] = useState(1)
  const [cityFallen, setCityFallen] = useState(false)
  const [firstToEnter, setFirstToEnter] = useState(null)
  const [sackOrder, setSackOrder] = useState([])
  const [finalSummary, setFinalSummary] = useState([])

  const [landStages, setLandStages] = useState([])
  const [roundQueue, setRoundQueue] = useState([])
  const [pendingEntrant, setPendingEntrant] = useState(null)

  /* ------------------------------------------------------------- setup */

  const startGame = useCallback((selectedIds) => {
    const initialPlayers = allCharacters
      .filter((c) => selectedIds.includes(c.id))
      .map((char) => ({
        ...char,
        attackChoice: null,
        shipId: null,
        stage: 0,
        status: 'ready',
        rollHistory: [],
      }))
    setPlayers(initialPlayers)
    setGameState('attack-choice')
  }, [])

  const chooseAttackType = useCallback((playerId, type) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, attackChoice: type } : p))
    )
  }, [])

  /* ------------------------------------------------- round resolution */

  const calculateSackOrder = useCallback((playerList) => {
    const insiders = playerList.filter((p) => p.status === 'inside')
    const others = playerList.filter(
      (p) => p.status !== 'inside' && p.status !== 'shipwrecked'
    )
    const shipwrecked = playerList.filter((p) => p.status === 'shipwrecked')

    const sorted = [...insiders, ...others.sort((a, b) => b.fama - a.fama), ...shipwrecked]

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

      queue.forEach((item) => {
        if (item.type === 'roll' && item.playerId) {
          const idx = updatedPlayers.findIndex((p) => p.id === item.playerId)
          if (idx === -1) return
          updatedPlayers[idx].rollHistory.push(item)

          if (item.enteredCity) {
            updatedPlayers[idx].status = 'inside'
            if (!firstName) firstName = updatedPlayers[idx].name
          } else if (item.shipSunk) {
            updatedPlayers[idx].status = 'shipwrecked'
            updatedPlayers[idx].fama = Math.max(0, updatedPlayers[idx].fama - 1)
          }
        }
      })

      const insiders = updatedPlayers.filter((p) => p.status === 'inside')

      if (insiders.length > 0) {
        setFirstToEnter(firstName)
        setCityFallen(true)
        calculateSackOrder(updatedPlayers)
        setFinalSummary([
          `VICTORY! ${insiders.length} crusaders entered the city`,
          'Constantinople has fallen to the Fourth Crusade!',
        ])
        setPlayers(updatedPlayers)
        setPendingEntrant(firstName)
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
        setGameState('attack-choice')
      } else {
        setPlayers(updatedPlayers)
        setGameState('bribery')
      }
    },
    [players, currentRound, firstToEnter, calculateSackOrder]
  )

  /* --------------------------------------------------------- execution */

  const executeAttack = useCallback(() => {
    const attackers = players.filter((p) => p.attackChoice !== 'sit_out')

    if (attackers.length === 0) {
      setFinalSummary(['No one attacked! The crusade has failed.'])
      setGameState('results')
      return
    }

    const queue = []

    const landAttackers = attackers
      .filter((p) => p.attackChoice === 'land')
      .sort((a, b) => b.fama - a.fama)

    let stages = []
    if (landAttackers.length > 0) {
      const land = buildLandAssault(landAttackers)
      stages = land.stages
      queue.push(...land.queue)
    }

    const seaAttackers = attackers.filter((p) => p.attackChoice === 'sea')
    if (seaAttackers.length > 0) {
      // The sea sequence's own visuals are the next slice of work. Its rolls
      // are still generated by the same rules code and folded into the round,
      // so the game resolves correctly in the meantime.
      const sea = buildSeaAssault(seaAttackers)
      queue.push(...sea.queue)
    }

    setLandStages(stages)
    setRoundQueue(queue)

    if (stages.length > 0) {
      setGameState('land-assault')
    } else {
      finishRound(queue)
    }
  }, [players, finishRound])

  const onLandComplete = useCallback(() => {
    finishRound(roundQueue)
  }, [finishRound, roundQueue])

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
      'The crusade faces disaster!',
    ])
    setGameState('results')
  }, [])

  /* ------------------------------------------------------------- reset */

  const resetGame = useCallback(() => {
    setGameState('character-select')
    setPlayers([])
    setCurrentRound(1)
    setCityFallen(false)
    setFirstToEnter(null)
    setSackOrder([])
    setFinalSummary([])
    setLandStages([])
    setRoundQueue([])
    setPendingEntrant(null)
  }, [])

  /* ------------------------------------------------------------ render */

  const charactersForSelect = useMemo(() => allCharacters, [])

  switch (gameState) {
    case 'character-select':
      return <CharacterSelect allCharacters={charactersForSelect} onStart={startGame} />

    case 'attack-choice':
      return (
        <AttackDeclaration
          players={players}
          currentRound={currentRound}
          onChoose={chooseAttackType}
          onExecute={executeAttack}
        />
      )

    case 'land-assault':
      return <LandAssault stages={landStages} onComplete={onLandComplete} />

    case 'first-to-enter':
      return (
        <FirstToEnter name={pendingEntrant} onContinue={() => setGameState('results')} />
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
