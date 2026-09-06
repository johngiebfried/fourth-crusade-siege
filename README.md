# Siege of Constantinople — April 12, 1204

The siege sequence of the Fourth Crusade RTTP module, rebuilt as real-time,
zero-asset procedural 3D. No image files, no model files, nothing fetched over
the network: every wall, ship, figure and label is generated at runtime from
primitives, vertex colours and canvas-drawn textures.

## Sharing it — the classroom link

The siege is published to GitHub Pages by `.github/workflows/pages.yml`. Every
push to `main` runs the five check suites, and if they pass, rebuilds and
republishes. A reader needs nothing but the link: no Node, no terminal, no
install.

Setting it up once:

1. Create an empty repository on GitHub. Do not add a README, `.gitignore` or
   licence — this repository already has its own history.
2. Point this checkout at it and push:

```bash
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git && git push -u origin main
```

3. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**. Nothing else needs configuring — the workflow reads the
   repository name and builds the asset paths to match, so renaming the repo
   later does not break the link.

The link is then `https://YOUR-NAME.github.io/YOUR-REPO/`, and the Actions tab
shows each deploy. The first one takes a couple of minutes.

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

Requires Node. If the machine has none, `brew install node`. This is for
working on the game — anyone who only wants to *play* it should be sent the
Pages link instead.

## When something goes wrong

Every screen sits inside an error boundary, so a fault shows a page saying so
rather than a blank white screen. That page carries the error and the build it
happened on, and a screenshot of it is a complete bug report. It also catches
faults on timers and in promises, which is where most of this game's work
happens and which a React error boundary alone would miss.

A machine with no WebGL at all — hardware acceleration switched off, or a
remote desktop — gets its own page saying so, because that is a setting on the
machine rather than a fault in the game.

## Rehearsing a screen

Any of these can be opened directly, which saves playing a siege to reach one:

```
?screen=bribery   ?screen=gate-opening   ?screen=first-to-enter   ?screen=results
```

They land with no round behind them, so they show empty state — enough to
check wording and layout before a class. Nothing links to them, and starting
the siege from the title always begins a real one.

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

The strongest guarantee is a **differential test against the original itself**.
`reference/original-index.html` is the original game, vendored unchanged.
`scripts/check-oracle.mjs` extracts `addLandAttackRolls` and
`addSeaAttackRolls` from *both* the original and this port, evaluates them in
one sandbox sharing a single seeded `rollDice`, and compares the resulting roll
queues item by item across 6,000 rounds. It currently compares about 52,000
rolls with no divergence. If it ever fails, the port is wrong and the original
is right.

That test is what proves the rules; the suites below test the reshaping around
them. A stress test over 4,000 randomised rounds checks the invariants — thresholds of
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
