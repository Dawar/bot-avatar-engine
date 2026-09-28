import type { ReactNode } from 'react';
import { Check, Circle, Square, Triangle } from 'lucide-react';
import type { Shape } from '@dawartodo/bot-avatar';
export function ShapeIcon({ shape, size = 18 }: { shape: Shape; size?: number }) {
  const Icon = { circle: Circle, square: Square, triangle: Triangle }[shape];
  return <Icon size={size} strokeWidth={1.6} />;
}
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-zinc-300'}`}
    >
      <span
        className={`absolute top-[3px] size-3 rounded-full bg-white transition-transform ${value ? 'left-[3px] translate-x-3' : 'left-[3px]'}`}
      />
    </button>
  );
}
export function Field({
  label,
  children,
  value,
}: {
  label: string;
  children: ReactNode;
  value?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="field-label">{label}</span>
        {value && <span className="text-[11px] text-muted">{value}</span>}
      </div>
      {children}
    </div>
  );
}
export function SelectedCheck() {
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-accent text-white">
      <Check size={10} strokeWidth={2.5} />
    </span>
  );
}
export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="31" height="33" viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M9 5H31Q38 5 36 14L32 31Q31 36 25 35L9 32Q3 31 4 24L5 12Q5 5 9 5Z"
          fill="#ADA0E8"
        />
        <rect x="13" y="15" width="4" height="10" rx="2" fill="#292A32" />
        <rect x="23" y="15" width="4" height="10" rx="2" fill="#292A32" />
      </svg>
      <span className="text-[22px] font-bold tracking-[-1px]">
        littlebot<span className="text-accent">.</span>
      </span>
    </div>
  );
}
