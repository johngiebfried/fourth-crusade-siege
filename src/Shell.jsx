/**
 * What loads, and when.
 *
 * The 3D app is behind a dynamic import so that `three`, `@react-three/fiber`
 * and `drei` are not merely unexecuted until they are wanted — they are not
 * even fetched. Vite splits them into their own chunk on the strength of the
 * `import()` below, so the first paint is the chooser and a few kilobytes of
 * vellum.
 *
 * That matters less than it sounds for a strong machine and more than it
 * sounds for a weak one, where the honest cost was never the download anyway:
 * it was building a city of eleven hundred houses and handing a tired GPU a
 * few hundred draw calls. Neither happens now unless someone asks for it.
 *
 * Two ways past the chooser, both of which have to keep working:
 *
 * - `?mode=visual`, so the visual siege can be linked or bookmarked directly.
 * - `?screen=…`, the rehearsal URLs, which open one screen without playing a
 *   siege to reach it. Those were broken once by a change made three lines
 *   away and not noticed for two commits, so they are handled explicitly here
 *   rather than left to fall through.
 */

import { Suspense, lazy, useState } from 'react'
import Chooser from './screens/Chooser.jsx'

const App = lazy(() => import('./App.jsx'))

/** Does the URL already say what it wants? */
function wantsVisual() {
  if (typeof location === 'undefined') return false
  const params = new URLSearchParams(location.search)
  return params.get('mode') === 'visual' || params.has('screen')
}

/**
 * Shown while the engine chunk arrives. Worth having: on the machines this
 * whole chooser exists for, that is a visible pause, and an unexplained blank
 * moment after clicking is how a slow load gets reported as a broken one.
 */
function Loading() {
  return (
    <div
      className="manuscript-scope flex min-h-screen w-screen items-center justify-center p-6"
      style={{ background: '#2a211a' }}
    >
      <div className="vellum ink-frame px-8 py-6 text-center">
        <div className="rubric">The Fourth Crusade</div>
        <div className="display mt-2 text-xl font-bold" style={{ color: 'var(--rubric)' }}>
          Raising the city
        </div>
      </div>
    </div>
  )
}

export default function Shell() {
  const [visual, setVisual] = useState(wantsVisual)

  if (!visual) return <Chooser onVisual={() => setVisual(true)} />

  return (
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  )
}
