/**
 * Colour language for the siege scenes.
 *
 * The governing note from the brief: Constantinople in 1204 is not a grey
 * Western castle. The land walls are banded stone and brick, the imperial
 * colours are purple and gold, and there are no minarets and no double-headed
 * eagle — both postdate this scene.
 */

export const PALETTE = {
  // Theodosian banded masonry: pale limestone courses with red brick levelling bands.
  wallStone: '#d8cdb4',
  wallStoneAlt: '#c9bda2',
  wallBrick: '#a8543c',
  wallBrickAlt: '#964a35',
  wallShadow: '#8f8673', // deep recess tone
  towerStone: '#cfc3a8',

  // Ground, water, sky.
  fieldGrass: '#7a7f52',
  fieldDirt: '#8f8163',
  moatWater: '#3f5a54',
  hornWater: '#2f5c6b',
  skyTop: '#5b7fa6',
  skyHorizon: '#e0c9a2',

  // The city behind the walls.
  cityRoof: '#b4643f',
  cityWall: '#ded2ba',
  domeLead: '#8fa3a8',
  domeGold: '#c8a552',
  hagiaDome: '#a8b0ad',

  // Figures.
  crusaderMail: '#9aa0a6',
  crusaderSurcoat: '#b8402f',
  crusaderCross: '#e8e2d2',
  byzantineLamellar: '#6f7a83',
  byzantinePurple: '#5b2d5b',
  imperialGold: '#c9a24a',
  varangianAxe: '#d6d6d0',

  // Ships.
  hullTimber: '#7d5a3c',
  hullTimberDark: '#5f432c',
  sailCanvas: '#e3d9c4',
  rigging: '#3d3227',

  // UI accents over the 3D scenes.
  uiInk: '#1c1512',
  uiParchment: '#f4ead6',
  uiSuccess: '#3f7d4f',
  uiFailure: '#8c3b2c',
}

/** Alternating course plan for a banded wall, bottom to top. */
export function courseColours(courseCount) {
  const out = []
  for (let i = 0; i < courseCount; i++) {
    // Roughly four stone courses to every two brick levelling courses.
    const inBrickBand = i % 6 === 4 || i % 6 === 5
    if (inBrickBand) {
      out.push(i % 2 === 0 ? PALETTE.wallBrick : PALETTE.wallBrickAlt)
    } else {
      out.push(i % 2 === 0 ? PALETTE.wallStone : PALETTE.wallStoneAlt)
    }
  }
  return out
}
