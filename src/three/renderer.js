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

/** Passed to <Canvas onCreated={...}>. Applies colour and shadow policy. */
export function configureRenderer({ gl }) {
  gl.outputColorSpace = THREE.SRGBColorSpace
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.05
  gl.shadowMap.enabled = true
  gl.shadowMap.type = THREE.PCFSoftShadowMap
}

/** True when the browser could run the WebGPU path, for a future switch. */
export function webGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}
