import { Label, Code, Stroke, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, lerp, seg } from '../paint/ease.js';
import { parenthesisGap } from '../math/semigroup.js';

const beats = [
  { id: 'layers', say: '先看画室里的一件小事：四张半透明的画纸，上面分别是红圆、黄三角、蓝方块和一道黑杠。' },
  { id: 'over', say: '把一张叠在另一张上面，画家叫它 over。它吃进两幅画，吐出一幅画。我把 a 叠在 b 上记作 a·b。' },
  { id: 'left', say: '从左往右一张一张地叠：先 a·b，再叠 c，再叠 d。这是 foldl，三步，每一步都要等上一步。' },
  { id: 'tree', say: '也可以两两同时叠：a·b 和 c·d 并行，最后再合起来。只要两轮。' },
  { id: 'same', say: '两种做法逐像素比较，差是零。不是碰巧：over 满足结合律。' },
  { id: 'law', say: '结合律说：(x·y)·z = x·(y·z)。括号可以随便放，所以工作可以随便切——切成段、切给线程、切给 GPU。' },
  { id: 'order', say: '但顺序不能换。红圆盖住黄三角，和黄三角盖住红圆，是两幅画：a·b ≠ b·a。' },
  { id: 'semigroup', say: '一个集合，配一个满足结合律的二元运算，叫半群。再有一张全透明的纸 e，叠上去什么都不变，就是幺半群。' },
  { id: 'redux', say: '你们的 action 列表在拼接下就是幺半群，空列表就是 e。所以 reducer 可以分批跑，也可以先拼好再跑，结果一样。' },
];

// 四张画纸，单位坐标。颜色和透明度会被 math/semigroup 用来逐像素验证结合律。
const SHEETS = [
  { name: 'a', color: C.red, alpha: 0.72, shape: { kind: 'circle', cx: 0.42, cy: 0.42, r: 0.3 } },
  { name: 'b', color: C.yellow, alpha: 0.78, shape: { kind: 'polygon', pts: [[0.5, 0.1], [0.92, 0.85], [0.1, 0.8]] } },
  { name: 'c', color: C.blue, alpha: 0.6, shape: { kind: 'polygon', pts: [[0.35, 0.35], [0.9, 0.35], [0.9, 0.9], [0.35, 0.9]] } },
  { name: 'd', color: C.ink, alpha: 0.7, shape: { kind: 'polygon', pts: [[0.05, 0.62], [0.62, 0.05], [0.72, 0.15], [0.15, 0.72]] } },
];
const GAP = parenthesisGap(SHEETS);
const byName = Object.fromEntries(SHEETS.map(s => [s.name, s]));

// 一叠画纸：names 从上到下。SVG 后画的在上面，所以倒过来画——这本身就是 over。
function Sheet({ c, size, names, opacity = 1, label, dashed }) {
  if (opacity <= 0) return null;
  const [x, y] = [c[0] - size / 2, c[1] - size / 2];
  const P = ([u, v]) => `${x + u * size},${y + v * size}`;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={size} height={size} fill={C.paper} fillOpacity={0.35} stroke={C.pencil} strokeWidth={dashed ? 3 : 1.5} strokeDasharray={dashed ? '10 8' : undefined} rx={4} />
      {[...names].reverse().map((n, i) => {
        const { shape, color, alpha } = byName[n];
        return shape.kind === 'circle' ? (
          <circle key={i} cx={x + shape.cx * size} cy={y + shape.cy * size} r={shape.r * size} fill={color} fillOpacity={alpha} />
        ) : (
          <path key={i} d={`M${shape.pts.map(P).join('L')}Z`} fill={color} fillOpacity={alpha} />
        );
      })}
      {label && (
        <Label x={c[0]} y={c[1] + size / 2 + 40} size={Math.max(26, size / 6)} font="math" italic>
          {label}
        </Label>
      )}
    </g>
  );
}

const edge = (from, to, k, fs, ts) => (
  <Stroke pts={[[from[0], from[1] + fs / 2], [to[0], to[1] - ts / 2]]} width={4} color={C.pencil} progress={k} />
);

function FoldLeft({ p, opacity }) {
  const L = [[170, 255], [310, 255], [450, 255], [590, 255]];
  const n1 = [240, 430];
  const n2 = [345, 600];
  const n3 = [450, 775];
  const s = [seg(p, 0.08, 0.35), seg(p, 0.38, 0.65), seg(p, 0.68, 0.95)].map(easeOut);
  return (
    <g opacity={opacity}>
      <Label x={380} y={170} size={30} color={C.red}>foldl：((a·b)·c)·d</Label>
      {L.map((c, i) => <Sheet key={i} c={c} size={110} names={[SHEETS[i].name]} />)}
      {edge(L[0], n1, s[0], 110, 120)}
      {edge(L[1], n1, s[0], 110, 120)}
      <Sheet c={n1} size={120} names={['a', 'b']} opacity={s[0]} />
      {edge(n1, n2, s[1], 120, 130)}
      {edge(L[2], n2, s[1], 110, 130)}
      <Sheet c={n2} size={130} names={['a', 'b', 'c']} opacity={s[1]} />
      {edge(n2, n3, s[2], 130, 140)}
      {edge(L[3], n3, s[2], 110, 140)}
      <Sheet c={n3} size={140} names={['a', 'b', 'c', 'd']} opacity={s[2]} />
      <Label x={640} y={610} size={28} color={C.pencil} anchor="start" opacity={s[0]}>
        第 {1 + (s[1] > 0) + (s[2] > 0)} 步
      </Label>
    </g>
  );
}

function FoldTree({ p, opacity }) {
  const L = [[1180, 255], [1320, 255], [1460, 255], [1600, 255]];
  const ab = [1250, 470];
  const cd = [1530, 470];
  const root = [1390, 740];
  const s = [seg(p, 0.1, 0.45), seg(p, 0.55, 0.9)].map(easeOut);
  return (
    <g opacity={opacity}>
      <Label x={1390} y={170} size={30} color={C.blue}>树形：(a·b)·(c·d)</Label>
      {L.map((c, i) => <Sheet key={i} c={c} size={110} names={[SHEETS[i].name]} />)}
      {edge(L[0], ab, s[0], 110, 120)}
      {edge(L[1], ab, s[0], 110, 120)}
      {edge(L[2], cd, s[0], 110, 120)}
      {edge(L[3], cd, s[0], 110, 120)}
      <Sheet c={ab} size={120} names={['a', 'b']} opacity={s[0]} />
      <Sheet c={cd} size={120} names={['c', 'd']} opacity={s[0]} />
      {edge(ab, root, s[1], 120, 140)}
      {edge(cd, root, s[1], 120, 140)}
      <Sheet c={root} size={140} names={['a', 'b', 'c', 'd']} opacity={s[1]} />
      <Label x={1640} y={610} size={28} color={C.pencil} anchor="start" opacity={s[0]}>
        第 {1 + (s[1] > 0)} 轮
      </Label>
    </g>
  );
}

function View({ clock }) {
  const p = clock.p;
  const row = inOut(p('layers'), seg(p('left'), 0, 0.25));
  const slide = easeInOut(seg(p('over'), 0.1, 0.6));
  const trees = easeOut(p('left')) * (1 - 0.82 * easeInOut(p('law'))) * (1 - easeInOut(seg(p('order'), 0, 0.4)));
  const same = easeOut(seg(p('same'), 0, 0.4)) * (1 - easeInOut(p('law')));
  const law = inOut(p('law'), seg(p('order'), 0, 0.4));
  const order = inOut(seg(p('order'), 0.3, 0.8), seg(p('semigroup'), 0, 0.4));
  const def = easeOut(seg(p('semigroup'), 0.3, 0.8));

  const xs = [480, 800, 1120, 1440];
  return (
    <g>
      <g opacity={row}>
        {/* a 最后画，才会叠在 b 上面 */}
        {[1, 2, 3, 0].map(i => (
          <Sheet key={i} c={[i === 0 ? lerp(xs[0], xs[1], slide) : xs[i], 400]} size={230} names={[SHEETS[i].name]} opacity={easeOut(seg(p('layers'), i * 0.12, 0.3 + i * 0.12))} label={slide > 0.5 && i < 2 ? null : SHEETS[i].name} />
        ))}
        <Label x={xs[1]} y={555} size={40} font="math" italic opacity={seg(p('over'), 0.6, 0.8)}>a·b</Label>
        <Label x={W / 2} y={720} size={40} font="math" opacity={easeOut(seg(p('over'), 0.5, 0.9))}>
          over : 画 × 画 → 画
        </Label>
      </g>

      <FoldLeft p={p('left')} opacity={trees} />
      <FoldTree p={p('tree')} opacity={trees * easeOut(seg(p('tree'), 0, 0.2))} />
      <g opacity={same}>
        <Label x={930} y={760} size={80} font="math">=</Label>
        <Label x={930} y={830} size={30} color={C.green} font="mono">Δ = {GAP.toFixed(4)}</Label>
      </g>

      <g opacity={law}>
        <Card x={460} y={400} w={1000} h={240} />
        <Label x={W / 2} y={515} size={76} font="math" italic>(x·y)·z = x·(y·z)</Label>
        <Label x={W / 2} y={590} size={32} color={C.pencil}>括号随便放 ⇒ 工作随便切</Label>
      </g>

      <g opacity={order}>
        <Sheet c={[640, 470]} size={330} names={['a', 'b']} label="a·b" />
        <Label x={960} y={500} size={96} font="math">≠</Label>
        <Sheet c={[1280, 470]} size={330} names={['b', 'a']} label="b·a" />
      </g>

      <g opacity={def}>
        <Label x={200} y={260} size={40} anchor="start" weight={600}>半群 (S, ·)</Label>
        <Label x={200} y={320} size={36} anchor="start" font="math" italic>x·(y·z) = (x·y)·z</Label>
        <Label x={200} y={400} size={40} anchor="start" weight={600}>幺半群 (S, ·, e)</Label>
        <Label x={200} y={460} size={36} anchor="start" font="math" italic>e·x = x = x·e</Label>
        <Sheet c={[1060, 360]} size={180} names={[]} dashed label="e" />
        <Label x={1200} y={370} size={60} font="math">·</Label>
        <Sheet c={[1340, 360]} size={180} names={['a']} />
        <Label x={1480} y={375} size={60} font="math">=</Label>
        <Sheet c={[1620, 360]} size={180} names={['a']} />
      </g>

      <Code
        x={200}
        y={620}
        size={30}
        progress={easeOut(p('redux'))}
        lines={[
          'const xs = [add, toggle], ys = [rename]',
          'reduce(r, s, [...xs, ...ys])',
          '  === reduce(r, reduce(r, s, xs), ys)   // 结合律',
          'reduce(r, s, [])  === s                  // 单位元',
        ]}
      />
    </g>
  );
}

export default { beats, View };
