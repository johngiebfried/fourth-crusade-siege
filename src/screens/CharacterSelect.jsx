/**
 * Character selection. Out of scope for the redesign — this is the existing
 * screen, ported to the Vite app with its markup and Tailwind classes intact.
 */

import { useState } from 'react'

const CHARS_PER_PAGE = 20

export default function CharacterSelect({ allCharacters, onStart }) {
  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [characterPage, setCharacterPage] = useState(0)

  const totalPages = Math.ceil(allCharacters.length / CHARS_PER_PAGE)
  const paginatedCharacters = allCharacters.slice(
    characterPage * CHARS_PER_PAGE,
    (characterPage + 1) * CHARS_PER_PAGE
  )

  const toggleCharacter = (charId) => {
    setSelectedCharacters((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    )
  }

  const selectAll = () => setSelectedCharacters(allCharacters.map((c) => c.id))
  const clearAll = () => setSelectedCharacters([])

  const startGame = () => {
    if (selectedCharacters.length === 0) {
      alert('Please select at least one character!')
      return
    }
    onStart(selectedCharacters)
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-amber-50 to-red-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-red-900 mb-4">
            ⚔️ Siege of Constantinople ⚔️
          </h1>
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

          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setCharacterPage((prev) => Math.max(0, prev - 1))}
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
              onClick={() => setCharacterPage((prev) => Math.min(totalPages - 1, prev + 1))}
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
            {paginatedCharacters.map((char) => (
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
              : `🏰 Begin Siege with ${selectedCharacters.length} Crusaders`}
          </button>
        </div>
      </div>
    </div>
  )
}
