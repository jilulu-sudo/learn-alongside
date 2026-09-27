import { Label, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg, lerp } from '../paint/ease.js';
import { softmaxH, tropicalPoly, DEMO_POLY } from '../math/tropical.js';
import { linePath, polyPath } from '../paint/brush.js';

const beats = [
  { id: 'lse', say: '热带世界是从哪儿来的？看一个你在 softmax 里见过的函数：h 乘以 log，里面是各项 e 的 v/h 次方之和。' },
  { id: 'shrink', say: '把温度 h 慢慢调低。', dur: 9 },
  { id: 'crystal', say: '曲线一点点变硬，最后冻成了上一幕的折线。log 里的加法变成了 max，乘法变成了加法。' },
  { id: 'maslov', say: '这叫 Maslov 去量子化。h 的角色像普朗克常数：h 趋于零，平滑的波动世界退化成棱角分明的经典世界。' },
  { id: 'painter', say: '作为画家，我喜欢这一刻：水彩干透，变成了木刻。' },
];

const X = x => 520 + (x + 2) * 123;
const Y = y => 820 - y * 58;
const XS = Array.from({ length: 131 }, (_, i) => -2 + i * 0.05);
const TERMS = x => DEMO_POLY.map(([c, k]) => c + k * x);
const curve = h => XS.map(x => [X(x), Y(softmaxH(h, TERMS(x)))]);
const LIMIT = XS.map(x => [X(x), Y(tropicalPoly(DEMO_POLY)(x))]);

// h 按对数刻度从 2 降到 0.02。
const hAt = k => Math.exp(lerp(Math.log(2), Math.log(0.02), k));

function Blob({ k, opacity }) {
  const n = 7;
  const R = 220;
  const c = [W / 2, 520];
  const pts = Array.from({ length: 180 }, (_, i) => {
    const th = (i / 180) * Math.PI * 2;
    const soft = R * (0.92 + 0.07 * Math.sin(3 * th + 1) + 0.05 * Math.sin(5 * th + 2));
    const local = ((th % ((2 * Math.PI) / n)) + (2 * Math.PI) / n) % ((2 * Math.PI) / n);
    const hard = (R * Math.cos(Math.PI / n)) / Math.cos(local - Math.PI / n);
    const r = lerp(soft, hard, k);
    return [c[0] + Math.cos(th) * r, c[1] + Math.sin(th) * r];
  });
  return (
    <g opacity={opacity}>
      <path d={polyPath(pts)} fill={k < 0.5 ? C.blue : C.ink} fillOpacity={lerp(0.45, 0.92, k)} />
      <Label x={c[0]} y={c[1] + R + 90} size={34} color={C.pencil}>水彩 → 木刻</Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const k = easeInOut(p.shrink);
  const h = hAt(k);
  const trail = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].filter(x => x < k);
  const plot = 1 - easeInOut(seg(p.painter, 0, 0.3));
  const freeze = easeOut(seg(p.crystal, 0, 0.5));

  return (
    <g>
      <g opacity={plot}>
        <Label x={W / 2} y={230} size={40} font="math" italic opacity={easeOut(p.lse)}>
          f_h(x) = h · log( e^(2/h) + e^((x+1)/h) + e^((2x−2)/h) )
        </Label>
        <line x1={X(-2)} y1={Y(0)} x2={X(4.5)} y2={Y(0)} stroke={C.pencil} strokeWidth={2} />
        <line x1={X(0)} y1={Y(-0.5)} x2={X(0)} y2={Y(8.5)} stroke={C.pencil} strokeWidth={2} />
        <path d={linePath(LIMIT)} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="4 10" opacity={0.6 * (1 - freeze)} />
        {trail.map(t => (
          <path key={t} d={linePath(curve(hAt(t)))} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.2} />
        ))}
        <path d={linePath(curve(h))} fill="none" stroke={C.blue} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.75 * (1 - freeze)} />
        <path d={linePath(LIMIT)} fill="none" stroke={C.ink} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={freeze} />

        <g opacity={easeOut(seg(p.shrink, 0, 0.1)) * (1 - freeze)}>
          <line x1={640} y1={300} x2={1280} y2={300} stroke={C.ink} strokeWidth={3} />
          <circle cx={lerp(640, 1280, k)} cy={300} r={14} fill={C.red} />
          <Label x={lerp(640, 1280, k)} y={278} size={28} font="mono">h = {h.toFixed(2)}</Label>
        </g>

        <g opacity={easeOut(seg(p.crystal, 0.3, 0.7))}>
          <Label x={1450} y={400} size={32} font="math" italic anchor="start">h·log(e^(a/h) + e^(b/h))</Label>
          <Label x={1450} y={450} size={32} font="math" italic anchor="start" color={C.red}>  → max(a, b) = a ⊕ b</Label>
          <Label x={1450} y={530} size={32} font="math" italic anchor="start">h·log(e^(a/h) · e^(b/h))</Label>
          <Label x={1450} y={580} size={32} font="math" italic anchor="start" color={C.red}>  = a + b = a ⊗ b</Label>
        </g>
      </g>

      <g opacity={inOut(seg(p.maslov, 0.1, 0.4), seg(p.painter, 0, 0.3))}>
        <Card x={140} y={300} w={520} h={220} />
        <Label x={400} y={380} size={34}>Maslov 去量子化</Label>
        <Label x={400} y={440} size={30} font="math" italic>h ↔ ħ，h → 0 ↔ 经典极限</Label>
        <Label x={400} y={490} size={26} color={C.pencil}>(ℝ₊, +, ×) ⟶ (ℝ, max, +)</Label>
      </g>

      <Blob k={easeInOut(seg(p.painter, 0.3, 0.9))} opacity={easeOut(seg(p.painter, 0.1, 0.4))} />
    </g>
  );
}

export default { beats, View };
