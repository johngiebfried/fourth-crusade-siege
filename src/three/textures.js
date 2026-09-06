/**
 * Runtime-generated textures. Everything here is drawn on an offscreen canvas
 * at load time — nothing is fetched over the network and no image file exists
 * in the project.
 */

import * as THREE from 'three'
import { PALETTE } from './palette.js'

const labelCache = new Map()

/**
 * A parchment name plate for a pawn. Sized to the text so long Frankish names
 * stay legible when projected.
 */
export function nameLabelTexture(name) {
  if (labelCache.has(name)) return labelCache.get(name)

  const pad = 22
  // Deliberately NOT the textura the rest of the interface is set in. A plate
  // is drawn at 46px and then rendered down to a handful of screen pixels over
  // a pawn's head, and a blackletter at that size is mush. Same reasoning as
  // the `.tally` numerals: anything that has to be read instantly and
  // correctly at small size keeps the serif.
  const fontSize = 46
  const measureCanvas = document.createElement('canvas')
  const mctx = measureCanvas.getContext('2d')
  mctx.font = `600 ${fontSize}px "Iowan Old Style", "Palatino Linotype", Georgia, serif`
  const textWidth = Math.ceil(mctx.measureText(name).width)

  const canvas = document.createElement('canvas')
  canvas.width = textWidth + pad * 2
  canvas.height = fontSize + pad * 2
  const ctx = canvas.getContext('2d')

  const r = 14
  const w = canvas.width
  const h = canvas.height
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(w - r, 0)
  ctx.quadraticCurveTo(w, 0, w, r)
  ctx.lineTo(w, h - r)
  ctx.quadraticCurveTo(w, h, w - r, h)
  ctx.lineTo(r, h)
  ctx.quadraticCurveTo(0, h, 0, h - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()

  ctx.fillStyle = 'rgba(244, 234, 214, 0.94)'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(28, 21, 18, 0.55)'
  ctx.stroke()

  ctx.font = `600 ${fontSize}px "Iowan Old Style", "Palatino Linotype", Georgia, serif`
  ctx.fillStyle = PALETTE.uiInk
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(name, w / 2, h / 2 + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true

  const entry = { texture, aspect: w / h }
  labelCache.set(name, entry)
  return entry
}

let sootTexture = null

/** Soft round particle used for the dissolve and for smoke. */
export function particleTexture() {
  if (sootTexture) return sootTexture

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  sootTexture = new THREE.CanvasTexture(canvas)
  sootTexture.colorSpace = THREE.SRGBColorSpace
  return sootTexture
}

/** Vertical gradient used as the sky dome's inner surface. */
export function skyTexture(top = PALETTE.skyTop, horizon = PALETTE.skyHorizon) {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, top)
  grad.addColorStop(0.62, horizon)
  grad.addColorStop(1, horizon)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
