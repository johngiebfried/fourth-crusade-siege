/**
 * Manuscript furniture: illuminated capitals, ruled parchment, decorated
 * borders.
 *
 * Three treatments are offered rather than one, because "medieval manuscript"
 * covers everything from a plain ruled workaday copy to a presentation leaf
 * with gold on it, and which of those a screen wants depends on what the
 * screen is for. They are used side by side in the game so they can be
 * compared in place rather than in the abstract:
 *
 *   Leaf     — a presentation opening. Gold-ground initial, rubricated
 *              incipit, wide margins. For the moments that matter.
 *   Ruled    — a working copy. Visible ruling, a marginal rubric in the left
 *              margin, a plain versal initial. For screens that are mostly
 *              information.
 *   Bordered — a decorated leaf. Vine-scroll border down the binding edge,
 *              a historiated initial. For the closing pages.
 *
 * ── On the lettering ──────────────────────────────────────────────────────
 *
 * The brief forbids fetched assets, which rules out a webfont, and no
 * blackletter face can be relied on across a room of unknown school laptops.
 * So the body text stays in the old-style serif the rest of the game uses —
 * which is honest enough, since a humanist book hand is what a thirteenth
 * century scribe's descendants were imitating — and the manuscript signal is
 * carried by the things that actually say "manuscript" at a glance: the
 * illuminated initial, the rubrication, the ruling, and the margins.
 *
 * The initial is drawn to a canvas at runtime, so it is generated, not
 * fetched, exactly like the flags and the name plates.
 */

import { useEffect, useRef } from 'react'

/* --------------------------------------------------------- illumination */

const GOLD = '#c9a227'
const GOLD_LIT = '#eed77a'
const GOLD_DEEP = '#8a6a14'
const LAPIS = '#2f4d8a'
const VERMILION = '#a32b25'
const PARCHMENT = '#f4ead6'

/**
 * An illuminated capital: the letter reserved in white on a coloured ground,
 * inside a gold panel, with vine-work filling the field around it.
 *
 * The letter itself is set in whatever old-style face the machine has, then
 * everything around it is drawn. That is the right division of labour — the
 * decoration is what the eye reads as medieval, and the decoration is the part
 * that can be guaranteed.
 */
function drawInitial(ctx, size, letter, palette) {
  const s = size / 100
  const { ground, vine } = palette

  ctx.clearRect(0, 0, size, size)

  // Gold panel, with a lit edge and a deep edge so it sits like leaf.
  ctx.fillStyle = GOLD
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = GOLD_LIT
  ctx.fillRect(0, 0, size, 3 * s)
  ctx.fillRect(0, 0, 3 * s, size)
  ctx.fillStyle = GOLD_DEEP
  ctx.fillRect(0, size - 3 * s, size, 3 * s)
  ctx.fillRect(size - 3 * s, 0, 3 * s, size)

  // The coloured field the letter is reserved out of.
  ctx.fillStyle = ground
  ctx.fillRect(7 * s, 7 * s, size - 14 * s, size - 14 * s)

  // Vine-work: a stem coiling in each corner of the field, in the second
  // colour. Kept behind the letter, which is drawn over it.
  ctx.save()
  ctx.strokeStyle = vine
  ctx.lineWidth = 2.4 * s
  ctx.lineCap = 'round'
  for (const [ox, oy, dx, dy] of [
    [12, 12, 1, 1],
    [88, 12, -1, 1],
    [12, 88, 1, -1],
    [88, 88, -1, -1],
  ]) {
    ctx.beginPath()
    ctx.moveTo(ox * s, oy * s)
    ctx.bezierCurveTo(
      (ox + dx * 22) * s,
      (oy + dy * 4) * s,
      (ox + dx * 26) * s,
      (oy + dy * 20) * s,
      (ox + dx * 13) * s,
      (oy + dy * 24) * s
    )
    ctx.stroke()
    // A trefoil leaf on the end of the stem.
    ctx.fillStyle = vine
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath()
      ctx.ellipse(
        (ox + dx * (13 + k * 5)) * s,
        (oy + dy * (26 + Math.abs(k) * 3)) * s,
        3.4 * s,
        2.2 * s,
        k * 0.7,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  }
  ctx.restore()

  // The letter, reserved in parchment white with a thin dark contour so it
  // holds its shape against the vine-work behind it.
  ctx.save()
  ctx.font = `bold ${Math.round(size * 0.72)}px 'Old English Text MT', Luminari, Herculanum, 'Iowan Old Style', Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = 'rgba(35,25,15,0.55)'
  ctx.lineWidth = size * 0.045
  ctx.strokeText(letter, size / 2, size * 0.54)
  ctx.fillStyle = PARCHMENT
  ctx.fillText(letter, size / 2, size * 0.54)
  ctx.restore()
}

const INITIAL_PALETTES = {
  lapis: { ground: LAPIS, vine: GOLD_LIT },
  vermilion: { ground: VERMILION, vine: GOLD_LIT },
  green: { ground: '#3f6b3a', vine: GOLD_LIT },
}

export function IlluminatedCapital({ letter, palette = 'lapis', size = 88, className = '' }) {
  const ref = useRef()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    drawInitial(ctx, size, letter, INITIAL_PALETTES[palette] ?? INITIAL_PALETTES.lapis)
  }, [letter, palette, size])

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ width: size, height: size }}
      className={`shrink-0 shadow-md ${className}`}
    />
  )
}

/* ------------------------------------------------------------- fragments */

/** Split the first letter off a body of text so it can be illuminated. */
function splitInitial(text) {
  const trimmed = String(text ?? '').trimStart()
  const letter = trimmed.slice(0, 1).toUpperCase()
  return { letter, rest: trimmed.slice(1) }
}

/**
 * The opening words of a passage, set in small red capitals. A scribe would
 * rubricate the incipit for exactly the reason we want it: it tells you where
 * to start reading on a page with no other landmarks.
 */
function rubricate(rest, words = 3) {
  const parts = rest.split(' ')
  return {
    lead: parts.slice(0, words).join(' '),
    tail: parts.slice(words).join(' '),
  }
}

/* --------------------------------------------------- treatment one: leaf */

/**
 * A presentation leaf: gold-ground initial with the text run round it, a
 * rubricated incipit, and generous margins. This is the most decorated of the
 * three and the slowest to read, so it belongs on the screens people are
 * meant to stop at.
 */
export function ManuscriptLeaf({
  eyebrow,
  heading,
  children,
  body,
  palette = 'lapis',
  wide = false,
  className = '',
}) {
  const { letter, rest } = splitInitial(body ?? '')
  const { lead, tail } = rubricate(rest)

  return (
    <div
      className={`manuscript-scope vellum ink-frame pointer-events-auto relative mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } px-10 py-9 ${className}`}
    >
      {/* The double rule a scribe drew to bound the text block. */}
      <div
        className="pointer-events-none absolute inset-4"
        style={{ border: '1px solid rgba(122,44,36,0.3)' }}
      />
      <div
        className="pointer-events-none absolute inset-[1.15rem]"
        style={{ border: '1px solid rgba(122,44,36,0.18)' }}
      />

      <div className="relative">
        {eyebrow && (
          <div className="rubric mb-3">
            {eyebrow}
          </div>
        )}
        {heading && (
          <h2 className="mb-4 text-3xl font-bold leading-tight md:text-4xl" style={{ color: 'var(--rubric)' }}>
            {heading}
          </h2>
        )}

        {body && (
          <div>
            <IlluminatedCapital
              letter={letter}
              palette={palette}
              size={92}
              className="float-left mr-4 mt-1"
            />
            <p className="text-lg leading-relaxed text-stone-800">
              <span className="font-semibold uppercase tracking-wide text-red-900">{lead}</span>{' '}
              {tail}
            </p>
            <div className="clear-both" />
          </div>
        )}

        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------- treatment two: ruled */

/**
 * A working copy: the ruling shows, the initial is a plain coloured versal
 * rather than a gold panel, and the rubric sits out in the left margin the way
 * a chapter heading does in a workaday manuscript. Faster to read than the
 * leaf, and it holds more text without looking crowded.
 */
export function ManuscriptRuled({
  rubric,
  heading,
  children,
  body,
  wide = false,
  className = '',
}) {
  const { letter, rest } = splitInitial(body ?? '')

  return (
    <div
      className={`manuscript-scope vellum ink-frame pointer-events-auto relative mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } ${className}`}
    >
      {/* Ruling: the faint horizontal lines a scribe pricked and ruled before
          writing a word, and the vertical bounding line of the margin. */}
      <div className="ruled pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-y-0 left-[8.75rem] w-px bg-red-900/25" />

      <div className="relative flex gap-6 px-8 py-8">
        {/* The margin, with the rubric written down it. */}
        <div className="w-24 shrink-0 pt-1 text-right">
          {rubric && (
            <div className="text-[0.7rem] font-semibold uppercase leading-snug tracking-[0.2em] text-red-800/85">
              {rubric}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {heading && (
            <h2 className="mb-3 text-2xl font-bold leading-tight md:text-3xl" style={{ color: 'var(--rubric)' }}>
              {heading}
            </h2>
          )}
          {body && (
            <p className="text-lg leading-[2rem] text-stone-800">
              <span
                className="float-left mr-2 font-bold leading-none text-red-800"
                style={{ fontSize: '3.4rem', marginTop: '0.15rem' }}
              >
                {letter}
              </span>
              {rest}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------- treatment three: bordered */

/** A vine-scroll border, drawn as one repeating SVG column. */
function VineBorder({ side = 'left' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 40 400"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-y-0 ${side === 'left' ? 'left-0' : 'right-0'} w-10`}
      style={side === 'right' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <rect x="0" y="0" width="40" height="400" fill="rgba(201,162,74,0.13)" />
      <path
        d="M20 0 C 34 26, 6 52, 20 78 C 34 104, 6 130, 20 156 C 34 182, 6 208, 20 234 C 34 260, 6 286, 20 312 C 34 338, 6 364, 20 400"
        fill="none"
        stroke={GOLD_DEEP}
        strokeWidth="3.2"
      />
      {[26, 78, 130, 182, 234, 286, 338].map((y, i) => {
        // The stem is at its extreme at each of these heights, alternating
        // sides — so the leaf grows outward from where the stem actually is.
        const stemX = i % 2 ? 8 : 32
        const out = i % 2 ? -1 : 1
        return (
          <g key={y}>
            {/* Stalk, then the leaf on the end of it. Leaves floating beside
                the stem read as beads on a string, not as a vine. */}
            <path
              d={`M${stemX} ${y} q ${out * 5} -4 ${out * 9} -6`}
              fill="none"
              stroke={GOLD_DEEP}
              strokeWidth="1.6"
            />
            <ellipse
              cx={stemX + out * 10}
              cy={y - 7}
              rx="6.5"
              ry="3.8"
              fill={i % 2 ? VERMILION : LAPIS}
              transform={`rotate(${out * -32} ${stemX + out * 10} ${y - 7})`}
            />
            {/* A second leaf below, turned the other way. */}
            <path
              d={`M${stemX} ${y} q ${out * 4} 5 ${out * 8} 8`}
              fill="none"
              stroke={GOLD_DEEP}
              strokeWidth="1.4"
            />
            <ellipse
              cx={stemX + out * 9}
              cy={y + 9}
              rx="5"
              ry="3"
              fill={i % 2 ? LAPIS : VERMILION}
              transform={`rotate(${out * 34} ${stemX + out * 9} ${y + 9})`}
            />
            {/* A gold berry where the stem crosses the middle. */}
            <circle cx={20} cy={y + 26} r="2.8" fill={GOLD} />
          </g>
        )
      })}
    </svg>
  )
}

/**
 * A decorated leaf: vine-scroll down both edges and a gold initial. The most
 * ornamental of the three, and the one that costs the most horizontal space —
 * which is why it is kept for the closing screens rather than anything that
 * has to hold a list.
 */
export function ManuscriptBordered({
  eyebrow,
  heading,
  children,
  body,
  palette = 'vermilion',
  wide = false,
  className = '',
}) {
  const { letter, rest } = splitInitial(body ?? '')
  const { lead, tail } = rubricate(rest, 4)

  return (
    <div
      className={`manuscript-scope vellum ink-frame pointer-events-auto relative mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } ${className}`}
    >
      <VineBorder side="left" />
      <VineBorder side="right" />

      <div className="relative px-16 py-10">
        {eyebrow && (
          <div className="rubric mb-3 text-center">
            {eyebrow}
          </div>
        )}
        {heading && (
          <h2 className="mb-5 text-center text-3xl font-bold leading-tight md:text-4xl" style={{ color: 'var(--rubric)' }}>
            {heading}
          </h2>
        )}
        {body && (
          <div className="mb-4">
            <IlluminatedCapital
              letter={letter}
              palette={palette}
              size={84}
              className="float-left mr-4 mt-1"
            />
            <p className="text-lg leading-relaxed text-stone-800">
              <span className="font-semibold uppercase tracking-wide text-red-900">{lead}</span>{' '}
              {tail}
            </p>
            <div className="clear-both" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- marginalia */

/**
 * A gloss in the margin: a short quotation or fact, set the way a reader's
 * note sits beside the text it comments on. This is the vehicle for the lore
 * — see `game/lore.js` — and it is deliberately quiet, because it is meant to
 * be read by whoever happens to look rather than to interrupt anyone.
 */
export function Marginalia({ entry, dark = false }) {
  if (!entry) return null
  return (
    <div
      className={`mt-6 border-l-2 pl-4 ${
        dark ? 'border-amber-600/50 text-stone-400' : 'border-red-800/40 text-stone-600'
      }`}
    >
      <p className={`text-base italic leading-relaxed ${dark ? 'text-stone-300' : ''}`}>
        {entry.text}
      </p>
      {entry.source && (
        <p
          className={`mt-1 text-xs uppercase tracking-[0.18em] ${
            dark ? 'text-amber-600/80' : 'text-red-900/60'
          }`}
        >
          {entry.source}
        </p>
      )}
    </div>
  )
}
