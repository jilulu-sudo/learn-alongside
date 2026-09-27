import { Label, Stroke, Disc, Card, Arrow } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';
import { nimSum, playNim, grundyTable } from '../math/games.js';

const beats = [
  { id: 'jars', say: '画室里三只罐子，分别插着 3、4、5 支画笔。两个学生轮流，每次从一只罐子里拿走任意多支。拿走最后一支的人赢。' },
  { id: 'bits', say: '先手能赢吗？把每罐的数写成二进制，按位对齐。' },
  { id: 'xor', say: '每一列数一数 1 的个数，奇数记 1，偶数记 0。这就是异或：3 ⊕ 4 ⊕ 5 = 2。' },
  { id: 'rule', say: '规则只有一句：异或不为零，先手必胜；为零，先手必败。必胜的走法，就是每次把异或拨回零。' },
  { id: 'play', say: '看一局。红方每一步都把异或拨回零；蓝方怎么走，都只能把它拨离零。', dur: 16 },
  { id: 'sum', say: '关键在于：三罐画笔是三个小博弈的“和”。博弈可以相加，而 Nim 的加法就是异或。' },
  { id: 'sg', say: 'Sprague–Grundy 定理说：任何公平博弈都等价于一罐 Nim。罐子的大小用 mex 算：后继里没出现的最小自然数。' },
  { id: 'link-fourier', say: '异或是 (ℤ/2)ⁿ 上的加法，它也有自己的 Fourier 变换，叫 Walsh–Hadamard：特征标只取 +1 和 −1。', needs: ['fourier'] },
  { id: 'link-tropical', say: '而“我要最大、你要最小”的 minimax，正是 (max, min) 半环上的同一个 fold——热带的影子又回来了。' },
];

const START = [3, 4, 5];
const GAME = playNim(START);
const JAR_X = [340, 600, 860];
const GRUNDY = grundyTable(9, [1, 2]);

function Jar({ x, count, leaving = 0, fade = 0, opacity }) {
  const total = count + leaving;
  const sticks = Array.from({ length: total }, (_, i) => {
    const out = i >= count;
    const dx = (i - (total - 1) / 2) * 24;
    const lift = out ? fade * 160 : 0;
    const o = out ? 1 - fade : 1;
    return (
      <g key={i} opacity={o}>
        <Stroke pts={[[x + dx * 0.6, 760 - lift], [x + dx, 420 - lift]]} width={7} color={C.ochre} seed={i * 13 + x} />
        <Disc c={[x + dx, 410 - lift]} r={11} color={[C.red, C.blue, C.yellow, C.green, C.violet][i % 5]} seed={i + x} />
      </g>
    );
  });
  return (
    <g opacity={opacity}>
      {sticks}
      <path d={`M${x - 85},560 L${x - 70},800 L${x + 70},800 L${x + 85},560`} fill={C.green} fillOpacity={0.35} stroke={C.ink} strokeWidth={4} />
      <Label x={x} y={850} size={36} font="mono" weight={700}>{count}</Label>
    </g>
  );
}

const BIT_X = [1370, 1470, 1570];
const bits = n => [4, 2, 1].map(b => (n & b ? 1 : 0));

function Table({ heaps, p, opacity }) {
  const s = nimSum(heaps);
  return (
    <g opacity={opacity}>
      {[4, 2, 1].map((b, i) => (
        <Label key={b} x={BIT_X[i]} y={300} size={26} color={C.pencil}>{b}</Label>
      ))}
      {heaps.map((h, r) => (
        <g key={r} opacity={easeOut(seg(p.bits, r * 0.2, 0.4 + r * 0.2))}>
          <Label x={1220} y={380 + r * 80} size={40} font="mono">{h}</Label>
          {bits(h).map((v, i) => (
            <Label key={i} x={BIT_X[i]} y={380 + r * 80} size={44} font="mono" color={v ? C.ink : C.pencil}>{v}</Label>
          ))}
        </g>
      ))}
      <g opacity={easeOut(p.xor)}>
        <line x1={1170} y1={590} x2={1640} y2={590} stroke={C.ink} strokeWidth={3} />
        <Label x={1220} y={650} size={40} font="mono" color={s ? C.red : C.green} weight={700}>⊕ {s}</Label>
        {bits(s).map((v, i) => (
          <Label key={i} x={BIT_X[i]} y={650} size={44} font="mono" weight={700} color={s ? C.red : C.green}>{v}</Label>
        ))}
        <Label x={1405} y={730} size={30} color={s ? C.red : C.green}>{s ? '先走的人必胜' : '先走的人必败'}</Label>
      </g>
    </g>
  );
}

function SubtractionGame({ p, opacity }) {
  const shown = Math.floor(seg(p, 0.15, 0.95) * GRUNDY.length);
  const x = n => 260 + n * 150;
  return (
    <g opacity={opacity}>
      <Label x={W / 2} y={280} size={34}>另一个游戏：每次拿走 1 或 2 支。g(n) = mex{'{'} g(n−1), g(n−2) {'}'}</Label>
      {GRUNDY.map((g, n) => (
        <g key={n}>
          {n >= 1 && <Arrow from={[x(n), 520]} to={[x(n - 1), 520]} bend={-40} gap={36} width={3} head={12} color={C.pencil} opacity={easeOut(seg(p, 0, 0.2))} />}
          {n >= 2 && <Arrow from={[x(n), 520]} to={[x(n - 2), 520]} bend={90} gap={36} width={3} head={12} color={C.pencil} opacity={easeOut(seg(p, 0, 0.2))} />}
          <Disc c={[x(n), 520]} r={34} color={n < shown ? (g === 0 ? C.ink : C.green) : C.pencil} seed={n + 60} />
          <Label x={x(n)} y={532} size={30} color={C.paper} weight={700}>{n}</Label>
          <Label x={x(n)} y={450} size={36} font="mono" weight={700} color={g === 0 ? C.ink : C.green} opacity={n < shown ? 1 : 0}>
            {g}
          </Label>
        </g>
      ))}
      <Label x={W / 2} y={720} size={30} color={C.pencil} opacity={seg(p, 0.8, 1)}>
        g = 0 的局面（黑点）先走必败；这个游戏等价于一罐大小为 g(n) 的 Nim
      </Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const q = seg(p.play, 0.04, 0.96) * GAME.log.length;
  const done = Math.min(GAME.log.length, Math.floor(q));
  const move = GAME.log[done];
  const f = done < GAME.log.length ? easeInOut(q - done) : 0;
  const heaps = GAME.states[done];
  const scene = 1 - easeInOut(seg(p.sum, 0, 0.3));
  const last = GAME.log[done - 1];

  return (
    <g>
      <g opacity={scene}>
        {heaps.map((h, i) => {
          const leaving = p.play > 0 && move && move.heap === i ? move.taken : 0;
          return <Jar key={i} x={JAR_X[i]} count={h - leaving} leaving={leaving} fade={f} opacity={easeOut(seg(p.jars, i * 0.15, 0.4 + i * 0.15))} />;
        })}
        <Table heaps={heaps} p={p} opacity={easeOut(p.bits)} />
        {p.play > 0 && last && (
          <Label x={600} y={320} size={30} color={last.player === 'red' ? C.red : C.blue} opacity={1}>
            {last.player === 'red' ? '红方' : '蓝方'}：第 {last.heap + 1} 罐拿走 {last.taken} 支{done === GAME.log.length ? `，${GAME.winner === 'red' ? '红方' : '蓝方'}拿走最后一支，赢` : ''}
          </Label>
        )}
      </g>

      <g opacity={inOut(seg(p.rule, 0.1, 0.4), seg(p.play, 0, 0.1))}>
        <Card x={1080} y={760} w={660} h={110} />
        <Label x={1410} y={830} size={32}>必胜走法：把 ⊕ 拨回 0</Label>
      </g>

      <g opacity={inOut(seg(p.sum, 0.2, 0.5), seg(p.sg, 0, 0.2))}>
        <Label x={W / 2} y={360} size={56} font="math" italic>G = ∗3 + ∗4 + ∗5 = ∗(3 ⊕ 4 ⊕ 5) = ∗2</Label>
        <Label x={W / 2} y={470} size={40} font="math" italic>∗a + ∗b = ∗(a ⊕ b)</Label>
        <Label x={W / 2} y={570} size={34} color={C.pencil}>G + G = 0：后手照抄先手的每一步，必胜</Label>
        <Label x={W / 2} y={650} size={34} color={C.green}>博弈在“和”下构成一个交换群，每个 Nim 值都是自己的逆</Label>
      </g>

      <SubtractionGame p={p.sg} opacity={inOut(seg(p.sg, 0, 0.15), seg(clock.has('link-fourier') ? p['link-fourier'] : p['link-tropical'], 0, 0.2))} />

      <g opacity={easeOut(seg(p['link-fourier'], 0, 0.3))}>
        <Card x={180} y={300} w={720} h={360} />
        <Label x={540} y={380} size={36} color={C.blue}>异或 → Fourier</Label>
        <Label x={540} y={460} size={30} font="math" italic>χ_s(x) = (−1)^(s·x)</Label>
        <Label x={540} y={530} size={28}>(ℤ/2)ⁿ 上的 Fourier = Walsh–Hadamard</Label>
        <Label x={540} y={590} size={26} color={C.pencil}>第二幕的钟面，缩成了只有两格的钟</Label>
      </g>
      <g opacity={easeOut(seg(p['link-tropical'], 0, 0.3))}>
        <Card x={1020} y={300} w={720} h={360} />
        <Label x={1380} y={380} size={36} color={C.ochre}>minimax → 热带</Label>
        <Label x={1380} y={460} size={30} font="math" italic>v(G) = max_(左) min_(右) v(G″)</Label>
        <Label x={1380} y={530} size={28}>(max, min) 也是半环</Label>
        <Label x={1380} y={590} size={26} color={C.pencil}>博弈求值和最短路，是同一个 fold</Label>
      </g>
    </g>
  );
}

export default { beats, View };
