import {
  DEFAULT_CONFIG,
  MOTION_STYLES,
  SHAPES,
  normalizeConfig,
  resolveColor,
  hashSeed,
  type AvatarConfig,
  type AvatarEmote,
} from './config.js';
import {
  advanceSpring,
  applySpin,
  blendPoses,
  samplePose,
  SPIN_DURATION,
  type Pose,
  type Spring,
} from './motion.js';
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
    | 'emote-start'
    | 'emote-complete'
    | 'emote-skipped'
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
  private spinElapsed: number | null = null;
  private nextSpinAt: number;
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
    this.nextSpinAt = this.spinInterval();
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
    if (changed.includes('seed')) this.nextSpinAt = this.time + this.spinInterval();
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
  private spinInterval() {
    return 12 + (hashSeed(this.config.seed) % 1200) / 100;
  }
  /** Returns false when paused, reduced-motion, or already playing; never snaps a running spin. */
  play(emote: AvatarEmote, reduced = false, source: 'manual' | 'automatic' = 'manual'): boolean {
    if (emote !== 'spin') throw new TypeError('Unknown avatar emote.');
    const reason = this.config.paused
      ? 'paused'
      : reduced || this.config.reducedMotion === 'always'
        ? 'reduced-motion'
        : this.spinElapsed !== null
          ? 'already-playing'
          : null;
    if (reason) {
      this.log('emote-skipped', { emote, reason });
      return false;
    }
    this.spinElapsed = 0;
    this.nextSpinAt = this.time + this.spinInterval();
    this.log('emote-start', { emote, source, durationSeconds: SPIN_DURATION });
    return true;
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
    if (this.spinElapsed !== null) {
      this.spinElapsed += reduced ? 0 : dt * this.speed.value;
      if (reduced || this.spinElapsed >= SPIN_DURATION) {
        this.spinElapsed = null;
        this.log('emote-complete', {
          emote: 'spin',
          reason: reduced ? 'reduced-motion' : 'finished',
        });
      }
    }
    if (
      !reduced &&
      !this.config.paused &&
      this.spinElapsed === null &&
      this.config.playful &&
      this.config.state === 'idle' &&
      this.energy.value < 0.05 &&
      this.config.motion !== 'precise' &&
      this.config.intensity > 0 &&
      this.time >= this.nextSpinAt
    ) {
      this.play('spin', false, 'automatic');
    }
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
    let pose = blendPoses(
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
    );
    if (this.spinElapsed !== null) pose = applySpin(pose, this.spinElapsed, this.intensity.value);
    return {
      pose,
      path: this.cachedPath,
      color: `rgb(${colorValues.join(',')})`,
      eyeColor: '#252536',
      faceOffsetY: weights[2]! * 10,
      energy: this.energy.value,
    };
  }
  log(type: AvatarEvent['type'], details: AvatarEvent['details'] = {}): void {
    // Logging is event-based; never flood production with animation frame logs.
    this.logger?.({ type, seed: this.config.seed, timestamp: Date.now(), details });
  }
}
