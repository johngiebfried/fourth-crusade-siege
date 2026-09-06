/**
 * The last page before a white screen.
 *
 * This exists for the beta rather than for me. If anything throws mid-siege
 * the app unmounts and the browser shows nothing at all — and a reader who is
 * a historian rather than a developer has no console to open, no stack to
 * copy, and nothing to report except "it broke". A blank page is an
 * unreportable bug, which is the same as an unfixable one.
 *
 * So this catches three different failures, because a React error boundary on
 * its own catches only the first of them:
 *
 * - **Render errors**, through `getDerivedStateFromError`.
 * - **Everything asynchronous** — a timer, an animation frame, a promise —
 *   through `error` and `unhandledrejection` on the window. Most of the game's
 *   work happens on timers, so this is where a real fault is likeliest to land
 *   and it is exactly what a boundary alone would miss.
 * - **No WebGL at all**, which is not an exception but a plausible machine:
 *   an old laptop, hardware acceleration switched off, a remote desktop. That
 *   one is checked before anything renders, because the honest message is
 *   about the browser and not about the game.
 *
 * What it shows is deliberately a page of the same book — vellum and rubric,
 * not a red stack trace — with the one piece of text that makes a report
 * useful: what went wrong, and which build it went wrong on.
 */

import { Component } from 'react'

/**
 * The text siege, which is the useful thing to offer someone whose machine
 * has just failed to draw the visual one. `BASE_URL` because GitHub Pages
 * serves the app from /<repo>/ and a hard-coded path would 404 there while
 * working perfectly in local dev.
 */
const TEXT_URL = `${import.meta.env.BASE_URL}text/`

/** Stamped in at build time. See `vite.config.js`. */
const BUILD = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'

/**
 * Can this browser draw at all?
 *
 * Asked once, on a throwaway canvas. Every screen in the game is WebGL, so if
 * the answer is no there is nothing to be gained by letting three.js discover
 * it and throw something about a null context.
 */
function webglMissing() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return !gl
  } catch {
    return true
  }
}

function Frame({ title, children }) {
  return (
    <div
      className="manuscript-scope flex min-h-screen w-screen items-center justify-center p-6"
      style={{ background: '#1c1512' }}
    >
      <div className="vellum ink-frame w-full max-w-xl px-8 py-7">
        <div className="rubric">The siege has stopped</div>
        <h1 className="display mt-2 text-2xl font-bold" style={{ color: 'var(--rubric)' }}>
          {title}
        </h1>
        {children}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button className="quill-button" onClick={() => window.location.reload()}>
              Begin again
            </button>
            {/* The whole reason the text siege ships alongside: a machine that
                cannot draw the city can still play the game. */}
            <button className="quill-button" onClick={() => window.location.assign(TEXT_URL)}>
              Play the text siege
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            build {BUILD}
          </span>
        </div>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    // Asked here rather than on mount: it needs no layout, and asking after
    // mounting would render the game once before replacing it.
    this.state = { error: null, noWebgl: webglMissing() }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidMount() {
    // A thrown error inside a `setTimeout` never reaches a boundary. The game
    // resolves every attempt on a chain of timers, so without these two the
    // boundary would be watching the one place faults are least likely to be.
    this.onError = (event) => {
      this.setState((s) => (s.error ? s : { error: event.error ?? new Error(event.message) }))
    }
    this.onRejection = (event) => {
      this.setState((s) => (s.error ? s : { error: event.reason ?? new Error('A promise failed') }))
    }
    window.addEventListener('error', this.onError)
    window.addEventListener('unhandledrejection', this.onRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.onError)
    window.removeEventListener('unhandledrejection', this.onRejection)
  }

  componentDidCatch(error, info) {
    // Still logged in full, for whoever does have a console open.
    console.error('The siege stopped:', error, info)
  }

  render() {
    if (this.state.noWebgl) {
      return (
        <Frame title="This browser cannot draw the city">
          <p className="mt-4" style={{ color: 'var(--ink)' }}>
            The whole game is drawn in 3D, and this browser has no WebGL available — so
            there is nothing it can put on screen. This is a setting on the machine
            rather than a fault in the game.
          </p>
          <p className="mt-3" style={{ color: 'var(--ink)' }}>
            The text siege will run here. It is the same game — the same dice, the same
            rules, the same outcomes — reported as text rather than drawn.
          </p>
          <p className="mt-3" style={{ color: 'var(--ink-soft)' }}>
            If you would rather fix the machine: the usual cause is hardware acceleration
            being switched off. In Chrome that is under Settings → System; in Safari,
            Develop → Experimental Features. A remote desktop or virtual machine will
            often not have it at all.
          </p>
        </Frame>
      )
    }

    if (this.state.error) {
      const message = String(this.state.error?.message ?? this.state.error)
      return (
        <Frame title="Something went wrong">
          <p className="mt-4" style={{ color: 'var(--ink)' }}>
            The siege cannot go on from here. Nothing is broken on your machine — this is
            a fault in the game, and it would help to know about it.
          </p>
          <p className="mt-3" style={{ color: 'var(--ink-soft)' }}>
            A screenshot of this page is enough of a report: it carries what went wrong
            and which build it happened on.
          </p>
          <pre
            className="ruled mt-4 overflow-x-auto whitespace-pre-wrap px-3 py-2 text-xs"
            style={{ color: 'var(--ink)', background: 'rgba(0,0,0,0.04)' }}
          >
            {message}
          </pre>
        </Frame>
      )
    }

    return this.props.children
  }
}
