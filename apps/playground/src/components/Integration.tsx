import { useState } from 'react';
import { Check, Code2, Copy, Download, FileUp, ArrowUpRight } from 'lucide-react';
import type { AvatarConfig } from '@dawartodo/bot-avatar';
export function reactSnippet(config: AvatarConfig) {
  return `'use client';\n\nimport { BotAvatar } from '@dawartodo/bot-avatar/react';\n\nexport function ThreadAvatar({ working = false }) {\n  return (\n    <BotAvatar\n      seed={${JSON.stringify(config.seed)}}\n      shape="${config.shape}"\n      color="${config.color}"\n      motion="${config.motion}"\n      emotion="${config.emotion}"\n      state={working ? 'working' : 'idle'}\n      intensity={${config.intensity}}\n      speed={${config.speed}}\n      transitionMs={${config.transitionMs}}\n      reducedMotion="${config.reducedMotion}"\n      playful={${config.playful}}\n      shadow={${config.shadow}}\n      size={40}\n    />\n  );\n}`;
}
export function Integration({
  config,
  onCopy,
  onExport,
  onImport,
}: {
  config: AvatarConfig;
  onCopy: (text: string) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const [tab, setTab] = useState<'react' | 'vanilla' | 'config'>('react');
  const code =
    tab === 'react'
      ? reactSnippet(config)
      : tab === 'config'
        ? JSON.stringify(config, null, 2)
        : `import { mountAvatar } from '@dawartodo/bot-avatar';\n\nconst svg = document.querySelector('#my-bot');\nconst avatar = mountAvatar(svg, ${JSON.stringify({ shape: config.shape, color: config.color, motion: config.motion, emotion: config.emotion, seed: config.seed, intensity: config.intensity, speed: config.speed, transitionMs: config.transitionMs, reducedMotion: config.reducedMotion, shadow: config.shadow, playful: config.playful }, null, 2)});\n\n// Retarget smoothly whenever your bot's status changes.\navatar.setOptions({ state: 'working' });\n\n// Call when your view unmounts.\navatar.destroy();`;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <div className="flex gap-1">
            {(['react', 'vanilla', 'config'] as const).map((t) => (
              <button
                key={t}
                className={`rounded-md px-3 py-2 text-xs ${t === tab ? 'bg-lilac-light text-accent' : 'text-muted'}`}
                onClick={() => setTab(t)}
              >
                {t === 'react' ? 'React' : t === 'vanilla' ? 'Vanilla JS' : 'JSON config'}
              </button>
            ))}
          </div>
          <button className="button" onClick={() => onCopy(code)}>
            <Copy size={12} />
            Copy code
          </button>
        </div>
        <pre className="overflow-x-auto bg-[#fdfcfa] p-6 font-mono text-[12px] leading-[1.9] text-[#686079]">
          <code>{code}</code>
        </pre>
      </section>
      <div className="space-y-5">
        <section className="panel p-6">
          <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-lilac-light text-accent">
            <Code2 size={19} />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">Ready for your next teammate.</h2>
          <p className="mt-3 text-xs leading-6 text-muted">
            A tiny SVG avatar with its own heartbeat. Give it a stable bot ID, then let your app
            switch its state as work begins and ends.
          </p>
          <ul className="mt-5 space-y-3 text-xs">
            {[
              'Framework-independent TypeScript core',
              'React adapter for DawarTodo',
              'No animation libraries or remote assets',
              'Shared clock & automatic visibility handling',
              'System reduced-motion support',
            ].map((text) => (
              <li key={text} className="flex items-center gap-2">
                <Check size={13} className="text-[#73a287]" />
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[11px] leading-5 text-muted">
              This package lives in this workspace. Build it with{' '}
              <code className="text-ink">npm run build</code>, then package{' '}
              <code className="text-ink">packages/bot-avatar</code> with{' '}
              <code className="text-ink">npm pack</code> for installation in DawarTodo. It is not
              published to npm.
            </p>
          </div>
        </section>
        <section className="panel p-6">
          <h3 className="text-sm font-semibold">Keep this little personality.</h3>
          <p className="mt-2 text-xs leading-5 text-muted">
            Export a portable JSON configuration, or load one you saved earlier.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="button" onClick={onExport}>
              <Download size={13} />
              Export config
            </button>
            <button className="button" onClick={onImport}>
              <FileUp size={13} />
              Import config
            </button>
          </div>
        </section>
        <a
          href="https://x.ai/bot"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-1 text-[11px] text-muted hover:text-accent"
        >
          Inspired by the expressive simplicity of Grok Bot
          <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
