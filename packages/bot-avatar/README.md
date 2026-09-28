# @dawartodo/bot-avatar

A dependency-free TypeScript engine for continuous, expressive flat SVG avatars, with an optional React 18/19 adapter. This package is local and unpublished.

```tsx
'use client';
import { BotAvatar } from '@dawartodo/bot-avatar/react';
<BotAvatar seed="thread-123" shape="circle" color="lilac" state="working" size={40} />;
```

## Configuration

| Property        | Values / range                                                      | Default     |
| --------------- | ------------------------------------------------------------------- | ----------- |
| `shape`         | `circle`, `square`, `triangle`                                      | `circle`    |
| `color`         | `lilac`, `mint`, `coral`, `sky`, `butter`, `graphite`, or `#RRGGBB` | `lilac`     |
| `state`         | `idle`, `working`                                                   | `idle`      |
| `motion`        | `organic`, `springy`, `precise`                                     | `organic`   |
| `seed`          | string or finite number                                             | `littlebot` |
| `intensity`     | 0–1                                                                 | 0.6         |
| `speed`         | 0.25–2                                                              | 1           |
| `transitionMs`  | 150–2000                                                            | 700         |
| `paused`        | boolean                                                             | false       |
| `reducedMotion` | `system`, `always`, `never`                                         | `system`    |
| `shadow`        | boolean                                                             | false       |

`transitionMs` is approximate spring settling time, not a hard deadline. At zero intensity body motion and gaze stop; the avatar can still blink. `paused` freezes the current animation clock. Editing visual options while paused settles them to a static pose. `reducedMotion="always"` disables all movement but keeps the state's expression. Use `never` only for an intentional application override.

`BotAvatar` also accepts `size` (default 64), an accessible `label`, ordinary SVG attributes, `debug`, and `onEvent`. It exposes `toSVG()` through a `BotAvatarHandle` ref; this exports a still snapshot, not an animation. `size` is the whole SVG box, including motion clearance. The colored body occupies roughly 60–65% of that box.

## Plain browser JavaScript

```ts
import { mountAvatar } from '@dawartodo/bot-avatar';
const controller = mountAvatar(
  svgElement,
  { seed: 'thread-123' },
  {
    label: 'Planning bot',
    onEvent: (event) => console.debug('[avatar]', event),
  },
);
controller.setOptions({ state: 'working' });
controller.setLabel('Planning bot is working');
const snapshot = controller.toSVG();
controller.destroy();
```

Each mount owns the SVG's children until `destroy()` restores the prior children and attributes. Use one controller per SVG. Destroy it when the view unmounts. The React wrapper handles that automatically, including Strict Mode cleanup.

## Headless engine

```ts
import { AvatarEngine } from '@dawartodo/bot-avatar';
const engine = new AvatarEngine({ seed: 'thread-123' });
engine.setOptions({ state: 'working' });
const frame = engine.step(1 / 60); // delta in seconds
// frame: pose, path, color, eyeColor, faceOffsetY, energy
```

The headless engine does not read system preferences. Pass `true` as the second argument to `step(delta, reduced)` to request a static frame, or configure `reducedMotion: 'always'`. Call `step` regularly; deltas are clamped to 50 ms to avoid motion jumps after stalls. Browser renderer users do not need to handle clocks themselves.

Exports also include `PALETTE`, `SHAPES`, `STATES`, `MOTION_STYLES`, `DEFAULT_CONFIG`, `identityFromSeed`, `normalizeConfig`, `parseConfig`, `resolveColor`, and `getSchedulerStats`. Configuration validation throws `TypeError` for invalid known values; JSON parsing ignores unknown fields and fills missing values from defaults. Store only public bot identity/configuration in shareable presets.

## Diagnostics

Events include `created`, `updated`, `transition-start`, `transition-settled`, `visibility`, `motion-preference`, and `destroyed`. Payloads contain the public seed, timestamp, and relevant configuration or changed fields. Logging is opt-in and event-based. `getSchedulerStats()` reports active subscribers and whether the shared frame loop is running. Motion updates never log a line per frame.

## Packaging

From the parent workspace, run `npm run build`, then `npm pack --workspace @dawartodo/bot-avatar --pack-destination /tmp`. Install the generated tarball in the consuming app. No global CSS, Vite plugin, backend, or animation dependency is required. React 18 or 19 is needed only for `/react`.
