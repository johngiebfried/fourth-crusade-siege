# Siege of Constantinople — April 12, 1204

The siege sequence of the Fourth Crusade RTTP module, rebuilt as real-time,
zero-asset procedural 3D. No image files, no model files, nothing fetched over
the network: every wall, ship, figure and label is generated at runtime from
primitives, vertex colours and canvas-drawn textures.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open the URL it prints. For classroom use, build once and serve the static
output — it needs no server of its own:

```bash
npm run build
```

Requires Node. If the machine has none, `brew install node`.

## Where things are

| Path | What it holds |
| --- | --- |
| `src/game/rules.js` | **The authoritative dice logic**, preserved verbatim from the original `index.html`. Do not change the thresholds or survivor gating here. |
| `src/game/stages.js` | Reshapes the flat roll queue into per-stage click rounds. Decides nothing; only regroups. |
| `src/data/characters.json` | The 52-character roster. |
| `src/screens/` | One file per screen. `Opening.jsx` is the title and setup; `CityBackdrop.jsx` is the city shot they play over. |
| `src/three/` | Scenes (land lane, sea lane, city panorama), palette, runtime textures, renderer config. |
| `src/three/geometry/` | Procedural wall, tower, pawn, die and defender geometry. |
| `DECISIONS.md` | Every design and historical call made during the build, and why. |

## How the rules stay intact

`addLandAttackRolls` and `addSeaAttackRolls` are copied unchanged from the
original implementation. They run once when a stage begins and produce the same
queue of decided outcomes the old modal stepped through. The 3D layer only
*reveals* those outcomes: clicking a token animates a die onto the face that was
already rolled. Nothing in `src/three/` or `src/screens/` ever rolls a die.

A stress test over 4,000 randomised rounds checks the invariants — thresholds of
5, then 6, then `max(3, 6 − survivors)`; each stage's cohort equal to the
previous stage's successes; captains never rolling to board; ships never over
capacity; sunk ships never boarding:

```bash
node scripts/check-rules.mjs
```

A second suite checks the *world* rather than the dice: that no camera framing
puts the camera inside masonry at any aspect ratio, that ladders reach the wall
face without sweeping through anything, that the walls run past the edge of the
frame, that the gate camera stands on clear ground with the gate in view, and
that every city landmark sits on land.

```bash
node scripts/check-scene.mjs
```

Every one of those assertions exists because something broke. The gate-opening
camera was written against a fifteen-unit gate wall; when the wall grew to a
hundred and fifty it ended up buried in masonry, and nothing caught it for two
commits.

## State of the build

**Working:** the opening — an isometric establishing shot of the city with a
crusader-cam inset, over which the whole setup runs (how many crusaders, who
refuses, land/sea/split, and naming the smaller group on a split) — the full land wall sequence
(staging → outer wall → inner wall → city gates), the full sea wall sequence
(fleet stands in → piloting → boarding over the flying bridge → breaking
through), per-stage camera framing on both, click-to-resolve tokens in any
order, a tumbling die that settles on the decided face, the universal dissolve
on failure, the distinct ship-sinking with its crew going down with it, the
first-to-enter callout, round two, the round-three bribery screen, the
gate-opening sequence, and the results and sack order hand-off.

When a round has both land and sea attackers, the two sequences play in order
and the round resolves once both are done.

Every screen in the module's flow is now built. Remaining work is polish —
see "What's next" in `DECISIONS.md`.
