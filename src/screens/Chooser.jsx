/**
 * The first screen: which siege?
 *
 * Two versions of this game now ship together — the original text app the
 * whole project was rebuilt from, and the 3D one. The point of asking is not
 * to protect a weak machine from the cost of the 3D: nothing 3D is downloaded
 * or run until this screen is answered, so an unchosen visual siege costs
 * nothing at all.
 *
 * The point is that there is somewhere to go when the visual siege will not
 * run. A machine with no WebGL, a room with no projector, a laptop that turns
 * the whole thing into a slideshow — before this, all of those ended at an
 * apology. Now they end at a working game.
 *
 * So this screen imports nothing that reaches three.js. `App.jsx` is behind a
 * dynamic import in `Shell.jsx`, which is what keeps the promise above true;
 * one careless import here would pull the whole engine back in and this file
 * would still look correct.
 */

import { Panel, Eyebrow, PrimaryButton, GhostButton } from './ui.jsx'

/**
 * Where the text game lives. `BASE_URL` matters: on GitHub Pages the app is
 * served from /<repo>/, so a hard-coded "/text/" would 404 on the deployed
 * site and work perfectly in local dev — the worst way for a link to break.
 */
const TEXT_URL = `${import.meta.env.BASE_URL}text/`

function Choice({ title, blurb, note, children }) {
  return (
    <div className="ruled flex flex-1 flex-col px-5 py-4">
      <h2 className="display text-lg font-bold" style={{ color: 'var(--rubric)' }}>
        {title}
      </h2>
      <p className="mt-2 flex-1 text-sm" style={{ color: 'var(--ink)' }}>
        {blurb}
      </p>
      <p className="mt-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
        {note}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default function Chooser({ onVisual }) {
  return (
    <div
      className="manuscript-scope flex min-h-screen w-screen items-center justify-center p-6"
      style={{ background: '#2a211a' }}
    >
      <Panel wide>
        <div className="text-center">
          <Eyebrow>The Fourth Crusade</Eyebrow>
          <h1
            className="display mt-2 text-3xl font-bold md:text-4xl"
            style={{ color: 'var(--rubric)' }}
          >
            The Siege of Constantinople
          </h1>
          <div className="mt-1.5" style={{ color: 'var(--ink-soft)' }}>
            12 April 1204
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 md:flex-row">
          <Choice
            title="The visual siege"
            blurb="The city, the walls and the fleet in three dimensions, with every attempt
                   played out on screen — the ladders, the engines, the ships coming under
                   the sea wall."
            note="Wants a reasonably recent machine and working graphics. Try this one first."
          >
            <PrimaryButton onClick={onVisual}>Begin the visual siege</PrimaryButton>
          </Choice>

          <Choice
            title="The text siege"
            blurb="The original game: the same dice and the same walls, reported as text.
                   Nothing is drawn."
            note="Runs on anything, including a machine that cannot manage the 3D at all."
          >
            <GhostButton onClick={() => window.location.assign(TEXT_URL)}>
              Begin the text siege
            </GhostButton>
          </Choice>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--ink-soft)' }}>
          The dice rules are identical — tested against the text version, roll for roll, on
          every build. The visual siege also corrects how the original ranked shipwrecks and
          the first man in, and follows the Instructor&rsquo;s Manual on the first-assault
          fama penalty.
        </p>
      </Panel>
    </div>
  )
}
