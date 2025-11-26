import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const SiegeOfConstantinople = () => {
  const [gameState, setGameState] = useState('character-select'); // character-select, attack-choice, rolling, results
  const [allCharacters] = useState([
    { id: 1, name: 'Boniface of Montferrat', faction: 'Imperial', fama: 10, bonus: 0 },
    { id: 2, name: 'Enrico Dandolo', faction: 'Venetian', fama: 10, bonus: 0 },
    { id: 3, name: 'Baldwin of Flanders', faction: 'N. French', fama: 6, bonus: 0 },
    { id: 4, name: 'Bishop Nivelons of Soissons', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 5, name: 'Robert of Clari', faction: 'Indeterminate', fama: 1, bonus: 0 },
    { id: 6, name: 'Louis of Blois', faction: 'N. French', fama: 5, bonus: 0 },
    { id: 7, name: 'Angelo Falier', faction: 'Venetian', fama: 4, bonus: 0 },
    { id: 8, name: 'John Faicete of Acre', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 9, name: 'Hugh of Saint-Pol', faction: 'N. French', fama: 4, bonus: 0 },
    { id: 10, name: 'Anna/Agnes of France', faction: 'Indeterminate', fama: 7, bonus: 0 },
    { id: 11, name: 'Oberto II of Biandrate', faction: 'Imperial', fama: 3, bonus: 0 },
    { id: 12, name: 'Martin of Parisis', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 13, name: 'Pantaleone Barbo', faction: 'Venetian', fama: 4, bonus: 0 },
    { id: 14, name: 'Theodore Branas', faction: 'Indeterminate', fama: 3, bonus: 0 },
    { id: 15, name: 'Geoffrey of Villehardouin', faction: 'N. French', fama: 4, bonus: 0 },
    { id: 16, name: 'Berthold of Katzenellenbogen', faction: 'Imperial', fama: 3, bonus: 0 },
    { id: 17, name: 'Conrad of Halberstadt', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 18, name: 'Marino Zeno', faction: 'Venetian', fama: 3, bonus: 0 },
    { id: 19, name: 'Brother Barozzi', faction: 'Indeterminate', fama: 3, bonus: 0 },
    { id: 20, name: 'Henry of Flanders', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 21, name: 'Peter of Luciendo', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 22, name: 'Pietro Steno', faction: 'Venetian', fama: 1, bonus: 0 },
    { id: 23, name: 'Renier of Travele', faction: 'Indeterminate', fama: 2, bonus: 0 },
    { id: 24, name: 'Conon of Bethune', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 25, name: 'Raimbaut of Vaquiras', faction: 'Imperial', fama: 1, bonus: 0 },
    { id: 26, name: 'Garnier of Troyes', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 27, name: 'Marco Sanudo', faction: 'Venetian', fama: 3, bonus: 0 },
    { id: 28, name: 'Othon of La Roche', faction: 'Indeterminate', fama: 3, bonus: 0 },
    { id: 29, name: 'Peter of Amiens', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 30, name: 'William of Arles', faction: 'Imperial', fama: 3, bonus: 0 },
    { id: 31, name: 'Andrew Valero', faction: 'Venetian', fama: 2, bonus: 0 },
    { id: 32, name: 'Amedee Pofey', faction: 'Indeterminate', fama: 1, bonus: 0 },
    { id: 33, name: 'James of Avesnes', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 34, name: 'Marino Ballaresso', faction: 'Venetian', fama: 3, bonus: 0 },
    { id: 35, name: 'Peter of Bethlehem', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 36, name: 'Piere Vidal', faction: 'Indeterminate', fama: 1, bonus: 0 },
    { id: 37, name: 'Milo of Brebant', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 38, name: 'Raveno della Carceri', faction: 'Imperial', fama: 2, bonus: 0 },
    { id: 39, name: 'Andrea Balduino', faction: 'Venetian', fama: 1, bonus: 0 },
    { id: 40, name: 'Peter of Bracieux', faction: 'N. French', fama: 2, bonus: 0 },
    { id: 41, name: 'Hugh of Saint-Ghislain', faction: 'Clerical', fama: 3, bonus: 0 },
    { id: 42, name: 'Andre of Ureboise', faction: 'Indeterminate', fama: 1, bonus: 0 },
    { id: 43, name: 'Guy of Pallavicini', faction: 'Imperial', fama: 2, bonus: 0 },
    { id: 44, name: 'Matteo Steno', faction: 'Venetian', fama: 2, bonus: 0 },
    { id: 45, name: 'Baldwin of Beauvoir', faction: 'N. French', fama: 1, bonus: 0 },
    { id: 46, name: 'Walon of Dampierre', faction: 'Clerical', fama: 1, bonus: 0 },
    { id: 47, name: 'King Lalibela of Ethiopia', faction: 'Indeterminate', fama: 10, bonus: 0 },
    { id: 48, name: 'Walframe of Gemona', faction: 'Indeterminate', fama: 1, bonus: 0 },
    { id: 49, name: 'Eustace of Flanders', faction: 'N. French', fama: 1, bonus: 0 },
    { id: 50, name: 'Warin of Douai', faction: 'Clerical', fama: 1, bonus: 0 },
    { id: 51, name: 'Henry of Ulmen', faction: 'Imperial', fama: 1, bonus: 0 },
    { id: 52, name: 'Domenico of Constantinople', faction: 'Venetian', fama: 1, bonus: 0 },
  ]);
  
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [rollQueue, setRollQueue] = useState([]);
  const [currentRollIndex, setCurrentRollIndex] = useState(0);
  const [showRollModal, setShowRollModal] = useState(false);
  const [cityFallen, setCityFallen] = useState(false);
  const [firstToEnter, setFirstToEnter] = useState(null);
  const [sackOrder, setSackOrder] = useState([]);
  const [finalSummary, setFinalSummary] = useState([]);
  const [characterPage, setCharacterPage] = useState(0);
  
  const CHARS_PER_PAGE = 20;
  const totalPages = Math.ceil(allCharacters.length / CHARS_PER_PAGE);
  const paginatedCharacters = allCharacters.slice(
    characterPage * CHARS_PER_PAGE,
    (characterPage + 1) * CHARS_PER_PAGE
  );

  // Character Selection
  const toggleCharacter = (charId) => {
    setSelectedCharacters(prev => 
      prev.includes(charId) 
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  };

  const selectAll = () => {
    setSelectedCharacters(allCharacters.map(c => c.id));
  };

  const clearAll = () => {
    setSelectedCharacters([]);
  };

  const startGame = () => {
    if (selectedCharacters.length === 0) {
      alert('Please select at least one character!');
      return;
    }
    
    const initialPlayers = allCharacters
      .filter(c => selectedCharacters.includes(c.id))
      .map(char => ({
        ...char,
        attackChoice: null,
        shipId: null,
        stage: 0,
        status: 'ready',
        rollHistory: []
      }));
    
    setPlayers(initialPlayers);
    setGameState('attack-choice');
  };

  // Attack Selection
  const chooseAttackType = (playerId, type) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, attackChoice: type } : p
    ));
  };

  const rollDice = () => Math.floor(Math.random() * 6) + 1;

  const executeAttack = () => {
    const attackers = players.filter(p => p.attackChoice !== 'sit_out');
    
    if (attackers.length === 0) {
      setFinalSummary(['No one attacked! The crusade has failed.']);
      setGameState('results');
      return;
    }

    // Build queue of all rolls
    const queue = [];
    
    queue.push({
      type: 'announcement',
      message: `ROUND ${currentRound} BEGINS`,
      subtitle: `${attackers.length} crusaders charge the walls!`
    });

    // Land Wall Attacks
    const landAttackers = attackers.filter(p => p.attackChoice === 'land').sort((a, b) => b.fama - a.fama);
    if (landAttackers.length > 0) {
      queue.push({
        type: 'announcement',
        message: '🏰 LAND WALL ASSAULT',
        subtitle: 'The crusaders charge the formidable Theodosian Walls'
      });
      
      addLandAttackRolls(queue, landAttackers);
    }

    // Sea Wall Attacks
    const seaAttackers = attackers.filter(p => p.attackChoice === 'sea');
    if (seaAttackers.length > 0) {
      queue.push({
        type: 'announcement',
        message: '🚢 SEA WALL ASSAULT',
        subtitle: 'Venetian ships approach the Golden Horn defenses'
      });
      
      addSeaAttackRolls(queue, seaAttackers);
    }

    // Final results
    queue.push({
      type: 'final',
      players: [...players]
    });

    setRollQueue(queue);
    setCurrentRollIndex(0);
    setShowRollModal(true);
    setGameState('rolling');
  };

  const addLandAttackRolls = (queue, attackers) => {
    let stage1Survivors = [];
    let stage2Survivors = [];
    
    // Stage 1: First Wall
    queue.push({
      type: 'stage-header',
      message: 'Stage 1: First Wall',
      subtitle: 'Need to roll 5 or higher to scale the outer defenses'
    });
    
    attackers.forEach(attacker => {
      const roll = rollDice();
      const total = roll + attacker.bonus;
      const success = total >= 5;
      
      queue.push({
        type: 'roll',
        player: attacker.name,
        stage: 'First Wall',
        roll: roll,
        bonus: attacker.bonus,
        total: total,
        threshold: 5,
        success: success,
        message: success ? 'Climbs the first wall!' : 'Repelled by defenders!',
        playerId: attacker.id
      });
      
      if (success) {
        stage1Survivors.push(attacker);
      }
    });

    if (stage1Survivors.length === 0) {
      queue.push({
        type: 'announcement',
        message: '💀 Attack Failed',
        subtitle: 'No one reached the second wall'
      });
      return;
    }

    queue.push({
      type: 'announcement',
      message: '⚡ Breakthrough!',
      subtitle: `${stage1Survivors.length} crusaders reach the second wall`
    });

    // Stage 2: Second Wall
    queue.push({
      type: 'stage-header',
      message: 'Stage 2: Second Wall',
      subtitle: 'Need to roll 6 to breach the massive inner defenses'
    });
    
    stage1Survivors.forEach(attacker => {
      const roll = rollDice();
      const total = roll + attacker.bonus;
      const success = total >= 6;
      
      queue.push({
        type: 'roll',
        player: attacker.name,
        stage: 'Second Wall',
        roll: roll,
        bonus: attacker.bonus,
        total: total,
        threshold: 6,
        success: success,
        message: success ? 'Breaches the inner wall!' : 'Thrown back by Greek defenders!',
        playerId: attacker.id
      });
      
      if (success) {
        stage2Survivors.push(attacker);
      }
    });

    if (stage2Survivors.length === 0) {
      queue.push({
        type: 'announcement',
        message: '💀 Attack Failed',
        subtitle: 'The inner walls held firm'
      });
      return;
    }

    queue.push({
      type: 'announcement',
      message: '⚡ Inner Wall Breached!',
      subtitle: `${stage2Survivors.length} crusaders fight through to the gates`
    });

    // Stage 3: Into the City
    const threshold = Math.max(3, 6 - stage2Survivors.length);
    queue.push({
      type: 'stage-header',
      message: 'Stage 3: City Gates',
      subtitle: `Need to roll ${threshold} or higher (threshold lowers with more attackers)`
    });
    
    let anyoneEntered = false;
    stage2Survivors.forEach(attacker => {
      const roll = rollDice();
      const total = roll + attacker.bonus;
      const success = total >= threshold;
      
      queue.push({
        type: 'roll',
        player: attacker.name,
        stage: 'City Gates',
        roll: roll,
        bonus: attacker.bonus,
        total: total,
        threshold: threshold,
        success: success,
        message: success ? '🎊 BREAKS INTO CONSTANTINOPLE!' : 'Held at the final gates!',
        playerId: attacker.id,
        enteredCity: success
      });
      
      if (success && !anyoneEntered) {
        anyoneEntered = true;
        queue.push({
          type: 'announcement',
          message: '👑 FIRST TO ENTER',
          subtitle: `${attacker.name} is the first crusader into the city!`
        });
      }
    });
  };

  const addSeaAttackRolls = (queue, attackers) => {
    // Venetians AND Oberto can captain ships
    const potentialCaptains = attackers.filter(p => 
      p.faction === 'Venetian' || p.name === 'Oberto II of Biandrate'
    );
    const passengers = attackers.filter(p => 
      p.faction !== 'Venetian' && p.name !== 'Oberto II of Biandrate'
    );
    
    if (potentialCaptains.length === 0) {
      queue.push({
        type: 'announcement',
        message: '⚠️ No Ship Captains Available',
        subtitle: 'Sea wall attack cancelled - need Venetians or Oberto of Biandrate to pilot ships!'
      });
      return;
    }

    // Form ships
    const ships = potentialCaptains.map((captain, idx) => ({
      id: `ship-${idx}`,
      captain: captain,
      passengers: []
    }));

    // Assign passengers to ships (max 3 per ship)
    let currentShipIndex = 0;
    for (const passenger of passengers) {
      // If current ship is full, move to next ship
      if (currentShipIndex < ships.length && ships[currentShipIndex].passengers.length >= 3) {
        currentShipIndex++;
      }
      
      // Add passenger to current ship if there's a ship available
      if (currentShipIndex < ships.length) {
        ships[currentShipIndex].passengers.push(passenger);
      } else {
        // No more ships available - this passenger can't attack
        queue.push({
          type: 'announcement',
          message: `⚠️ ${passenger.name} has no ship`,
          subtitle: 'All ships are full (max 3 passengers each)'
        });
      }
    }

    queue.push({
      type: 'announcement',
      message: '⚓ Ships Formed',
      subtitle: `${ships.length} Venetian ships launch toward the sea walls`
    });

    ships.forEach((ship, shipIdx) => {
      const crew = [ship.captain, ...ship.passengers];
      
      queue.push({
        type: 'announcement',
        message: `Ship ${shipIdx + 1}: ${ship.captain.name}`,
        subtitle: `${crew.length} crusaders aboard`
      });

      // Ship survival roll
      const pilotRoll = rollDice();
      queue.push({
        type: 'roll',
        player: ship.captain.name,
        stage: 'Piloting',
        roll: pilotRoll,
        bonus: 0,
        total: pilotRoll,
        threshold: 2,
        success: pilotRoll > 1,
        message: pilotRoll === 1 ? '💥 SHIP SINKS!' : '✓ Ship reaches the walls',
        playerId: ship.captain.id,
        shipSunk: pilotRoll === 1
      });

      if (pilotRoll === 1) {
        queue.push({
          type: 'announcement',
          message: '🌊 Ship Lost!',
          subtitle: 'All aboard lose 1 fama'
        });
        return;
      }

      // Boarding rolls (only passengers attack, captain pilots)
      if (ship.passengers.length === 0) {
        queue.push({
          type: 'announcement',
          message: '⚠️ No Passengers',
          subtitle: `${ship.captain.name} pilots the ship but has no one to attack the walls`
        });
        return;
      }

      queue.push({
        type: 'stage-header',
        message: 'Boarding the Sea Walls',
        subtitle: 'Need to roll 6 to climb from ship to ramparts'
      });

      const captainTitle = ship.captain.faction === 'Venetian' ? 'Venetian captain' : 'Genoese captain';
      queue.push({
        type: 'announcement',
        message: `⚓ ${ship.captain.name} holds the ship steady`,
        subtitle: `${captainTitle} maintains command while passengers attack`
      });

      let boarders = [];
      ship.passengers.forEach(member => {
        const roll = rollDice();
        const total = roll + member.bonus;
        const success = total >= 6;
        
        queue.push({
          type: 'roll',
          player: member.name,
          stage: 'Boarding',
          roll: roll,
          bonus: member.bonus,
          total: total,
          threshold: 6,
          success: success,
          message: success ? 'Boards the wall!' : 'Falls back to ship!',
          playerId: member.id
        });
        
        if (success) boarders.push(member);
      });

      if (boarders.length === 0) {
        queue.push({
          type: 'announcement',
          message: '💀 Boarding Failed',
          subtitle: 'No one from this ship reached the walls'
        });
        return;
      }

      // Fighting through
      const threshold = Math.max(3, 6 - boarders.length);
      queue.push({
        type: 'stage-header',
        message: 'Fighting Through',
        subtitle: `Need ${threshold}+ to break into the city`
      });

      let anyoneEntered = false;
      boarders.forEach(attacker => {
        const roll = rollDice();
        const total = roll + attacker.bonus;
        const success = total >= threshold;
        
        queue.push({
          type: 'roll',
          player: attacker.name,
          stage: 'Breaking Through',
          roll: roll,
          bonus: attacker.bonus,
          total: total,
          threshold: threshold,
          success: success,
          message: success ? '🎊 BREAKS INTO CONSTANTINOPLE!' : 'Held at the breach!',
          playerId: attacker.id,
          enteredCity: success
        });
        
        if (success && !anyoneEntered) {
          anyoneEntered = true;
          queue.push({
            type: 'announcement',
            message: '👑 FIRST TO ENTER',
            subtitle: `${attacker.name} is the first crusader into the city!`
          });
        }
      });
    });
  };

  const processRollResult = (rollData) => {
    if (rollData.type === 'final') {
      // Process all rolls and determine outcome
      const updatedPlayers = rollData.players.map(p => ({ ...p }));
      
      rollQueue.forEach(item => {
        if (item.type === 'roll' && item.playerId) {
          const playerIdx = updatedPlayers.findIndex(p => p.id === item.playerId);
          if (playerIdx !== -1) {
            updatedPlayers[playerIdx].rollHistory.push(item);
            
            if (item.enteredCity) {
              updatedPlayers[playerIdx].status = 'inside';
              if (!firstToEnter) {
                setFirstToEnter(updatedPlayers[playerIdx].name);
              }
            } else if (item.shipSunk) {
              updatedPlayers[playerIdx].status = 'shipwrecked';
              updatedPlayers[playerIdx].fama = Math.max(0, updatedPlayers[playerIdx].fama - 1);
            }
          }
        }
      });

      // Check victory
      const insiders = updatedPlayers.filter(p => p.status === 'inside');
      if (insiders.length > 0) {
        setCityFallen(true);
        calculateSackOrder(updatedPlayers);
        setFinalSummary([
          `VICTORY! ${insiders.length} crusaders entered the city`,
          'Constantinople has fallen to the Fourth Crusade!'
        ]);
        setPlayers(updatedPlayers);
        setGameState('results');
      } else {
        if (currentRound < 2) {
          // Apply penalties to sitters and reset for next round
          const penalizedPlayers = updatedPlayers.map(p => {
            if (p.attackChoice === 'sit_out') {
              return { ...p, fama: Math.max(0, p.fama - 1), attackChoice: null };
            }
            return { ...p, attackChoice: null };
          });
          
          setPlayers(penalizedPlayers);
          setCurrentRound(prev => prev + 1);
          setGameState('attack-choice');
        } else {
          setFinalSummary([
            'Two attacks have failed.',
            'The crusade faces disaster!',
            'Option: Bribe Greeks to open gates (20 fama collective)'
          ]);
          setPlayers(updatedPlayers);
          setGameState('results');
        }
      }
    }
  };

  const calculateSackOrder = (playerList) => {
    const insiders = playerList.filter(p => p.status === 'inside');
    const others = playerList.filter(p => p.status !== 'inside' && p.status !== 'shipwrecked');
    const shipwrecked = playerList.filter(p => p.status === 'shipwrecked');
    
    const sorted = [
      ...insiders,
      ...others.sort((a, b) => b.fama - a.fama),
      ...shipwrecked
    ];
    
    setSackOrder(sorted.map((p, idx) => ({
      position: idx + 1,
      name: p.name,
      faction: p.faction,
      status: p.status
    })));
  };

  const advanceRoll = () => {
    const current = rollQueue[currentRollIndex];
    
    if (current.type === 'final') {
      processRollResult(current);
      setShowRollModal(false);
      // Don't set state here - let processRollResult determine the correct next state
      return;
    }

    if (currentRollIndex < rollQueue.length - 1) {
      setCurrentRollIndex(prev => prev + 1);
    }
  };

  const getCurrentRoll = () => {
    return rollQueue[currentRollIndex];
  };

  const resetGame = () => {
    setGameState('character-select');
    setSelectedCharacters([]);
    setPlayers([]);
    setCurrentRound(1);
    setRollQueue([]);
    setCurrentRollIndex(0);
    setShowRollModal(false);
    setCityFallen(false);
    setFirstToEnter(null);
    setSackOrder([]);
    setFinalSummary([]);
    setCharacterPage(0);
  };

  // RENDER: Character Selection
  if (gameState === 'character-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-red-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-red-900 mb-4">⚔️ Siege of Constantinople ⚔️</h1>
            <p className="text-xl text-gray-700 mb-2">April 12, 1204</p>
            <p className="text-gray-600">Select characters participating in this game</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Characters ({selectedCharacters.length} of {allCharacters.length} selected)
              </h2>
              <div className="space-x-2">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setCharacterPage(prev => Math.max(0, prev - 1))}
                disabled={characterPage === 0}
                className={`px-4 py-2 rounded ${
                  characterPage === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                ← Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {characterPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCharacterPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={characterPage === totalPages - 1}
                className={`px-4 py-2 rounded ${
                  characterPage === totalPages - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Next →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {paginatedCharacters.map(char => (
                <label
                  key={char.id}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCharacters.includes(char.id)
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(char.id)}
                    onChange={() => toggleCharacter(char.id)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <div className="font-bold text-gray-800">{char.name}</div>
                    <div className="text-sm text-gray-600">{char.faction}</div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={startGame}
              disabled={selectedCharacters.length === 0}
              className={`w-full py-4 rounded-lg text-xl font-bold transition-colors ${
                selectedCharacters.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}
            >
              {selectedCharacters.length === 0
                ? 'Select at least one character'
                : `🏰 Begin Siege with ${selectedCharacters.length} Crusaders`
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Attack Choice
  if (gameState === 'attack-choice') {
    const needsChoice = players.filter(p => p.attackChoice === null);
    const landCount = players.filter(p => p.attackChoice === 'land').length;
    const seaCount = players.filter(p => p.attackChoice === 'sea').length;
    const sitCount = players.filter(p => p.attackChoice === 'sit_out').length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-red-900">Round {currentRound}</h1>
            <p className="text-xl text-gray-700 mt-2">Choose Attack Strategy</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl mb-1">🏰</div>
                <div className="text-sm text-gray-600">Land Walls</div>
                <div className="text-2xl font-bold text-amber-700">{landCount}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">🚢</div>
                <div className="text-sm text-gray-600">Sea Walls</div>
                <div className="text-2xl font-bold text-blue-700">{seaCount}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">⏸️</div>
                <div className="text-sm text-gray-600">Sitting Out</div>
                <div className="text-2xl font-bold text-gray-700">{sitCount}</div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.map(player => (
                <div key={player.id} className="border rounded-lg p-4">
                  <div className="font-bold text-gray-800 mb-2">{player.name}</div>
                  <div className="text-sm text-gray-600 mb-3">{player.faction}</div>
                  
                  {player.attackChoice === null ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => chooseAttackType(player.id, 'land')}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        🏰 Land
                      </button>
                      <button
                        onClick={() => chooseAttackType(player.id, 'sea')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        🚢 Sea
                      </button>
                      <button
                        onClick={() => chooseAttackType(player.id, 'sit_out')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        ⏸️ Sit Out
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-gray-100 rounded font-medium">
                      {player.attackChoice === 'land' && '🏰 Attacking Land Walls'}
                      {player.attackChoice === 'sea' && '🚢 Attacking Sea Walls'}
                      {player.attackChoice === 'sit_out' && '⏸️ Sitting Out'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {needsChoice.length === 0 && (
              <button
                onClick={executeAttack}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition-colors shadow-lg"
              >
                ⚔️ Execute Attack!
              </button>
            )}
            
            {needsChoice.length > 0 && (
              <div className="mt-6 text-center text-gray-600">
                Waiting for {needsChoice.length} crusader{needsChoice.length > 1 ? 's' : ''} to choose...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Roll Modal
  if (showRollModal && rollQueue.length > 0) {
    const current = getCurrentRoll();
    const progress = ((currentRollIndex + 1) / rollQueue.length * 100).toFixed(0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 text-center mt-2">
              {currentRollIndex + 1} / {rollQueue.length}
            </div>
          </div>

          {/* Content */}
          {current.type === 'announcement' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">{current.message.includes('🏰') ? '🏰' : current.message.includes('🚢') ? '🚢' : '⚔️'}</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">{current.message}</h2>
              <p className="text-xl text-gray-600">{current.subtitle}</p>
            </div>
          )}

          {current.type === 'stage-header' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎯</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{current.message}</h2>
              <p className="text-lg text-gray-600">{current.subtitle}</p>
            </div>
          )}

          {current.type === 'roll' && (
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{current.player}</h3>
              <div className="text-gray-600 mb-6">{current.stage}</div>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Rolled</div>
                  <div className="w-20 h-20 bg-red-600 text-white rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg">
                    {current.roll}
                  </div>
                </div>
                
                {current.bonus > 0 && (
                  <>
                    <div className="text-3xl text-gray-400">+</div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Bonus</div>
                      <div className="w-20 h-20 bg-amber-600 text-white rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg">
                        {current.bonus}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="text-3xl text-gray-400">=</div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total</div>
                  <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg ${
                    current.success ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {current.total}
                  </div>
                </div>
              </div>

              <div className="text-gray-600 mb-4">
                Need {current.threshold}+ to succeed
              </div>
              
              <div className={`text-2xl font-bold ${current.success ? 'text-green-600' : 'text-red-600'}`}>
                {current.success ? '✓' : '✗'} {current.message}
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={advanceRoll}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {currentRollIndex < rollQueue.length - 1 ? (
              <>Next <ChevronRight className="w-6 h-6" /></>
            ) : (
              'See Results'
            )}
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Results
  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-red-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-red-900 mb-4">
              {cityFallen ? '🎊 Constantinople Has Fallen! 🎊' : '⚔️ Attack Results ⚔️'}
            </h1>
            {firstToEnter && (
              <p className="text-2xl text-amber-700 font-bold">
                First to Enter: {firstToEnter}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Summary</h2>
            <div className="space-y-2">
              {finalSummary.map((line, idx) => (
                <p key={idx} className="text-xl text-gray-700">{line}</p>
              ))}
            </div>
          </div>

          {cityFallen && sackOrder.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Sack Order</h2>
              <p className="text-gray-600 mb-6">Order of priority for selecting regions to plunder:</p>
              <div className="space-y-3">
                {sackOrder.map(entry => (
                  <div key={entry.position} className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-3xl font-bold text-amber-600 w-16 text-center">
                      #{entry.position}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-gray-800">{entry.name}</div>
                      <div className="text-gray-600">{entry.faction}</div>
                    </div>
                    <div className="text-gray-600">
                      {entry.status === 'inside' && '✅ Entered City'}
                      {entry.status === 'shipwrecked' && '🌊 Shipwrecked'}
                      {entry.status === 'ready' && '⚔️ Outside Walls'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetGame}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition-colors shadow-lg"
          >
            🔄 New Siege
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SiegeOfConstantinople;
