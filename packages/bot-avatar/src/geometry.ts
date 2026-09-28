import { SHAPES, type Shape } from './config.js';
export type Point = readonly [number, number];
const COUNT = 72;
function outline(shape: Shape): Point[] {
  const result: Point[] = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = -Math.PI / 2 + (i / COUNT) * Math.PI * 2;
    const x = Math.cos(angle),
      y = Math.sin(angle);
    let radius = 39;
    if (shape === 'square') radius = 35 / (Math.abs(x) ** 7 + Math.abs(y) ** 7) ** (1 / 7);
    if (shape === 'triangle') {
      // Radial intersection of three half-planes; rounded by the shared spline below.
      radius = Math.min(
        ...[
          [0, 1, 33],
          [0.8660254, -0.5, 23],
          [-0.8660254, -0.5, 23],
        ].map(([nx, ny, distance]) => {
          const dot = nx! * x + ny! * y;
          return dot > 0.0001 ? distance! / dot : Infinity;
        }),
      );
    }
    result.push([x * radius, y * radius]);
  }
  // Three local passes soften triangle corners while preserving its clear silhouette.
  if (shape === 'triangle')
    for (let pass = 0; pass < 3; pass++) {
      const copy = result.slice();
      for (let i = 0; i < COUNT; i++) {
        const prev = copy[(i + COUNT - 1) % COUNT]!,
          curr = copy[i]!,
          next = copy[(i + 1) % COUNT]!;
        result[i] = [(prev[0] + 2 * curr[0] + next[0]) / 4, (prev[1] + 2 * curr[1] + next[1]) / 4];
      }
    }
  return result;
}
const OUTLINES = SHAPES.map(outline);
const number = (n: number) => n.toFixed(2);
/** All shapes share the same topology, allowing continuous interruptible shape morphing. */
export function shapePath(weights: readonly number[]): string {
  const points = Array.from({ length: COUNT }, (_, i): Point => [
    OUTLINES.reduce((sum, points, s) => sum + points[i]![0] * weights[s]!, 0),
    OUTLINES.reduce((sum, points, s) => sum + points[i]![1] * weights[s]!, 0),
  ]);
  const first = points[0]!,
    last = points[COUNT - 1]!;
  let path = `M${number((first[0] + last[0]) / 2)},${number((first[1] + last[1]) / 2)}`;
  for (let i = 0; i < COUNT; i++) {
    const current = points[i]!,
      next = points[(i + 1) % COUNT]!;
    path += `Q${number(current[0])},${number(current[1])} ${number((current[0] + next[0]) / 2)},${number((current[1] + next[1]) / 2)}`;
  }
  return path + 'Z';
}
