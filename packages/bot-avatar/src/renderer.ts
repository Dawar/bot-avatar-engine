import { AvatarEngine, type AvatarFrame, type AvatarLogger } from './engine.js';
import { type AvatarConfig } from './config.js';
import { subscribe } from './scheduler.js';
const NS = 'http://www.w3.org/2000/svg';
function element<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
export interface MountOptions {
  label?: string;
  onEvent?: AvatarLogger;
  debug?: boolean;
}
export interface AvatarController {
  setOptions(options: Partial<AvatarConfig>): void;
  getConfig(): AvatarConfig;
  setLabel(label?: string): void;
  /** Downloadable SVG snapshot at the current pose. No scripts or external assets. */
  toSVG(): string;
  destroy(): void;
}
/** Mount into a caller-owned SVG. Import is SSR-safe; call this only in a browser. */
export function mountAvatar(
  svg: SVGSVGElement,
  options: Partial<AvatarConfig> = {},
  mountOptions: MountOptions = {},
): AvatarController {
  const logger: AvatarLogger | undefined =
    mountOptions.onEvent || mountOptions.debug
      ? (event) => {
          if (mountOptions.debug) console.debug('[littlebot]', event);
          mountOptions.onEvent?.(event);
        }
      : undefined;
  const engine = new AvatarEngine(options, logger);
  const originalNodes = Array.from(svg.childNodes);
  const attributeNames = ['viewBox', 'role', 'aria-label', 'xmlns'];
  const originalAttributes = attributeNames.map((name) => [name, svg.getAttribute(name)] as const);
  svg.setAttribute('viewBox', '0 0 128 128');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('role', 'img');
  let label = mountOptions.label;
  let config = engine.getConfig();
  const updateLabel = () =>
    svg.setAttribute(
      'aria-label',
      label ?? `${config.shape} bot, ${config.state === 'working' ? 'working hard' : 'idle'}`,
    );
  updateLabel();
  const shadow = element('ellipse', {
    cx: '64',
    cy: '108',
    rx: '25',
    ry: '3',
    fill: '#262638',
    opacity: '.09',
  });
  const body = element('g', { 'data-part': 'body' });
  const shape = element('path', { 'data-part': 'shape' });
  const face = element('g', { 'data-part': 'face' });
  const eyes = [-10, 10].map((x) =>
    element('rect', { x: String(x - 3.6), width: '7.2', rx: '3.6' }),
  );
  face.append(...eyes);
  body.append(shape, face);
  svg.replaceChildren(shadow, body);
  let destroyed = false;
  let unsubscribe: (() => void) | undefined;
  let onscreen = true;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () =>
    config.reducedMotion === 'always' || (config.reducedMotion === 'system' && media.matches);
  const paint = (frame: AvatarFrame) => {
    const p = frame.pose;
    body.setAttribute(
      'transform',
      `translate(${64 + p.x} ${61 + p.y}) rotate(${p.rotation}) scale(${p.scaleX} ${p.scaleY})`,
    );
    shape.setAttribute('d', frame.path);
    shape.setAttribute('fill', frame.color);
    face.setAttribute('transform', `translate(${p.gazeX} ${p.gazeY + frame.faceOffsetY})`);
    eyes.forEach((eye, index) => {
      eye.setAttribute('y', String(-p.eyeHeight / 2));
      eye.setAttribute('height', String(p.eyeHeight));
      eye.setAttribute('fill', frame.eyeColor);
      eye.setAttribute(
        'transform',
        `rotate(${p.eyeTilt * (index === 0 ? -1 : 1)} ${index === 0 ? -10 : 10} 0)`,
      );
    });
    shadow.setAttribute('visibility', config.shadow ? 'visible' : 'hidden');
    shadow.setAttribute('rx', String(25 / p.shadowScale));
  };
  const render = (dt: number) => paint(engine.step(dt, reduced()));
  function reconcile() {
    const active = !destroyed && onscreen && !document.hidden && !config.paused && !reduced();
    if (active && !unsubscribe) unsubscribe = subscribe(render);
    if (!active && unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
  }
  const onVisibility = () => {
    engine.log('visibility', { documentHidden: document.hidden, onscreen });
    reconcile();
  };
  const onMotion = () => {
    engine.log('motion-preference', { reduced: reduced() });
    render(0);
    reconcile();
  };
  const observer =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (!entry || entry.isIntersecting === onscreen) return;
            onscreen = entry.isIntersecting;
            onVisibility();
          },
          { rootMargin: '80px' },
        )
      : undefined;
  observer?.observe(svg);
  document.addEventListener('visibilitychange', onVisibility);
  media.addEventListener('change', onMotion);
  render(0);
  reconcile();
  return {
    setOptions(patch) {
      if (destroyed) return;
      const previous = config;
      engine.setOptions(patch);
      config = engine.getConfig();
      updateLabel();
      // A paused avatar freezes its clock, but remains editable in the studio.
      const edited = (
        ['shape', 'color', 'state', 'motion', 'seed', 'intensity', 'speed'] as const
      ).some((key) => previous[key] !== config[key]);
      if (config.paused && edited) paint(engine.step(0, true));
      else render(0);
      reconcile();
    },
    getConfig: () => engine.getConfig(),
    setLabel(next) {
      if (!destroyed) {
        label = next;
        updateLabel();
      }
    },
    toSVG() {
      return new XMLSerializer().serializeToString(svg);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe?.();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      media.removeEventListener('change', onMotion);
      engine.log('destroyed');
      svg.replaceChildren(...originalNodes);
      for (const [name, value] of originalAttributes) {
        if (value === null) svg.removeAttribute(name);
        else svg.setAttribute(name, value);
      }
    },
  };
}
