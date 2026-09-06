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

/* --------------------------------------------------------------- penwork */

/*
 * Pen-flourishes and line-fillers, not drolleries.
 *
 * Marginal grotesques were tried here first — a hare with a trumpet, a snail,
 * a hybrid — and they were bad. Figure drawing at this size lives or dies on
 * anatomy, and hand-authored SVG paths for a hare are not going to beat a
 * scribe who drew hares all day. A crude drollery is worse than none: it reads
 * as clip-art and drags the whole page down with it.
 *
 * What a manuscript page has just as much of, and what *is* within reach here,
 * is penwork: cadels, flourishes, knotwork and line-fillers. They are
 * geometric rather than anatomical, so they can be constructed rather than
 * observed, and they are drawn correctly by construction at any size.
 */

/**
 * A line-filler: the band of penwork a scribe ran along a short last line so
 * that the text block kept its edge. A real feature of a ruled page, and the
 * one piece of ornament that has an actual job.
 */
export function LineFiller({ className = '', height = 14 }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 14"
      preserveAspectRatio="none"
      height={height}
      className={`w-full ${className}`}
    >
      <path
        d="M0 7 h6 m0 0 q6 -7 12 0 q6 7 12 0 q6 -7 12 0 q6 7 12 0 q6 -7 12 0 q6 7 12 0
           q6 -7 12 0 q6 7 12 0 q6 -7 12 0 q6 7 12 0 q6 -7 12 0 q6 7 12 0 q6 -7 12 0
           q6 7 12 0 q6 -7 12 0 q6 7 12 0 h6"
        fill="none"
        stroke="var(--rubric)"
        strokeWidth="1.6"
        opacity="0.55"
      />
    </svg>
  )
}

/**
 * A pen-flourish for the corner of a leaf: a spiralling stem with hairline
 * tendrils and bulb terminals, of the kind that runs off the ascenders of a
 * top line. Built from arcs, so it is right by construction.
 */
export function PenFlourish({ size = 108, flip = false, className = '' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <g fill="none" stroke="var(--ink)" strokeLinecap="round" opacity="0.5">
        {/* The main stem, swinging down and coiling. */}
        <path d="M8 8 C 46 10, 74 30, 78 62 C 80 84, 62 96, 48 88 C 36 81, 38 62, 54 60
                 C 68 58, 78 70, 76 84"
              strokeWidth="2.6" />
        {/* Hairline tendrils off the stem. */}
        <path d="M30 14 C 44 26, 46 42, 38 54" strokeWidth="1.2" />
        <path d="M52 22 C 62 34, 62 48, 54 58" strokeWidth="1.2" />
        <path d="M78 62 C 92 56, 104 62, 106 76" strokeWidth="1.5" />
        <path d="M20 10 C 22 26, 16 38, 6 44" strokeWidth="1.2" />
      </g>
      {/* Bulb terminals: the little swelled dots a quill leaves at the end of
          a stroke, and the detail that makes penwork read as penwork. */}
      <g fill="var(--rubric)" opacity="0.6">
        <circle cx="106" cy="76" r="3.2" />
        <circle cx="76" cy="84" r="2.8" />
        <circle cx="6" cy="44" r="2.6" />
        <circle cx="38" cy="54" r="2.2" />
        <circle cx="54" cy="58" r="2.2" />
      </g>
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
