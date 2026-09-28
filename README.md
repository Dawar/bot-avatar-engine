# Littlebot — Bot Avatar Studio

A reusable, flat SVG avatar engine and a local playground for giving bots a little life. Built as a standalone prototype for later integration into DawarTodo.

## Run the studio

Requires Node 22.13+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The requested remote preview is [littlebot.mykiosk.app](https://littlebot.mykiosk.app). If that hostname has a cached DNS error, use the browser-verified [fresh preview](https://littlebot-preview.mykiosk.app); see [tunnel operation](docs/TUNNEL.md). The preview works without a backend, account, API key, external font, or image service.

- **Shapes:** circle, rounded square, rounded triangle, cloud, star, hexagon. Shape changes morph continuously.
- **Colors:** rich lilac, mint, coral, sky, butter, graphite. The API also accepts six-digit hex colors.
- **States:** `idle` and `working` (displayed as “Working hard”). Both stay alive with breathing, glances, and blinks.
- **Motion:** organic, springy, precise; adjustable intensity, tempo, and transition duration.
- **Playground:** light/lilac/dark canvases, pause/resume, auto-cycle, 24–96px previews, all 36 color/shape combinations, and stable seeded personalities.
- **Expressions:** larger glossy anime eyes, curious look-and-linger glances, and narrow slanted working eyes. Circular reflections remain undistorted and are clipped by the eyelids.
- **Emotes:** a hop-and-spin makes the face travel around the silhouette. Try **Do a spin**, call `avatar.play('spin')`, or leave occasional idle spins enabled in Organic/Springy.
- **Portability:** copy React/vanilla code, export/import JSON, share a preset URL, and download a still SVG snapshot. Configuration saves locally in your browser.
- **Diagnostics:** lifecycle/state/visibility logs in the studio and opt-in structured library events. No per-frame logging.

## Architecture

```text
packages/bot-avatar/       @dawartodo/bot-avatar
  src/config.ts           typed options, validation, palette, stable identity
  src/motion.ts           deterministic motion and exact damped springs
  src/geometry.ts         shared-topology SVG shape morphs
  src/engine.ts           pure TypeScript engine; no browser dependency
  src/scheduler.ts        one requestAnimationFrame loop for active avatars
  src/renderer.ts         browser SVG controller, accessibility, cleanup
  src/react.tsx           optional React adapter with a preserved 'use client'
apps/playground/          React + Vite + shared Tailwind utilities
```

The core has **zero runtime dependencies**. React is an optional peer used only by the `/react` entry point. Animation changes SVG attributes outside React; it does not rerender components every frame. Avatar instances share a clock, pause offscreen and when the document is hidden, and release observers/listeners on destruction. Reduced motion uses a static but state-specific expression and schedules no frames.

A stable `seed` (for example a Codex thread ID) determines blink/gaze timing. `identityFromSeed(id)` can derive the shape and color as well. State, shape, color, style, intensity, and tempo changes preserve their spring position/velocity. Rapid changes can interrupt transitions without restarting motion. Time deltas are bounded after long stalls.

## API

```tsx
'use client';
import { BotAvatar } from '@dawartodo/bot-avatar/react';

<BotAvatar
  seed="thread-123"
  shape="triangle"
  color="mint"
  state={isWorking ? 'working' : 'idle'}
  motion="organic"
  size={40}
  label={isWorking ? 'Planning bot, working' : 'Planning bot, idle'}
/>;
```

```ts
import { mountAvatar, identityFromSeed } from '@dawartodo/bot-avatar';

const avatar = mountAvatar(document.querySelector<SVGSVGElement>('#bot')!, {
  ...identityFromSeed('thread-123'),
  state: 'idle',
});
avatar.setOptions({ state: 'working' });
// On view teardown:
avatar.destroy();
```

The SVG renderer owns the children of its host `<svg>` while mounted. Imports are safe in server code; call `mountAvatar` in the browser. The React wrapper renders an empty, accessible SVG on the server and fills it on client mount. Keep the same component key for a bot to preserve motion as its status changes.

See [the package reference](packages/bot-avatar/README.md) and [DawarTodo integration notes](docs/DAWARTODO.md).

## Build and checks

```sh
npm run check          # typecheck, core regression tests, both production builds
npm run format:check
npm audit
npm pack --workspace @dawartodo/bot-avatar --pack-destination /tmp
```

Library output: `packages/bot-avatar/dist`. Static studio output: `apps/playground/dist`. Any static host can serve the studio. This project does not publish or modify DawarTodo. The library is not on the npm registry; install the generated tarball or use a workspace dependency.

Browser validation is recorded in [docs/VALIDATION.md](docs/VALIDATION.md). Core tests cover interrupted transitions, frame-rate independence, pause/resume, deterministic identity, input validation, static reduced motion, event volume, and rapid repeated state changes.

## Design references

Inspired by the expressive geometric avatars in [Grok Bot](https://x.ai/bot). The geometry and motion in this project are original; no Grok implementation, brand assets, or runtime services are used. The renderer uses browser [animation frames](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) and respects [reduced-motion preferences](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).
