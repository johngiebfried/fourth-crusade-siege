/**
 * Faction colours and devices.
 *
 * A note on what these are and are not. Uniform livery by contingent is a
 * **game convention, not a historical one**: in 1204 heraldry was personal and
 * familial, and a lord's following was not dressed alike. Several of the
 * devices below are also a little later than the scene — the red-and-gold Lion
 * of Saint Mark in this form is early modern, and the fleur-de-lis is only
 * just becoming a French royal emblem around this date. They are here because
 * a class has to tell five contingents apart across a room, and these are the
 * marks that read.
 *
 * One correction was made rather than following the brief literally. The
 * Imperial eagle here is **single-headed**, black on gold. The double-headed
 * eagle is a later development for the Holy Roman Empire — fifteenth century —
 * and the double-headed *Byzantine* eagle is Palaiologan, after 1261, which
 * this project has already been careful to keep out of the city.
 */

import * as THREE from 'three'

export const FACTIONS = {
  Venetian: {
    label: 'Venetian',
    cape: '#a32b25',
    cross: '#f2e8d4',
    field: '#a32b25',
    device: '#d9b45a',
    draw: drawLionOfSaintMark,
  },
  'N. French': {
    label: 'N. French',
    cape: '#2f4d8a',
    cross: '#f2e8d4',
    field: '#2f4d8a',
    device: '#d9b45a',
    draw: drawFleurDeLis,
  },
  Imperial: {
    label: 'Imperial',
    cape: '#d3a734',
    cross: '#2b2620',
    field: '#d3a734',
    device: '#1d1a16',
    draw: drawEagle,
  },
  Clerical: {
    label: 'Clerical',
    cape: '#ece4d4',
    cross: '#a32b25',
    field: '#ece4d4',
    // Near-black, not the gold of the papal arms — see drawCrossedKeys.
    device: '#141210',
    draw: drawCrossedKeys,
  },
  Indeterminate: {
    label: 'Indeterminate',
    // Green, and a blank flag. Undyed wool was tried first and sat too close
    // to the clerical white at forty pixels; green is the only hue left that
    // separates cleanly from all four declared contingents.
    cape: '#3f6b3a',
    cross: '#f2e8d4',
    field: '#3f6b3a',
    device: '#3f6b3a',
    draw: null,
  },
}

export const factionOf = (name) => FACTIONS[name] ?? FACTIONS.Indeterminate

/* ---------------------------------------------------------------- devices */

/*
 * These are drawn, not fetched, so every one of them is a compromise between
 * what a herald would recognise and what survives being a hundred pixels wide
 * on a projector. The rule throughout: build the silhouette first and let
 * detail be notches cut back out of it, because a shape reads at distance and
 * an outline does not.
 */

/** A pointed feather, drawn along an axis. Used for tails and tufts. */
function feather(ctx, x, y, angle, len, wide) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(wide, len * 0.34, wide * 0.42, len * 0.82)
  ctx.lineTo(0, len)
  ctx.lineTo(-wide * 0.42, len * 0.82)
  ctx.quadraticCurveTo(-wide, len * 0.34, 0, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/**
 * Walk a path from a to b in `count` scallops, each bulging out to one side.
 *
 * This is the whole trick behind the wings. Feathers drawn as separate spokes
 * radiating from a shoulder make a starburst — the first eagle here came out
 * as a crow, and the first lion had no wing at all. A wing reads as a *mass*
 * with a stepped trailing edge, and that is what this cuts.
 */
function scallopedEdge(ctx, ax, ay, bx, by, count, depth) {
  const dx = (bx - ax) / count
  const dy = (by - ay) / count
  // Perpendicular to the run, which is the direction the scallops bulge.
  const len = Math.hypot(dx, dy) || 1
  const px = (-dy / len) * depth
  const py = (dx / len) * depth
  for (let i = 0; i < count; i++) {
    const x0 = ax + dx * i
    const y0 = ay + dy * i
    ctx.quadraticCurveTo(x0 + dx * 0.5 + px, y0 + dy * 0.5 + py, x0 + dx, y0 + dy)
  }
}

/**
 * One wing: a filled mass sweeping from the shoulder out to a tip, with a
 * scalloped trailing edge for the feathers and a rank of coverts laid over
 * its root.
 */
function wing(ctx, { rootX, rootY, tipX, tipY, backX, backY, feathers, depth }) {
  ctx.beginPath()
  ctx.moveTo(rootX, rootY)
  // Leading edge: bowed, the way a spread wing actually is.
  ctx.quadraticCurveTo((rootX + tipX) / 2, rootY - (rootY - tipY) * 0.75, tipX, tipY)
  scallopedEdge(ctx, tipX, tipY, backX, backY, feathers, depth)
  ctx.closePath()
  ctx.fill()
}

/**
 * The eagle of the Empire, displayed: wings spread, head to dexter, one head
 * only. The double-headed eagle everyone pictures is fifteenth-century, and
 * the double-headed Byzantine one is post-1261 — either would be wrong here in
 * the specific way this project is trying not to be.
 */
function drawEagle(ctx, w, h, colour) {
  ctx.fillStyle = colour
  const cx = w * 0.5

  for (const side of [-1, 1]) {
    // The main span: nearly to the edge of the field, which is what makes it
    // an eagle displayed rather than a bird sitting on a branch.
    wing(ctx, {
      rootX: cx + side * w * 0.06,
      rootY: h * 0.34,
      tipX: cx + side * w * 0.455,
      tipY: h * 0.2,
      backX: cx + side * w * 0.1,
      backY: h * 0.56,
      feathers: 6,
      depth: side * h * 0.05,
    })
    // Coverts, a shorter rank over the root.
    wing(ctx, {
      rootX: cx + side * w * 0.05,
      rootY: h * 0.3,
      tipX: cx + side * w * 0.27,
      tipY: h * 0.235,
      backX: cx + side * w * 0.08,
      backY: h * 0.44,
      feathers: 4,
      depth: side * h * 0.035,
    })
  }

  // Body: broad chest into a waist between the legs.
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.1, h * 0.32)
  ctx.bezierCurveTo(cx - w * 0.115, h * 0.46, cx - w * 0.08, h * 0.56, cx - w * 0.055, h * 0.64)
  ctx.lineTo(cx + w * 0.055, h * 0.64)
  ctx.bezierCurveTo(cx + w * 0.08, h * 0.56, cx + w * 0.115, h * 0.46, cx + w * 0.1, h * 0.32)
  ctx.closePath()
  ctx.fill()

  // Neck: short and thick. A long thin neck makes a dove, which is what the
  // first attempt looked like.
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.075, h * 0.34)
  ctx.bezierCurveTo(cx - w * 0.085, h * 0.26, cx - w * 0.075, h * 0.21, cx - w * 0.04, h * 0.18)
  ctx.bezierCurveTo(cx + w * 0.045, h * 0.16, cx + w * 0.075, h * 0.24, cx + w * 0.05, h * 0.33)
  ctx.closePath()
  ctx.fill()

  // Head: a broad skull with the heavy brow of a raptor.
  const hx = cx - w * 0.04
  const hy = h * 0.17
  ctx.beginPath()
  ctx.ellipse(hx, hy, w * 0.05, h * 0.063, -0.15, 0, Math.PI * 2)
  ctx.fill()

  // Beak: short, deep and hooked down — the one feature that says eagle
  // rather than crow, so it is drawn heavy.
  ctx.beginPath()
  ctx.moveTo(hx - w * 0.02, h * 0.132)
  // Along the top of the beak to the point, then the hook curling hard down
  // and back. A shallow hook reads as a duck; this one has to bite.
  ctx.quadraticCurveTo(hx - w * 0.1, h * 0.142, hx - w * 0.125, h * 0.183)
  ctx.quadraticCurveTo(hx - w * 0.132, h * 0.216, hx - w * 0.107, h * 0.222)
  ctx.quadraticCurveTo(hx - w * 0.108, h * 0.196, hx - w * 0.088, h * 0.183)
  // The gape, back to the head.
  ctx.lineTo(hx - w * 0.015, h * 0.196)
  ctx.closePath()
  ctx.fill()
  // The lower mandible, dropped open below it.
  ctx.beginPath()
  ctx.moveTo(hx - w * 0.02, h * 0.207)
  ctx.quadraticCurveTo(hx - w * 0.07, h * 0.212, hx - w * 0.086, h * 0.196)
  ctx.lineTo(hx - w * 0.018, h * 0.19)
  ctx.closePath()
  ctx.fill()

  // Tail: a short fan, tucked under the body.
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.055, h * 0.58)
  ctx.lineTo(cx + w * 0.055, h * 0.58)
  scallopedEdge(ctx, cx + w * 0.085, h * 0.86, cx - w * 0.085, h * 0.86, 3, h * 0.045)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.055, h * 0.58)
  ctx.lineTo(cx + w * 0.055, h * 0.58)
  ctx.lineTo(cx + w * 0.085, h * 0.86)
  ctx.lineTo(cx - w * 0.085, h * 0.86)
  ctx.closePath()
  ctx.fill()

  // Legs: thrown well out to either side so they clear the tail. Crossing the
  // tail was what made the first version look like a bird in a net.
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = colour
  for (const side of [-1, 1]) {
    // Thick thighs, short shanks, talons splayed only a little. Drawn thin and
    // long they read as spider legs on either side of the tail.
    ctx.lineWidth = h * 0.075
    ctx.beginPath()
    ctx.moveTo(cx + side * w * 0.055, h * 0.55)
    ctx.quadraticCurveTo(cx + side * w * 0.135, h * 0.59, cx + side * w * 0.15, h * 0.66)
    ctx.stroke()
    ctx.lineWidth = h * 0.042
    ctx.beginPath()
    ctx.moveTo(cx + side * w * 0.15, h * 0.66)
    ctx.lineTo(cx + side * w * 0.158, h * 0.72)
    ctx.stroke()
    ctx.lineWidth = h * 0.028
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath()
      ctx.moveTo(cx + side * w * 0.158, h * 0.72)
      ctx.quadraticCurveTo(
        cx + side * w * (0.158 + k * 0.04),
        h * 0.765,
        cx + side * w * (0.158 + k * 0.058),
        h * 0.785
      )
      ctx.stroke()
    }
  }
  ctx.restore()

  // The eye, punched back out so it reads on a dark device.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(hx - w * 0.004, h * 0.158, h * 0.019, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * The fleur-de-lis, in the ordinary heraldic form: a central petal with two
 * curling side petals, bound by a band, on a flared foot. Every element is a
 * filled path rather than a stroke, so nothing thins out at size.
 */
function drawFleurDeLis(ctx, w, h, colour) {
  ctx.fillStyle = colour
  const cx = w * 0.5

  // Central petal: a lance with a swelling waist, rising to a fine point.
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.07)
  ctx.bezierCurveTo(cx + w * 0.05, h * 0.18, cx + w * 0.088, h * 0.32, cx + w * 0.082, h * 0.5)
  ctx.lineTo(cx - w * 0.082, h * 0.5)
  ctx.bezierCurveTo(cx - w * 0.088, h * 0.32, cx - w * 0.05, h * 0.18, cx, h * 0.07)
  ctx.closePath()
  ctx.fill()

  // Side petals. These have to be fat where they leave the band and taper to
  // a curled point — drawn thin at the base they read as horns, which is what
  // the first two attempts looked like.
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + side * w * 0.07, h * 0.5)
    // Outer edge: bulges well out before turning up to the point.
    ctx.bezierCurveTo(
      cx + side * w * 0.245,
      h * 0.505,
      cx + side * w * 0.305,
      h * 0.38,
      cx + side * w * 0.255,
      h * 0.15
    )
    // The point itself, hooked slightly inward.
    ctx.quadraticCurveTo(cx + side * w * 0.225, h * 0.2, cx + side * w * 0.208, h * 0.27)
    // Inner edge: back down to the band, keeping the petal thick throughout.
    ctx.bezierCurveTo(
      cx + side * w * 0.185,
      h * 0.38,
      cx + side * w * 0.135,
      h * 0.44,
      cx + side * w * 0.07,
      h * 0.5
    )
    ctx.closePath()
    ctx.fill()
  }

  // The band.
  ctx.fillRect(cx - w * 0.145, h * 0.5, w * 0.29, h * 0.085)

  // The foot: a stem flaring to a base with only a shallow notch under it. A
  // deep notch forks it, and it stops being a foot and becomes a tail.
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.062, h * 0.585)
  ctx.bezierCurveTo(cx - w * 0.07, h * 0.7, cx - w * 0.13, h * 0.8, cx - w * 0.195, h * 0.88)
  ctx.quadraticCurveTo(cx - w * 0.1, h * 0.885, cx, h * 0.835)
  ctx.quadraticCurveTo(cx + w * 0.1, h * 0.885, cx + w * 0.195, h * 0.88)
  ctx.bezierCurveTo(cx + w * 0.13, h * 0.8, cx + w * 0.07, h * 0.7, cx + w * 0.062, h * 0.585)
  ctx.closePath()
  ctx.fill()
}

/**
 * The lion of St Mark: winged, passant, nimbed, with the gospel under the
 * forepaw. The wing is the half people actually recognise, so it gets the
 * scalloped mass and the body stays a clean silhouette behind it.
 */
function drawLionOfSaintMark(ctx, w, h, colour) {
  ctx.fillStyle = colour

  // The wing first, so the body sits over its root. It rises off the shoulder,
  // not the rump — off the rump it reads as a fin.
  wing(ctx, {
    rootX: w * 0.62,
    rootY: h * 0.5,
    tipX: w * 0.17,
    tipY: h * 0.1,
    backX: w * 0.5,
    backY: h * 0.46,
    feathers: 5,
    depth: h * 0.055,
  })
  wing(ctx, {
    rootX: w * 0.63,
    rootY: h * 0.48,
    tipX: w * 0.34,
    tipY: h * 0.2,
    backX: w * 0.55,
    backY: h * 0.44,
    feathers: 3,
    depth: h * 0.042,
  })

  // Body: a deep chest at the shoulder tapering back to the haunch, with the
  // neck carried up into the mane so the head is not a floating disc.
  ctx.beginPath()
  ctx.moveTo(w * 0.17, h * 0.56)
  ctx.bezierCurveTo(w * 0.24, h * 0.46, w * 0.46, h * 0.45, w * 0.62, h * 0.46)
  // Up the neck to the head.
  ctx.bezierCurveTo(w * 0.7, h * 0.46, w * 0.72, h * 0.4, w * 0.76, h * 0.38)
  ctx.lineTo(w * 0.8, h * 0.5)
  // Chest and belly.
  ctx.bezierCurveTo(w * 0.76, h * 0.6, w * 0.72, h * 0.66, w * 0.66, h * 0.69)
  ctx.bezierCurveTo(w * 0.5, h * 0.73, w * 0.3, h * 0.72, w * 0.21, h * 0.68)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.235, h * 0.585, w * 0.095, h * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()

  // Nimbus.
  ctx.save()
  ctx.lineWidth = h * 0.032
  ctx.strokeStyle = colour
  ctx.beginPath()
  ctx.arc(w * 0.775, h * 0.36, h * 0.145, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Head: a maned disc with a muzzle, drawn as one scalloped path.
  ctx.beginPath()
  const mr = h * 0.115
  const points = 12
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2
    const x = w * 0.775 + Math.cos(a) * mr
    const y = h * 0.42 + Math.sin(a) * mr
    if (i === 0) ctx.moveTo(x, y)
    else {
      ctx.quadraticCurveTo(
        w * 0.775 + Math.cos(a2) * mr * 1.42,
        h * 0.42 + Math.sin(a2) * mr * 1.42,
        x,
        y
      )
    }
  }
  ctx.closePath()
  ctx.fill()
  // Muzzle, pushed out of the mane to dexter.
  ctx.beginPath()
  ctx.moveTo(w * 0.83, h * 0.38)
  ctx.quadraticCurveTo(w * 0.935, h * 0.4, w * 0.9, h * 0.47)
  ctx.quadraticCurveTo(w * 0.85, h * 0.48, w * 0.825, h * 0.44)
  ctx.closePath()
  ctx.fill()

  // Legs. The near foreleg is raised over the book.
  ctx.save()
  ctx.strokeStyle = colour
  ctx.lineCap = 'round'
  ctx.lineWidth = h * 0.05
  // Hind legs bent at the hock, forelegs straight — the passant stance.
  for (const [x0, xm, x1] of [
    [0.245, 0.2, 0.225],
    [0.315, 0.35, 0.325],
    [0.56, 0.575, 0.545],
  ]) {
    ctx.beginPath()
    ctx.moveTo(w * x0, h * 0.66)
    ctx.quadraticCurveTo(w * xm, h * 0.79, w * x1, h * 0.9)
    ctx.stroke()
    // Paw.
    ctx.save()
    ctx.lineWidth = h * 0.038
    ctx.beginPath()
    ctx.moveTo(w * (x1 - 0.018), h * 0.905)
    ctx.lineTo(w * (x1 + 0.03), h * 0.905)
    ctx.stroke()
    ctx.restore()
  }
  // The near foreleg, raised, its paw resting on the book.
  ctx.beginPath()
  ctx.moveTo(w * 0.655, h * 0.65)
  ctx.quadraticCurveTo(w * 0.725, h * 0.7, w * 0.715, h * 0.765)
  ctx.stroke()

  // Tail, curling up behind the haunch.
  ctx.lineWidth = h * 0.032
  ctx.beginPath()
  ctx.moveTo(w * 0.175, h * 0.58)
  ctx.bezierCurveTo(w * 0.06, h * 0.6, w * 0.04, h * 0.42, w * 0.105, h * 0.34)
  ctx.stroke()
  ctx.restore()
  feather(ctx, w * 0.105, h * 0.345, -0.35, h * 0.11, w * 0.038)

  // The gospel, under the paw.
  ctx.fillRect(w * 0.6, h * 0.785, w * 0.26, h * 0.105)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillRect(w * 0.722, h * 0.785, w * 0.014, h * 0.105)
  ctx.fillRect(w * 0.625, h * 0.815, w * 0.075, h * 0.014)
  ctx.fillRect(w * 0.758, h * 0.815, w * 0.075, h * 0.014)
  ctx.fillRect(w * 0.625, h * 0.848, w * 0.075, h * 0.014)
  ctx.fillRect(w * 0.758, h * 0.848, w * 0.075, h * 0.014)
  ctx.restore()
}

/**
 * The keys of St Peter, heavy and near-black on the white field.
 *
 * Drawn first in the gold and silver of the papal arms, which is correct and
 * completely illegible — two pale keys on a pale ground. Then drawn near
 * upright, at which the two shafts ran almost parallel and read as one key
 * with a doubled ring. This is the third version: a true saltire, bows low
 * and together, wards high and splayed outward, crossing below centre.
 */
function drawCrossedKeys(ctx, w, h, colour) {
  const key = (angle, dir, tint, halo) => {
    ctx.save()
    ctx.translate(w * 0.5, h * 0.58)
    ctx.rotate(angle)
    ctx.strokeStyle = tint
    ctx.fillStyle = tint
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const pad = halo ? h * 0.05 : 0

    // Shaft.
    ctx.lineWidth = h * 0.095 + pad * 2
    ctx.beginPath()
    ctx.moveTo(0, -h * 0.46)
    ctx.lineTo(0, h * 0.22)
    ctx.stroke()

    // Bow: a ring with a small collar where it meets the shaft.
    ctx.lineWidth = h * 0.075 + pad * 2
    ctx.beginPath()
    ctx.arc(0, h * 0.3, h * 0.12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillRect(-h * 0.045 - pad, h * 0.15 - pad, h * 0.09 + pad * 2, h * 0.06 + pad * 2)

    // The bit, stepped like a real ward.
    const bx = dir > 0 ? 0 : -w * 0.155
    ctx.fillRect(bx - pad, -h * 0.44 - pad, w * 0.155 + pad * 2, h * 0.075 + pad * 2)
    const bx2 = dir > 0 ? 0 : -w * 0.105
    ctx.fillRect(bx2 - pad, -h * 0.3 - pad, w * 0.105 + pad * 2, h * 0.075 + pad * 2)
    const bx3 = dir > 0 ? w * 0.09 : -w * 0.155
    ctx.fillRect(bx3 - pad, -h * 0.37 - pad, w * 0.065 + pad * 2, h * 0.06 + pad * 2)
    ctx.restore()
  }

  key(-0.44, -1, colour)
  // The upper key over a halo of the field colour, so the two stay two.
  key(0.44, 1, factionOf('Clerical').field, true)
  key(0.44, 1, colour)
}

/* ----------------------------------------------------------------- flags */

const flagCache = new Map()

/**
 * A faction's flag, drawn on a canvas at load. Same technique the name plates
 * already use — generated in code, never fetched — which is what lets a device
 * this small stay legible at all. Geometry at three or four pixels would be
 * mush.
 */
export function factionFlagTexture(factionName) {
  if (flagCache.has(factionName)) return flagCache.get(factionName)
  const f = factionOf(factionName)

  // Big enough that the devices can carry real detail: these fly on staffs a
  // couple of metres from the camera now, not as forty-pixel pennons.
  const w = 320
  const h = 240
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = f.field
  ctx.fillRect(0, 0, w, h)
  if (f.draw) f.draw(ctx, w, h, f.device)

  // A darker edge, so the flag has an outline against sky or masonry.
  ctx.strokeStyle = 'rgba(30,26,20,0.45)'
  ctx.lineWidth = 5
  ctx.strokeRect(2.5, 2.5, w - 5, h - 5)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  flagCache.set(factionName, texture)
  return texture
}
