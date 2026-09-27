// 画笔组件。它们不保存任何状态：给定 props，就画出同一幅图。
import { hash, partial, quad, resample, ring, strokeOutline, wobble, polyPath, scriptRuns } from './brush.js';
import { C, F } from './theme.js';

export function Stroke({ pts, color = C.ink, width = 6, seed, progress = 1, opacity = 1, amp = 2 }) {
  if (progress <= 0 || opacity <= 0) return null;
  const s = seed ?? hash(pts[0]?.join());
  const line = wobble(resample(pts, 6), { seed: s, amp });
  return <path d={strokeOutline(partial(line, progress), { width, seed: s })} fill={color} opacity={opacity} />;
}

export function Arrow({ from, to, bend = 0, color = C.ink, width = 5, progress = 1, opacity = 1, head = 18, gap = 0, seed, label, labelOffset = 26, labelColor, size = 30 }) {
  if (progress <= 0 || opacity <= 0) return null;
  const pts = trim(quad(from, to, bend), gap);
  const drawn = partial(pts, progress);
  const tip = drawn.at(-1);
  const prev = drawn.at(-Math.min(4, drawn.length)) ?? tip;
  const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  const wing = a => [tip[0] - head * Math.cos(ang + a), tip[1] - head * Math.sin(ang + a)];
  const mid = pts[Math.floor(pts.length / 2)];
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const len = Math.hypot(dx, dy) || 1;
  const side = bend >= 0 ? 1 : -1;
  const lp = [mid[0] + (dy / len) * labelOffset * side, mid[1] - (dx / len) * labelOffset * side];
  return (
    <g opacity={opacity}>
      <Stroke pts={pts} color={color} width={width} progress={progress} seed={seed ?? hash(`${from}${to}${bend}`)} />
      {progress > 0.92 && <path d={polyPath([tip, wing(0.42), wing(-0.42)])} fill={color} />}
      {label && progress > 0.5 && (
        <Label x={lp[0]} y={lp[1] + size * 0.35} size={size} color={labelColor ?? color} opacity={(progress - 0.5) * 2} font="math" italic>
          {label}
        </Label>
      )}
    </g>
  );
}

// 从两端各裁掉 gap 像素，让箭头不压在圆点上。
function trim(pts, gap) {
  if (!gap) return pts;
  const keep = p => Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) > gap && Math.hypot(p[0] - pts.at(-1)[0], p[1] - pts.at(-1)[1]) > gap;
  const inner = pts.filter(keep);
  return inner.length > 1 ? inner : pts;
}

export function Loop({ at, r = 46, angle = -Math.PI / 2, color = C.ink, width = 4, progress = 1, opacity = 1, label, size = 28 }) {
  const c = [at[0] + Math.cos(angle) * r * 1.25, at[1] + Math.sin(angle) * r * 1.25];
  const pts = ring(c, r, { start: angle + Math.PI + 0.55, steps: 48, seed: hash(`${at}${angle}`) }).slice(0, 42);
  const drawn = partial(pts, progress);
  const tip = drawn.at(-1);
  const prev = drawn.at(-3) ?? tip;
  const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  const wing = a => [tip[0] - 14 * Math.cos(ang + a), tip[1] - 14 * Math.sin(ang + a)];
  if (progress <= 0 || opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <Stroke pts={pts} color={color} width={width} progress={progress} />
      {progress > 0.92 && <path d={polyPath([tip, wing(0.45), wing(-0.45)])} fill={color} />}
      {label && (
        <Label x={at[0] + Math.cos(angle) * r * 2.9} y={at[1] + Math.sin(angle) * r * 2.9 + size * 0.35} size={size} color={color} font="math" italic opacity={progress}>
          {label}
        </Label>
      )}
    </g>
  );
}

export function Disc({ c, r, color = C.ink, opacity = 1, seed, irregular = 0.05, scale = 1 }) {
  if (opacity <= 0 || scale <= 0) return null;
  return <path d={polyPath(ring(c, r * scale, { seed: seed ?? hash(`${c}${r}`), irregular }))} fill={color} opacity={opacity} />;
}

export function Circle({ c, r, color = C.ink, width = 4, progress = 1, opacity = 1, seed }) {
  return <Stroke pts={ring(c, r, { seed: seed ?? hash(`${c}${r}o`), irregular: 0.03 })} color={color} width={width} progress={progress} opacity={opacity} amp={1.2} />;
}

const FAMILY = { serif: F.serif, math: F.math, mono: F.mono };

export function Label({ x, y, size = 36, color = C.ink, anchor = 'middle', font = 'serif', weight = 400, italic = false, opacity = 1, children }) {
  if (opacity <= 0) return null;
  const flat = [children].flat().every(c => typeof c === 'string' || typeof c === 'number') ? [children].flat().join('') : null;
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontFamily={FAMILY[font]} fontWeight={weight} fontStyle={italic ? 'italic' : 'normal'} opacity={Math.min(1, opacity)}>
      {font === 'math' && flat ? <Scripts text={flat} size={size} /> : children}
    </text>
  );
}

// 数学标签里的 x_i、Σ_(d|n)、e^(2πi) 画成真正的上下标。
const SHIFT = { sub: 0.28, sup: -0.42 };
function Scripts({ text, size }) {
  let level = 0;
  return scriptRuns(text).map(({ t, kind }, i) => {
    const target = kind ? SHIFT[kind] * size : 0;
    const dy = target - level;
    level = target;
    return (
      <tspan key={i} dy={dy || undefined} fontSize={kind ? size * 0.68 : undefined}>
        {t}
      </tspan>
    );
  });
}

// 等宽代码块：lines 是字符串数组，逐行淡入。
export function Code({ x, y, lines, size = 28, color = C.ink, progress = 1, opacity = 1, lineHeight = 1.5, anchor = 'start' }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {lines.map((line, i) => (
        <Label key={i} x={x} y={y + i * size * lineHeight} size={size} color={color} font="mono" anchor={anchor} opacity={Math.min(1, progress * lines.length - i)}>
          {line}
        </Label>
      ))}
    </g>
  );
}

// 一张半透明的“纸片”，给叠加在画面上的公式或说明垫底。
export function Card({ x, y, w, h, opacity = 1, color = C.paper }) {
  if (opacity <= 0) return null;
  const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  return (
    <g opacity={opacity}>
      <path d={polyPath(wobble(resample(pts.concat([pts[0]]), 12), { seed: hash(`${x}${y}`), amp: 2.5 }))} fill={color} stroke={C.ink} strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
}
