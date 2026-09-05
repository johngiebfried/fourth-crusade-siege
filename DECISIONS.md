# Build Decisions — Siege of Constantinople v1

Captured in the pre-build interview, 2026-09-05. These resolve every point where the
spec was open or where the spec and the existing `index.html` disagreed. Where a
decision contradicts the spec text, the reason is recorded.

## Project setup

| Decision | Choice |
| --- | --- |
| Location | `~/Downloads/siege-constantinople` |
| Toolchain | Vite + React; `three`, `@react-three/fiber`, `@react-three/drei` as npm deps |
| Node | Installed via Homebrew during setup (machine had no Node at all) |
| Source of truth | The `index.html` pasted into the brief; `characters.json` generated from its roster |

## Renderer

**WebGL2 now, structured for WebGPU later.** The spec asks for WebGPU with WebGL2
fallback. R3F's WebGPU path still has rough edges with several drei helpers, and this
is a tool that has to work on a classroom projector without debugging. Nothing here —
flat shading, primitives, instanced pawns — needs WebGPU's throughput. The renderer
choice is isolated in one module so switching later is a small change, not a rewrite.

## Classroom context

- **Projected at the front of the room, GM drives it.** One screen, instructor clicks.
- Type sizing, contrast, and hit targets are tuned for back-row legibility.
- No per-student input path in v1.

## Pacing

**Cinematic — 10–15 minutes per siege is fine.** Ship sail-ins get real travel time,
the First to Enter callout gets a held beat. This sequence is the centerpiece of the
class period, not a transition between other things.

## Tokens and identity

- Pawns are anonymous generic geometry, as the spec requires.
- **Each pawn carries a floating name label** — a canvas-drawn text sprite generated at
  runtime, so still zero network assets. Without it the GM cannot tell whose token is
  whose, and the roll queue is per-named-character.
- Faction colors and per-character flags stay deferred to v2.

## Failure and death

**Abstract dissolve.** The pawn breaks into particles and drifts away. No blood, no
ragdoll, no fall. Reads as "removed from play" rather than "killed" — appropriate for a
classroom module about a massacre. One universal dissolve at every stage of both wall
types; ship-sinking is the single exception with its own animation.

## Dice

**A 3D d6 tumbles in the scene** beside the token and settles on the pre-decided face,
then the token climbs or dissolves. Outcomes are still pre-computed into the queue when
a stage begins, exactly as `addLandAttackRolls` / `addSeaAttackRolls` do now — the die
animates a decision already made. The number stays visible because the thresholds are
part of what the module teaches.

## Defenders

**Static Byzantine silhouettes on the ramparts.** Lamellar armor, a few Varangian
long-hafted axes. Cheap to build and it stops the walls reading as unmanned. They do not
animate in v1.

## Sea assault

| Question | Decision |
| --- | --- |
| Ship capacity | **Captain + 3 passengers** — the existing code wins over the spec's "up to 2". The instruction to preserve the logic exactly takes precedence; the spec's 2 reads as a slip. |
| Ship ordering | **Keep the existing roster order.** No fama-ranked sort. Order affects presentation sequence only, never odds, and the code is authoritative. |
| Flying bridge | **Paired visually, single ship logically.** Each real ship renders with a lashed partner hull alongside and a rigged plank walkway between mast-tops, so the Clari/Villehardouin silhouette is correct — while the rules still treat one ship per captain, leaving the existing ship-formation code untouched. |

## Bribery (round 3)

**Pure narration.** Full-screen text stating the assault failed, the three fama costs
(20 general, 15 Boniface, 12 Anna), a Confirm button, then the gate-opening animation
with one anonymous figure walking through. No in-app contributor selection and no note
field — the GM handles contributions live, as now.

## Build order

1. Rough title screen — dome silhouettes and the peninsula in place immediately, so the
   flow runs end to end; detail passes come later.
2. **Land wall vertical slice** — staging → first wall → second wall → city gates, with
   the side-on camera, tumbling dice, and dissolve/success states.
3. Sea wall sequence.
4. Title screen refinement — Hagia Sophia detail, Hippodrome obelisks, scattered churches.

## Standing rule

Any historical-accuracy call not already settled by the spec gets asked, not assumed.

---

## Calls made during the build

These were not in the interview; they came up while building and follow the
brief's intent rather than its letter. Flagging them because they are the
places where the implementation and the spec text differ.

**Individual meshes, not `InstancedMesh`, for tokens.** The spec names
`InstancedMesh` for army and passenger pawns. Instancing makes per-token click
picking, per-token dissolve timing and per-token name plates substantially more
complex, and at a maximum of 52 tokens there is no performance case for it.
Pawns are individual meshes sharing geometry and materials.

**A shallow camera yaw, rather than a pure side-on view.** A strictly side-on
lane camera collapses the scene's depth: tokens standing along a rampart differ
only in Z, so they stack onto a single screen column and their name plates
overlap into an unreadable pile. The lane camera carries about fifteen degrees
of yaw. It still reads left to right — camp, moat, outer wall, inner wall, city
— with the walls in profile, but rampart depth now separates the tokens.

**Framing is specified by lane width, not camera distance.** Each stage
declares how many world units of lane it must show; the camera distance is
solved from the viewport's aspect ratio. A fixed distance crops the lane and
pushes name plates off screen on any display narrower than 16:9. Scene fog
tracks the camera distance for the same reason — fixed fog planes wash the
whole lane out as soon as the camera pulls back.

**Tailwind is a real dependency now.** The original ran Tailwind from the CDN
script. The preserved character-select and attack-declaration screens keep
their markup and classes exactly, so Tailwind moved into the build as
`@tailwindcss/vite`.

## Two bugs worth remembering

**Never pass an inline object to `<Canvas camera={{...}}>`.** R3F diffs that
prop by object identity, so an inline literal is a new object on every render
and the camera is re-applied — snapping back to its starting position and
silently defeating any per-frame easing. The camera is declared with drei's
`<PerspectiveCamera makeDefault>` instead.

**Never hand R3F a hand-constructed renderer through `gl`.** Passing a
`new THREE.WebGLRenderer(...)` leaves R3F's animation loop unstarted: the scene
mounts completely — meshes, lights, background all present — and never draws a
frame. `src/three/renderer.js` hands R3F renderer *properties* and configures
the instance R3F builds, in `onCreated`.

## What's next

1. **Title screen.** The isometric establishing shot: Hagia Sophia's shallow
   dome on its windowed drum with flanking half-domes, scattered smaller domed
   churches, the Hippodrome obelisks, the peninsula between Marmara and the
   Golden Horn, and Blachernae where the land walls meet the water. No
   minarets. The domed-church silhouettes already used behind both lanes are
   the groundwork for it.
2. Polish: name plate collision avoidance when many tokens bunch together, and
   richer defender reactions.

## Sea sequence, as built

**All passengers are aboard from the start, from the ship manifest.** A ship
that founders produces no boarding rolls at all, so its passengers appear
nowhere in the roll queue. Deriving the crew from boarding rolls meant they
were invisible and could not go down with the ship. `formShips` was extracted
out of `addSeaAttackRolls` so both the rolls and the visuals read the same
formation — a pure extraction, verified identical to the original inline loop
over 20,000 random rosters, with no change to who sails with whom.

**Sinking is the one failure with its own animation**, as the brief requires.
The ship lists hard over, settles by the head and goes under with a water
splash — nothing fades — and its crew ride it down rather than dissolving.

**Sails are furled.** Set sails read as a wall of canvas that blanked out the
whole fleet at the lane camera's angle, and ships went into an assault with
canvas in anyway. Each yard carries a furled bundle instead.

**Boarding ramps only exist once dropped.** A stowed ramp modelled at its hinge
read as a giant diagonal pole across the hulls.

**A failed boarder dissolves, though the rules message says "Falls back to
ship!"** This follows the brief, which asks for the universal dissolve at every
stage of both wall types with ship-sinking as the sole exception. Worth knowing
that the underlying rule is gentler than the visual: a failed boarder is not
lost, they simply do not advance and take no fama penalty. If you would rather
they visibly drop back onto the deck than dissolve, that is a small change in
`resolveCrew` in `src/screens/SeaAssault.jsx`.
