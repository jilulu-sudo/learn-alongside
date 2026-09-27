import { Label, Stroke, Card, Code } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeOut, inOut, seg, pulse } from '../paint/ease.js';
import { stalk, add, outcome, eq, game, ZERO, stalkValue, stalkTerms, formatFraction } from '../math/games.js';

const beats = [
  { id: 'draw', say: 'Hackenbush 本身就是一幅画：地上长着蓝枝和红枝。左方只能砍蓝的，右方只能砍红的；砍断后悬空的部分一起掉落。轮到谁没得砍，谁输。' },
  { id: 'integers', say: '一根两节的蓝枝值 2，一节红枝值 −1：蓝方能多走几步，值就是几。' },
  { id: 'half', say: '一节蓝上面接一节红，值多少？左方砍蓝会把红也带走，所以左方不急着砍。它值二分之一。' },
  { id: 'check', say: '验证一下：两根这样的枝，加一根红枝。机器把整棵博弈树搜一遍——后手必胜，所以总和是 0：½ + ½ − 1 = 0。' },
  { id: 'data', say: '康威把每个博弈写成：{ 左方能走到的局面 | 右方能走到的局面 }。0 是两边都没路，1 是 {0 | }，½ 是 {0 | 1}。' },
  { id: 'type', say: '这就是一个递归数据类型。数，只是其中特别整齐的一类博弈。' },
  { id: 'stalks', say: '一根枝从地面往上读：先是整数部分；第一次变色以后，每一节的权重减半。' },
];

const GROUND = 780;
const EDGE = 95;
const STALKS = [
  { colors: 'BB', x: 280 },
  { colors: 'R', x: 460 },
  { colors: 'BR', x: 640 },
  { colors: 'BRRB', x: 840 },
];

function Stalk({ colors, x, progress = 1, opacity = 1, glow = 0, weights }) {
  const pts = Array.from({ length: colors.length + 1 }, (_, i) => [x + Math.sin(i * 1.7 + x) * 14, GROUND - i * EDGE]);
  return (
    <g opacity={opacity}>
      {[...colors].map((c, i) => (
        <Stroke key={i} pts={[pts[i], pts[i + 1]]} width={12 + glow * 6} color={c === 'B' ? C.blue : C.red} progress={seg(progress, i / colors.length, (i + 1) / colors.length)} seed={x + i * 3} />
      ))}
      {pts.slice(1).map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r={8} fill={C.ink} opacity={seg(progress, (i + 0.8) / colors.length, (i + 1) / colors.length)} />
      ))}
      {weights &&
        weights.map((w, i) => (
          <Label key={i} x={pts[i + 1][0] + 40} y={(pts[i][1] + pts[i + 1][1]) / 2 + 10} size={28} font="mono" anchor="start" color={w > 0 ? C.blue : C.red}>
            {fmtWeight(w)}
          </Label>
        ))}
    </g>
  );
}

const fmtWeight = w => `${w > 0 ? '+' : '−'}${Math.abs(w) === 1 ? '1' : `1/${Math.round(1 / Math.abs(w))}`}`;
const valueOf = colors => formatFraction(stalkValue(colors));

const TRIO = add(add(stalk('BR'), stalk('BR')), stalk('R'));
const TRIO_OUTCOME = outcome(TRIO);
const ONE = game([ZERO], []);
const HALF_IS = eq(stalk('BR'), game([ZERO], [ONE]));
const TERMS = stalkTerms('BRRB');

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const rightA = inOut(seg(p.half, 0.2, 0.5), seg(p.data, 0, 0.2));
  const rightB = inOut(seg(p.data, 0.1, 0.4), seg(p.stalks, 0, 0.2));

  return (
    <g>
      <Stroke pts={[[140, GROUND + 6], [1780, GROUND + 6]]} width={10} color={C.ochre} progress={easeOut(seg(p.draw, 0, 0.3))} seed={77} />
      {STALKS.map((s, i) => {
        const focus = (s.colors === 'BR' && p.half > 0 && p.data === 0) || (s.colors === 'BRRB' && p.stalks > 0);
        const dim = (p.half > 0 && p.stalks === 0 && s.colors !== 'BR') || (p.stalks > 0 && s.colors !== 'BRRB');
        return (
          <g key={s.x}>
            <Stalk {...s} progress={easeOut(seg(p.draw, 0.15 + i * 0.15, 0.45 + i * 0.15))} opacity={dim ? 0.3 : 1} glow={focus ? pulse(clock.t) : 0} weights={s.colors === 'BRRB' && p.stalks > 0.2 ? TERMS : null} />
            <Label x={s.x} y={GROUND + 60} size={40} font="mono" weight={700} opacity={(i < 2 ? easeOut(p.integers) : i === 2 ? easeOut(seg(p.half, 0.6, 0.9)) : easeOut(seg(p.stalks, 0.6, 0.9))) * (dim ? 0.3 : 1)}>
              {valueOf(s.colors)}
            </Label>
          </g>
        );
      })}

      <g opacity={rightA}>
        <Label x={1420} y={300} size={30} anchor="middle">左方砍蓝 → 红也掉，剩下 <tspan fontWeight={700}>0</tspan></Label>
        <Label x={1420} y={350} size={30} anchor="middle">右方砍红 → 剩一节蓝，是 <tspan fontWeight={700}>1</tspan></Label>
        <Label x={1420} y={420} size={40} font="math" italic>BR = {'{'} 0 | 1 {'}'} = ½</Label>
        <g opacity={easeOut(seg(p.check, 0, 0.3))}>
          <Stalk colors="BR" x={1240} progress={1} />
          <Stalk colors="BR" x={1400} progress={1} />
          <Stalk colors="R" x={1560} progress={1} />
          <Label x={1400} y={500} size={34} font="math" italic>½ + ½ + (−1)</Label>
          <Label x={1400} y={GROUND + 60} size={32} color={TRIO_OUTCOME === 'second' ? C.green : C.red} opacity={easeOut(seg(p.check, 0.4, 0.8))}>
            {TRIO_OUTCOME === 'second' ? '后手必胜 ⇒ = 0 ✓' : `结果：${TRIO_OUTCOME}`}
          </Label>
        </g>
      </g>

      <g opacity={rightB}>
        <Card x={1060} y={220} w={720} h={520} />
        {[
          ['0', '{ | }'],
          ['1', '{ 0 | }'],
          ['−1', '{ | 0 }'],
          ['½', '{ 0 | 1 }'],
        ].map(([v, form], i) => (
          <g key={v} opacity={easeOut(seg(p.data, 0.15 + i * 0.15, 0.4 + i * 0.15))}>
            <Label x={1200} y={300 + i * 70} size={40} font="math">{v}</Label>
            <Label x={1260} y={300 + i * 70} size={40} font="math" anchor="start">= {form}</Label>
          </g>
        ))}
        <Label x={1420} y={590} size={26} color={HALF_IS ? C.green : C.red} opacity={easeOut(seg(p.data, 0.8, 1))}>
          BR = {'{'}0 | 1{'}'}：{HALF_IS ? '按 Conway 的 ≤ 递归比较，成立 ✓' : '不成立'}
        </Label>
        <Code
          x={1100}
          y={650}
          size={22}
          progress={easeOut(p.type)}
          lines={['type Game = { L: Game[]; R: Game[] }', 'const zero = { L: [], R: [] }', 'const half = { L: [zero], R: [one] }']}
        />
      </g>

      <g opacity={easeOut(seg(p.stalks, 0.3, 0.7))}>
        <Label x={1300} y={420} size={40} font="math" italic anchor="start">BRRB</Label>
        <Label x={1300} y={490} size={36} font="mono" anchor="start">= {TERMS.map(fmtWeight).join(' ')}</Label>
        <Label x={1300} y={560} size={44} font="mono" weight={700} anchor="start">= {valueOf('BRRB')}</Label>
        <Label x={1300} y={630} size={28} color={C.pencil} anchor="start">二进制小数：有限博弈长出的数都是 k/2ⁿ</Label>
      </g>
    </g>
  );
}

export default { beats, View };
