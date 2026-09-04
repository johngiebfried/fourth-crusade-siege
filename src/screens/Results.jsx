/**
 * Results and sack order. Out of scope for the redesign — the existing screen,
 * ported unchanged. This is the hand-off point to the Sack phase.
 */

export default function Results({ cityFallen, firstToEnter, finalSummary, sackOrder, onReset }) {
  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-amber-50 to-red-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-red-900 mb-4">
            {cityFallen ? '🎊 Constantinople Has Fallen! 🎊' : '⚔️ Attack Results ⚔️'}
          </h1>
          {firstToEnter && (
            <p className="text-2xl text-amber-700 font-bold">First to Enter: {firstToEnter}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Summary</h2>
          <div className="space-y-2">
            {finalSummary.map((line, idx) => (
              <p key={idx} className="text-xl text-gray-700">
                {line}
              </p>
            ))}
          </div>
        </div>

        {cityFallen && sackOrder.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Sack Order</h2>
            <p className="text-gray-600 mb-6">
              Order of priority for selecting regions to plunder:
            </p>
            <div className="space-y-3">
              {sackOrder.map((entry) => (
                <div
                  key={entry.position}
                  className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
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
          onClick={onReset}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition-colors shadow-lg"
        >
          🔄 New Siege
        </button>
      </div>
    </div>
  )
}
