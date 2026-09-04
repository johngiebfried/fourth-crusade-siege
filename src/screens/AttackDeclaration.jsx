/**
 * Attack declaration. Out of scope for the redesign — the existing screen,
 * ported unchanged.
 */

export default function AttackDeclaration({ players, currentRound, onChoose, onExecute }) {
  const needsChoice = players.filter((p) => p.attackChoice === null)
  const landCount = players.filter((p) => p.attackChoice === 'land').length
  const seaCount = players.filter((p) => p.attackChoice === 'sea').length
  const sitCount = players.filter((p) => p.attackChoice === 'sit_out').length

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-amber-50 to-red-50 p-8">
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
            {players.map((player) => (
              <div key={player.id} className="border rounded-lg p-4">
                <div className="font-bold text-gray-800 mb-2">{player.name}</div>
                <div className="text-sm text-gray-600 mb-3">{player.faction}</div>

                {player.attackChoice === null ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onChoose(player.id, 'land')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      🏰 Land
                    </button>
                    <button
                      onClick={() => onChoose(player.id, 'sea')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      🚢 Sea
                    </button>
                    <button
                      onClick={() => onChoose(player.id, 'sit_out')}
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
              onClick={onExecute}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition-colors shadow-lg"
            >
              ⚔️ Execute Attack!
            </button>
          )}

          {needsChoice.length > 0 && (
            <div className="mt-6 text-center text-gray-600">
              Waiting for {needsChoice.length} crusader{needsChoice.length > 1 ? 's' : ''} to
              choose...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
