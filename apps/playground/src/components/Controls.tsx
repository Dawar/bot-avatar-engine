import { Crosshair, Leaf, RotateCcw, Waves, ChevronDown } from 'lucide-react';
import { MOTION_STYLES, PALETTE, SHAPES, type AvatarConfig } from '@dawartodo/bot-avatar';
import { Field, ShapeIcon, Toggle, SelectedCheck } from './ui';
export const MOTION_INFO = {
  organic: { label: 'Organic', text: 'Soft, curious & a little floaty.', icon: Leaf },
  springy: { label: 'Springy', text: 'Bouncy, playful & full of energy.', icon: Waves },
  precise: { label: 'Precise', text: 'Calm, considered & understated.', icon: Crosshair },
};
export function Controls({
  config,
  onChange,
  onReset,
}: {
  config: AvatarConfig;
  onChange: (patch: Partial<AvatarConfig>) => void;
  onReset: () => void;
}) {
  return (
    <aside className="panel px-6 pb-1" aria-label="Avatar controls">
      <div className="flex items-center justify-between border-b border-line py-5">
        <h2 className="text-sm font-semibold">Make it yours</h2>
        <button
          className="icon-button"
          onClick={onReset}
          title="Reset avatar"
          aria-label="Reset avatar"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="control-section">
        <Field label="Shape">
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                aria-pressed={config.shape === shape}
                onClick={() => onChange({ shape })}
                className={`flex flex-col items-center gap-2 rounded-lg border py-3.5 text-[11px] capitalize transition-colors ${config.shape === shape ? 'border-[#b8a8e6] bg-lilac-light text-accent' : 'border-line text-muted hover:bg-stone-50'}`}
              >
                <ShapeIcon shape={shape} size={21} />
                {shape}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="control-section">
        <Field
          label="Color"
          value={
            <span className="capitalize">
              {config.color.startsWith('#') ? 'Custom' : config.color}
            </span>
          }
        >
          <div className="flex items-center justify-between gap-2">
            {Object.entries(PALETTE).map(([name, color]) => (
              <button
                key={name}
                aria-label={`${name} color`}
                aria-pressed={config.color === name}
                title={name}
                onClick={() => onChange({ color: name as AvatarConfig['color'] })}
                className={`flex size-8 items-center justify-center rounded-full outline-offset-[3px] transition-transform hover:scale-110 ${config.color === name ? 'outline-1 outline-accent' : ''}`}
                style={{ backgroundColor: color }}
              >
                {config.color === name && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="m3 6 2 2 4-4"
                      stroke="#292a32"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="control-section">
        <Field label="Motion style">
          <div className="space-y-2">
            {MOTION_STYLES.map((motion) => {
              const info = MOTION_INFO[motion];
              const Icon = info.icon;
              const selected = config.motion === motion;
              return (
                <button
                  key={motion}
                  onClick={() => onChange({ motion })}
                  aria-pressed={selected}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${selected ? 'border-[#c7b9e9] bg-[#f8f6fd]' : 'border-line hover:bg-stone-50'}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-lilac-light text-accent' : 'bg-stone-50 text-muted'}`}
                  >
                    <Icon size={16} strokeWidth={1.6} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs font-medium">{info.label}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">{info.text}</span>
                  </span>
                  {selected ? (
                    <SelectedCheck />
                  ) : (
                    <span className="size-4 rounded-full border border-line" />
                  )}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
      <div className="control-section space-y-5">
        <Field label="Motion intensity" value={`${Math.round(config.intensity * 100)}%`}>
          <input
            aria-label="Motion intensity"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.intensity}
            onChange={(e) => onChange({ intensity: Number(e.target.value) })}
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted">
            <span>Subtle</span>
            <span>Expressive</span>
          </div>
        </Field>
        <Field label="Tempo" value={`${config.speed.toFixed(2).replace(/0$/, '')}×`}>
          <input
            aria-label="Tempo"
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={config.speed}
            onChange={(e) => onChange({ speed: Number(e.target.value) })}
          />
          <div className="mt-2 flex justify-between text-[10px] text-muted">
            <span>Easy does it</span>
            <span>A little pep</span>
          </div>
        </Field>
      </div>
      <details className="group py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-muted">
          Fine tuning
          <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-5 space-y-5">
          <Field label="Transition" value={`${config.transitionMs} ms`}>
            <input
              aria-label="Transition duration"
              type="range"
              min="150"
              max="2000"
              step="50"
              value={config.transitionMs}
              onChange={(e) => onChange({ transitionMs: Number(e.target.value) })}
            />
          </Field>
          <label className="flex items-center justify-between text-xs">
            Occasional idle spins
            <Toggle
              label="Occasional idle spins"
              value={config.playful}
              onChange={(playful) => onChange({ playful })}
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            Ground shadow
            <Toggle
              label="Ground shadow"
              value={config.shadow}
              onChange={(shadow) => onChange({ shadow })}
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            Reduce motion
            <Toggle
              label="Reduce motion"
              value={config.reducedMotion === 'always'}
              onChange={(value) => onChange({ reducedMotion: value ? 'always' : 'system' })}
            />
          </label>
          <p className="text-[10px] leading-relaxed text-muted">
            System motion preferences are always respected unless explicitly overridden in code.
          </p>
          <label className="block text-xs">
            Bot identity
            <input
              aria-label="Bot identity"
              value={config.seed}
              maxLength={100}
              onChange={(e) => onChange({ seed: e.target.value })}
              className="mt-2 w-full rounded-md border border-line px-2.5 py-2 font-mono text-xs"
            />
          </label>
        </div>
      </details>
    </aside>
  );
}
