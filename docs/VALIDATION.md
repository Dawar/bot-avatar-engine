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
