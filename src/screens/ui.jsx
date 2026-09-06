/**
 * Shared furniture for the screens that sit over the city.
 *
 * Everything here is a manuscript page: vellum ground, iron-gall ink frames,
 * vermilion rubrication, quill-drawn buttons. The dark slate cards and rounded
 * corners these started as were the last modern thing in the game, and they
 * made the 3D lane look like a screenshot pasted into a web app.
 *
 * The tokens and the `.vellum` / `.ink-frame` / `.quill-button` rules live in
 * `index.css`.
 */

/* ------------------------------------------------------------- drolleries */

/**
 * A drollery: the grotesque a bored scribe drew in the margin. Hybrid
 * creatures, a hare with a trumpet, a snail — they have nothing to do with the
 * text and that is the point of them.
 *
 * These are the strongest single signal that a page is medieval rather than
 * merely brown, so they go in the margins of the big screens. Drawn as inline
 * paths: no fetched asset, and they stay crisp at any size.
 */
const DROLLERIES = {
  // A hare blowing a trumpet: the standard marginal joke, the hunted turned
  // herald, heckling the knights the page is actually about.
  //
  // Drawn as separated masses with the limbs as strokes. The first version had
  // everything overlapping and both filled and stroked, and came out as one
  // amorphous blob — at this size a drollery lives or dies on its silhouette.
  hare: (
    <g>
      {/* Haunch and body. */}
      <ellipse cx="21" cy="45" rx="11" ry="10" />
      <ellipse cx="34" cy="44" rx="14" ry="8.5" transform="rotate(-8 34 44)" />
      {/* Neck and head. */}
      <ellipse cx="49" cy="34" rx="9" ry="6.5" transform="rotate(-24 49 34)" />
      {/* Muzzle. */}
      <path d="M55 31 q7 1 8 4 q-4 3 -9 2 z" />
      {/* Ears, long and apart — the one feature that must read. */}
      <path d="M47 28 q-5 -14 -2 -21 q5 3 6 19 z" />
      <path d="M52 27 q0 -15 5 -20 q3 5 -1 20 z" />
      {/* Trumpet, from the muzzle up and out, with a flared bell. */}
      <g fill="none" strokeWidth="2.6">
        <path d="M62 33 l10 -7" />
      </g>
      <path d="M70 28 l9 -7 q2 4 0 9 l-8 2 z" />
      {/* Forelegs and hind leg. */}
      <g fill="none" strokeWidth="2.8">
        <path d="M42 49 q2 7 0 12" />
        <path d="M36 50 q1 6 -1 11" />
        <path d="M17 53 q-3 6 1 10 M18 63 h7" />
      </g>
      {/* Scut. */}
      <circle cx="10" cy="41" r="4.5" />
    </g>
  ),

  // The snail: the other great marginal joke — armed knights recoiling from
  // one. Belongs on a page about men who would not climb a wall.
  snail: (
    <g>
      {/* Foot. */}
      <path d="M8 56 q0 -7 9 -7 l26 0 q7 0 7 4 q0 4 -7 4 z" />
      {/* Shell, as an open spiral rather than concentric rings. */}
      <g fill="none" strokeWidth="4">
        <path d="M40 50 a15 15 0 1 1 3 -12 a10 10 0 1 0 -8 8 a5.5 5.5 0 1 1 2 -7" />
      </g>
      {/* Head and eyestalks. */}
      <path d="M45 52 q10 -2 13 -8 q4 2 3 6 q-2 5 -12 6 z" />
      <g fill="none" strokeWidth="2.4">
        <path d="M56 45 q5 -6 4 -13" />
        <path d="M52 46 q7 -4 12 -3" />
      </g>
      <circle cx="60" cy="30" r="2.8" />
      <circle cx="65" cy="42" r="2.4" />
    </g>
  ),

  // A hybrid: a hooded man's head on a bird's body, one of the commonest
  // grotesques in the margins of a thirteenth-century psalter.
  hybrid: (
    <g>
      {/* Bird body and tail. */}
      <ellipse cx="30" cy="47" rx="16" ry="10" transform="rotate(6 30 47)" />
      <path d="M15 48 q-11 2 -14 -5 q9 0 13 -4 z" />
      {/* A wing, folded. */}
      <path d="M26 42 q10 -3 17 3 q-8 6 -17 3 z" />
      {/* Legs and feet. */}
      <g fill="none" strokeWidth="2.8">
        <path d="M28 57 q-1 6 -2 9 M25 66 h7" />
        <path d="M38 56 q2 6 2 9 M38 65 h7" />
      </g>
      {/* Neck, then a hooded human head turned back over the shoulder. */}
      <path d="M42 44 q3 -8 9 -11 l6 6 q-6 4 -8 10 z" />
      <path d="M50 32 q1 -11 10 -12 q9 -1 10 8 q1 8 -7 10 q-9 2 -13 -6 z" />
      {/* The hood's point, falling behind. */}
      <path d="M52 24 q-6 -6 -3 -12 q6 1 9 7 z" />
      {/* Face reserved out of the ink: brow, eye, beard line. */}
      <g style={{ fill: '#efe2c4', stroke: 'none' }}>
        <circle cx="64" cy="29" r="2.1" />
        <path d="M60 36 q6 2 10 -1 q-3 5 -10 4 z" />
      </g>
    </g>
  ),
}

/**
 * A marginal grotesque. `which` picks the creature; `flip` faces it the other
 * way, because a drollery should look in toward the text it is heckling.
 */
export function Drollery({ which = 'hare', flip = false, size = 76, className = '' }) {
  // shrink-0 matters: inside a flex row an SVG with no basis collapses to
  // nothing, which is how the first one of these rendered as a smudge.
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 72"
      width={size}
      height={size * 0.9}
      className={`shrink-0 ${className}`}
      style={{
        fill: 'var(--ink)',
        stroke: 'var(--ink)',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        opacity: 0.72,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      {DROLLERIES[which] ?? DROLLERIES.hare}
    </svg>
  )
}

/* ------------------------------------------------------------- ink icons */

/**
 * The three attack choices, drawn rather than set in emoji.
 *
 * Emoji were the loudest modern note left on the page — a colour bitmap from
 * 2015 in the middle of a manuscript — and no amount of vellum around them
 * fixes that.
 */
const INK_ICONS = {
  // A towered curtain wall, seen straight on.
  wall: (
    <g fill="none" strokeWidth="3">
      <path d="M6 46 v-18 h8 v-6 h8 v6 h20 v-6 h8 v6 h8 v18 z" />
      <path d="M14 46 v-14 M42 46 v-14" />
      <path d="M24 46 v-11 h8 v11" />
      <path d="M6 46 h50" strokeWidth="4" />
    </g>
  ),
  // A ship with a lateen yard, bow on to the wall.
  ship: (
    <g fill="none" strokeWidth="3">
      <path d="M8 40 q22 10 44 0 l-4 6 q-18 6 -36 0 z" />
      <path d="M30 40 v-28" />
      <path d="M30 14 l16 20 h-16 z" />
      <path d="M14 44 l-4 6 M22 46 l-3 6 M40 46 l3 6 M48 44 l4 6" strokeWidth="2" />
    </g>
  ),
  // Two crossed swords. Drawn as a sword built upright and then rotated twice:
  // an X with arrowheads on it is a compass rose, not a weapon, which is what
  // the first attempt at this looked like.
  swords: (
    <>
      {[-38, 38].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 30 32)`}>
          {/* Blade, tapering to a point. */}
          <path d="M30 8 l4 8 v26 h-8 v-26 z" fill="var(--ink)" stroke="none" />
          {/* Crossguard. */}
          <path d="M19 42 h22 v4 h-22 z" fill="var(--ink)" stroke="none" />
          {/* Grip and pommel. */}
          <path d="M28 46 h4 v8 h-4 z" fill="var(--ink)" stroke="none" />
          <circle cx="30" cy="56" r="3.4" fill="var(--ink)" stroke="none" />
        </g>
      ))}
    </>
  ),
}

export function InkIcon({ name, size = 60, className = '' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={className}
      style={{ stroke: 'var(--ink)', strokeLinecap: 'round', strokeLinejoin: 'round' }}
    >
      {INK_ICONS[name] ?? INK_ICONS.wall}
    </svg>
  )
}

/* ----------------------------------------------------------------- panels */

/** A vellum leaf over the city. */
export function Panel({ children, wide = false, className = '' }) {
  return (
    <div
      className={`manuscript-scope vellum ink-frame pointer-events-auto mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } px-8 py-6 ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * What used to be a dark card. It is vellum too now — the dark panels were
 * fighting the page, and "weight" on a manuscript comes from a heavier ink
 * frame and rubrication, not from inverting the ground.
 */
export function DarkPanel({ children, wide = false, className = '' }) {
  return (
    <div
      className={`manuscript-scope vellum ink-frame pointer-events-auto mx-4 w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } px-8 py-7 ${className}`}
      style={{ borderWidth: 3 }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------- text */

/** A rubricated label. `dark` is kept for call-site compatibility; ink is ink. */
export function Eyebrow({ children }) {
  return <div className="rubric">{children}</div>
}

export function Heading({ children, className = '' }) {
  return (
    <h2
      className={`mt-2 text-3xl font-bold leading-tight md:text-4xl ${className}`}
      style={{ color: 'var(--rubric)' }}
    >
      {children}
    </h2>
  )
}

/**
 * A ruled divider: the horizontal line a scribe drew between sections, with a
 * small lozenge on it. Replaces the hairline `border-t` a web page would use.
 */
export function Rule({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1" style={{ background: 'rgba(43,33,24,0.35)' }} />
      <span
        className="inline-block h-2 w-2 rotate-45"
        style={{ background: 'var(--rubric)', opacity: 0.75 }}
      />
      <span className="h-px flex-1" style={{ background: 'rgba(43,33,24,0.35)' }} />
    </div>
  )
}

/* ---------------------------------------------------------------- buttons */

export function PrimaryButton({ children, disabled, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`quill-button-primary px-10 py-3.5 text-xl ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`quill-button px-8 py-3.5 text-lg ${className}`}>
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------- layout */

/** Layout for a screen that lays a single leaf over the city. */
export function OverCity({ children, align = 'center' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex justify-center overflow-y-auto px-2 py-8 ${
        align === 'center' ? 'items-center' : 'items-start'
      }`}
    >
      {children}
    </div>
  )
}
