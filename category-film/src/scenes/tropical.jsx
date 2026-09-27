import { Label, Stroke, Disc, Card, Code } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';
import { SEMIRINGS, matpow, weightMatrix, adjacency, bestPath, tropicalPoly, dominant, DEMO_POLY } from '../math/tropical.js';

const beats = [
  { id: 'shops', say: '城里有五间画室，颜料要从 A 送到 E。路上的数字是分钟。' },
  { id: 'matmul', say: '你一定写过矩阵乘法：c_ij 等于 a_ik 乘 b_kj，再对 k 求和。' },
  { id: 'swap', say: '现在把“求和”换成“取最小”，把“乘”换成“加”。代码一个字不改，只换传进去的那对运算。' },
  { id: 'power', say: '把路程矩阵 D 自乘：D² 是最多走两段路的最短时间，D³ 是三段，D⁴……看 A 到 E 那一格。', dur: 13 },
  { id: 'fixed', say: '乘到不再变化，就得到全部最短路。Bellman-Ford、Floyd，都是热带世界里的线性代数。' },
  { id: 'nonlinear', say: '在普通算术里，min 是非线性的；在热带半环里，它就是加法。非线性问题，换一个半环，就成了线性问题。' },
  { id: 'poly', say: '热带多项式的图像是折线：max(2, x+1, 2x−2)。折点，是“哪一项说了算”发生交接的地方。' },
  { id: 'fp', say: '对你们来说：半环就是一个可以注入的依赖。同一个 fold，传 (+,×) 数走法，传 (∨,∧) 判可达，传 (min,+) 求最短路。' },
];

const NAMES = ['A', 'B', 'C', 'D', 'E'];
const POS = [[240, 480], [460, 300], [470, 660], [720, 430], [900, 680]];
const EDGES = [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2]];
const D = weightMatrix(5, EDGES);
const POWERS = [1, 2, 3, 4, 5].map(k => matpow(SEMIRINGS.minPlus, D, k));
const PATHS = [1, 2, 3, 4].map(k => bestPath(D, 0, 4, k));
const FIXED = POWERS[3].every((row, i) => row.every((v, j) => v === POWERS[4][i][j]));

const ADJ = adjacency(5, EDGES);
const COUNT2 = matpow(SEMIRINGS.counting, ADJ, 2);
const REACH = matpow(SEMIRINGS.boolean, adjacency(5, EDGES, true).map(r => r.map(Boolean)), 4);

const fmt = v => (v === Infinity ? '∞' : v === true ? '✓' : v === false ? '·' : String(v));

function Graph({ opacity, path, k }) {
  const onPath = (a, b) => path && path.some((v, i) => i && ((path[i - 1] === a && v === b) || (path[i - 1] === b && v === a)));
  return (
    <g opacity={opacity}>
      {EDGES.map(([a, b, w]) => {
        const hot = onPath(a, b);
        const mid = [(POS[a][0] + POS[b][0]) / 2, (POS[a][1] + POS[b][1]) / 2];
        return (
          <g key={`${a}${b}`}>
            <Stroke pts={[POS[a], POS[b]]} width={hot ? 12 : 5} color={hot ? C.red : C.ink} progress={k} seed={a * 7 + b} />
            <circle cx={mid[0]} cy={mid[1]} r={22} fill={C.paper} opacity={k} />
            <Label x={mid[0]} y={mid[1] + 10} size={28} font="mono" opacity={k}>{w}</Label>
          </g>
        );
      })}
      {POS.map((c, i) => (
        <g key={i}>
          <Disc c={c} r={36} color={C.ochre} scale={k} seed={i + 40} />
          <Label x={c[0]} y={c[1] + 12} size={34} color={C.paper} weight={700} opacity={k}>{NAMES[i]}</Label>
        </g>
      ))}
    </g>
  );
}

function Matrix({ x, y, M, prev, cell = 84, size = 32, opacity = 1, title, highlight }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      {title && <Label x={x + (cell * M.length) / 2} y={y - 50} size={30} font="math">{title}</Label>}
      {NAMES.map((n, i) => (
        <g key={n}>
          <Label x={x + i * cell + cell / 2} y={y - 12} size={size * 0.7} color={C.pencil}>{n}</Label>
          <Label x={x - 16} y={y + i * cell + cell / 2 + 9} size={size * 0.7} color={C.pencil} anchor="end">{n}</Label>
        </g>
      ))}
      {M.map((row, i) =>
        row.map((v, j) => {
          const changed = prev && prev[i][j] !== v;
          const hot = highlight && highlight[0] === i && highlight[1] === j;
          return (
            <g key={`${i}${j}`}>
              <rect x={x + j * cell + 2} y={y + i * cell + 2} width={cell - 4} height={cell - 4} fill={hot ? C.red : changed ? C.yellow : C.paper} fillOpacity={hot ? 0.3 : changed ? 0.55 : 1} stroke={C.pencil} />
              <Label x={x + j * cell + cell / 2} y={y + i * cell + cell / 2 + size * 0.35} size={size} font="mono">{fmt(v)}</Label>
            </g>
          );
        }),
      )}
    </g>
  );
}

function Formula({ swap, opacity }) {
  const tok = (x, a, b, color) => (
    <>
      <Label x={x} y={330} size={60} font="math" italic opacity={1 - swap}>{a}</Label>
      <Label x={x} y={330} size={60} font="math" italic color={color} opacity={swap}>{b}</Label>
    </>
  );
  return (
    <g opacity={opacity}>
      <Label x={1150} y={330} size={60} font="math" italic anchor="start">c_ij =</Label>
      {tok(1410, 'Σ_k', 'min_k', C.red)}
      <Label x={1560} y={330} size={60} font="math" italic>a_ik</Label>
      {tok(1660, '·', '+', C.red)}
      <Label x={1760} y={330} size={60} font="math" italic>b_kj</Label>
    </g>
  );
}

function Plot({ opacity, p }) {
  const X = x => 560 + (x + 2) * 114;
  const Y = y => 760 - y * 55;
  const xs = Array.from({ length: 71 }, (_, i) => -2 + i * 0.1);
  const f = tropicalPoly(DEMO_POLY);
  const dom = dominant(DEMO_POLY);
  const hue = [C.blue, C.green, C.red];
  const draw = easeInOut(seg(p, 0.1, 0.7));
  return (
    <g opacity={opacity}>
      <clipPath id="tropical-plot">
        <rect x={X(-2)} y={Y(8.6)} width={X(5) - X(-2)} height={Y(-1) - Y(8.6)} />
      </clipPath>
      <line x1={X(-2)} y1={Y(0)} x2={X(5)} y2={Y(0)} stroke={C.pencil} strokeWidth={2} />
      <line x1={X(0)} y1={Y(-1)} x2={X(0)} y2={Y(8.5)} stroke={C.pencil} strokeWidth={2} />
      {DEMO_POLY.map(([c, k], i) => (
        <line key={i} clipPath="url(#tropical-plot)" x1={X(-2)} y1={Y(c - 2 * k)} x2={X(5)} y2={Y(c + 5 * k)} stroke={hue[i]} strokeWidth={2.5} strokeDasharray="8 8" opacity={0.7} />
      ))}
      {xs.slice(1).map((x, i) => (
        <line key={i} x1={X(xs[i])} y1={Y(f(xs[i]))} x2={X(x)} y2={Y(f(x))} stroke={hue[dom(x - 0.05)]} strokeWidth={10} strokeLinecap="round" opacity={i / xs.length < draw ? 1 : 0} />
      ))}
      {[1, 3].map(x => <circle key={x} cx={X(x)} cy={Y(f(x))} r={12} fill={C.ink} opacity={seg(p, 0.7, 0.9)} />)}
      <Label x={W / 2} y={250} size={40} font="math" italic>max(2, x+1, 2x−2) = 2 ⊕ 1⊗x ⊕ (−2)⊗x²</Label>
      <Label x={X(-1.2)} y={Y(2) - 20} size={30} font="math" italic color={hue[0]}>2</Label>
      <Label x={X(2)} y={Y(3) - 24} size={30} font="math" italic color={hue[1]}>x+1</Label>
      <Label x={X(4.1)} y={Y(6.2) - 10} size={30} font="math" italic color={hue[2]} anchor="end">2x−2</Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const m = Math.min(4, Math.floor(seg(p.power, 0.05, 0.95) * 4) + 1);
  const shownPower = p.power > 0 ? m : 1;
  const graphOn = inOut(p.shops, seg(p.nonlinear, 0, 0.3));
  const powerOn = inOut(seg(p.power, 0, 0.15), seg(p.nonlinear, 0, 0.3));
  const best = PATHS[shownPower - 1];

  return (
    <g>
      <Graph opacity={graphOn} k={easeOut(seg(p.shops, 0, 0.6))} path={p.power > 0 ? best.path : null} />
      <Formula swap={easeInOut(seg(p.swap, 0.1, 0.4))} opacity={inOut(p.matmul, seg(p.power, 0, 0.15))} />
      <Code
        x={1060}
        y={450}
        size={24}
        opacity={inOut(seg(p.swap, 0.3, 0.6), seg(p.power, 0, 0.15))}
        progress={easeOut(seg(p.swap, 0.3, 0.9))}
        lines={[
          'const mul = S => (A, B) =>',
          '  A.map(row => B[0].map((_, j) =>',
          '    row.reduce((acc, a, k) =>',
          '      S.add(acc, S.mul(a, B[k][j])), S.zero)))',
          '',
          'const tropical = {',
          '  add: Math.min, mul: (a, b) => a + b,',
          '  zero: Infinity, one: 0 }',
        ]}
      />
      <Matrix x={1220} y={290} M={POWERS[shownPower - 1]} prev={shownPower > 1 ? POWERS[shownPower - 2] : null} opacity={powerOn} title={`D${['', '²', '³', '⁴'][shownPower - 1]}（min, +）`} highlight={[0, 4]} />
      <Label x={560} y={850} size={32} opacity={powerOn}>
        A → E，最多 {shownPower} 段：{fmt(best.cost)} 分钟（{best.path.map(i => NAMES[i]).join('→')}）
      </Label>
      <Label x={1430} y={790} size={30} color={FIXED ? C.green : C.red} opacity={powerOn * easeOut(p.fixed)}>
        D⁵ = D⁴：{FIXED ? '到了不动点' : '还在变'}
      </Label>

      <g opacity={inOut(seg(p.nonlinear, 0.1, 0.4), seg(p.poly, 0, 0.2))}>
        <Card x={360} y={330} w={1200} h={330} />
        <Label x={W / 2} y={430} size={40}>普通世界 (ℝ, +, ×)：min(a, b) 是非线性的</Label>
        <Label x={W / 2} y={520} size={40} color={C.ochre}>热带世界 (ℝ∪{'{'}∞{'}'}, min, +)：a ⊕ b = min(a, b)</Label>
        <Label x={W / 2} y={600} size={30} color={C.pencil}>加法幂等：a ⊕ a = a——没有减法，所以也没有 μ</Label>
      </g>

      <Plot opacity={inOut(seg(p.poly, 0, 0.2), seg(p.fp, 0, 0.2))} p={p.poly} />

      <g opacity={easeOut(seg(p.fp, 0.1, 0.4))}>
        <Matrix x={180} y={420} M={COUNT2} cell={60} size={24} title={`${SEMIRINGS.counting.name} A²：两步走法数`} />
        <Matrix x={770} y={420} M={REACH} cell={60} size={24} title={`${SEMIRINGS.boolean.name} 可达`} />
        <Matrix x={1360} y={420} M={POWERS[3]} cell={60} size={24} title={`${SEMIRINGS.minPlus.name} 最短时间`} />
        <Label x={W / 2} y={260} size={32} font="mono">matmul(S) —— 同一段代码，三种 S</Label>
      </g>
    </g>
  );
}

export default { beats, View };
