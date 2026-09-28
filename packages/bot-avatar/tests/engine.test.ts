import test from 'node:test';
import assert from 'node:assert/strict';
import { AvatarEngine, type AvatarEvent } from '../src/engine.js';
import { advanceSpring, samplePose } from '../src/motion.js';
import {
  DEFAULT_CONFIG,
  identityFromSeed,
  normalizeConfig,
  parseConfig,
  resolveColor,
} from '../src/config.js';
const near = (a: number, b: number, epsilon = 1e-6) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} should equal ${b}`);
function run(engine: AvatarEngine, seconds: number, fps = 60) {
  let frame = engine.step(0);
  for (let i = 0; i < seconds * fps; i++) frame = engine.step(1 / fps);
  return frame;
}
test('state retargets from the current pose and can be interrupted without a jump', () => {
  const engine = new AvatarEngine();
  const idle = run(engine, 1);
  engine.setOptions({ state: 'working' });
  assert.deepEqual(engine.step(0), idle);
  const partial = run(engine, 0.15);
  assert.ok(partial.energy > 0 && partial.energy < 1);
  engine.setOptions({ state: 'idle' });
  assert.deepEqual(engine.step(0), partial);
  assert.ok(run(engine, 2).energy < 0.0001);
});
test('shape, color and style retarget without a discontinuity', () => {
  const engine = new AvatarEngine();
  const before = run(engine, 0.4);
  engine.setOptions({ shape: 'triangle', color: 'coral', motion: 'springy' });
  assert.deepEqual(engine.step(0), before);
  const after = run(engine, 2);
  assert.notEqual(after.path, before.path);
  assert.equal(after.color, 'rgb(239,153,136)');
});
test('exact spring solution gives equivalent motion across common frame rates', () => {
  const results = [30, 60, 120].map((fps) => {
    const engine = new AvatarEngine();
    engine.setOptions({ state: 'working' });
    return run(engine, 0.5, fps);
  });
  for (const frame of results) {
    near(frame.energy, results[0]!.energy);
    near(frame.pose.y, results[0]!.pose.y);
  }
  const spring = { value: 0, velocity: 0 };
  advanceSpring(spring, 1, 0.2, 700);
  assert.ok(spring.value > 0 && spring.value < 1);
});
test('idle and working both stay alive; seed makes a reproducible personality', () => {
  for (const energy of [0, 1])
    for (const motion of ['organic', 'springy', 'precise'] as const) {
      const a = samplePose(1, 'thread-1', energy, motion, 0.6);
      assert.notDeepEqual(a, samplePose(1.5, 'thread-1', energy, motion, 0.6));
      assert.deepEqual(a, samplePose(1, 'thread-1', energy, motion, 0.6));
      assert.notDeepEqual(a, samplePose(1, 'thread-2', energy, motion, 0.6));
    }
  assert.deepEqual(identityFromSeed('thread-1'), identityFromSeed('thread-1'));
});
test('reduced motion is fully static but still distinguishes work from idle', () => {
  const engine = new AvatarEngine();
  const idle = engine.step(1, true);
  assert.deepEqual(engine.step(50, true), idle);
  engine.setOptions({ state: 'working', shape: 'square' });
  const working = engine.step(0, true);
  assert.equal(working.energy, 1);
  assert.notEqual(working.pose.eyeHeight, idle.pose.eyeHeight);
  assert.notEqual(working.path, idle.path);
  assert.deepEqual(engine.step(1, true), working);
});
test('pause freezes pose and long gaps are bounded on resume', () => {
  const engine = new AvatarEngine();
  const before = run(engine, 0.3);
  engine.setOptions({ paused: true });
  assert.deepEqual(engine.step(100), before);
  engine.setOptions({ paused: false });
  const after = engine.step(100);
  assert.ok(Math.abs(after.pose.y - before.pose.y) < 1);
});
test('bad runtime configuration is rejected atomically', () => {
  const engine = new AvatarEngine();
  for (const options of [
    { state: 'missing' },
    { intensity: NaN },
    { speed: Infinity },
    { speed: 0 },
    { color: 'url(https://example.com)' },
    { seed: {} },
    { paused: 1 },
    { transitionMs: 0 },
  ]) {
    assert.throws(() => engine.setOptions(options as never), TypeError);
    assert.deepEqual(engine.getConfig(), DEFAULT_CONFIG);
  }
  assert.equal(resolveColor('#aabbcc'), '#AABBCC');
  assert.equal(normalizeConfig({ shape: undefined }).shape, 'circle');
  assert.throws(() => parseConfig('[]'));
  assert.throws(() => parseConfig('null'));
  assert.throws(() => parseConfig('{broken'));
});
test('JSON config round trips and ignores unknown fields', () => {
  const config = normalizeConfig({
    shape: 'triangle',
    motion: 'precise',
    color: '#C0FFEE',
    seed: 0,
  });
  assert.deepEqual(parseConfig(JSON.stringify(config)), config);
  assert.deepEqual(parseConfig('{"untrusted":"discard"}'), DEFAULT_CONFIG);
});
test('logging records lifecycle and one completion without per-frame flooding', () => {
  const events: AvatarEvent[] = [];
  const engine = new AvatarEngine({}, (event) => events.push(event));
  run(engine, 3);
  assert.equal(events.length, 1);
  engine.setOptions({ state: 'working' });
  run(engine, 3);
  assert.deepEqual(
    events.map((e) => e.type),
    ['created', 'updated', 'transition-start', 'transition-settled'],
  );
  run(engine, 10);
  assert.equal(events.length, 4);
});
test('repeated transitions keep all geometry and motion finite', () => {
  const engine = new AvatarEngine();
  for (let i = 0; i < 800; i++) {
    if (i % 7 === 0)
      engine.setOptions({
        state: i % 2 ? 'idle' : 'working',
        shape: ['circle', 'square', 'triangle'][i % 3] as 'circle',
        intensity: (i % 11) / 10,
        speed: 0.25 + (i % 8) * 0.25,
      });
    const frame = engine.step(1 / 60);
    assert.ok(Object.values(frame.pose).every(Number.isFinite));
    assert.ok(!/NaN|Infinity/.test(frame.path));
    assert.ok(frame.pose.eyeHeight > 0);
  }
});
test('caller mutations cannot change engine configuration', () => {
  const engine = new AvatarEngine();
  const config = engine.getConfig();
  config.shape = 'square';
  assert.equal(engine.getConfig().shape, 'circle');
});
test('explicit reduced-motion configuration also works in the headless core', () => {
  const engine = new AvatarEngine({ reducedMotion: 'always' });
  const before = engine.step(1 / 60);
  assert.deepEqual(run(engine, 3), before);
});
