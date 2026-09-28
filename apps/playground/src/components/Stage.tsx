import { Moon, Zap, Pause, Play, Download, Sun, Check } from 'lucide-react';
import { BotAvatar, type BotAvatarHandle } from '@dawartodo/bot-avatar/react';
import type { AvatarConfig, AvatarLogger } from '@dawartodo/bot-avatar';
import { useEffect, useState, type RefObject } from 'react';
import { Toggle } from './ui';
export type Background = 'paper' | 'lilac' | 'dark';
export function Stage({
  config,
  onChange,
  cycle,
  onCycle,
  background,
  setBackground,
  avatarRef,
  onDownload,
  onEvent,
}: {
  config: AvatarConfig;
  onChange: (patch: Partial<AvatarConfig>) => void;
  cycle: boolean;
  onCycle: (value: boolean) => void;
  background: Background;
  setBackground: (value: Background) => void;
  avatarRef: RefObject<BotAvatarHandle | null>;
  onDownload: () => void;
  onEvent: AvatarLogger;
}) {
  const dark = background === 'dark';
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const motionReduced =
    config.reducedMotion === 'always' || (config.reducedMotion === 'system' && systemReduced);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="panel overflow-hidden" aria-label="Live avatar preview">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="eyebrow">The stage</span>
            <span className="size-1 rounded-full bg-zinc-300" />
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span
                className={`size-1.5 rounded-full ${config.paused || motionReduced ? 'bg-zinc-400' : 'bg-[#7eaa91]'}`}
              />
              {config.paused ? 'Paused' : motionReduced ? 'Reduced motion' : 'Live preview'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 hidden text-[10px] text-muted sm:block">Canvas</span>
            {(['paper', 'lilac', 'dark'] as const).map((bg) => (
              <button
                key={bg}
                aria-label={`${bg} canvas`}
                aria-pressed={background === bg}
                onClick={() => setBackground(bg)}
                className={`flex size-[18px] items-center justify-center rounded-full border border-black/10 ${background === bg ? 'outline-1 outline-offset-[3px] outline-zinc-400' : ''}`}
                style={{
                  backgroundColor: { paper: '#FAF9F6', lilac: '#EFEBF6', dark: '#30313B' }[bg],
                }}
              >
                {background === bg && <Check size={9} color={bg === 'dark' ? '#fff' : '#71717a'} />}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`dot-grid relative flex h-[370px] flex-col items-center justify-center transition-colors sm:h-[416px] ${dark ? 'bg-[#30313b] text-white' : background === 'lilac' ? 'bg-[#efebf6]' : 'bg-[#fcfbf9]'}`}
        >
          <div className="absolute left-5 top-4">
            <span
              className={`rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${dark ? 'border-white/10 text-white/50' : 'border-black/[0.06] text-muted'}`}
            >
              {config.motion} / {config.shape}
            </span>
          </div>
          <div className="absolute right-4 top-3 flex gap-1">
            <button
              onClick={() => onChange({ paused: !config.paused })}
              className={`icon-button ${dark ? 'text-white/60 hover:text-white' : ''}`}
              aria-label={config.paused ? 'Resume animation' : 'Pause animation'}
              title={config.paused ? 'Resume animation' : 'Pause animation'}
            >
              {config.paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              onClick={onDownload}
              className={`icon-button ${dark ? 'text-white/60 hover:text-white' : ''}`}
              aria-label="Download SVG snapshot"
              title="Download SVG snapshot"
            >
              <Download size={14} />
            </button>
          </div>
          <div className="-mt-7 flex items-center justify-center" data-testid="hero-avatar">
            <BotAvatar
              ref={avatarRef}
              {...config}
              size={288}
              onEvent={onEvent}
              label={`Your ${config.color} ${config.shape} bot, ${config.state === 'working' ? 'working hard' : 'idle'}`}
            />
          </div>
          <div className="absolute bottom-10 text-center">
            <p className="text-[15px] font-medium tracking-[-0.2px]">
              {config.state === 'idle' ? 'Just taking it all in.' : 'A little bot. A lot to do.'}
            </p>
            <p className={`mt-2 text-[11px] ${dark ? 'text-white/45' : 'text-muted'}`}>
              {config.state === 'idle'
                ? 'Breathing, blinking, ready when you are.'
                : 'Focused eyes. Busy mind. Finding a way.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-muted sm:block">State</span>
            <div className="flex gap-1 rounded-lg bg-[#f4f3f5] p-1">
              {(['idle', 'working'] as const).map((state) => (
                <button
                  key={state}
                  onClick={() => onChange({ state })}
                  aria-pressed={config.state === state}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium transition-colors ${config.state === state ? 'bg-white shadow-xs' : 'text-muted hover:text-ink'}`}
                >
                  {state === 'idle' ? <Moon size={13} /> : <Zap size={13} />}
                  {state === 'idle' ? 'Idle' : 'Working hard'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Toggle label="Auto-cycle states" value={cycle} onChange={onCycle} />
            <span className="text-[11px] text-muted">Auto-cycle</span>
          </div>
        </div>
      </section>
      <section
        className="panel flex min-h-[144px] flex-wrap items-center justify-between gap-3 px-6 py-3"
        aria-label="Avatar size previews"
      >
        <div>
          <h2 className="text-xs font-semibold">Small, but full of life.</h2>
          <p className="mt-1.5 text-[10px] text-muted">From a task list to center stage.</p>
        </div>
        <div className="flex items-end gap-3 sm:gap-5">
          {[24, 40, 64, 96].map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <div className="flex h-[92px] items-center">
                <BotAvatar {...config} size={size} label={`${size} pixel preview`} />
              </div>
              <span className="font-mono text-[9px] text-muted">{size}px</span>
            </div>
          ))}
        </div>
      </section>
      <div className="flex items-center justify-center gap-2 px-3 text-[10px] text-muted">
        <Sun size={12} strokeWidth={1.5} />
        <span>Always a little alive. Even when there’s nothing to do.</span>
      </div>
    </div>
  );
}
