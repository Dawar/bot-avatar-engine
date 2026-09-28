import { ArrowUpRight } from 'lucide-react';
import { BotAvatar } from '@dawartodo/bot-avatar/react';
import { PALETTE, SHAPES, type AvatarConfig } from '@dawartodo/bot-avatar';
const names = ['Milo', 'Fern', 'Pip', 'Atlas', 'Sunny', 'Ash'];
export function Gallery({
  config,
  onSelect,
  expanded = false,
}: {
  config: AvatarConfig;
  onSelect: (patch: Partial<AvatarConfig>) => void;
  expanded?: boolean;
}) {
  const colors = Object.keys(PALETTE) as (keyof typeof PALETTE)[];
  const bots = expanded
    ? SHAPES.flatMap((shape) =>
        colors.map((color, i) => ({
          shape,
          color,
          name: `${names[i]} · ${shape}`,
          seed: `${color}-${shape}`,
        })),
      )
    : colors.map((color, i) => ({
        shape: SHAPES[i % SHAPES.length]!,
        color,
        name: names[i]!,
        seed: names[i]!,
      }));
  return (
    <section aria-label="Avatar gallery">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.5px]">
            {expanded ? 'Every shape has a personality.' : 'A few familiar faces.'}
          </h2>
          <p className="mt-1.5 text-[11px] text-muted">
            {expanded
              ? `All ${SHAPES.length * colors.length} combinations. Pick a starting point and make it your own.`
              : 'Same little engine. A whole cast of characters. Pick one to play.'}
          </p>
        </div>
        <span className="hidden font-mono text-[10px] text-muted sm:block">
          {expanded ? `${SHAPES.length * colors.length} COMBINATIONS` : 'THE LITTLEBOT LINEUP'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {bots.map((bot) => (
          <button
            key={bot.seed}
            onClick={() => onSelect({ shape: bot.shape, color: bot.color, seed: bot.seed })}
            aria-label={`Try ${bot.name}`}
            className="group panel relative overflow-hidden px-3 pb-3 pt-1 text-left transition-colors hover:border-[#b8a8e6] hover:bg-[#f9f7fd]"
          >
            <span className="absolute right-2.5 top-2.5 text-muted opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowUpRight size={13} />
            </span>
            <div className="flex h-[110px] items-center justify-center">
              <BotAvatar
                {...config}
                shape={bot.shape}
                color={bot.color}
                seed={bot.seed}
                size={112}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium">{bot.name}</span>
              <span className="text-[9px] capitalize text-muted">
                {expanded ? bot.color : bot.shape}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
