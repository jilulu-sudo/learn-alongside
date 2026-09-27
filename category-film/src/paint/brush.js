// 笔触几何：全是纯函数。同一个 seed 永远画出同一根线，所以任何时刻的画面都能精确重现。

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = s => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// 平滑噪声：几条随机相位的正弦叠加。u 是沿线的弧长参数。
function noise(seed) {
  const r = rng(seed);
  const waves = Array.from({ length: 3 }, (_, i) => ({ f: (i + 1) * (0.6 + r()), ph: r() * Math.PI * 2, a: 1 / (i + 1) }));
  return u => waves.reduce((s, w) => s + w.a * Math.sin(u * w.f + w.ph), 0) / 1.83;
}

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function resample(pts, step = 8) {
  if (pts.length < 2) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

export function lengthOf(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}

// 只取前 progress 比例的那一段，用来“画出来”。
export function partial(pts, progress) {
  if (progress >= 1) return pts;
  if (progress <= 0 || pts.length < 2) return pts.slice(0, 1);
  const target = lengthOf(pts) * progress;
  const out = [pts[0]];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (run + d >= target) {
      const k = (target - run) / d;
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      return out;
    }
    run += d;
    out.push(pts[i]);
  }
  return out;
}

export function wobble(pts, { seed = 1, amp = 2.2, freq = 0.02 } = {}) {
  const n = noise(seed);
  let u = 0;
  return pts.map((p, i) => {
    if (i) u += dist(pts[i - 1], p);
    const [a, b] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]];
    const len = dist(a, b) || 1;
    const [nx, ny] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const o = n(u * freq) * amp;
    return [p[0] + nx * o, p[1] + ny * o];
  });
}

// 把中心线变成一条有粗细变化、两端收尖的填充轮廓，这就是“笔触”。
export function strokeOutline(pts, { width = 6, seed = 1, taper = 0.18 } = {}) {
  if (pts.length < 2) return '';
  const n = noise(seed + 7);
  const L = lengthOf(pts) || 1;
  let u = 0;
  const left = [];
  const right = [];
  pts.forEach((p, i) => {
    if (i) u += dist(pts[i - 1], p);
    const s = u / L;
    const tip = Math.min(1, s / taper, (1 - s) / taper);
    const w = (width / 2) * (0.35 + 0.65 * Math.sqrt(Math.max(0, tip))) * (0.85 + 0.25 * n(u * 0.03));
    const [a, b] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]];
    const len = dist(a, b) || 1;
    const [nx, ny] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  const f = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
  return `M${left.map(f).join('L')}L${right.reverse().map(f).join('L')}Z`;
}

export function quad(a, b, bend = 0, steps = 32) {
  const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const len = dist(a, b) || 1;
  const c = [mx - ((b[1] - a[1]) / len) * bend, my + ((b[0] - a[0]) / len) * bend];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  });
}

export function ring(c, r, { seed = 1, irregular = 0.04, steps = 72, start = -Math.PI / 2 } = {}) {
  const n = noise(seed);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = start + (i / steps) * Math.PI * 2;
    const rr = r * (1 + irregular * n(i * 0.35));
    return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr];
  });
}

export const polyPath = pts => `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
export const linePath = pts => `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}`;

// 把 "Σ_(d|n) μ(n/d)" 切成普通段和上下标段。_x / ^x 取紧跟的一串字母数字，_(…) / ^(…) 取括号里的全部。
export function scriptRuns(text) {
  const runs = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) runs.push({ t: buf, kind: null });
    buf = '';
  };
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if ((c === '_' || c === '^') && next && next !== ' ') {
      flush();
      let body;
      if (next === '(') {
        let depth = 0;
        let j = i + 1;
        for (; j < text.length; j++) {
          if (text[j] === '(') depth++;
          if (text[j] === ')' && --depth === 0) break;
        }
        body = text.slice(i + 2, j);
        i = j + 1;
      } else {
        const m = /^[\p{L}\p{N}]+/u.exec(text.slice(i + 1));
        body = m ? m[0] : next;
        i += 1 + body.length;
      }
      runs.push({ t: body, kind: c === '_' ? 'sub' : 'sup' });
    } else {
      buf += c;
      i++;
    }
  }
  flush();
  return runs;
}
