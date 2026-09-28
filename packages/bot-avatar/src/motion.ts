import { hashSeed, type MotionStyle } from './config.js';
export interface Spring {
  value: number;
  velocity: number;
}
/** Exact critically damped spring solution: stable across frame rates, keeps velocity on retarget. */
export function advanceSpring(
  spring: Spring,
  target: number,
  dt: number,
  durationMs: number,
): void {
  const omega = 6 / (durationMs / 1000);
  const offset = spring.value - target;
  const b = spring.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  spring.value = target + (offset + b * dt) * decay;
  spring.velocity = (spring.velocity - omega * b * dt) * decay;
}
export interface Pose {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  gazeX: number;
  gazeY: number;
  eyeWidth: number;
  eyeHeight: number;
  eyeOpen: number;
  eyeLift: number;
  eyeTilt: number;
  faceTurn: number;
  faceOpacity: number;
  shadowScale: number;
}
export const REST_POSE: Readonly<Pose> = Object.freeze({
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  gazeX: 0,
  gazeY: 0,
  eyeWidth: 15.5,
  eyeHeight: 24,
  eyeOpen: 1,
  eyeLift: 0,
  eyeTilt: 0,
  faceTurn: 0,
  faceOpacity: 1,
  shadowScale: 1,
});
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const LOOK_TARGETS = [
  [0, 0],
  [-0.9, -0.25],
  [0.75, -0.5],
  [0.35, 0.5],
  [0, -0.8],
  [-0.6, 0.3],
  [1, 0.1],
] as const;
/** Seeded glances ease into a point of interest, then hold instead of constantly wandering. */
export function sampleGaze(time: number, seed: string | number, working = false) {
  const period = working ? 1.35 : 2.8;
  const shifted = time + ((hashSeed(seed) % 1000) / 1000) * period;
  const beat = Math.floor(shifted / period);
  const elapsed = shifted - beat * period;
  const progress = smoothstep(Math.min(1, elapsed / (working ? 0.3 : 0.55)));
  const target = (index: number) =>
    LOOK_TARGETS[hashSeed(`${seed}:look:${index}`) % LOOK_TARGETS.length]!;
  const previous = target(beat - 1),
    next = target(beat);
  return {
    x: mix(previous[0], next[0], progress),
    y: mix(previous[1], next[1], progress),
  };
}
/** Pure, deterministic motion sampler. Time is local animation time in seconds. */
export function samplePose(
  time: number,
  seed: string | number,
  energy: number,
  style: MotionStyle,
  intensity: number,
  reduced = false,
): Pose {
  if (reduced)
    return {
      ...REST_POSE,
      eyeWidth: mix(15.5, 18, energy),
      eyeHeight: mix(24, 9.5, energy),
      eyeTilt: 18 * energy,
      gazeY: 2.2 * energy,
    };
  const hash = hashSeed(seed);
  const phase = ((hash % 10000) / 10000) * Math.PI * 2;
  const t = time + phase;
  const bounce = style === 'springy' ? 1.9 : style === 'precise' ? 0.32 : 1;
  const rhythm = style === 'springy' ? 1.2 : style === 'precise' ? 0.8 : 1;
  const breath = Math.sin(t * 1.7 * rhythm);
  const effort = Math.sin(t * 7.5 * rhythm);
  const lift = mix(breath * 2.1, effort * 2.8 - 1, energy) * intensity * bounce;
  const squash = mix(breath * 0.026, effort * 0.045, energy) * intensity * bounce;
  // Separate clocks blended by energy avoid a phase jump when state changes.
  const curious = sampleGaze(time, seed);
  const focused = sampleGaze(time, seed, true);
  const head = sampleGaze(time - 0.16, seed);
  const gazeX = mix(curious.x * 6.5, focused.x * 2.3, energy) * intensity;
  const gazeY = mix(curious.y * 4, 2.2 + focused.y * 0.7, energy) * intensity;
  const blinkPeriod = 3.7 + (hash % 170) / 100;
  const blinkTime = (((time + phase) % blinkPeriod) + blinkPeriod) % blinkPeriod;
  const blink = blinkTime < 0.18 ? Math.sin((blinkTime / 0.18) * Math.PI) ** 2 : 0;
  const eyeOpen = 1 - blink * 0.95;
  return {
    ...REST_POSE,
    x: Math.sin(t * 0.93) * intensity * bounce * mix(1.2, 0.6, energy),
    y: -lift,
    rotation:
      mix(head.x * 4 + Math.sin(t * 0.82), -3 + Math.sin(t * 3.75) * 4, energy) *
      intensity *
      bounce,
    scaleX: 1 - squash * 0.7,
    scaleY: 1 + squash,
    gazeX,
    gazeY,
    eyeWidth: mix(15.5, 18, energy),
    eyeHeight: mix(24 + Math.max(0, -curious.y) * intensity * 2, 9.5, energy) * eyeOpen,
    eyeOpen,
    eyeLift: curious.x * 1.5 * intensity * (1 - energy),
    eyeTilt: 18 * energy,
    shadowScale: 1 + lift * 0.025,
  };
}
export const SPIN_DURATION = 1.65;
const unit = (value: number) => Math.max(0, Math.min(1, value));
/** Add a temporary hop and full turn without interrupting the underlying state motion. */
export function applySpin(pose: Pose, elapsed: number, intensity: number): Pose {
  const progress = unit(elapsed / SPIN_DURATION);
  const turn = smoothstep(unit((progress - 0.16) / 0.65)) * Math.PI * 2;
  const hop = Math.sin(unit((progress - 0.14) / 0.74) * Math.PI);
  const anticipation = Math.sin(unit(progress / 0.14) * Math.PI);
  const landing = Math.sin(unit((progress - 0.88) / 0.12) * Math.PI);
  const compression = (anticipation * 0.08 + landing * 0.1) * (0.65 + intensity * 0.35);
  return {
    ...pose,
    y: Math.max(-16, pose.y - hop * 14 * (0.65 + intensity * 0.35)),
    rotation: pose.rotation + Math.sin(turn) * 4,
    scaleX: pose.scaleX * (1 + compression - Math.abs(Math.sin(turn)) * 0.08),
    scaleY: pose.scaleY * (1 - compression),
    faceTurn: turn,
    faceOpacity: smoothstep(unit(Math.cos(turn) / 0.28)),
    shadowScale: pose.shadowScale + hop * 0.35,
  };
}
export function blendPoses(poses: readonly Pose[], weights: readonly number[]): Pose {
  const output = { ...REST_POSE };
  for (const key of Object.keys(output) as (keyof Pose)[])
    output[key] = poses.reduce((sum, pose, index) => sum + pose[key] * weights[index]!, 0);
  return output;
}
