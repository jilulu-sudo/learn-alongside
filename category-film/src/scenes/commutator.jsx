import { Label, Stroke, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, lerp, pulse, seg } from '../paint/ease.js';
import { commutatorGap, commutatorWord, moves, pose, replicas, walk } from '../math/semigroup.js';
import { polyPath } from '../paint/brush.js';

const beats = [
  { id: 'setup', say: '上一幕留下一个问题：顺序什么时候要紧？这是一只乌龟，尾巴上拴着画笔，走到哪儿画到哪儿。' },
  { id: 'commute', say: '它会两个动作：向东一步 x，向北一步 y。先 x 后 y，先 y 后 x，终点一样。' },
  { id: 'loop', say: '走一个环：x，y，再倒着走 x，倒着走 y。画笔回到起点，线条闭合。' },
  { id: 'turn', say: '现在换两个动作：a 是朝着脑袋的方向前进一步，b 是原地左转。前进，左转，后退，右转——' },
  { id: 'gap', say: '——回不去了。这个缺口，就是交换子 [a,b] = a b a⁻¹ b⁻¹。它为零，当且仅当 a 和 b 可以交换。' },
  { id: 'group', say: '注意，交换子要用到逆：倒着走、反着转。半群没有逆，要先走进群里，才量得出“不可交换”有多大。' },
  { id: 'crdt', say: '换成你们的语言：两个副本收到同样两条操作，顺序不同。交换子为零，副本自然一致；这正是 CRDT 要求操作可交换的原因。' },
];

const U = 180;
const LEFT = [470, 660];
const RIGHT = [1250, 470];
const toScreen = (o, p) => [o[0] + p.x * U, o[1] - p.y * U];

// 走到进度 k（0..1）时：已画的点列，和乌龟当前的位姿。
function walkAt(o, word, k) {
  const poses = walk(pose(), word);
  const steps = word.length;
  const i = Math.min(steps - 1, Math.floor(k * steps));
  const f = easeInOut(Math.min(1, k * steps - i));
  const a = poses[i];
  const b = poses[i + 1];
  const now = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), th: lerp(a.th, b.th, f) };
  return { pts: [...poses.slice(0, i + 1), now].map(p => toScreen(o, p)), now, step: k <= 0 ? -1 : i };
}

function Turtle({ o, at, color = C.green, opacity = 1 }) {
  const [x, y] = toScreen(o, at);
  const a = -at.th;
  const pt = (r, d) => [x + Math.cos(a + d) * r, y + Math.sin(a + d) * r];
  return <path d={polyPath([pt(30, 0), pt(20, 2.4), pt(20, -2.4)])} fill={color} opacity={opacity} />;
}

function Grid({ o, cols, rows, opacity }) {
  const lines = [];
  for (let i = cols[0]; i <= cols[1]; i++) lines.push([[o[0] + i * U, o[1] - rows[0] * U], [o[0] + i * U, o[1] - rows[1] * U]]);
  for (let j = rows[0]; j <= rows[1]; j++) lines.push([[o[0] + cols[0] * U, o[1] - j * U], [o[0] + cols[1] * U, o[1] - j * U]]);
  return (
    <g opacity={opacity * 0.5}>
      {lines.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.pencil} strokeWidth={1.5} strokeDasharray="4 8" />)}
    </g>
  );
}

function Word({ x, y, word, step, opacity }) {
  return (
    <g opacity={opacity}>
      {word.map((m, i) => (
        <Label key={i} x={x + (i - 1.5) * 90} y={y} size={40} font="math" italic color={i === step ? C.red : C.ink} weight={i === step ? 700 : 400}>
          {moves[m].name}
        </Label>
      ))}
    </g>
  );
}

const GAP = commutatorGap('forward', 'left');
const inc = k => s => s + k;
const set = k => () => k;
const R1 = replicas(0, inc(2), inc(3));
const R2 = replicas(0, set(2), inc(3));

function View({ clock }) {
  const p = clock.p;
  const panels = 1 - easeInOut(seg(p('crdt'), 0, 0.3));
  const loopWord = commutatorWord('east', 'north');
  const turnWord = commutatorWord('forward', 'left');

  const xy = walkAt(LEFT, ['east', 'north'], easeInOut(seg(p('commute'), 0.05, 0.45)));
  const yx = walkAt(LEFT, ['north', 'east'], easeInOut(seg(p('commute'), 0.5, 0.9)));
  const loop = walkAt(LEFT, loopWord, seg(p('loop'), 0.05, 0.9));
  const turn = walkAt(RIGHT, turnWord, seg(p('turn'), 0.1, 1));
  const leftTurtle = p('loop') > 0 ? loop.now : p('commute') > 0.5 ? yx.now : xy.now;

  const gapIn = easeOut(seg(p('gap'), 0, 0.3));
  const end = turn.pts.at(-1);

  return (
    <g>
      <g opacity={panels}>
        <Grid o={LEFT} cols={[-1, 2]} rows={[-1, 2]} opacity={easeOut(p('setup'))} />
        <Label x={LEFT[0] + U / 2} y={210} size={32} opacity={easeOut(seg(p('commute'), 0, 0.3))}>平移：x = 向东，y = 向北</Label>
        <Stroke pts={xy.pts} color={C.red} width={7} opacity={1 - easeInOut(p('loop'))} />
        <Stroke pts={yx.pts} color={C.blue} width={7} opacity={1 - easeInOut(p('loop'))} />
        <Label x={LEFT[0] + U + 30} y={LEFT[1] - U - 30} size={30} anchor="start" opacity={easeOut(seg(p('commute'), 0.9, 1)) * (1 - p('loop'))}>xy = yx</Label>
        <Stroke pts={loop.pts} color={C.ink} width={7} />
        <Word x={LEFT[0] + U / 2} y={820} word={loopWord} step={p('loop') < 1 ? loop.step : -1} opacity={easeOut(p('loop'))} />
        <Label x={LEFT[0] + U / 2} y={LEFT[1] + 75} size={32} color={C.green} opacity={easeOut(seg(p('loop'), 0.9, 1))}>[x, y] = e，闭合 ✓</Label>
        <Turtle o={LEFT} at={leftTurtle} opacity={easeOut(p('setup'))} />

        <g opacity={easeOut(seg(p('turn'), 0, 0.15))}>
          <Grid o={RIGHT} cols={[-1, 2]} rows={[-2, 1]} opacity={1} />
          <Label x={RIGHT[0] + U / 2} y={210} size={32}>a = 前进一步，b = 左转 90°</Label>
          <Stroke pts={turn.pts} color={C.ink} width={7} />
          <Turtle o={RIGHT} at={turn.now} />
          <Word x={RIGHT[0] + U / 2} y={820} word={turnWord} step={p('gap') > 0 ? -1 : turn.step} opacity={1} />
        </g>

        <g opacity={gapIn}>
          <line x1={end[0]} y1={end[1]} x2={RIGHT[0]} y2={RIGHT[1]} stroke={C.red} strokeWidth={6 + 4 * pulse(clock.since('gap'))} strokeDasharray="12 10" strokeLinecap="round" />
          <circle cx={RIGHT[0]} cy={RIGHT[1]} r={12} fill="none" stroke={C.red} strokeWidth={4} />
          <Label x={RIGHT[0] + U + 70} y={RIGHT[1] + U / 2} size={34} color={C.red} anchor="start">缺口 = {GAP.toFixed(3)}</Label>
          <Label x={RIGHT[0] + U + 70} y={RIGHT[1] + U / 2 + 48} size={28} color={C.red} anchor="start" font="math" italic>[a,b] = a b a⁻¹ b⁻¹ ≠ e</Label>
        </g>

        <g opacity={inOut(p('group'), seg(p('crdt'), 0, 0.3))}>
          <Card x={560} y={380} w={800} h={170} />
          <Label x={W / 2} y={450} size={38}>群 = 每支箭头都能倒着走的幺半群</Label>
          <Label x={W / 2} y={510} size={30} color={C.pencil} font="math" italic>a · a⁻¹ = e = a⁻¹ · a</Label>
        </g>
      </g>

      <Replicas p={p('crdt')} />
    </g>
  );
}

function Replicas({ p }) {
  const k = easeOut(seg(p, 0.2, 0.5));
  const k2 = easeOut(seg(p, 0.55, 0.85));
  const row = (y, f, g, r, ok, opacity) => (
    <g opacity={opacity}>
      <Label x={420} y={y} size={34} font="mono">{`${f}, ${g}`}</Label>
      <Label x={420} y={y + 60} size={40} font="mono" color={C.ink}>→ {r.fg}</Label>
      <Label x={960} y={y + 30} size={34} color={ok ? C.green : C.red}>{ok ? '一致 ✓ 可交换' : '分叉 ✗ 交换子 ≠ e'}</Label>
      <Label x={1500} y={y} size={34} font="mono">{`${g}, ${f}`}</Label>
      <Label x={1500} y={y + 60} size={40} font="mono" color={C.ink}>→ {r.gf}</Label>
    </g>
  );
  return (
    <g opacity={k}>
      <Label x={420} y={230} size={32} color={C.pencil}>副本甲收到的顺序</Label>
      <Label x={1500} y={230} size={32} color={C.pencil}>副本乙收到的顺序</Label>
      {row(360, 'inc(2)', 'inc(3)', R1, R1.fg === R1.gf, 1)}
      {row(600, 'set(2)', 'inc(3)', R2, R2.fg === R2.gf, k2)}
    </g>
  );
}

export default { beats, View };
