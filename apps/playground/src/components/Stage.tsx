import { Moon, Zap, Pause, Play, Download, Sun, Check, RotateCw } from 'lucide-react';
import { BotAvatar, type BotAvatarHandle } from '@dawartodo/bot-avatar/react';
import type { AvatarConfig, AvatarLogger, Emotion } from '@dawartodo/bot-avatar';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Toggle } from './ui';
const expressionCopy: Record<Emotion, { label: string; title: string; detail: string }> = {
  resting: {
    label: 'Resting',
    title: 'Just taking it all in.',
    detail: 'A slow breath. Nothing urgent.',
  },
  curious: {
    label: 'Curious',
    title: 'Oh? What’s over there?',
    detail: 'Wide eyes, a little lean, a closer look.',
  },
  thinking: {
    label: 'Thinking',
    title: 'There must be another way.',
    detail: 'A gentle tilt. Looking up for a new idea.',
  },
  sleepy: {
    label: 'Sleepy',
    title: 'Just resting my eyes…',
    detail: 'Heavy eyelids and a gentle droop.',
  },
  focused: {
    label: 'Focused',
    title: 'Okay. Let’s figure this out.',
    detail: 'Eyes narrowed. Leaning into the problem.',
  },
  determined: {
    label: 'Determined',
    title: 'Come on. Almost there.',
    detail: 'Digging in, squinting, pushing a little harder.',
  },
  frustrated: {
    label: 'Frustrated',
    title: 'Why. Won’t. This. Work.',
    detail: 'A tight squint, a scrunch, a little shake.',
  },
  testing: {
    label: 'Testing',
    title: 'What if we try this?',
    detail: 'Checking, watching, waiting for a result.',
  },
  happy: {
    label: 'Happy',
    title: 'Aha! There it is.',
    detail: 'Crescent eyes and a little bounce of delight.',
  },
};
const previewEmotions: Record<AvatarConfig['state'], Emotion[]> = {
  idle: ['resting', 'curious', 'thinking', 'sleepy', 'happy'],
  working: ['focused', 'determined', 'frustrated', 'thinking', 'testing', 'happy'],
};
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
  onSpin,
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
  onSpin: () => void;
}) {
  const dark = background === 'dark';
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('resting');
  const logEvent = useCallback<AvatarLogger>(
    (event) => {
      if (event.type === 'emotion-change') setCurrentEmotion(event.details.to as Emotion);
      onEvent(event);
    },
    [onEvent],
  );
  const expression = expressionCopy[currentEmotion];
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
              onEvent={logEvent}
              label={`Your ${config.color} ${config.shape} bot, ${config.state === 'working' ? 'working hard' : 'idle'}`}
            />
          </div>
          <div className="absolute bottom-10 text-center">
            <p className="text-[15px] font-medium tracking-[-0.2px]">{expression.title}</p>
            <p className={`mt-2 text-[11px] ${dark ? 'text-white/45' : 'text-muted'}`}>
              {expression.detail}
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
                  onClick={() => onChange({ state, emotion: 'auto' })}
                  aria-pressed={config.state === state}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium transition-colors ${config.state === state ? 'bg-white shadow-xs' : 'text-muted hover:text-ink'}`}
                >
                  {state === 'idle' ? <Moon size={13} /> : <Zap size={13} />}
                  {state === 'idle' ? 'Idle' : 'Working hard'}
                </button>
              ))}
            </div>
          </div>
          <button
            className="button text-accent"
            disabled={config.paused || motionReduced}
            onClick={onSpin}
            title="Hop and turn all the way around"
          >
            <RotateCw size={13} />
            Do a spin
          </button>
          <div className="flex items-center gap-2">
            <Toggle label="Auto-cycle states" value={cycle} onChange={onCycle} />
            <span className="text-[11px] text-muted">Auto-cycle</span>
          </div>
        </div>
      </section>
      <section className="panel p-4" aria-label="Emotion previews">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold">A little emotional range</h2>
            <p className="mt-1 text-[10px] text-muted">
              {config.state === 'idle'
                ? 'Attention wanders naturally. Pick an expression to explore.'
                : 'Focus → effort → frustration → rethink → test → delight.'}
            </p>
          </div>
          <button
            className={config.emotion === 'auto' ? 'button-primary' : 'button'}
            aria-pressed={config.emotion === 'auto'}
            onClick={() => onChange({ emotion: 'auto' })}
          >
            {config.state === 'idle' ? 'Let it wander' : 'Play the work loop'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {previewEmotions[config.state].map((emotion) => (
            <button
              key={emotion}
              aria-label={`Preview ${expressionCopy[emotion].label.toLowerCase()} expression`}
              aria-pressed={config.emotion === emotion}
              onClick={() => onChange({ emotion })}
              className={`flex flex-col items-center rounded-lg border px-1 py-2 transition-colors ${config.emotion === emotion ? 'border-accent bg-lilac-light text-accent' : 'border-transparent hover:bg-stone-50'}`}
            >
              <BotAvatar
                {...config}
                emotion={emotion}
                size={64}
                shadow={false}
                playful={false}
                label={`${emotion} expression`}
              />
              <span className="text-[10px]">{expressionCopy[emotion].label}</span>
              <span
                aria-hidden="true"
                className={`mt-1 size-1 rounded-full ${currentEmotion === emotion ? 'bg-accent' : 'bg-transparent'}`}
              />
            </button>
          ))}
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
