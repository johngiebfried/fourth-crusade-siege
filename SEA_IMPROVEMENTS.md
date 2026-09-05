# Sea wall assault — improvement checklist

Written after the land lane's visual rework. The sea lane has had none of it,
so most of this is parity work: the same problems are all still there, and the
fixes are already written and proven on the land side.

Same constraints throughout: **flat-shaded, vertex-coloured, no texture maps,
no external assets**, and a frame budget that assumes an older school laptop.

---

## A. Parity — what the land lane got and the sea lane hasn't

These are the ones that matter most, because they are known problems with
known fixes.

- [x] **A1. The sea wall is 15 units long; the land walls are 150.** At this
      length both ends of the wall sit inside the frame, which is exactly the
      cutaway look you objected to. Extend it well past the camera's view.
      *Small change, large effect. Do this first.*

- [x] **A2. Camera solves distance from width, not height.** This is the old
      broken approach — it crops the composition on wide displays, which is
      the shape a projector is. Port the height-based framing from the land
      lane.

- [x] **A3. The camera is side-on with a shallow yaw.** Same view that made
      the land walls read as cut slabs. Move it out along the wall so the sea
      wall runs as a diagonal, with the ships in the foreground and the city
      rising behind. *This is the single biggest visual change available.*

- [x] **A4. Towers sit flush with the wall face.** Setting them proud is what
      most made the land wall read as a wall — it breaks the face into bays
      and casts the shadows that separate one from the next.

- [x] **A5. Wall and towers are separate meshes.** Merge into one geometry per
      line with `buildWallLine`, which also brings the baked ambient occlusion,
      weathering and per-block jitter across for free.

- [x] **A6. No rubble or detail where the wall meets the water.** A mole,
      landing steps, and fallen masonry at the foot, so the wall does not meet
      the sea on a dead straight line.

---

## B. Water — the thing that will sell this lane

The Horn is most of the frame here, and it is currently a flat coloured slab.

- [x] **B1. Give the Horn the moat's wave treatment.** Already written:
      a lit material with wave displacement injected into its shader, no
      textures. Scale the swell up — this is open water, not a ditch.

- [ ] **B2. Wakes behind moving ships.** A tapering V of lighter water,
      strongest while a ship is under way and fading as it comes to rest.

- [ ] **B3. Foam where hull meets water**, and a wash against the wall foot.

- [x] **B4. Ships should ride the water they are actually on** — tie the
      existing bob to the same wave function so hulls sit in the swell rather
      than on top of it.

- [ ] **B5. A sinking ship should disturb the water it goes down in** — the
      splash exists, but the surface around it does not react.

---

## C. Ships — the centrepiece, and currently the least detailed thing

- [x] **C1. Merge each ship into one geometry.** Fifteen meshes per ship, and
      a ship is drawn twice because they are lashed in pairs. Same treatment as
      the walls and garrison.

- [x] **C2. Hull planking as vertex colour** — strakes running the length of
      the hull, darker at the waterline, so the hull is not one flat brown.

- [x] **C3. Shields hung along the gunwale.** Period-correct, instantly
      readable, and cheap.

- [x] **C4. Rigging.** Shrouds from the mast-head to the rail, a forestay and
      backstay. Lines do more for a ship's silhouette than almost anything.

- [ ] **C5. Oars** on the lower hull, since these are being rowed into
      position rather than sailed.

- [x] **C6. Waterline detail** — a painted band, and the hull sitting at a
      believable draught rather than resting on the surface.

---

## D. The assault itself — parallel to the ladders

The ladders now rise, stay on success and topple on failure. The sea lane's
equivalents are all still static.

- [x] **D1. The flying bridge should be run out during boarding**, not stand
      rigged from the start — the direct parallel to the ladders, and the
      thing Clari actually describes.

- [x] **D2. The boarding ramp should land on the parapet.** It currently drops
      to a fixed angle rather than to wherever the wall is, which is the same
      bug the ladders had.

- [ ] **D3. Grapples and lines** thrown to the rampart before boarding.

- [x] **D4. Decided: failed boarders keep dissolving.** Clean, and the
      ambiguity is the point — the module does not claim they died.

- [ ] **D5. Defenders should react at the point of contact** — crowding to
      the threatened stretch of rampart rather than standing evenly spaced.

---

## E. Setting — currently missing entirely

- [x] **E1. Galata and the chain tower across the Horn.** It is the landmark
      from the title screen, it is where the camp is, and it would tie the two
      screens together. Its absence is why this lane feels placeless.

- [x] **E2. The rest of the fleet** at anchor in the background, so three
      ships do not look like the whole Fourth Crusade.

- [x] **E3. The city rising behind the sea wall** — domes and roofs, as the
      land lane has.

- [ ] **E4. Smoke** over the city from the earlier fires.

---

---

## Done

Everything ticked above. The lane now has: a hundred-and-fifty-unit merged wall
with towers standing proud and rubble at its foot, height-solved framing on a
camera that looks along the wall, moving water, planked hulls with shields on
the gunwale and rigging, Galata with its chain tower and the camp opposite, the
rest of the fleet at anchor, and the city rising behind the wall.

**The boarding mechanic changed on instruction.** The gangway is run out from
the flying bridge at the lashed mast-heads and dropped onto the rampart — not
from the bow. That is the whole point of lashing two ships together and rigging
a bridge between their mast-tops: to put men onto the wall from *above* it. A
ramp off the forecastle would be reaching up at the wall from deck level, which
is the problem the bridges were built to solve. Its length and slope are
computed from the gap to the wall face and the drop from the mast-heads to the
parapet, so it lands on the wall rather than at a fixed angle.

**One camera decision specific to this lane.** It sits lower than the land
lane's. At the land lane's thirty degrees the horizon falls outside the top of
the frame, which is fine over a field but wrong here — it hid the far shore
entirely, and the point of this lane is that the fleet is *inside* the Horn
with Galata opposite. A shallower pitch and a wider lens keep the far bank and
a strip of sky in shot, and water reads far better at a grazing angle than
from above.

## Still open

- [ ] **B2.** Wakes behind moving ships.
- [ ] **B3.** Foam at the hull and against the wall foot.
- [ ] **B5.** The surface reacting where a ship goes down.
- [ ] **C5.** Oars.
- [ ] **D3.** Grapples and lines thrown before boarding.
- [ ] **D5.** Defenders crowding to the threatened stretch of rampart.
- [ ] **E4.** Smoke over the city from the earlier fires.
