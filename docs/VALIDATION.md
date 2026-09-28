# Validation — 2026-09-28

## Automated

- `npm run check`: passed. Both projects typecheck and produce production builds.
- `npm test`: 12 passing regression tests covering uninterrupted/interruptible state and shape transitions, 30/60/120 Hz equivalence, deterministic motion, live idle/working styles, reduced motion, pause/resume, malformed configuration rejection, JSON round trips, bounded logging, and repeated rapid transitions.
- `npm audit`: zero known vulnerabilities at validation time.
- `npm pack --workspace @dawartodo/bot-avatar --pack-destination artifacts`: produced an installable 10.9 KB tarball containing compiled JavaScript, declarations, and package documentation.
- Installed that exact tarball in a fresh temporary directory with React/ReactDOM 19.2.6. Verified the public core import, a working-state frame, React server rendering, and the preserved `use client` directive in the adapter. No workspace source aliases were involved in this check.

## Browser

Exercised the local studio in the Codex Chromium browser:

- Desktop playground, circle → triangle morph, coral color, working state, and springy style.
- Pause stays stationary; resume and the fine-tuning controls remain available.
- Reduced motion stays at an unchanged body transform; idle/working still have distinct eye heights (working: 10.5 SVG units).
- Expanded gallery contains all 18 combinations; a selected gallery bot returns to the playground.
- React, vanilla JavaScript, and JSON integration views are available.
- Exported JSON exists on disk, parses through the actual library, and imports back into the studio with success feedback.
- SVG snapshot exists on disk, contains the avatar geometry, and contains no script element.
- Copy component reports successful clipboard writing. The browser automation clipboard accessor did not expose the system clipboard content, so the copied text was not independently read back.
- Auto-cycle moves from working to idle. Reset stops auto-cycle and restores the original avatar.
- 390px mobile viewport reflows to one column with document width and scroll width both 390px. The desktop viewport was restored afterward.
- No browser error/warning logs were observed in the final browser check.

The preview remains available at http://127.0.0.1:5173 while the development server is running. It is not publicly deployed. DawarTodo itself has not been modified or integration-tested. SVG exports are still images; live animation uses the component or controller.

## Expressive avatars and expanded palette

- Production builds and typechecks pass; the suite now has **16 passing tests**.
- Added spin coverage for no jump at activation, a visible hop, face hiding on the back, return to the underlying pose, working-state changes during the spin, pause/resume, reduced-motion cancellation, automatic scheduling, and opt-out.
- All six silhouettes produce distinct paths and finite interrupted morphs. The gallery derives its 36 combinations from the shared definitions.
- Browser inspected the new cloud and star, rich colors, and large glossy idle eyes. Idle and working reflections retained the same circle radii (2.6, 2.5, 1.15 SVG units per eye); only the eye silhouette receives expression rotation/scaling.
- The Do a spin button triggered the hop and wraparound face in the browser.
- The expanded browser gallery exposes all 36 combinations. The final browser check reported no errors or warnings.
- Installed the updated package tarball in a fresh temporary directory with React/ReactDOM 19.2.6. Verified all six shapes, the compiled spin API and hidden-back pose, and React server rendering without leaking the `playful` configuration into SVG attributes.
- The ERD preview is now public at https://littlebot.mykiosk.app; see TUNNEL.md for verified readiness and the local DNS-cache limitation encountered at startup. The earlier note about no public deployment describes the initial version.
- After the requested restart, the original tunnel serves HTTPS successfully with the DNS address supplied explicitly, but the local resolver retains its missing-name cache. The fresh URL https://littlebot-preview.mykiosk.app returns HTTPS 200 with normal DNS and loads the full studio in the browser; both ERD tunnels report their connectors and origins ready.

## Activity and emotion behavior

- All **22 tests** pass, along with both typechecks and production builds. New coverage checks the full working sequence, reproducible varied idle behavior, independent emotion overrides and interrupted transitions, pause/reduced motion, bounded emotion-change logging, and behavior timing at 30/60/120 Hz.
- Browser inspected angry squints, body compression, happy crescent eyes, and the reusable expression preview controls. Catchlight radii remain 2.6, 2.5, and 1.15 with no reflection transforms.
- The idle preview moved between automatic expressions. Curious and sleepy overrides, editing an expression while paused, resuming, and returning to automatic behavior worked. No browser errors or warnings were observed.
- The public preview returned HTTP 200 after restarting the local development server; the existing ERD preview connector and origin remain ready.
- `state` stays independent of `emotion`; an automatic happy expression does not report application success or completion. Only idle and working activity states are implemented. Source-level extension points are documented in the package reference and DawarTodo notes.

- Thinking was refined after visual feedback: equally sized, level eyes with an upward glance and gentler head tilt. A regression check preserves that symmetry. The updated package installs independently and exposes all nine expressions, the catalogs, backward-compatible presets, and the React adapter without leaking the emotion prop onto SVG.
- Live development now reloads the studio when the core library changes, because a preserved React controller could otherwise keep using an old motion sampler. Saved preview settings survive the reload.
