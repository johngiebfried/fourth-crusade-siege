import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * A build stamp, so a bug report from the beta can be tied to a build.
 *
 * Falls back to the date if this is not a git checkout — a downloaded zip, for
 * instance — because a stamp that throws at build time is worse than a vague
 * one.
 */
function buildId() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    return sha.toString().trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export default defineConfig({
  /*
   * GitHub Pages serves a project site from /<repo>/ rather than from the
   * domain root, and a build made for the root loads a blank page there —
   * the HTML arrives and every asset behind it 404s. The workflow passes the
   * repository name in; local dev and `npm run preview` keep the root.
   */
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
})
