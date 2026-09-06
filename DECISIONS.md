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

---

## Revision: scene checks, screen consistency, and the rest of the polish list

### Scene invariants

`scripts/check-rules.mjs` proved the dice were right; nothing proved the world
was. The gate camera sat buried in masonry for two commits and no one noticed.

`scripts/check-scene.mjs` now asserts the things that actually broke: that no
camera framing puts the camera inside a wall at any aspect ratio, that ladders
reach the wall face and clear the parapet, that both walls run past the edge of
the frame, that the gate camera stands on cleared ground aimed at the gate,
that a ship stops short of the sea wall with a gangway that reaches, and that
every city landmark sits on land.

For those checks to mean anything they have to test what ships, so the world's
dimensions and every camera framing moved out of the `.jsx` components into
`three/lane.js` — a plain module Node can import, which the scenes now read
from. The suite found a real defect on its first run: the gate camera's start
point stood outside the street cleared for it, so it could begin inside a
building.

### One environment quirk worth recording

The browser preview used for checking this work fires a stray click shortly
after page load, which lands on whatever button is under it — usually "Begin
the Siege", so the title screen appears to skip itself. This is not an app
bug: with an event probe installed no click events fire and the title screen
stays put. If the title screen ever *does* appear to skip in a real browser,
that finding is worth revisiting rather than assuming the same cause.

### Screens

Results, First to Enter and Bribery were still flat Tailwind cards on a pale
gradient — the seams where the redesign stopped. They now sit over the city
like everything else, sharing one set of panel, heading and button components
in `screens/ui.jsx`.

### The rest of the polish list

**Sea:** foam collars and wakes, an expanding ring where a ship goes down,
oars, grapples thrown alongside the gangway, defenders massing on the bays the
ships have come alongside, and smoke over the city.

**Land:** a wall-walk with real depth, with the parapet standing on its outer
edge and embrasure sills between the merlons, so the walk reads as a surface
men stand on. The crusader camp with its tents and pennons, and the engines
drawn up in front of it — a mangonel, the beam-and-sling stone-thrower of the
period, and a ram slung under a hide-covered penthouse. Deliberately no
counterweight trebuchet: that is a later machine than 1204 for a western army
in the field.

Ordering the camp took a correction. First placed, the tents stood on top of
the army and the engines were standing in the moat. Reading back from the wall
it now goes: wall, ditch, army, engines, tents.

**The crusader-cam inset** pointed inland at a bare green ridge, which told the
class nothing. It now looks south across the Horn, so the camp is in the
foreground, the fleet is on the water, and Constantinople's sea wall and domes
close the far bank — the inset says where the crusaders are *and* what they are
looking at.

---

## Revision: the crossing, the water, and the way onto the wall

### The moat bridge is back, deliberately this time

An earlier version had a structure sitting at the moat's edge that read as a
crusader-built bridge. It was actually a mis-placed battering ram, and removing
it took the bridge with it. Bridges are now built on purpose, four of them
spaced along the ditch. They answer the question the lane otherwise leaves
open — how does an army on the near bank reach a wall on the far one — and
they are what a besieger actually did: fill or bridge the ditch before you can
put a ladder on anything.

The ram is gone. At this scale it was a large box that read as neither ram nor
penthouse. Two mangonels stand off to one side of the camp instead.

### The sea lane reads across the Horn, not along it

The fleet used to start already at sea, which left the crossing meaningless.
Galata is now the near bank: the ships lie drawn up on its beach, and when a
captain's attempt begins the ship pushes off and rows the whole way over. A
ship that founders does so **in mid-channel**, which is both where it would and
where it reads.

The channel is narrower than it was. The Golden Horn is an inlet a few hundred
metres across, not an open sea, and at the old width the ships spent the whole
animation as specks in the middle of it.

### Why the water looked wrong

The first water displaced its surface but never touched its **normals**, so the
light fell on it as if it were still flat. The geometry said "sea" and the
shading said "painted floor" — which is exactly why it read as silly.

It now sums four wave trains running in different directions and computes the
surface normal analytically from their gradients, so the lighting *is* the
wave. On a Phong material that also gives a real specular glint, which is most
of what makes water look wet. Still no textures: it is all arithmetic.

### Boarders go up first, then walk

A boarder used to travel from the deck to the parapet in one move, which read
as a diagonal leap across open water. They are now lifted to the inboard end of
the gangway — up on the flying bridge between the mast-heads — and only then
walk the plank across to the wall. Two steps, and the second one is a walk
along something solid.

The ship and gangway dimensions moved into `three/lane.js` so the scene checks
can assert that route: that the bridge stop really is at the inboard end of the
gangway, that it is well above the deck, and that a boarder steps off just
inboard of the wall face. A screenshot of one lucky roll would not have proved
any of that.

### One bug worth recording

Naming a local variable `station`, not `stage`. A local `const stage` inside
the ship-view loop shadowed the assault stage the component was resolving, so
`stage?.key === 'piloting'` was quietly testing a string, and every ship became
unclickable with no error anywhere.

---

## Revision: proportions

**Tower spacing, both walls.** They were set close enough to read as a picket
fence. Spacing is up about a third — land walls from 5.8 units to 7.9, the sea
wall from 6.3 to 8.3 — which is still close, as the real circuit is, but no
longer shoulder to shoulder. Expressed as counts rather than spacings, because
the wall's length is what they divide.

**The Golden Horn was overcorrected.** Told once that it was too wide, it went
from 34 units to 27, which was too far the other way. It is now 38, and the
Galata side has been cut right back — a quarter of the houses and tents, on a
narrower bank — so the water gets roughly the middle of the frame rather than
being squeezed between a crowded foreground and the wall. The camera also
looks down a little more steeply, nineteen degrees rather than fourteen, which
gives the channel more of the screen without losing the far shore.

**One bridge over the moat, not four.** A besieging army bridges the ditch
where it means to assault. A single crossing reads as an effort that cost
something; four read as fencing along the bank.

**The mangonel is now actually a mangonel.** It was a frame with a stick in it.
It has A-frames carrying a proper axle, a padded crossbeam for the throwing arm
to strike, a sling hanging from the arm's head with its stone in the pouch, the
bundle of hauling ropes at the short arm — this is a traction engine, and those
ropes are how it is thrown — a windlass for cocking the arm back down, and shot
piled ready beside it.

---

## Revision: the crusader pawns, first pass

Three changes, chosen off a ranked list. Faction colour, banner-bearers and
grouping the staging by contingent are all still open decisions.

**Every crusader now wears a cross**, on the chest and repeated on the shield.
This was not a matter of size: there was no cross on the pawn at all. What sat
on the shield before was a shrunken copy of the shield's own outline, which
read as a device but said nothing. Taking the cross is the best-attested marker
these men had, so this is the rare change that is both the most historically
grounded and the cheapest.

Making it visible needed one fix to the shield. It is a three-sided prism, and
a prism presents an *edge* rather than a face to the camera unless it is turned
— so the shield is rotated a sixth of a turn on its own axis, and the group's
yaw flipped, to put a flat face square to the lane camera. A device on an edge
is not a device.

**The figures are about fifteen per cent larger.** They were roughly a third
the height of the outer wall, which is about right in proportion but cost
legibility on a projector.

**Contact shadows, and real cast shadows.** The pawns were the only thing in
the lane not casting into the shadow map, so they sat on the grass rather than
in it. They now cast, and each also carries a soft disc that fades to nothing
at its rim — the falloff is vertex alpha on a four-component colour attribute,
not a texture, so it costs nothing. This is the affordable part of what people
are reaching for when they ask about ray tracing.

Calibration note: the disc was first drawn at 0.44 units, which hid it
completely underneath the figure. It reads at 0.72.

## Revision: the crusader pawns, second pass — helm, livery, banners

**The great helm, and no shield.** Everyone now wears the same flat-topped
great helm: a shallow cylinder with a top plate, a dark vision slit, a vertical
reinforce down the face and three breaths bored beside it. Your call, and the
right one — the great helm is just emerging by 1204, it silhouettes cleanly at
forty pixels, and a single form reads as an army rather than as a costume
parade. The shield is gone entirely. At this camera you see helmet, cape and
spear; the shield was geometry paying no rent.

**Livery, by faction.**

| Faction | Colour | Device |
| --- | --- | --- |
| Venetian | Red | Lion of St Mark |
| N. French | Blue | Fleur-de-lis |
| Imperial | Yellow, black device | Eagle |
| Clerical | White, red cross | Crossed keys of St Peter |
| Indeterminate | Green | *(blank flag)* |

Indeterminate was left to me and I chose undyed wool, which was wrong: buff sat
too close to the clerical white at forty pixels, which is the one contrast that
had to hold. It is green, your call, and green is in fact the only hue left
that separates cleanly from all four declared contingents. It is darker and
more saturated than the olive of the field, so it does not sink into the grass.
Its flag stays deliberately blank.

Two deliberate anachronisms, both yours and both defensible as game
conventions: the Lion in its early-modern red form, and the fleur-de-lis, which
is not yet a fixed royal arms in 1204. One deliberate *avoidance*: the imperial
eagle is **single-headed**. The double-headed HRE eagle is fifteenth-century,
and the double-headed Byzantine eagle is post-1261 — either would have been
wrong here, and wrong in the specific way this project is trying not to be.

Devices are drawn to a 128×96 canvas at runtime and cached per faction. A
`CanvasTexture` is generated, never fetched — the no-asset rule holds.

**Banner-bearers, and nobody else.** The senior man of each contingent —
highest fama, ties broken on id so it never changes between loads — carries a
standard on a taller staff. Every *other* man was first given a small pennon on
his spear; they came out as a thicket of little flags saying nothing the cape
colour had not already said, and they are gone. The spear is just a spear. The
standard means more when one man in the following holds it. This is the strongest available answer to "how do
these people come together": it groups them without uniforming them, and it is
the one part of the livery scheme that is straightforwardly historical.

**The staging is grouped by contingent.** Pawns are sorted by faction before
slots are handed out, so the Venetians stand with the Venetians. Presentation
only — it touches no roll, and the dice logic never sees the ordering.

**One geometry per faction.** The helm, cape, mail neck, boots, spear and cross
are merged into a single 577-vertex geometry per faction with ambient occlusion
baked into the vertex colours, cached and shared. Five geometries dress the
whole army.

**Where the cross had to go.** It was on the geometric front of the figure
(+Z), which the lane camera looks at about forty-five degrees off, so it read
as a smudge on the flank. It now sits at azimuth −0.8 rad — square to the
camera — and is larger. Same lesson as the flags, learned twice: on a figure
this small, a device is only a device if a flat face carries it toward the
viewer.

**Both lanes, not just the land one.** The sea crew are dressed from the ship
manifests rather than the roll queue. That matters: passengers of a ship that
founders never roll to board, so they exist nowhere in the queue, and dressing
from the queue would have left them undyed — standing out from their own
contingent at the exact moment they go down with the ship. Two new scene
invariants now hold the wiring in place, one per lane, plus one that every
passenger carries the fama a bearer is picked on.

## Revision: legibility passes on the devices and the bridge

**The keys of St Peter, twice.** First drawn in the gold and silver of the
papal arms, at the weight the other devices use: correct tincture, and
completely illegible — two pale keys on a pale ground. Redrawn near-black and
much heavier. That still was not right: laid out nearly upright the two shafts
ran almost parallel and read as *one* key with a doubled ring. They are now a
true saltire — bows low and together, wards high and splayed outward, crossing
below centre, with the upper key laid over a halo of the field colour so the
two stay two where they meet. Weight and layout beat tincture on a flag forty
pixels wide.

**The moat bridge was out of scale.** It was two units across with a handrail —
wider than a man is tall, and far too finished for something an army throws
over a ditch under shot. It is now barely two abreast, on thin leaning
trestles, with no rail at all: salvaged boards of uneven width and length, laid
crooked, sagging at midspan, with gaps where there was nothing left to lay and
braces missing from some bents. It answers the "how do they get across the
moat" question without pretending anyone had time to build well.

## Revision: the sea lane's physics, and who flies what

### The boarding walk was a diagonal, and here is why

A man who got onto the wall was placed by *his slot in the whole boarding
order*, spread evenly along the rampart — a leftover from before the gangway
existed. His ship had nothing to do with where he landed. So he stepped off the
flying bridge and drifted sideways across open water to a berth that might be
twenty units from his own plank. It looked like a diagonal leap because it was
one.

He now lands at the far end of *his own ship's* gangway, at its depth, so the
whole path from the head of the plank to the foot of it is a straight run along
X. Men from the same ship keep a lane a third of a metre apart and hold it the
whole way, so they walk in file down the plank instead of converging on a
point.

### Landing inside a tower

The towers stand proud of the wall face. Drop a gangway straight in opposite
one and its far end is inside masonry, and so is the man who walks down it —
which is exactly what was reported.

Three things fixed it, in order of how much they do:

1. **Fewer towers.** Eighteen down to twelve, the same third the land wall was
   thinned by. Bays are 12.5 units instead of 8.3, so most berths are clear
   before anything else is tried.
2. **The fleet slides bodily along the wall** to the smallest offset that puts
   every berth in a bay. Pushing ships *individually* clear was tried first and
   is worse: with a large fleet the pushes bunch neighbours together until
   hulls overlap. Sliding the line keeps the spacing exactly even, and the
   *smallest* sufficient slide is chosen because a big one takes the far end of
   the line out of frame.
3. **The plank swings.** Where a berth still ends up opposite a tower — only
   with seven ships or more — the gangway is laid down a few degrees off square
   so it lands beside the tower instead of on it. Never more than nine degrees
   in practice. The boarder still walks a straight line, because the line he
   walks is the plank.

The scene checks now assert all of it for fleets of one through twelve: that
the boarder's path and the plank's line are the same line, that nobody lands
inside a tower, and that no two hulls overlap.

### The fleet is narrower

The outermost ship of a five-ship fleet sat outside the frame on a laptop. The
spread is down from 34 units to 24, floored so hulls can never touch however
many ships there are. The camera looks *along* the lane rather than square
across it, so the near end of the line is what runs out of the corner — which
is why the smallest tower-clearing slide is preferred over the best one.

### Who flies what

**Every mast-head flies Venice's colours.** The fleet was Venetian whoever
commanded a given ship — Venice built it, crewed it, and the contract that put
the army aboard was hers.

**The other four contingents' banners stand on the Galata shore**, planted on
the beach they embarked from. It says who is aboard without dressing the ships
in four sets of livery, and it gives the far bank something to be besides
scenery.

**A contingent's flag goes up over the tower nearest where its first man got
onto the wall**, and runs up its staff as it is raised. First arrival takes the
tower; once the flag is up it stays up, even after that man has pushed on into
the city. It is the clearest read in the sequence of who is actually winning.

## Revision: the manuscript treatment, better devices, and the textbook

### Three manuscript treatments, not one

"Medieval manuscript" covers everything from a plain ruled working copy to a
presentation leaf with gold on it, and which one a screen wants depends on what
the screen is for. So there are three, used side by side in the game so they
can be judged in place:

| Treatment | Where | What it is |
| --- | --- | --- |
| **Leaf** | First to enter | Gold-ground initial, rubricated incipit, double bounding rule, painted parchment mottle. The most decorated and the slowest to read, so it goes on the one moment worth stopping at. |
| **Ruled** | Bribery | Visible ruling, a rubric out in the left margin, a plain red versal. Holds a price table without looking crowded. |
| **Bordered** | Results | Vine-scroll down both edges with leaves growing off the stem, centred heading. The most ornamental and the most expensive in width, so it is kept for the closing page. |

The illuminated initial is drawn to a canvas at runtime — gold panel with a lit
and a deep edge, a lapis or vermilion field, vine-work in the corners, and the
letter reserved in parchment white with a dark contour. Generated, not fetched,
exactly like the flags and the name plates. On the first-to-enter screen the
initial is the crusader's own, which is a small thing that pays for itself.

### The lettering, and why there is no blackletter

The brief forbids fetched assets, which rules out a webfont, and no blackletter
face can be relied on across a room of unknown school laptops — macOS ships
none, and Windows only has Old English Text MT if Office put it there. The
canvas initial names those faces and falls back gracefully; the body text stays
in the old-style serif the rest of the game uses.

This is the right trade rather than a concession. The manuscript signal at a
glance is the *initial, the rubrication, the ruling and the margins*, not the
letterforms — and those are the parts that can be guaranteed to render. A
blackletter body would also be markedly harder to read on a projector, which is
the opposite of what a classroom text wants.

### The devices, rebuilt

The flags fly on staffs now, close enough to the camera that the old
hundred-pixel drawings were showing their seams. The canvas went from 128×96 to
320×240 and all four devices were redrawn.

The lesson worth recording is about **wings**. Drawn as feathers radiating from
a shoulder they make a starburst: the first eagle came out as a crow, and the
first lion had no visible wing at all. A wing reads as a *mass* with a stepped
trailing edge. Both are now built by filling a swept shape and cutting its
trailing edge into scallops, which is one path instead of a dozen and reads
correctly at any size.

The rest was iteration against the thing on screen: the eagle needed a short
thick neck and a deep hooked beak (a long neck and a shallow hook make a dove,
then a duck), and its legs had to be thick and short and thrown clear of the
tail. The fleur-de-lis needed side petals fat where they leave the band — drawn
thin they read as horns — and only a shallow notch under the foot, because a
deep one forks it into a tail.

### The textbook of the day

Six sets of passages, in `game/lore.js`, offered to the screens as marginal
gloss:

`chronicle` (13) · `siegecraft` (10) · `walls` (8) · `city` (6) ·
`aftermath` (6) · `fleet` (5)

Every passage attributed to a chronicler is **my own plain-English rendering**
of what that writer says at that point, not a transcription of a published
translation — modern translations are somebody's copyrighted work. The general
sets carry no attribution at all, and a check enforces that, so nothing
uncited can drift into looking like a quotation.

The picker exhausts a set before it repeats anything. A class plays this more
than once, and a random pick shows the same passage twice in a sitting while
never showing a third of them.

`scripts/check-lore.mjs` holds the whole thing together: sets long enough not
to repeat, nothing empty, nothing long enough to stop the game, every chronicle
entry sourced, no general entry sourced, no passage in two sets, and the picker
exhausting before repeating. `npm run check` now runs all three suites.

## Revision: the whole interface becomes a manuscript page

The reference is *Inkulinati*: vellum ground, iron-gall ink line-work,
vermilion rubrication, gold used sparingly, and drolleries in the margin. What
that rules out is everything the modern web reaches for by default — rounded
corners, soft drop shadows, flat saturated UI colour, emoji. A scribe had a
quill, three pigments and a piece of skin.

It was done at the **primitive** level rather than screen by screen, so it
reaches everything at once: tokens and `.vellum` / `.ink-frame` /
`.quill-button` / `.ruled` in `index.css`, and the shared furniture in
`screens/ui.jsx` rebuilt on top of them. `manuscript-scope` zeroes every border
radius inside a panel, because a rounded corner is the single most modern thing
a box can do and they otherwise creep back in one Tailwind class at a time.

Three specific things were doing most of the damage:

**The dark panels.** Bribery, the results and the first-to-enter callout were
all inverted slate cards. They are vellum now. Weight on a manuscript comes
from a heavier ink frame and more rubrication, not from flipping the ground —
and the dark cards made the 3D lane behind them look like a screenshot pasted
into a web app.

**The emoji.** 🏰 🚢 ⚔️ 👑 were colour bitmaps from 2015 sitting in the middle
of a manuscript, and no amount of vellum around them helps. They are drawn in
ink now. The crossed swords took two goes: an X with arrowheads on it is a
compass rose, so the sword is built upright — blade, crossguard, grip, pommel —
and then rotated twice.

**The roll readout.** Emerald-on-green success and red-on-pink failure was pure
web. Success and failure now read as ink and vermilion, which is how a
manuscript marks anything at all.

### Drolleries

The marginal grotesques are the strongest single signal that a page is medieval
rather than merely brown, so there are three — a hare with a trumpet, a snail,
and a hooded man's head on a bird's body — drawn as inline paths.

Two things had to be got right. They collapse to a smudge inside a flex row
without `shrink-0`, an SVG with no basis having nothing to hold its width open.
And the first drawings overlapped everything and both filled *and* stroked it,
which produced one amorphous blob: at this size a drollery lives or dies on its
silhouette, so the masses are separated and the limbs are strokes.

### On the lettering, again

Still no blackletter body face, for the reasons in the previous entry: a
webfont is a fetched asset and no blackletter can be relied on across unknown
school laptops. The manuscript signal is carried by the initial, the
rubrication, the ruling and the margins — the parts that always render, and
that stay readable on a projector.

## Revision: where the textbook actually appears

**Scheme B — the waiting beats.** The three moments the game already spends
doing nothing now carry a passage: the title screen takes `city`, the "fleet
stands in" beat before the sea assault takes `fleet`, and the gate opening
takes `chronicle`. No new screens, no interruption, roughly three to six
passages a playthrough.

**Scheme C — failures only.** A failed roll carries a fact from `siegecraft` or
`walls` under the readout. Failure is when a student actually has the question —
*why didn't that work?* — and it is the one beat where nobody is mid-decision.
Successes stay clean on purpose: a fact under every roll becomes wallpaper and
stops being read.

### The chronicle set is two men now

Choniates, Gunther of Pairis and Innocent III are better writers on what the
Fourth Crusade *meant*, and all three are about the sack rather than about
getting over a wall. On the beats this set feeds, a passage about mules in the
Hagia Sophia answers a question nobody has asked yet.

So the rotation is Villehardouin and Robert of Clari — the two eyewitnesses of
the siege itself, and between them the top and the bottom of the army: a
marshal who helped negotiate the Venetian treaty and is defensive about the
diversion, and a poor knight of Picardy who cares far more about the plunder
and the marvels than about who was right.

The rest are kept in `HELD_BACK.sack`, written and checked but out of the
picker's reach, because the module hands off to a sack phase and that is where
they belong. `SETS` is what the picker can see; `HELD_BACK` is not in it.

### The gloss has to match the lane

The first failure gloss shown on the *land* wall was the story of the harbour
chain. Every passage in `siegecraft` and `walls` now carries `lane: 'land' |
'sea' | 'both'`, and the picker filters on it — an irrelevant fact is worse
than no fact, because it reads as the game not knowing what the student just
watched.

The seen-list is keyed per *lane* as well as per set. Keyed per set alone,
exhausting the six land passages would wipe the sea lane's history with them.

`scripts/check-lore.mjs` covers all of it: every tagged passage carries a lane,
each lane has at least four passages that fit it, a hundred draws in one lane
never return the other's, and a lane exhausts its own passages before
repeating.

## Revision: a real hand, and no more drolleries

### The font: a deliberate exception to the no-assets rule

The manuscript styling was carried entirely by decoration — vellum, ink frames,
rubrication, ruling, illuminated initials — while the type stayed a system
serif, because the brief forbids fetched assets. Judged in place, that was not
good enough. The page looked brown, not medieval.

There is no way around it: a book hand cannot be generated at runtime, and no
medieval face can be relied on across a room of unknown school laptops. macOS
ships Luminari and Herculanum; Windows only has Old English Text MT if Office
put it there. The choice is a font file or no medieval type.

A font is now shipped in the repo — **in the repo, not on a CDN**: a classroom
with no network or a blocked font host would otherwise fall silently back to
Georgia mid-lesson, which is the failure this is meant to end. Which font took
two goes; see the entry below.

The no-external-assets rule still holds absolutely where it was aimed — the 3D
scene, where every mesh is procedural and nothing is fetched. Type is a
different kind of thing.

It is set **everywhere, body text included**, which was the call.

### Three places keep the serif, on purpose

**Numerals and tallies.** Textura numerals are quirky by design and several are
unrecognisable to a modern eye. This game is played on dice results, thresholds
and fama counts read at a glance from across a room, and a misread roll is a
rules dispute. Anything tagged `.tally` reverts.

**Name plates in the 3D scene.** Drawn at 46px and rendered down to a handful
of screen pixels over a pawn's head. A blackletter at that size is mush.

**Text inputs**, for the same reason as the tallies.

### Rubrics are no longer set in capitals

A tracked line of small caps is a modern web idiom, and in a textura it is also
the worst available choice: majuscules in this hand are ornate display letters
meant to be used *one at a time* — which is exactly what the illuminated
initial uses them for — and a whole line of them is close to undecipherable.
A scribe rubricating a heading wrote it in the ordinary hand, in red.

The illuminated initial now draws in the shipped hand, and waits for it:
canvas text does not defer to a webfont the way the DOM does, so it paints
once immediately and again on `document.fonts.load`, or the capital would be
set in Georgia permanently because nothing would ever redraw it.

### The drolleries are gone

The marginal grotesques were bad, and they are removed rather than redrawn a
third time. Figure drawing at that size lives or dies on anatomy, and
hand-authored SVG paths for a hare are not going to beat a scribe who drew
hares all day. A crude drollery is worse than none: it reads as clip-art and
drags the page down with it.

What replaced them is **penwork** — a rubricated line-filler, and a pen
flourish with hairline tendrils and bulb terminals. Just as characteristic of a
manuscript page, and geometric rather than anatomical, so it can be constructed
correctly rather than observed badly. The line-filler is also the one piece of
ornament with an actual job: it is what a scribe ran along a short last line to
keep the text block's edge.

## Revision: the hand, second choice

The textura was rejected on sight, and rightly — it is correct for 1204 and
genuinely hard to read, which is the wrong trade for a text a class reads off a
projector. The replacement had to be a *scribal* hand without being a fraktur,
and that is a narrower gap than it sounds. Five candidates were rendered in the
actual panel and judged side by side rather than argued about:

| | Verdict |
| --- | --- |
| **UnifrakturMaguntia** (textura) | Rejected. Authentic and hard to read. |
| **Cardo**, **Junge** (Carolingian descendants) | The trap. Carolingian minuscule is the direct ancestor of every book serif in use, so an authentic one reads as a nice modern serif — exactly the complaint this was meant to fix. |
| **Uncial Antiqua** | The most convincingly scribal of the five, but its true uncial `g` and `t` turn "get over it" into "ʒet over it", and it is five centuries early for this siege besides. |
| **MedievalSharp** | Chosen. Rounded, unmistakably hand-drawn, and with no letterform a student will misread. |

The honest cost: MedievalSharp is a modern designer's medieval hand rather than
a historical script. Every other candidate paid for its authenticity in
legibility, and for a teaching tool on a projector that is the wrong currency.

The font family is declared as `Hand` rather than by its own name, and the
`@font-face` block carries the swap instructions, so changing this decision is
two lines and a file. The candidates are all SIL OFL 1.1 and all live in
`google/fonts` under `ofl/<name>/`.

**`.tally` survives the swap, changed in kind.** Under the textura the dice
numbers had to revert to a serif outright, its numerals being unrecognisable.
This hand's numerals are clear, so they stay in it and are merely set heavier.
The rule is kept because the reason for it has not gone away — a misread roll
is a rules dispute — and the next swap may need it again.

## Revision: reading the instructor's manual and the gamebook

The published game arrived late in the build, and it settled several things
that had been guesswork. Two changes came out of it, both small, and a longer
list of things deliberately *not* done.

### The module's actual job

The manual's online-teaching section names the thing this replaces: *"moving
small clip-art boats or chess figures of knights may provide a modest
replacement for the heightened drama of the attack."* And: *"The Siege and Sack
modules of Phase III are the places where students 'feel' the game most
intensely, and this can be the yeast that really catalyzes their learning
experience."*

So this is the drama engine for the moment the game leans on hardest, and its
competition is clip-art. That is a clearer brief than the one it was built to.

### The speech boon

The manual gives the faction with the most rousing pre-assault speech *"a
powerful boon, namely that any member of that group can increase by one all
their dice rolls for the siege."* The data model always supported it — `bonus`
sits on every character and `rules.js` adds it to every roll — but it was
hardcoded to zero and unreachable, so the speeches left no trace in the model.

There is now a step between the refusals and the attack choice: pick the
faction that won, or no faction. It is asked in round one only, and the boon
**rides on the roster rather than on component state** — the roster is what
comes back as `existingRoster` for round two, so baking it in there is what
makes it hold "for the siege" rather than for one round.

### The sack order gains the tier it was missing

The manual: first position to the first man in, *"followed by those who also
made it onto **either the second set of land walls or the sea walls**"*, then
everyone else by fama, shipwrecked last.

That third tier did not exist. Anyone who got onto the inner wall or the sea
wall and fell short was dropped in with the men who never left the ground. It
is now its own tier, `status: 'walls'`, set for a man who rolled in the final
stage of either lane and failed — he was standing on the wall when he did it.

The effect is the point: in a test round, Berthold of Katzenellenbogen (fama 3)
came out ranked above Boniface of Montferrat (fama 10), because Berthold got
onto the inner wall and Boniface did not. The manual has these men roll afresh
against each other to order the tier; we rank them on the roll they already
made, which needs no extra step at the table and rewards the same thing.

The by-fama ordering of the tier *below* is the pedagogy, and the manual says
so outright: it exists *"to imitate the historical complaint of the sack
mentioned by Robert of Clari that the rich and powerful lords took all the
spoils for themselves, leaving the common knights with nothing."*

### Selection stopped looking like hover

Adding a list of faction choices exposed an old bug: `.quill-button:hover`
filled with rubric, which is exactly how a *selected* option was drawn. With a
cursor resting anywhere in a list, the projector showed two options apparently
chosen and no way to tell which was real. Hover now only tints; rubric fill
means chosen, and only chosen.

### Deliberately not done

- **The fama reroll.** The gamebook tells students they may *"spend a point of
  fama... to reroll dice during an attack on the city."* The author does not
  use the rule and does not want it modelled. Recorded here because the
  gamebook is fixed and a student may well ask.
- **A narration engine.** The manual's model narration is far richer than
  "Repelled by defenders!" — but the author prefers the flat line: less
  complicated, and it does not slow the table.
- **A visible fama ledger.** Scores will have moved in earlier phases and no
  instructor is going to key them in. The siege reports position, not points.
- **Greek agency in the siege.** It belongs to the sack, not here.
- **Sack-order export.** What is on screen is usable as it stands.

### Known divergences between the original code and the printed manual

Left as they are, faithful to the code, and recorded so the choice is visible:

| | Manual | Code, and this port |
| --- | --- | --- |
| Ship capacity | *"can then carry **2** other crusaders"* | 3 passengers |
| Final roll | 5+, reduced 1 per additional man, no floor | `max(3, 6 − n)` |
| Round-one penalty | attackers who fail lose 1 fama | those who sit out lose 1 fama |

## Revision: the fix list, worked through

### The differential test against the original

The most valuable thing in this pass. Every suite here tested *my reading* of
the rules, which is the wrong thing to test — a misreading would be enshrined
by its own test rather than caught by it. The original file was not in the
repo, so there was nothing to compare against.

It is now: `reference/original-index.html`, vendored unchanged, and
`scripts/check-oracle.mjs`. Neither implementation can be monkey-patched from
outside — `rollDice` is a closure variable in the original and an ESM binding
in the port — so both function *sources* are extracted as text by brace
matching and evaluated in one sandbox that supplies a single seeded
`rollDice`. Same dice into both, then the roll queues are compared field by
field.

**6,000 rounds, ~52,000 rolls, no divergence.** The test was then mutation
checked: changing `Math.max(3, ...)` to `Math.max(2, ...)` in the port makes it
fail on seed 1454 and print the offending pair, which is what proves the test
can fail at all.

### The author's rulings, recorded

Four divergences between the original code and the printed manual were put to
the author and settled. All four keep the code's behaviour, so nothing changed
— but the choices are now deliberate rather than accidental:

- **Ship capacity is 3 passengers**, not the manual's 2.
- **The final roll keeps its floor** of `max(3, 6 − n)`.
- **The round-one fama penalty falls on those who sit out**, not on attackers
  who fail.
- **Characters the gamebook places inside the city** — Empress Anna, King
  Lalibela, Domenico of Constantinople, Theodore Branas — are outside it for
  the purposes of this module, and may attack the walls like anyone else.

### Numerals go back to a serif, having been wrong twice

The textura's numerals were unreadable, so `.tally` used a serif. On the swap
to MedievalSharp I decided its numerals were clear and put them back in the
hand. They are not clear: at body size its **6 and 8 are near identical**, so
"Roll 6+" reads as "Roll 8+" — and the whole game is 5+ against 6+. Its 4 can
be taken for a 2; I misread one in a screenshot of this interface, which is
what sent me looking. A misread threshold is a rules dispute in front of a
class. Numbers are in a serif and will stay there.

The same font's exclamation mark is a near-vertical stroke that reads as an l,
so "Crusade!" came out "Crusadel". Exclamation marks are stripped at display
time along with the emoji; the rubric colour was carrying the emphasis anyway.

### Name plates, staggered properly

At twenty-four crusaders the tokens stand about 1.1 units apart and a plate is
about 3.6 units wide — a plate is three times wider than the gap between the
men wearing it. Three lift levels meant every third neighbour collided, and the
line was unreadable at exactly the class sizes this is built for. Five levels
puts five consecutive tokens at five different heights, which clears both
neighbours and their neighbours; crowded lines also get slightly smaller
plates. Not perfect in the densest corner of the camp, but legible.

### The rest

- **The later stages are framed tighter.** Stage one has the whole army and
  needs the width; by stage two only survivors remain and the frame was still
  sized for the crowd, so a handful of men stood tiny in a lot of masonry.
- **The vine border runs down one edge, not two.** Two vines ate eight rems of
  a page whose whole job is a list of names, and the sack order came out as
  "Conrad of H…".
- **The first-to-enter gloss knows which wall he came over.** Unfiltered it
  handed a man who went up a ladder a fact about undermining.
- **Pixel ratio is capped at 1.5 and shadow maps step down to 1024** on
  machines reporting four cores or less, or 4GB or less. The cap is confirmed
  working: the canvas renders 721×1242 on a dpr-2 display where it would
  otherwise be 962×1656.
- **Space or Enter resolves the next token** in both lanes, in the stage's own
  fama order — for a teacher running this from the back of a room with a
  clicker. Deliberately not a way to choose *who*: a shortcut that silently
  picked the wrong student would be worse than none.
- **`?screen=` jumps to a screen for rehearsal**, documented in the README.
- **Round two is later in the day** — lower, redder sun, flatter light, a
  dustier sky and two more fires standing over the city. The two rounds looked
  identical, which undercut the manual's own framing that a second assault is
  the army's last chance.

### Not done, and why

**Bundle parse cost on the target machine.** The browser pane reports the page
as `hidden`, which throttles both `requestAnimationFrame` and `setInterval`, so
framerate is not measurable from this harness at all. The bundle is 1.2MB raw
and 328KB gzipped, essentially all three.js. This still needs half an hour on
the actual classroom laptop, and nothing here substitutes for that.

## The crusader-camp inset had land and water occupying the same space

The inset on the title screen read as a pale ground floating in a mixture of
land and water, and it was exactly that. The shore box ran from z −9 to +21 and
the Horn from z −31 to +3 — a twelve-unit overlap — with the water surface four
hundredths of a unit *below* the turf. The swell then pushed crests up through
the ground. The siege camp compounded it: its footprint ran z −22 to +22, so a
third of the tents stood out in the water.

They now meet at a single waterline at z = 0: water behind it and set low
enough that no crest reaches the bank, a shingle strip along the edge as on the
sea lane's Galata bank, then turf, with the camp kept entirely behind it.

## Measured: the scenes are art-limited, not compute-limited

Taken from `renderer.info` during a live sea assault, at 1741×1242:

| | Draw calls | Triangles | Textures |
| --- | --- | --- | --- |
| Sea lane | 97 | 212,698 | 19 |
| Title-screen city | 322 | 86,024 | 0 |

That is a very small scene. The merging work means the whole sea wall with its
towers, and a whole rampart of defenders, are one draw call each. Two hundred
thousand triangles is not what limits an integrated GPU — fill rate and shadow
passes are — and there is room for several times this geometry before the
triangle count becomes the constraint.

**So the current look is a consequence of the art direction, not the hardware.**
Flat shading and vertex colours were chosen deliberately, and the budget for
more detail exists whenever that choice is revisited.

## Revision: toward a reconstruction

Five pieces of work, aimed at Byzantium 1200 in the knowledge that we are not
going to reach it — those are offline renders by a specialist with per-monument
research behind them. What is reachable is the right *vocabulary* at a finish
that reads correctly from across a room.

### Atmosphere

Every scene had a flat background fill and fog set to a colour that did not
match it, so distant masonry faded toward a grey that was nowhere in the sky
behind it. `geometry/Sky.jsx` now issues both from one palette entry, so they
cannot drift apart: a gradient dome from zenith to horizon with a warm bleach
around the sun, painted into vertex colours rather than sampled from a texture,
and linear fog in the horizon colour. One draw call, no lighting work, no
asset.

This is the cheapest item on the list and close to the most effective. Aerial
perspective — distance draining contrast — is the single most characteristic
thing about the reference renders.

### An architectural kit

`geometry/buildingKit.js`: pitched roofs with eaves and gable ends, arcades on
true semicircular arches, domes on windowed drums with a cornice at the
springing, half-domes, apses, battered buttresses, columns, and complete house
and church assemblies. Every part returns a merged, AO-baked geometry.

Two constraints shaped it. Everything must be **indexed**, because
`mergeGeometries` refuses a mix — which is why an arch here is a half-torus
rather than an extruded shape with a hole. And light is **baked**, because flat
shading with one directional light cannot know that a wall is under an eave.

Three things were got wrong first and are worth recording:

- A four-sided pyramid is a *hipped* roof, not a pitched one. The gable end is
  half of what says "Mediterranean town" at a distance.
- A three-segment cylinder is a triangular prism, but `rotateX` alone leaves
  its apex pointing *down*; it needs `rotateZ(π)` after.
- `SphereGeometry` and `CylinderGeometry` measure their start angle from
  different axes, so a half-sphere sits ninety degrees off the half-cylinder
  under it. The apse cap now uses a full hemisphere and buries the back half in
  the wall — a few triangles for something that cannot be misaligned.

### Landmarks

The Hagia Sophia, Hippodrome and Great Palace were twenty-odd separate meshes
each. They are now one merged geometry apiece, built from the kit — cheaper
*and* more detailed, which is the usual result of merging.

The Great Church got the sequence that makes it that building rather than a
dome on a box: narthex, great dome on a windowed drum, two semi-domes bracing
it along the long axis, four exedrae stepping the mass down, buttresses north
and south, an apse closing the east end. The Hippodrome got an arcaded
substructure round its sphendone and a row of columns down the spina.

### The city is dense, and the precinct is clear

At 520 houses the town read as scattered cottages once each house became
smaller and more articulated. It is 1,100 houses and 90 churches now, packed to
within 1.2 units of the shoreline, and it reads as a city.

Housing is kept off the ceremonial quarter. That is not only so the landmarks
can be seen: the Augustaion, the Hippodrome and the Great Palace were one
enormous open precinct, and tenements over them would be the same mistake as
building on the Forum in Rome.

### Cypresses

260 of them through the city, merged rather than instanced so each carries its
own baked tone. Scale cues are a large part of why a reconstruction reads as a
place — the eye needs something whose size it already knows — and the cypress
is the right choice here: the tree of this coast, strongly vertical, and
everywhere in period views of the city.

### What it cost

| | Draw calls | Triangles |
| --- | --- | --- |
| Before | 322 | 86,024 |
| After | 328 | 379,110 |

**4.4× the geometry for six more draw calls.** That is what the merging buys,
and 379,000 triangles remains a light scene — the constraint on the target
hardware is fill rate and the shadow pass, neither of which this touches.

## Revision: the ground the class actually stares at

### The city behind the walls

The panorama got rebuilt from the kit while the two siege lanes — the screens
the class looks at for the entire sequence — kept a hundred and fifty plain
boxes with a slab or a drum on top. That was backwards: the panorama is a
title card, and the lanes fill the top third of the screen for twenty minutes.

`buildCityQuarter` now serves both. At lane scale a building is three or four
units across rather than half a unit, so every part of the kit finally reads —
the pitch of a roof, the shade under an eave, the ring of windows in a drum.
Roughly one house in six is a church with a dome and an apse, one in ten a
larger public building presenting an arcade to the street, and seventy
cypresses stand among them.

The land lane still keeps its street clear in front of the gate, passed in as a
predicate: a gate needs a road, and it is the only ground the bribery camera
has to stand on.

Sea lane cost: 97 draw calls and 213,000 triangles before, 157 and 289,000
after. Still a light scene.

### The coastlines were drawn with a ruler

The geography was polygons with three or four vertices over seventy units. The
Bosphorus bank ran dead straight for its entire length, the Asian shore was
four points across a hundred and thirty units, and the peninsula came out as a
wedge. Irregularity at every scale is what reads as land rather than as a
diagram.

`refineCoast` does two passes. Chaikin's corner-cutting rounds the polyline —
twice, enough to lose the facets without turning it to mush — and then each
point is displaced along the local normal by three sine waves of different
wavelength, giving bays with headlands inside them. It is deterministic, so the
shore is identical every load and the placement tests stay meaningful, and the
ends of an open run are pinned so refined segments still meet their neighbours.

Two things this forced:

**The peninsula's shore is generated once and shared.** `EUROPE` and
`PENINSULA` both describe it, and refining them separately would let them drift
apart until the city had buildings standing in the Marmara. Both are now
composed from the same two refined arrays.

**The Marmara coast bellies out.** It ran straight from the land walls to
Seraglio Point, which is what made the city read as a wedge with a point on it.
It now bulges south around where the harbours of Julian and Theodosius actually
were — which is both the fix and the truth.

The head of the Golden Horn also had to be widened and its shores calmed: north
and south came within five units of each other there, and at the amplitude open
water carries they crossed and cut a notch out of the land.

The chain tower moved half a unit inland with the refined shore. It still
stands at the water's edge, which is the entire point of a tower that anchored
a chain across the Horn.

## Titles are set in capitals

A `.display` class on every heading — the title screen, the stage banners, the
manuscript panels, the screen headings.

This hand's majuscules are ornate and well drawn, and a title is the one place
they can be used at length: a heading is short, it is large, and nobody has to
read it at speed. Under the textura the opposite was true and rubrics had to be
set in lowercase, because a whole line of *its* capitals was close to
undecipherable — the change of hand is what makes this possible.

Two adjustments come with it. Capitals in a hand like this collide at the
serifs when set solid, so the tracking opens to 0.07em; and with no descenders
the line-height comes down to 1.12, or a title floats in its own block.

A side benefit: "The Siege of Constantinople" now fits on one line rather than
wrapping to two.

## Revision: wall details, from the Byzantium 1200 reconstructions

Read against the site's own renders of the Theodosian land walls and the sea
walls, which show several things this had wrong or missing.

### The moat was a work of masonry, not a stream in a field

The largest gap. It was a channel of water in grass. In the reconstructions —
and in what survives — it is a **revetted trench**: dressed masonry down both
faces with a coping along the lip, a low **counterscarp wall with its own small
merlons** along the field edge, and **cross-walls dividing it into sections**.

That last one is the detail worth having. The site's text notes the ditch
"could be filled with water", and the dams are how: the ground falls some sixty
metres from the Horn to the Marmara, so a single continuous ditch could never
have held any. It was a flight of separate basins, each level and each
fillable. It is also the right thing to have on screen in a game whose first
question is how the army gets across it.

`buildMoatWorks` builds all three, merged into one geometry.

### Merlons are narrower than the gaps between them

They were drawn 0.55 wide with 0.45 gaps, which reads as a low wall with slots
cut in it. The reconstructions show the opposite — upright teeth with air
between them — so it is 0.44 against 0.56 now.

### A corbel course under the wall head

The surviving walls carry one, and it does a great deal at a distance: a hard
line of shadow along the top of the masonry, so the wall reads as something
built in stages rather than as one extruded slab. One small box per merlon
pitch, plus a string course, and both merge into the wall line.

### Something the moat works broke, and the check that now guards it

The counterscarp occupies real width, and the army's third mustering row landed
on the narrow ledge between it and the lip of the ditch — a third of the
crusaders standing inside the masonry. The rows are 1.9 apart instead of 2.6,
and `check-scene.mjs` now asserts every row clears the ditch and its
counterscarp.

### The caveat the site itself insists on

Its front page carries a notice worth quoting to a class:

> *"after 618 ... Byzantine economy never recovered ... Even in 1200 most of
> the Great Palace was in ruins and was not used anymore ... Reconstructions on
> this website will try to show the monuments as they were built or modified
> until 1200 and as if they were maintained properly (which was never the
> case)."*

The crusaders did not arrive at a gleaming city. They arrived at a very large,
very old, half-derelict one that had been burning intermittently for nine
months. Nothing in this build reflects that yet, and it argues against pushing
the city toward polish for its own sake.

## Revision: a gate to attack, and a tidier Galata

### The crusaders' bridge is gone, and a causeway replaces it

The timber bridge was the answer to "how does the army get over the ditch"
back when the ditch was a stream in a field. With the moat works built it is
redundant, and with a gate it is wrong: **a gate has a permanent stone
crossing**, and that is a large part of why an army attacks at one. The
causeway is now part of `buildMoatWorks`, with a skirt down into the ditch and
a parapet either side, and the dams step aside for it.

The answer to the question is better for it. It is not that the crusaders
knocked something together in a night — it is that the Byzantines built the
crossing centuries earlier and could not take it away.

### The Adrianople Gate

The army did not attack a stretch of blank curtain. In 1203 they fought at the
north end of the land walls, up by the Blachernae, and a gate is where an
assault concentrates: the one place the wall can be opened rather than climbed,
with the causeway already there and a road rather than a slope in front of it.
`LAND_GATE` stands in for the Gate of Charisius — the Adrianople Gate — the
northernmost of the great gates and the nearest to the previous year's
fighting.

Both wall lines are now built as **two runs with the gate between them** rather
than one continuous wall, with the regular towers that would have fallen inside
the opening skipped; the gatehouse brings its own heavier pair. It carries an
arched passage, spandrels, the wall over the top, and a machicolation on
corbels — the box a defender drops things from, which is the detail that says
this opening was expected to be attacked.

The arch is a half-torus turned a quarter about Y, because the wall runs along
Z and the opening faces along X. An extruded shape with a hole is the obvious
way and the wrong one: it comes out non-indexed, and `mergeGeometries` will not
take it alongside everything else.

It sits off the centre line. Dead centre it would stand behind the roll readout
and split the muster in two.

### The army stands back

Men waiting to go in do not crowd the lip of the ditch. `LANE.musterX` holds
the rows off it, out of bowshot of the wall head, and they come forward when it
is their turn.

### Pera, and a hint of foreshore

Galata was twenty-six boxes with flat slabs on them, which read as a shanty
rather than as the Genoese and Amalfitan quarter it was. Sixty-four kit
buildings now, the odd domed church among them, forty cypresses, and the
crusader camp gathered between the town and the beach the fleet is drawn up on.
The contingent banners planted along the shore are gone.

At the foot of the sea wall there is now a narrow shelf of rubble, boulders
along it, and two small landing stages on piles. Deliberately slight: the ships
come in to `atWallX` and their gangways reach the wall face, so anything
projecting more than a metre from the masonry would foul the one piece of
staging the whole sequence depends on. It is only there to stop the wall
reading as a slab dropped into a pond.

## Revision: the gate rebuilt, and far fewer towers

Both against the Byzantium 1200 reconstruction of the **Porta Rhegium** — the
Silver Gate, the military gate of these walls — which is drawn at almost
exactly the oblique angle the lane camera uses.

### The first gate was wrong in the way beginners draw castles

An enormous arch, nearly seven units wide in a wall seven and a half high,
standing open. The reconstruction is the opposite on every count:

- **The opening is small.** A doorway a cart passes through, about a third of
  the wall's height. `innerHalf` went from 3.4 to 0.95. The wall is the point;
  the gate is a hole in it.
- **It is shut.** These are besieged walls, and the entire third round of this
  game is about paying somebody to open one. Two leaves, banded with iron.
- **It goes through.** The doors sit back a full wall-thickness behind the
  face, with passage walls, a dark soffit and a floor, so the arch reads as the
  mouth of a tunnel rather than a shape painted on masonry. That depth was the
  thing most obviously missing.
- **A relieving arch** in brick above the main ring, carrying the wall's weight
  off the head of the opening. It is on the real gates and it stops the arch
  looking pasted on.
- **The flanking towers are square, large, and set behind**, rising well clear
  of the curtain.

The lintel block over the arch also sat proud of the wall by half its
thickness, so the gate bulged out of the line. It is flush now.

### Nineteen towers a side was roughly triple

One every eight units against a tower three units wide — the wall read as a row
of buttresses with slots between them. The real ratio is nothing like it:
ninety-six towers over five and a half kilometres is one every fifty-odd metres
against a tower some five metres wide, and the renders show long unbroken runs
of curtain with a big tower standing clear at intervals.

Nine a side now, which is one every sixteen units and about three in frame, and
each is proportionally bigger. The two lines still interleave by half a
spacing, so an outer tower always covers the gap between two inner ones.

### Every tower is crenellated

They ended in a plain slab. That is why the square ones read as featureless
blocks — the gate's pair worst of all, being the largest. Every tower in the
reconstructions is crenellated, and the teeth are most of what makes a tower
read as a fighting platform rather than a pillar. Square towers get three
merlons a side, polygonal ones a ring of seven.

## Revision: three things wrong along the moat

### The counterscarp ran straight through its own bridge

Crenellations and all. A low crenellated wall standing across the middle of the
causeway that is supposed to carry traffic over the ditch — which is not a
subtle error, and it had been there since the moat works went in.

The counterscarp is now built as two runs with the road between them, and each
run ends in a pier where it meets the opening. That reads as a gateway in the
outer defence, which is what it was: an attacker had to come through this gap
or get over the wall either side of it.

### The gate correction had overshot

`innerHalf` went 3.4 → 0.95 against the Porta Rhegium, which was right in
direction and too far in degree: at 0.95 the opening was narrower than two
crusaders abreast, and the figures beside it made that obvious. 1.35 now, with
the outer wall's at 1.15. Still a doorway in a wall rather than a gap in one.

### A tower was crowding the gate

Skipping the towers that fall *inside* the opening is not enough. The next one
along still landed four units from a gate tower, and the pair read as a clump
rather than as a gate with clear wall either side.

`clearOfGate` pushes any curtain tower closer than a set distance out to it —
11.5 units on the outer line, 13 on the inner. One tower moves a little further
down the wall and the gate stands on its own.

## Revision: the road, and engines that shoot

### Everything along the ditch now stops at the road

The counterscarp had been cut for the causeway; the revetment and its coping
had not. Both ran straight on through the crossing, and the coping — standing a
few hundredths of a unit proud of the deck — surfaced along it as a line of
bumps.

Every length-wise piece is now built from **one list of runs**, so a gap for the
road can only be forgotten in one place rather than three.

### The causeway is a road, not a slab in a meadow

It stopped a couple of units short at each end, leaving the crossing marooned
with grass on both sides. It now runs from out in the field the army musters on,
over the ditch, and up to the face of the outer wall. The parapet is only over
the ditch, because a road in open field does not have one.

### The mangonels were facing backwards

A traction trebuchet works like a see-saw: the long arm is hauled *down* on the
side away from the target, so the sling and its stone lie on the ground behind
the machine, and the crew pull the short arm to sweep the long arm up, over and
forward. The stone leaves as the head passes the top, flying the way the head
was travelling.

Ours had the loaded sling on the *wall* side, which is the throw pointing into
the camp. Both engines are turned round.

### They shoot

The frame is baked into the camp's merged geometry and never moves; only the
beam, the sling and the stone are live. An attempt looses one of the two, and
they alternate, so a stone is in the air rather more often than either machine
could manage alone.

They fire **alongside the die rather than before it**. An extra beat per
crusader is a couple of minutes across a class of twenty-four, and the phase is
already the longest in the game.

**The shot is not simulated.** It follows a parabola solved to land on a chosen
point rather than an integration of whatever velocity the arm imparted. Real
physics buys nothing here and costs control: a stone that sails over the wall
or drops in the ditch reads as a bug rather than as a miss, and this is a
classroom projector, not a ballistics exercise.

## Still open, and the caveat that goes with them

Faction colour is a **game convention, not a historical one**, and it should be
said out loud rather than buried. Uniform livery by contingent is anachronistic
for 1204 — heraldry was personal and familial, and contingents were not dressed
alike. It was adopted knowingly, because a wargame counter has to be readable
at forty pixels on a projector, and because the banner-bearer half of the
scheme *is* historical: contingents genuinely identified by standard. If a
later pass wants to walk it back, the defensible version is a naturalistic
surcoat with the cross on it and the faction colour confined to the banner.

Deferred by choice, not forgotten:

- **Round two should feel more desperate than round one** — no visual
  distinction between them yet.
- **The first-to-enter callout is undressed** — it is the dramatic peak of the
  whole sequence and currently reads as plain text.
- **Name plates still collide** when tokens bunch. Legible, but untidy.
- **Helm and shield variety** was considered and declined: one great helm for
  everybody, no shields.
