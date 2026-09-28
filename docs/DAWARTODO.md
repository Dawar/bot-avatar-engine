# DawarTodo integration notes

DawarTodo's local manifest was inspected on 2026-09-28: React 19.2.6, TypeScript, and vinext/Vite with Cloudflare tooling. No DawarTodo files were changed.

## Install later

Build and pack this library from the studio repository:

```sh
npm run build
npm pack --workspace @dawartodo/bot-avatar --pack-destination /tmp
```

When integration is requested, install `/tmp/dawartodo-bot-avatar-0.1.0.tgz` in DawarTodo. Both public entry points include TypeScript declarations, and the React adapter preserves its `use client` boundary. No additional CSS or assets are needed in DawarTodo.

## Suggested boundary

Keep avatar identity separate from current work status. Persist a bot's `seed`, `shape`, `color`, and optionally `motion` on the bot record. Derive `state` from the application's existing job/thread status. There is no network polling in the avatar library.

```tsx
'use client';

import { BotAvatar } from '@dawartodo/bot-avatar/react';
import { identityFromSeed } from '@dawartodo/bot-avatar';

export function ThreadAvatar({
  threadId,
  running,
  name,
}: {
  threadId: string;
  running: boolean;
  name: string;
}) {
  return (
    <BotAvatar
      {...identityFromSeed(threadId)}
      state={running ? 'working' : 'idle'}
      motion="organic"
      size={40}
      label={`${name}, ${running ? 'working' : 'idle'}`}
    />
  );
}
```

Use the same React key while status changes; remounting an avatar resets its local animation clock. Feed existing subscriptions or job events into the `running` prop. Map real statuses in the consuming app once its requirements are known. This prototype deliberately defines only `idle` and `working`.

## Operational behavior

- Each instance has deterministic blink and gaze timing from its ID. Identical seeds have the same personality, but the local clock starts at mount, so separate mounts are not guaranteed to be phase-locked.
- State/style/color/shape changes are spring-smoothed and interruptible. Identity seed changes select a new personality immediately.
- All visible avatars share one frame scheduler. Hidden documents and offscreen avatars stop subscribing; resume continues their local time without a catch-up jump.
- Reduced motion stops all motion and leaves a state-specific expression. Keep the default `system` setting in the app.
- A 40px box includes animation clearance; the shape itself is smaller. Adjust the box size to the task row's available space.
- Use a descriptive label if the avatar carries status. If nearby visible text already provides the same information, use `aria-hidden="true"` to prevent duplicate announcements. Do not use an aria-live region for animation frames.
- Enable `onEvent` or `debug` temporarily for production investigation. Keep bot IDs free of secrets; event logs include the seed. There are no frame-level logs.
- SVG imports do not touch browser globals. React server rendering emits the accessible container; the avatar is drawn during client mount.

## Extending the engine

Add state semantics to `BotState`/`STATES` and define their poses and blend targets in the core. Keep the app's domain statuses outside the renderer. Add palette colors centrally in `config.ts`; keep geometry in `geometry.ts`. The playground consumes these shared definitions, and its controls use global Tailwind utilities and shared primitives.

The UI name “Littlebot” is just the studio identity. The distributable package uses the DawarTodo scope and has no coupling to that branding.
