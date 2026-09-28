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
  eyeHeight: number;
  eyeTilt: number;
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
  eyeHeight: 16,
  eyeTilt: 0,
  shadowScale: 1,
});
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
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
      eyeHeight: mix(16, 10.5, energy),
      eyeTilt: 9 * energy,
      gazeY: 1.2 * energy,
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
  const gaze = mix(Math.sin(t * 0.65) * Math.sin(t * 0.27) * 3.5, Math.sin(t * 2.4) * 2, energy);
  const blinkPeriod = 3.7 + (hash % 170) / 100;
  const blinkTime = (((time + phase) % blinkPeriod) + blinkPeriod) % blinkPeriod;
  const blink = blinkTime < 0.18 ? Math.sin((blinkTime / 0.18) * Math.PI) ** 2 : 0;
  return {
    x: Math.sin(t * 0.93) * intensity * bounce * mix(1.2, 0.6, energy),
    y: -lift,
    rotation: mix(Math.sin(t * 0.82) * 3, Math.sin(t * 3.75) * 5, energy) * intensity * bounce,
    scaleX: 1 - squash * 0.7,
    scaleY: 1 + squash,
    gazeX: gaze * intensity,
    gazeY: mix(Math.sin(t * 0.56) * 1.7, 1.2, energy) * intensity,
    eyeHeight: mix(16, 10.5, energy) * (1 - blink * 0.91),
    eyeTilt: 9 * energy,
    shadowScale: 1 + lift * 0.025,
  };
}
export function blendPoses(poses: readonly Pose[], weights: readonly number[]): Pose {
  const output = { ...REST_POSE };
  for (const key of Object.keys(output) as (keyof Pose)[])
    output[key] = poses.reduce((sum, pose, index) => sum + pose[key] * weights[index]!, 0);
  return output;
}
