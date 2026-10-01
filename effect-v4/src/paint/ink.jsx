// 画笔：只有线、点、字、印。颜色全部是 CSS 变量，深浅两套主题由样式表切换。
import { lerp, textWidth } from './ease.js';

export const C = {
  paper: 'var(--paper)',
  ink: 'var(--ink)',
  pencil: 'var(--pencil)',
  faint: 'var(--faint)',
  rule: 'var(--rule)',
  a: 'var(--a)',
  e: 'var(--e)',
  r: 'var(--r)',
  aSoft: 'var(--a-soft)',
  eSoft: 'var(--e-soft)',
  rSoft: 'var(--r-soft)',
};
export const F = { serif: 'var(--serif)', mono: 'var(--mono)' };

const n = x => Math.round(x * 100) / 100;

export function Line({ x1, y1, x2, y2, p = 1, color = C.ink, w = 3, dash, opacity = 1 }) {
  if (p <= 0 || opacity <= 0) return null;
  return (
    <line
      x1={n(x1)}
      y1={n(y1)}
      x2={n(lerp(x1, x2, Math.min(1, p)))}
      y2={n(lerp(y1, y2, Math.min(1, p)))}
      style={{ stroke: color, strokeWidth: w, strokeLinecap: 'round', strokeDasharray: dash, opacity }}
    />
  );
}

// 曲线按进度 p 画出来：pathLength 归一化为 1，用虚线长度控制画到哪里。
export function Path({ d, p = 1, color = C.ink, w = 3, dash, fill = 'none', opacity = 1 }) {
  if (p <= 0 || opacity <= 0) return null;
  const partial = p < 1 && !dash;
  return (
    <path
      d={d}
      pathLength={partial ? 1 : undefined}
      style={{
        fill,
        stroke: color,
        strokeWidth: w,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: partial ? `${n(p)} 1` : dash,
        opacity: dash && p < 1 ? opacity * p : opacity,
      }}
    />
  );
}

export function Dot({ x, y, r = 9, color = C.ink, hollow = false, w = 3, opacity = 1 }) {
  if (opacity <= 0 || r <= 0) return null;
  return (
    <circle
      cx={n(x)}
      cy={n(y)}
      r={n(r)}
      style={{ fill: hollow ? C.paper : color, stroke: color, strokeWidth: hollow ? w : 0, opacity }}
    />
  );
}

export function Text({ x, y, size = 28, color = C.ink, anchor = 'middle', weight = 400, mono = false, opacity = 1, children, spacing }) {
  if (opacity <= 0) return null;
  return (
    <text
      x={n(x)}
      y={n(y)}
      textAnchor={anchor}
      style={{ fill: color, fontSize: size, fontFamily: mono ? F.mono : F.serif, fontWeight: weight, opacity, letterSpacing: spacing }}
    >
      {children}
    </text>
  );
}

// 印章：章节的记号。朱红方块，纸色的字。
export function Seal({ x, y, size = 52, char, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={size} height={size} rx={4} style={{ fill: C.e }} />
      <Text x={x + size / 2} y={y + size * 0.72} size={size * 0.62} color={C.paper} weight={700}>
        {char}
      </Text>
    </g>
  );
}

// 小标签：圆角框里一个名字。
export function Tag({ x, y, label, color = C.ink, size = 24, opacity = 1, anchor = 'middle', fill = C.paper, mono = true, strike = 0 }) {
  if (opacity <= 0) return null;
  const w = textWidth(label, size, mono) + size;
  const h = size * 1.5;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g opacity={opacity}>
      <rect x={n(left)} y={n(y - h / 2)} width={n(w)} height={n(h)} rx={h / 2} style={{ fill, stroke: color, strokeWidth: 2 }} />
      <Text x={left + w / 2} y={y + size * 0.35} size={size} color={color} mono={mono}>
        {label}
      </Text>
      {strike > 0 && <Line x1={left + 6} y1={y} x2={left + w - 6} y2={y} p={strike} color={color} w={2.5} />}
    </g>
  );
}

export function Cross({ x, y, size = 12, color = C.e, w = 3, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <Line x1={x - size} y1={y - size} x2={x + size} y2={y + size} color={color} w={w} />
      <Line x1={x - size} y1={y + size} x2={x + size} y2={y - size} color={color} w={w} />
    </g>
  );
}

// 中断：线被剪断的地方，一道斜杠。
export function Cut({ x, y, size = 16, color = C.pencil, w = 3, opacity = 1 }) {
  return <Line x1={x - size * 0.5} y1={y + size} x2={x + size * 0.5} y2={y - size} color={color} w={w} opacity={opacity} />;
}

// 类型签名 Effect<A, E, R>：三个参数各有自己的颜色。show 控制每一段的不透明度。
export function Sig({ x, y, a, e, r, size = 34, anchor = 'middle', show = {}, opacity = 1, prefix = 'Effect' }) {
  if (opacity <= 0) return null;
  const o = k => show[k] ?? 1;
  return (
    <text x={x} y={y} textAnchor={anchor} style={{ fontFamily: F.mono, fontSize: size, opacity, fill: C.ink }}>
      <tspan>{prefix}&lt;</tspan>
      <tspan style={{ fill: C.a, opacity: o('a') }}>{a}</tspan>
      <tspan style={{ opacity: Math.min(o('a'), o('e')) }}>, </tspan>
      <tspan style={{ fill: C.e, opacity: o('e') }}>{e}</tspan>
      <tspan style={{ opacity: Math.min(o('e'), o('r')) }}>, </tspan>
      <tspan style={{ fill: C.r, opacity: o('r') }}>{r}</tspan>
      <tspan>&gt;</tspan>
    </text>
  );
}

// 时间轴：从 x0 到 x1 表示 0..ms 毫秒，每 every 毫秒一个刻度。
export function Axis({ x0, x1, y, ms, every, p = 1, label = ms => `${ms}`, opacity = 1 }) {
  const ticks = [];
  for (let t = 0; t <= ms; t += every) ticks.push(t);
  const xOf = t => x0 + ((x1 - x0) * t) / ms;
  return (
    <g opacity={opacity}>
      <Line x1={x0} y1={y} x2={x1} y2={y} p={p} color={C.pencil} w={2} />
      {ticks.map(t => (
        <g key={t} opacity={xOf(t) <= lerp(x0, x1, p) + 0.5 ? 1 : 0}>
          <Line x1={xOf(t)} y1={y - 6} x2={xOf(t)} y2={y + 6} color={C.pencil} w={2} />
          <Text x={xOf(t)} y={y + 36} size={20} color={C.pencil} mono>
            {label(t)}
          </Text>
        </g>
      ))}
    </g>
  );
}
