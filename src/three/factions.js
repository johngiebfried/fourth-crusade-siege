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
    device: '#c9a24a',
    draw: drawCrossedKeys,
  },
  Indeterminate: {
    label: 'Indeterminate',
    // Undyed cloth: no allegiance declared, and a plain flag to match.
    cape: '#a99c85',
    cross: '#3a352c',
    field: '#a99c85',
    device: '#a99c85',
    draw: null,
  },
}

export const factionOf = (name) => FACTIONS[name] ?? FACTIONS.Indeterminate

/* ---------------------------------------------------------------- devices */

/** Winged lion passant, book under the paw — reduced to what reads small. */
function drawLionOfSaintMark(ctx, w, h, colour) {
  ctx.fillStyle = colour
  const s = h / 100
  // Body and haunches.
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.56, 26 * s, 13 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  // Chest and head.
  ctx.beginPath()
  ctx.ellipse(w * 0.72, h * 0.44, 11 * s, 10 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.8, h * 0.36, 7 * s, 7 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  // Wing, swept up behind.
  ctx.beginPath()
  ctx.moveTo(w * 0.52, h * 0.48)
  ctx.quadraticCurveTo(w * 0.42, h * 0.16, w * 0.2, h * 0.22)
  ctx.quadraticCurveTo(w * 0.36, h * 0.36, w * 0.4, h * 0.56)
  ctx.closePath()
  ctx.fill()
  // Legs.
  ctx.fillRect(w * 0.34, h * 0.6, 6 * s, 22 * s)
  ctx.fillRect(w * 0.64, h * 0.58, 6 * s, 24 * s)
  // Tail.
  ctx.beginPath()
  ctx.moveTo(w * 0.26, h * 0.56)
  ctx.quadraticCurveTo(w * 0.12, h * 0.5, w * 0.14, h * 0.74)
  ctx.lineWidth = 4 * s
  ctx.strokeStyle = colour
  ctx.stroke()
}

/** Fleur-de-lis. */
function drawFleurDeLis(ctx, w, h, colour) {
  ctx.fillStyle = colour
  const cx = w * 0.5
  // Centre petal.
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.12)
  ctx.quadraticCurveTo(cx + w * 0.13, h * 0.36, cx, h * 0.58)
  ctx.quadraticCurveTo(cx - w * 0.13, h * 0.36, cx, h * 0.12)
  ctx.fill()
  // Side petals, curling outward.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx, h * 0.42)
    ctx.quadraticCurveTo(cx + dir * w * 0.3, h * 0.26, cx + dir * w * 0.29, h * 0.54)
    ctx.quadraticCurveTo(cx + dir * w * 0.18, h * 0.46, cx, h * 0.56)
    ctx.fill()
  }
  // Band and foot.
  ctx.fillRect(cx - w * 0.2, h * 0.58, w * 0.4, h * 0.08)
  ctx.beginPath()
  ctx.moveTo(cx, h * 0.66)
  ctx.quadraticCurveTo(cx + w * 0.1, h * 0.82, cx, h * 0.9)
  ctx.quadraticCurveTo(cx - w * 0.1, h * 0.82, cx, h * 0.66)
  ctx.fill()
}

/** Single-headed eagle displayed. Not double-headed: that is later. */
function drawEagle(ctx, w, h, colour) {
  ctx.fillStyle = colour
  const cx = w * 0.5
  // Body.
  ctx.beginPath()
  ctx.ellipse(cx, h * 0.55, w * 0.1, h * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head and beak.
  ctx.beginPath()
  ctx.ellipse(cx, h * 0.26, w * 0.075, h * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + w * 0.06, h * 0.24)
  ctx.lineTo(cx + w * 0.17, h * 0.28)
  ctx.lineTo(cx + w * 0.06, h * 0.32)
  ctx.closePath()
  ctx.fill()
  // Wings displayed, with a ragged trailing edge.
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx + dir * w * 0.06, h * 0.4)
    ctx.quadraticCurveTo(cx + dir * w * 0.42, h * 0.2, cx + dir * w * 0.44, h * 0.5)
    for (let i = 0; i < 3; i++) {
      const t = 0.5 + i * 0.09
      ctx.lineTo(cx + dir * w * (0.3 - i * 0.06), h * (t + 0.06))
      ctx.lineTo(cx + dir * w * (0.36 - i * 0.06), h * (t + 0.11))
    }
    ctx.lineTo(cx + dir * w * 0.08, h * 0.62)
    ctx.closePath()
    ctx.fill()
  }
  // Tail and legs.
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.09, h * 0.72)
  ctx.lineTo(cx + w * 0.09, h * 0.72)
  ctx.lineTo(cx + w * 0.05, h * 0.92)
  ctx.lineTo(cx - w * 0.05, h * 0.92)
  ctx.closePath()
  ctx.fill()
}

/** The keys of Saint Peter, crossed in saltire. */
function drawCrossedKeys(ctx, w, h, colour) {
  const key = (angle, tint) => {
    ctx.save()
    ctx.translate(w * 0.5, h * 0.52)
    ctx.rotate(angle)
    ctx.strokeStyle = tint
    ctx.fillStyle = tint
    ctx.lineWidth = h * 0.075
    ctx.lineCap = 'round'
    // Shaft.
    ctx.beginPath()
    ctx.moveTo(0, -h * 0.26)
    ctx.lineTo(0, h * 0.3)
    ctx.stroke()
    // Bow.
    ctx.beginPath()
    ctx.arc(0, -h * 0.31, h * 0.1, 0, Math.PI * 2)
    ctx.lineWidth = h * 0.055
    ctx.stroke()
    // Wards.
    ctx.fillRect(0, h * 0.14, w * 0.13, h * 0.055)
    ctx.fillRect(0, h * 0.25, w * 0.09, h * 0.055)
    ctx.restore()
  }
  key(-0.42, colour)
  key(0.42, '#e8e4dc')
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

  const w = 128
  const h = 96
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
