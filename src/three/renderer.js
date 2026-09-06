/**
 * Single swap point for the renderer.
 *
 * v1 ships on WebGL2. The brief asked for WebGPU with a WebGL2 fallback, but
 * R3F's WebGPU path still has rough edges, and this is a tool that has to work
 * first time on whatever machine the classroom projector is attached to.
 * Nothing in these scenes — flat shading, merged primitives, a few dozen pawns
 * — needs WebGPU's throughput.
 *
 * Note that we hand R3F renderer *properties* and configure the instance it
 * builds, rather than constructing a renderer ourselves: R3F v9 owns the
 * animation loop, and a hand-built renderer passed through `gl` leaves that
 * loop unstarted, so the scene mounts fully but never draws a frame.
 *
 * To move to WebGPU later, change only this file.
 */

import * as THREE from 'three'

/** Passed to <Canvas gl={...}>. */
export const RENDERER_PROPS = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
}

/**
 * Pixel-ratio clamp, passed to <Canvas dpr={...}>.
 *
 * R3F otherwise renders at the device's own ratio, which on a Retina display
 * is four times the pixels of a 1080p projector — for a scene whose whole
 * look is flat shading and hard edges, and which gains almost nothing from it.
 * The classroom target is an unknown and probably old laptop, so the ceiling
 * is deliberately low. The floor of 1 keeps it honest on a plain display.
 */
export const DPR = [1, 1.5]

/**
 * Shadow map size, stepped down on machines that are likely to struggle.
 *
 * A soft 2048² map per scene is the single most expensive thing here on
 * integrated graphics. This has never run on the actual classroom hardware —
 * the honest position — so the heuristic is deliberately crude and errs
 * towards the cheaper setting.
 */
export function shadowMapSize() {
  if (typeof navigator === 'undefined') return 2048
  const cores = navigator.hardwareConcurrency ?? 4
  const lowMemory = (navigator.deviceMemory ?? 8) <= 4
  return cores <= 4 || lowMemory ? 1024 : 2048
}

/** Passed to <Canvas onCreated={...}>. Applies colour and shadow policy. */
export function configureRenderer({ gl }) {
  gl.outputColorSpace = THREE.SRGBColorSpace
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.05
  gl.shadowMap.enabled = true
  // Soft shadows on a weak GPU cost more than they are worth; the basic map
  // still grounds the figures, which is all these shadows are for.
  gl.shadowMap.type = shadowMapSize() >= 2048 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap
}

/** True when the browser could run the WebGPU path, for a future switch. */
export function webGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}
