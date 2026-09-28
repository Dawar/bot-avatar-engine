import {
  DEFAULT_CONFIG,
  MOTION_STYLES,
  SHAPES,
  normalizeConfig,
  resolveColor,
  type AvatarConfig,
} from './config.js';
import { advanceSpring, blendPoses, samplePose, type Pose, type Spring } from './motion.js';
import { shapePath } from './geometry.js';
export interface AvatarFrame {
  pose: Pose;
  path: string;
  color: string;
  eyeColor: string;
  faceOffsetY: number;
  energy: number;
}
export interface AvatarEvent {
  type:
    | 'created'
    | 'updated'
    | 'transition-start'
    | 'transition-settled'
    | 'visibility'
    | 'motion-preference'
    | 'destroyed';
  seed: string | number;
  timestamp: number;
  details: Record<string, unknown>;
}
export type AvatarLogger = (event: AvatarEvent) => void;
const spring = (value: number): Spring => ({ value, velocity: 0 });
const rgb = (color: string) =>
  [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
export class AvatarEngine {
  private config: AvatarConfig;
  private time = 0;
  private energy: Spring;
  private shape: Spring[];
  private style: Spring[];
  private color: Spring[];
  private intensity: Spring;
  private speed: Spring;
  private transitioning = false;
  private cachedWeights = '';
  private cachedPath = '';
  constructor(
    options: Partial<AvatarConfig> = {},
    private logger?: AvatarLogger,
  ) {
    this.config = normalizeConfig(options);
    this.energy = spring(this.config.state === 'working' ? 1 : 0);
    this.shape = SHAPES.map((shape) => spring(Number(shape === this.config.shape)));
    this.style = MOTION_STYLES.map((style) => spring(Number(style === this.config.motion)));
    this.color = rgb(resolveColor(this.config.color)).map(spring);
    this.intensity = spring(this.config.intensity);
    this.speed = spring(this.config.speed);
    this.log('created', { config: this.getConfig() });
  }
  getConfig(): AvatarConfig {
    return { ...this.config };
  }
  setOptions(options: Partial<AvatarConfig>): void {
    const next = normalizeConfig(options, this.config);
    const changed = (Object.keys(DEFAULT_CONFIG) as (keyof AvatarConfig)[]).filter(
      (key) => next[key] !== this.config[key],
    );
    if (!changed.length) return;
    const previousState = this.config.state;
    this.config = next;
    this.log('updated', { changed, config: this.getConfig() });
    if (
      changed.some((key) =>
        ['state', 'shape', 'color', 'motion', 'intensity', 'speed'].includes(key),
      )
    ) {
      this.transitioning = true;
      this.log('transition-start', {
        from: previousState,
        to: next.state,
        changed,
        durationMs: next.transitionMs,
      });
    }
  }
  /** No ambient clock or DOM dependency: usable in tests, SSR, or a custom renderer. */
  step(deltaSeconds: number, reduced = false): AvatarFrame {
    reduced = reduced || this.config.reducedMotion === 'always';
    const dt = this.config.paused
      ? 0
      : Math.min(Math.max(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0), 0.05);
    const targets: [Spring, number][] = [
      [this.energy, Number(this.config.state === 'working')],
      [this.intensity, this.config.intensity],
      [this.speed, this.config.speed],
      ...this.shape.map((s, i): [Spring, number] => [s, Number(SHAPES[i] === this.config.shape)]),
      ...this.style.map((s, i): [Spring, number] => [
        s,
        Number(MOTION_STYLES[i] === this.config.motion),
      ]),
      ...this.color.map((s, i): [Spring, number] => [s, rgb(resolveColor(this.config.color))[i]!]),
    ];
    for (const [value, target] of targets) {
      if (reduced) {
        value.value = target;
        value.velocity = 0;
      } else advanceSpring(value, target, dt, this.config.transitionMs);
    }
    if (!reduced) this.time += dt * this.speed.value;
    if (
      this.transitioning &&
      targets.every(
        ([s, target]) => Math.abs(s.value - target) < 0.002 && Math.abs(s.velocity) < 0.01,
      )
    ) {
      this.transitioning = false;
      this.log('transition-settled', { state: this.config.state });
    }
    const weights = this.shape.map((s) => s.value);
    const weightsKey = weights.map((w) => w.toFixed(4)).join(',');
    if (weightsKey !== this.cachedWeights) {
      this.cachedPath = shapePath(weights);
      this.cachedWeights = weightsKey;
    }
    const colorValues = this.color.map((s) => Math.round(Math.max(0, Math.min(255, s.value))));
    return {
      pose: blendPoses(
        MOTION_STYLES.map((style) =>
          samplePose(
            this.time,
            this.config.seed,
            this.energy.value,
            style,
            this.intensity.value,
            reduced,
          ),
        ),
        this.style.map((s) => s.value),
      ),
      path: this.cachedPath,
      color: `rgb(${colorValues.join(',')})`,
      eyeColor: '#252536',
      faceOffsetY: weights[2]! * 6,
      energy: this.energy.value,
    };
  }
  log(type: AvatarEvent['type'], details: AvatarEvent['details'] = {}): void {
    // Logging is event-based; never flood production with animation frame logs.
    this.logger?.({ type, seed: this.config.seed, timestamp: Date.now(), details });
  }
}
