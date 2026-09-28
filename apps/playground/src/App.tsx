import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Code2,
  Download,
  Shuffle,
  X,
  Terminal,
  CircleHelp,
  Link as LinkIcon,
  FileUp,
} from 'lucide-react';
import {
  DEFAULT_CONFIG,
  identityFromSeed,
  normalizeConfig,
  parseConfig,
  type AvatarConfig,
  type AvatarEvent,
} from '@dawartodo/bot-avatar';
import { type BotAvatarHandle } from '@dawartodo/bot-avatar/react';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { Stage, type Background } from './components/Stage';
import { Integration, reactSnippet } from './components/Integration';
import { Logo } from './components/ui';
const STORAGE_KEY = 'littlebot:studio:v1';
function readInitial(): { config: AvatarConfig; message?: string } {
  try {
    const shared = new URLSearchParams(window.location.search).get('avatar');
    const stored = shared ?? localStorage.getItem(STORAGE_KEY);
    return { config: stored ? parseConfig(stored) : { ...DEFAULT_CONFIG, shadow: true } };
  } catch (error) {
    console.warn('[littlebot:studio] Could not restore avatar configuration', error);
    return {
      config: { ...DEFAULT_CONFIG, shadow: true },
      message: 'That saved configuration could not be loaded. Starting with a fresh bot.',
    };
  }
}
function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Tab = 'playground' | 'gallery' | 'integration';
export function App() {
  const [initial] = useState(readInitial);
  const [config, setConfig] = useState<AvatarConfig>(initial.config);
  const [tab, setTab] = useState<Tab>('playground');
  const [background, setBackground] = useState<Background>('paper');
  const [cycle, setCycle] = useState(false);
  const [toast, setToast] = useState(initial.message ?? '');
  const [debug, setDebug] = useState(false);
  const [events, setEvents] = useState<AvatarEvent[]>([]);
  const [help, setHelp] = useState(false);
  const avatarRef = useRef<BotAvatarHandle>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [copyFallback, setCopyFallback] = useState('');
  const patch = useCallback(
    (update: Partial<AvatarConfig>) => setConfig((current) => normalizeConfig(update, current)),
    [],
  );
  const eventLogger = useCallback(
    (event: AvatarEvent) => {
      setEvents((current) => [event, ...current].slice(0, 35));
      if (debug) console.debug('[littlebot:studio]', event);
    },
    [debug],
  );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('[littlebot:studio] Configuration could not be saved locally', error);
    }
  }, [config]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!cycle || config.paused) return;
    const id = setTimeout(
      () =>
        setConfig((current) => ({
          ...current,
          state: current.state === 'idle' ? 'working' : 'idle',
          emotion: 'auto',
        })),
      config.state === 'working' ? 15000 / config.speed : 5000,
    );
    return () => clearTimeout(id);
  }, [cycle, config.paused, config.state, config.speed]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHelp(false);
        setCopyFallback('');
      }
      if (event.key === ' ' && event.target === document.body) {
        event.preventDefault();
        setConfig((current) => ({ ...current, paused: !current.paused }));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied. A little personality, ready to go.');
    } catch {
      setCopyFallback(text);
    }
  };
  const exportConfig = () => {
    download(JSON.stringify(config, null, 2), 'littlebot-config.json', 'application/json');
    setToast('Avatar configuration exported.');
  };
  const chooseBot = (update: Partial<AvatarConfig>) => {
    patch(update);
    setTab('playground');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const shuffle = () => {
    patch(identityFromSeed(crypto.randomUUID()));
    setToast('A new face. The same little heartbeat.');
  };
  return (
    <>
      <header className="border-b border-line bg-white/70">
        <div className="mx-auto flex min-h-[78px] max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-9 lg:px-12">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="mt-1 rounded border border-line px-1.5 py-0.5 font-mono text-[8px] tracking-wider text-muted">
              STUDIO
            </span>
          </div>
          <nav
            className="order-3 flex w-full items-center gap-7 text-xs sm:order-none sm:w-auto"
            aria-label="Studio sections"
          >
            {(['playground', 'gallery', 'integration'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                aria-current={tab === item ? 'page' : undefined}
                className={`relative py-1 capitalize transition-colors ${tab === item ? 'font-semibold text-ink after:absolute after:-bottom-[26px] after:left-0 after:h-0.5 after:w-full after:bg-accent max-sm:after:-bottom-4' : 'text-muted hover:text-ink'}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="button hidden md:inline-flex" onClick={exportConfig}>
              <Download size={13} />
              Export config
            </button>
            <button className="button-primary" onClick={() => copy(reactSnippet(config))}>
              <Code2 size={14} />
              <span className="hidden sm:inline">Copy component</span>
              <span className="sm:hidden">Copy</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1224px] px-5 pb-12 pt-9 sm:px-9 lg:px-0 lg:pt-11 xl:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#85a78d]" />
              <span className="eyebrow">A little shape. A lot of life.</span>
            </div>
            <h1 className="text-[30px] font-semibold leading-[1.2] tracking-[-1.3px] sm:text-[35px]">
              {tab === 'playground'
                ? 'Small shapes. Big personality.'
                : tab === 'gallery'
                  ? 'Meet the whole little crew.'
                  : 'A heartbeat for your app.'}
            </h1>
            <p className="mt-3 max-w-xl text-xs leading-6 text-muted sm:text-[13px]">
              {tab === 'playground'
                ? 'Give your bots a little life. Find their shape, set their mood, and let them move.'
                : tab === 'gallery'
                  ? 'One engine, endless characters. Your motion settings bring every one to life.'
                  : 'Take your bot from the playground to wherever the work happens.'}
            </p>
          </div>
          <button className="button mb-1" onClick={shuffle}>
            <Shuffle size={13} />
            Shuffle a bot
          </button>
        </div>
        {tab === 'playground' && (
          <>
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_322px]">
              <Stage
                config={config}
                onChange={patch}
                cycle={cycle}
                onCycle={setCycle}
                background={background}
                setBackground={setBackground}
                avatarRef={avatarRef}
                onEvent={eventLogger}
                onSpin={() => avatarRef.current?.play('spin')}
                onDownload={() => {
                  const svg = avatarRef.current?.toSVG();
                  if (svg) {
                    download(svg, 'littlebot-snapshot.svg', 'image/svg+xml');
                    setToast('SVG snapshot downloaded. Animation lives in the component.');
                  }
                }}
              />
              <Controls
                config={config}
                onChange={patch}
                onReset={() => {
                  setConfig({ ...DEFAULT_CONFIG, shadow: true });
                  setCycle(false);
                  setToast('Back to our original little bot.');
                }}
              />
            </div>
            <div className="mb-8 mt-11">
              <Gallery config={config} onSelect={chooseBot} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7e1f0] bg-[#f3f0f8] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/80 text-accent">
                  <Code2 size={16} />
                </span>
                <div>
                  <p className="text-xs font-medium">A little personality. Ready to plug in.</p>
                  <p className="mt-1 text-[10px] text-muted">
                    A portable core, a React component, and a state for every moment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTab('integration');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-xs font-medium text-accent"
              >
                Meet the API
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
        {tab === 'gallery' && (
          <>
            <div className="panel mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
              <span className="text-xs text-muted">
                The crew is feeling{' '}
                <strong className="font-medium text-ink">
                  {config.state === 'idle' ? 'relaxed' : 'productive'}
                </strong>
                .
              </span>
              <div className="flex gap-2">
                {(['idle', 'working'] as const).map((state) => (
                  <button
                    key={state}
                    onClick={() => patch({ state, emotion: 'auto' })}
                    className={state === config.state ? 'button-primary' : 'button'}
                    aria-pressed={state === config.state}
                  >
                    {state === 'idle' ? 'Idle' : 'Working hard'}
                  </button>
                ))}
                <button className="button" onClick={() => patch({ paused: !config.paused })}>
                  {config.paused ? 'Resume all' : 'Pause all'}
                </button>
              </div>
            </div>
            <Gallery config={config} onSelect={chooseBot} expanded />
          </>
        )}
        {tab === 'integration' && (
          <Integration
            config={config}
            onCopy={copy}
            onExport={exportConfig}
            onImport={() => importRef.current?.click()}
          />
        )}
        <footer className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-[10px] text-muted">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-lilac" />
            Littlebot engine <span className="font-mono text-[9px]">v0.1.0</span>
            <span className="mx-1 text-zinc-300">/</span>Made for bots with things to do.
          </div>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-1.5 hover:text-ink"
              onClick={() =>
                copy(
                  `${window.location.origin}${window.location.pathname}?avatar=${encodeURIComponent(JSON.stringify(config))}`,
                )
              }
            >
              <LinkIcon size={11} />
              Share preset
            </button>
            <button
              className="flex items-center gap-1.5 hover:text-ink"
              onClick={() => importRef.current?.click()}
            >
              <FileUp size={11} />
              Import
            </button>
            <button
              className="flex items-center gap-1.5 hover:text-ink"
              onClick={() => setDebug(!debug)}
              aria-expanded={debug}
            >
              <Terminal size={11} />
              Diagnostics
            </button>
            <button
              aria-label="About this playground"
              className="hover:text-ink"
              onClick={() => setHelp(!help)}
              aria-expanded={help}
            >
              <CircleHelp size={13} />
            </button>
          </div>
        </footer>
        {help && (
          <div className="panel mt-4 p-5 text-xs leading-6 text-muted">
            <p>
              Choose a shape and color, then try a state and motion style. Auto-cycle switches
              between five seconds of idle and a full working loop. Press Space outside a control to
              pause. Your choices are saved in this browser.
            </p>
            <p className="mt-2">
              Share preset puts the configuration in a link. SVG downloads are still snapshots; use
              the component for live animation. This is a standalone prototype for later DawarTodo
              integration.
            </p>
          </div>
        )}
        {debug && (
          <section className="panel mt-4 p-5" aria-label="Engine diagnostics">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold">Engine diagnostics</h2>
                <p className="mt-1 text-[10px] text-muted">
                  Main preview events. Detailed payloads are also sent to the browser console.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-accent"
                  onClick={() => copy(JSON.stringify(events, null, 2))}
                >
                  Copy log
                </button>
                <button
                  className="icon-button"
                  onClick={() => setDebug(false)}
                  aria-label="Close diagnostics"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="max-h-60 overflow-auto rounded-lg bg-stone-50 p-3 font-mono text-[10px] leading-6">
              {events.length ? (
                events.map((event, i) => (
                  <p key={`${event.timestamp}-${i}`}>
                    <span className="text-muted">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>{' '}
                    <span className="text-accent">{event.type}</span>{' '}
                    {JSON.stringify(event.details)}
                  </p>
                ))
              ) : (
                <p className="text-muted">Open the playground to see avatar events.</p>
              )}
            </div>
          </section>
        )}
      </main>
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Import avatar configuration"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 65536) throw new Error('Configuration exceeds 64KB.');
            const imported = parseConfig(await file.text());
            setConfig(imported);
            setCycle(false);
            setTab('playground');
            setToast('Your little bot is back. Configuration imported.');
          } catch (error) {
            setToast(
              `Could not import: ${error instanceof Error ? error.message : 'Invalid configuration.'}`,
            );
          }
          e.target.value = '';
        }}
      />
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex w-max max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-ink px-4 py-3 text-xs text-white shadow-lg"
        >
          <Check size={14} className="shrink-0 text-[#b9d6b3]" />
          <span>{toast}</span>
          <button onClick={() => setToast('')} aria-label="Dismiss notification">
            <X size={13} className="shrink-0 text-white/60" />
          </button>
        </div>
      )}
      {copyFallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-title"
            className="panel w-full max-w-xl p-5"
          >
            <div className="mb-4 flex justify-between">
              <h2 id="copy-title" className="text-sm font-semibold">
                Select and copy
              </h2>
              <button onClick={() => setCopyFallback('')} aria-label="Close copy dialog">
                <X size={16} />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">
              Clipboard access is unavailable. Copy the text below.
            </p>
            <textarea
              autoFocus
              readOnly
              value={copyFallback}
              onFocus={(e) => e.target.select()}
              aria-label="Text to copy"
              className="h-72 w-full rounded-md border border-line p-3 font-mono text-xs"
            />
          </div>
        </div>
      )}
    </>
  );
}
