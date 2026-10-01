// 动画只依赖“拍内进度” p。这些小函数把 p 切段、加缓动，全部是纯函数。
export const clamp01 = x => Math.min(1, Math.max(0, x));
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const ease = t => t * t * (3 - 2 * t);
export const easeOut = t => 1 - (1 - t) ** 3;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ramp = (p, a, b) => ease(seg(p, a, b));

// 沿折线走到总长的 p 处。
export function along(points, p) {
  const lens = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
  const total = lens.reduce((s, l) => s + l, 0);
  let d = clamp01(p) * total;
  for (const [i, l] of lens.entries()) {
    if (d <= l || i === lens.length - 1) {
      const k = l === 0 ? 0 : Math.min(1, d / l);
      return [lerp(points[i][0], points[i + 1][0], k), lerp(points[i][1], points[i + 1][1], k)];
    }
    d -= l;
  }
  return points[0];
}

// 二次贝塞尔曲线上 t 处的点。
export const quad = (a, c, b, t) => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
];

// 估算一段文字的宽度：中日韩字符算一个字宽，其他按等宽 0.6 / 比例 0.55 字宽。
export function textWidth(text, size, mono = false) {
  let w = 0;
  for (const ch of String(text)) w += ch.codePointAt(0) > 0x2e80 ? size : size * (mono ? 0.6 : 0.55);
  return w;
}
