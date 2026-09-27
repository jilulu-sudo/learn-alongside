import { Label, Stroke, Disc, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg, lerpPt } from '../paint/ease.js';
import { scan, divisors, hasseEdges, mobius, totient, mobiusInvert } from '../math/incidence.js';

const beats = [
  { id: 'ledger', say: '画廊每天记下当天新来的访客：3，1，4，1，5，9，2，6。' },
  { id: 'zeta', say: '老板只想看累计人数：第 n 天的柱子，把之前每一天都摞上去。这是 scan，数学家叫它 ζ 变换。' },
  { id: 'mu', say: '反过来，从累计数恢复每天的人数：相邻两根相减。这是 ζ 的逆，叫 Möbius 变换，记作 μ。' },
  { id: 'poset', say: '“之前”不一定是一条线。换成整除：d 排在 n 之前，当且仅当 d 整除 n。12 的因子排成一张网。' },
  { id: 'sum', say: '让每个因子带一个值，比如欧拉函数 φ。沿着网往上累加，流进 12 的总和恰好是 12。' },
  { id: 'invert', say: '反过来求 φ(12)，不再是简单相减，而是每个因子带一个符号 μ：加一、减一，或者零。' },
  { id: 'incl', say: '在“子集”这张网上，同样的反演就是容斥原理：单个加，两两减，三个再加回来。' },
  { id: 'fp', say: '所以 μ 是 diff 的推广，ζ 是 scan 的推广：任何偏序都有自己的一对。条件是值得住在一个能做减法的交换群里。' },
];

const G = [3, 1, 4, 1, 5, 9, 2, 6];
const F = scan(G);
const HUES = [C.red, C.yellow, C.blue, C.green, C.violet, C.ochre, C.red, C.blue];
const UNIT = 13;
const BASE = 780;
const barX = i => 210 + i * 90;

function Bars({ p, opacity }) {
  const zeta = easeInOut(seg(p.zeta, 0.1, 0.8));
  const mu = easeInOut(seg(p.mu, 0.15, 0.75));
  return (
    <g opacity={opacity}>
      <line x1={160} y1={BASE} x2={930} y2={BASE} stroke={C.ink} strokeWidth={3} />
      {G.map((_, i) => {
        let y = BASE;
        const segs = [];
        for (let j = 0; j <= i; j++) {
          const grow = j === i ? easeOut(seg(p.ledger, i * 0.08, 0.3 + i * 0.08)) : seg(zeta, j / 9, j / 9 + 0.3) * (1 - mu);
          const h = G[j] * UNIT * grow;
          if (h > 0.2) segs.push(<rect key={j} x={barX(i) - 30} y={y - h} width={60} height={h} fill={HUES[j]} opacity={0.85} />);
          y -= h;
        }
        const shown = Math.round((BASE - y) / UNIT);
        return (
          <g key={i}>
            {segs}
            <Label x={barX(i)} y={y - 14} size={26} font="mono" opacity={easeOut(seg(p.ledger, i * 0.08, 0.3 + i * 0.08))}>
              {shown}
            </Label>
            <Label x={barX(i)} y={BASE + 36} size={24} color={C.pencil}>
              {i + 1}
            </Label>
          </g>
        );
      })}
      <Label x={545} y={210} size={34} font="math" italic opacity={inOut(seg(p.zeta, 0.2, 0.5), seg(p.mu, 0, 0.15))}>
        f = scan(+)(g) = ζ g
      </Label>
      <Label x={545} y={210} size={34} font="math" italic opacity={easeOut(seg(p.mu, 0.15, 0.35))}>
        g(n) = f(n) − f(n−1) = (μ f)(n)
      </Label>
    </g>
  );
}

const N = 12;
const POS = { 1: [1440, 740], 2: [1290, 580], 3: [1590, 580], 4: [1160, 420], 6: [1440, 420], 12: [1300, 260] };
const EDGES = hasseEdges(N);
const PHI_TERMS = divisors(N).map(d => ({ d, phi: totient(d), mu: mobius(N / d) }));
const PHI_SUM = PHI_TERMS.reduce((s, t) => s + t.phi, 0);
const INVERTED = mobiusInvert(n => n)(N);
const MU_EXPR = [...PHI_TERMS]
  .reverse()
  .filter(t => t.mu !== 0)
  .map((t, i) => (i === 0 ? `${t.mu * t.d}` : `${t.mu > 0 ? '+' : '−'} ${t.d}`))
  .join(' ');

function Hasse({ p, opacity, clock }) {
  const draw = easeInOut(seg(p.poset, 0.2, 0.8));
  const phiIn = easeOut(seg(p.sum, 0, 0.3));
  const muIn = easeOut(seg(p.invert, 0.1, 0.5));
  const flow = (clock.since('sum') % 2.4) / 2.4;
  return (
    <g opacity={opacity}>
      {EDGES.map(([a, b]) => (
        <Stroke key={`${a}-${b}`} pts={[POS[a], POS[b]]} width={5} color={C.ink} progress={draw} seed={a * 31 + b} />
      ))}
      {p.sum > 0 &&
        p.invert === 0 &&
        EDGES.map(([a, b]) => <circle key={`f${a}-${b}`} cx={lerpPt(POS[a], POS[b], flow)[0]} cy={lerpPt(POS[a], POS[b], flow)[1]} r={8} fill={C.yellow} opacity={phiIn} />)}
      {PHI_TERMS.map(({ d, phi, mu }) => (
        <g key={d}>
          <Disc c={POS[d]} r={40} color={C.blue} scale={easeOut(seg(p.poset, 0, 0.5))} seed={d} />
          <Label x={POS[d][0]} y={POS[d][1] + 12} size={34} color={C.paper} weight={700} opacity={seg(p.poset, 0.3, 0.6)}>
            {d}
          </Label>
          <Label x={POS[d][0] + 56} y={POS[d][1] - 18} size={26} anchor="start" font="math" italic opacity={phiIn}>
            φ={phi}
          </Label>
          <Label x={POS[d][0] + 56} y={POS[d][1] + 22} size={28} anchor="start" font="mono" weight={700} color={mu > 0 ? C.green : mu < 0 ? C.red : C.pencil} opacity={muIn}>
            μ={mu > 0 ? '+1' : mu < 0 ? '−1' : '0'}
          </Label>
        </g>
      ))}
    </g>
  );
}

function Venn({ opacity }) {
  const cs = [[470, 420, C.red], [610, 420, C.yellow], [540, 540, C.blue]];
  const signs = [['+', 380, 370], ['+', 700, 370], ['+', 540, 650], ['−', 540, 360], ['−', 450, 530], ['−', 630, 530], ['+', 540, 460]];
  return (
    <g opacity={opacity}>
      {cs.map(([x, y, col], i) => <circle key={i} cx={x} cy={y} r={150} fill={col} fillOpacity={0.35} stroke={C.ink} strokeWidth={3} />)}
      {signs.map(([s, x, y], i) => (
        <Label key={i} x={x} y={y + 14} size={44} weight={700} color={s === '+' ? C.green : C.red}>
          {s}
        </Label>
      ))}
      <Label x={540} y={800} size={30} font="math" italic>
        μ(S, T) = (−1)^(|T∖S|)
      </Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const bars = 1 - easeInOut(seg(p.poset, 0, 0.3));
  const hasse = easeOut(p.poset) * (1 - 0.75 * easeInOut(seg(p.incl, 0, 0.3))) * (1 - easeInOut(seg(p.fp, 0, 0.3)));
  const left = (a, b) => inOut(a, b);

  return (
    <g>
      <Bars p={p} opacity={bars} />
      <Hasse p={p} opacity={hasse} clock={clock} />

      <g opacity={left(seg(p.poset, 0.3, 0.7), seg(p.incl, 0, 0.3))}>
        <Label x={200} y={300} size={44} anchor="start" font="math" italic>d → n ⇔ d | n</Label>
        <Label x={200} y={360} size={30} anchor="start" color={C.pencil}>“之前”换成“整除”</Label>
        <Label x={200} y={470} size={40} anchor="start" font="math" italic opacity={easeOut(p.sum)}>f(n) = Σ_(d|n) g(d)</Label>
        <Label x={200} y={530} size={32} anchor="start" font="mono" opacity={easeOut(seg(p.sum, 0.4, 0.8))}>
          Σ φ(d) = {PHI_TERMS.map(t => t.phi).join('+')} = {PHI_SUM}
        </Label>
        <Label x={200} y={640} size={40} anchor="start" font="math" italic opacity={easeOut(p.invert)}>g(n) = Σ_(d|n) μ(n/d) f(d)</Label>
        <Label x={200} y={700} size={32} anchor="start" font="mono" opacity={easeOut(seg(p.invert, 0.4, 0.8))}>
          φ(12) = {MU_EXPR} = {INVERTED}
        </Label>
      </g>

      <Venn opacity={inOut(seg(p.incl, 0.1, 0.5), seg(p.fp, 0, 0.3))} />

      <g opacity={easeOut(seg(p.fp, 0.2, 0.6))}>
        <Card x={360} y={300} w={1200} h={420} />
        <Label x={W / 2} y={400} size={40} font="math">scan ⟷ ζ　　diff ⟷ μ　　μ ∗ ζ = δ</Label>
        <Label x={W / 2} y={490} size={34}>链 → 整除格 → 子集格 → 任意（局部有限的）偏序</Label>
        <Label x={W / 2} y={580} size={30} color={C.pencil}>
          ζ 只需要加法（交换幺半群）；μ 还需要减法（交换群）
        </Label>
        <Label x={W / 2} y={660} size={30} color={C.blue} opacity={clock.kept('fourier') ? 1 : 0}>
          下一枝：把偏序换成群，把 μ 换成 Fourier
        </Label>
      </g>
    </g>
  );
}

export default { beats, View };
