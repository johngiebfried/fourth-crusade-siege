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

Every screen in the flow is built. What remains is polish:

1. Name plate collision avoidance when many tokens bunch together in one spot.
2. Richer defender reactions on the ramparts.
3. The crusader-cam inset could carry more life — figures moving between the
   tents, or a boat pulling off the shore.

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

## Title screen, as built

**Stylised scale, honest shape.** The whole city is about 65 units across, so a
true-to-scale 12-metre wall would be a tenth of a unit and disappear. Walls and
landmarks are sized to read at a glance, the way a medieval map exaggerates
what matters. What is kept honest is the geography: the triangular peninsula,
the Golden Horn north and the Sea of Marmara south, the Theodosian land walls
closing the western base with Blachernae at their northern end, the sea walls
as a single lower line following the coast, and Hagia Sophia dominating the
eastern tip beside the Hippodrome and the Great Palace.

**Hagia Sophia** is a shallow lead dome on a drum ringed with windows, flanked
by two half-domes on the east–west axis, with buttress piers at the corners.
Deliberately no minarets: those arrive with the Ottoman conquest in 1453, two
and a half centuries after this scene. The dome was first coloured a sandy
tone, which read as a later mosque; it is lead-grey now.

**The Hippodrome** carries its curved sphendone, the Obelisk of Theodosius with
its pyramidion, the rougher Walled Obelisk, and the Serpent Column between them.

**The skyline is domes, not spires** — around sixty domed churches scattered
through five hundred houses, a handful of them gilded. The whole townscape is
merged into a single vertex-coloured geometry, so several hundred buildings
cost one draw call. It is generated from a seeded RNG, so it is the same city
every time it loads.

**The camera is isometric** — an orthographic camera whose zoom is solved from
the viewport so the peninsula fits at any aspect, with a very slow drift so the
shot breathes without becoming a spin. This is the only screen that is not
locked side-on.

**The crusader cam** is a second canvas in the corner, showing the camp pitched
on the Galata shore with the fleet moored off it — the camp is also visible
across the Horn in the main shot.


---

## Revision: geography and the setup flow

### The geography was wrong, and it mattered

The first version drew the peninsula as an **island**. That is the one mistake
that undoes the whole scene, because it makes the Theodosian land walls face
open water — and the land walls exist precisely because there is open ground
behind them. Corrected:

- **Europe is one landmass**, traced as a single outline from the Marmara coast
  round Seraglio Point, back west along the Horn's south shore, **around the
  head of the Golden Horn**, and east again along its north shore to Galata
  Point. Thrace lies beyond the land walls; Galata joins the same landmass
  around the head of the inlet, because the Horn is an inlet and not a strait.
- **The Golden Horn is the notch** that outline leaves behind, not a channel
  between two separate shapes.
- **Asia** is a separate landmass east of the Bosphorus, with Chalcedon and
  Chrysopolis on it so it reads as settled rather than as a bare slab.
- **Hagia Sophia no longer overflows into the Horn.** Every landmark is now
  placed by a point-in-polygon test with a clearance margin bigger than its own
  footprint, and the four landmarks are checked against each other for overlap.
- **The city stands on a ridge** matching `groundHeight` exactly, so the
  townscape sits on the terrain instead of floating above a flat plate.

### Galata's chain tower

Galata now has its tower as the central icon: a stout ashlar tower with a
machicolated crown and conical roof. **The chain is not shown.** The crusaders
broke it in July 1203, which is exactly why the fleet in this scene is inside
the Horn rather than shut out of it. The ring it was made fast to is still
there at the waterline.

### The setup flow, rebuilt over the city shot

The old flow asked for fifty-two checkboxes and then fifty-two land/sea/sit-out
choices, on screens that looked nothing like the opening image. It now runs as
four questions laid over the living city shot:

1. **How many crusaders are attacking?** A number. The roster is pre-scripted,
   so a count of fifteen means the first fifteen names on the list — no picking.
2. **Does anyone refuse?** Name them from a dropdown. Sitting out still costs
   1 fama, exactly as before.
3. **Land walls, sea walls, or split?**
4. **Only if split:** two numbers that must add up to the attackers, then name
   the *smaller* group from a dropdown. The rest go the other way.

The dropdown is a custom panel rather than a native multi-select, which is
unreadable on a projector. If the sea party ends up with no Venetian and no
Oberto, the panel says so before the dice are thrown rather than after.

Round two re-runs the same flow from step 2, since the roster is already fixed.

`CharacterSelect.jsx`, `AttackDeclaration.jsx` and `TitleScreen.jsx` are
superseded and removed; the city shot now lives in `CityBackdrop.jsx` and the
whole opening in `Opening.jsx`.


---

## Revision: the land lane, seen along the wall

The side-on lane looked at the defences **end-on**, so each wall was a slab
seen edge-first — a cross-section through a wall rather than a wall. That is
where the cutaway look came from, and no amount of tuning the yaw fixed it,
because the problem was which face of the wall you were looking at.

The camera now stands out on the attackers' side and looks back **along** the
line. Each wall runs as a diagonal across the frame, the next line stands
taller behind it, and the city closes the top of the shot — a continuous wall
chain instead of a diagram. Three things had to change together:

**The walls run off both edges of the frame.** A lane depth of forty-six units
against a camera that sees roughly thirty means the ends are never in shot,
which is what kills the cutaway. The old lane was thirteen deep and its cut
ends were always visible.

**Framing is solved from vertical extent, not width.** This composition stacks
up the screen — outer wall, inner wall, gate, city — so height is the binding
constraint. Solving from width, as the old lane did, crops the chain on a wide
display, which is exactly the shape a classroom projector is. A wider screen
now simply shows more wall running off the edges.

**The banding had to be calmed right down.** Two brick courses in every six,
each standing proud, read as masonry from a few metres and as corduroy from
any distance — the whole wall turned into a texture. It is now one muted brick
band every seventh course, barely proud of the stone. Lighting does the rest:
the sun rakes across the wall faces so the three lines model separately, with
low fill so shadowed sides read as shadow.

Elevation is the live trade-off, and worth knowing if this wants further
tuning. Around thirty degrees is the current setting. Lower and the wall lines
overlap into one mass; higher and you look down onto their tops and lose the
faces, and the horizon leaves the frame entirely. A steeper on-screen diagonal
costs wall face, one for one.


---

## Revision: ladders, ground detail, and how far the walls run

**The walls now run far past every edge of the frame.** Lane depth went from 46
to 150 units, with towers and garrison spread to match. The old length still
let the far end of the chain appear at the top of the shot; nothing is cut off
now.

**Ladders are raised during the assault, not scenery.** A ladder comes up out
of the grass as a crusader's attempt begins, stays against the wall if they get
over, and topples back if they do not. The wall therefore accumulates the
ladders of everyone who made it, which shows the assault's progress without any
extra interface. The gates stage raises none — a gate is not scaled.

**Ground detail, easy tier.** Grass is one instanced mesh — fourteen thousand
tufts in a single draw call, with per-instance tint so the field is not one
flat green. Two mistakes worth recording: blades were first sized for a much
bigger world (a crusader token is only about 1.15 units, so grass must be a
tenth of that, not half), and the material had `vertexColors` set while the
geometry carried no colour attribute, which rendered the whole field black.
Instance colour is applied by the renderer independently of that flag.

**The moat is a lit material with waves injected into its shader**, not a raw
ShaderMaterial. A raw shader receives no lighting and no fog, which made the
ditch read as a black trench cut through the field rather than as water sitting
in the landscape. Still no textures anywhere — the ripples and the glint on the
crests are arithmetic.


## Visual fidelity: the decision, and what it bought

Asked how far to push realism, the answer was **stay flat-shaded and push that
hard** — no physically-based materials, no post-processing, no texture maps,
procedural or otherwise. Target machine is an older or unknown school laptop,
so the frame budget stays low.

That constraint turns out to be freeing rather than limiting, because the two
techniques that buy the most realism per unit of cost are both free at runtime:
**baking light into vertex colours**, and **merging geometry**.

### Depth painted into vertex colours

Every piece of masonry is now shaded per vertex by where it sits:

- **Ambient occlusion** darkens courses near the ground and under the parapet
  oversail, so the wall sits in the landscape instead of floating on it.
- **Weathering** stains the lower wall and streaks down the face.
- **Per-course and per-block jitter** stops the masonry reading as a flat wash.

None of this costs anything at render time — it is all in the colour attribute.

Two calibration notes. Vertex colours near 1.0 under a strong sun blow out to
near-white and the banding vanishes entirely, so the whole range sits lower
now. And the brick had at one point been muted so far that it stopped reading
at all; it needs to be quiet at distance but still present up close.

### Towers stand proud of the wall

Towers were flush with the wall face, which gave the line no rhythm. Set
forward, they break the face into bays and cast the shadows that let you read
one bay from the next. This is what most made the wall look like a wall.

### Merging, which is where the performance came from

The scene had roughly six hundred draw calls for defenders alone — a hundred
figures at six meshes each — plus a hundred and fifty city buildings and
fifty-two towers, all separate. That is exactly the shape of thing that turns
an integrated-graphics laptop into a slideshow.

Now: a whole wall line — courses, merlons, every tower, arrow slits and the
rubble heaped at its foot — merges into **one geometry**. So does each
garrison, and the city backdrop. Grass is a single instanced mesh of fourteen
thousand tufts. The land lane measured 112 fps and the sea lane 120.

Note for later: `mergeGeometries` refuses a mix of indexed and non-indexed
geometry. Box and cylinder primitives are indexed; the polyhedra
(Dodecahedron, Icosahedron) are not. The rubble uses rotated boxes for that
reason.

### Still available, same rule, not yet done

Real embrasures and a walkable parapet with depth; siege engines (mangonels,
a ram under its penthouse) on the field; banners and tents in the crusader
camp; smoke and fires; per-figure variation in the crusader pawns to match the
defenders.

---

## Revision: the sea lane brought up to the land lane, with a new boarding mechanic

### Boarding comes down from the mast-heads

**Changed on instruction, and it is the more correct mechanic anyway.** The
gangway is run out from the flying bridge at the lashed mast-heads and dropped
onto the rampart — not from the bow, as it was.

That is the whole point of lashing two ships together and rigging a bridge
between their mast-tops: to put men onto the wall *from above it*. A ramp off
the forecastle is reaching up at the wall from deck level, which is precisely
the problem the bridges were built to solve. Its length and slope are computed
from the gap to the wall face and the drop from the mast-heads to the parapet,
so it lands on the wall instead of swinging to a fixed angle.

### A lower camera than the land lane, deliberately

The land lane looks down at about thirty degrees, which puts the horizon
outside the top of the frame. Over a field that is fine. Here it hid the far
shore completely — and the point of this lane is that the fleet is *inside* the
Golden Horn, with Galata and its chain tower opposite. A shallower pitch with a
wider lens keeps the far bank and a strip of sky in shot, and water reads far
better at a grazing angle than from above.

### Everything else is parity work

The sea lane had received none of the land lane's rework, so it carried every
problem the land lane used to have: a fifteen-unit wall whose cut ends sat in
frame, framing solved from width rather than height, a side-on camera, flush
towers, unmerged geometry and flat water. All now match the land lane.

Added beyond parity: planked hulls with shields hung on the gunwale and
standing rigging, Galata with its chain tower and the crusader camp opposite,
the rest of the fleet at anchor, and the city rising behind the wall.

### Failed boarders keep dissolving

Decided rather than deferred. The universal dissolve stays, on the grounds that
it is clean and that its ambiguity is a feature: the module does not claim the
crusader died, only that they are out of the assault.

### One calibration note

The Horn was first given a swell scaled up for open water, at nearly twenty
units per wave — two waves across the entire frame, which read as flat grey
blobs rather than as sea. Open water wants many small waves, not a few
enormous ones, and the crest highlight has to be a narrow band or it lights
whole swathes of the surface instead of the tops of the waves.
