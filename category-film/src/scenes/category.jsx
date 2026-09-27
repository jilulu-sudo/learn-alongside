import { Label, Arrow, Disc, Loop, Card, Circle, Stroke } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg, lerp } from '../paint/ease.js';
import { hasseEdges, divisors } from '../math/incidence.js';

const beats = [
  { id: 'strip', say: '现在，把前几幅画里的颜色、数字、罐子都拿掉，只留下点和箭头。' },
  { id: 'axioms', say: '一个范畴就是：一些对象，一些箭头；首尾相接的箭头可以组合；组合满足结合律；每个对象有一支什么都不做的箭头。' },
  { id: 'monoid', say: '第一幕的幺半群，是只有一个点的范畴：每张画纸是一支绕回自己的箭头，over 就是组合。结合律，原来是范畴的公理。' },
  { id: 'poset', say: '第二幕的整除关系也是范畴：d 整除 n，就画一支 d 到 n 的箭头；传递性就是组合。μ 就住在这个范畴的关联代数里。' },
  { id: 'metric', say: '第三幕的地图也是：箭头上不再是“有或没有”，而是一个距离。组合是相加，三角不等式就是组合。Lawvere 把度量空间看成富集在热带半环上的范畴。' },
  { id: 'games', say: '第四幕的博弈也是：Joyal 让博弈做对象，让策略做箭头，策略可以组合。这后来长成了程序语义学里的“博弈语义”。' },
  { id: 'fourier-dual', say: '如果你看了 Fourier 那一枝：把一个群送到它的特征标群，这个操作本身，也是一支更高层的箭头——函子。', needs: ['fourier'] },
  { id: 'commdiag', say: '还记得交换子吗？范畴论里到处是“交换图”：从一角到另一角，走哪条路结果都一样。那正是交换子为零的地方。', needs: ['commutator'] },
  { id: 'one', say: '五个岛，是同一个岛的五幅写生。' },
];

const Q = {
  monoid: { c: [540, 380], title: '幺半群', color: C.red, note: '一个对象；组合 = over' },
  poset: { c: [1380, 380], title: '偏序（整除）', color: C.blue, note: '至多一支箭头；组合 = 传递性' },
  metric: { c: [540, 720], title: '度量空间', color: C.ochre, note: 'hom = 距离；组合 = +；恒等 = 0' },
  games: { c: [1380, 720], title: '博弈', color: C.green, note: '对象 = 博弈；箭头 = 策略' },
};

const toward = ([x, y], k) => `translate(${lerp(0, W / 2 - x, k)} ${lerp(0, 520 - y, k)}) translate(${x} ${y}) scale(${1 - 0.85 * k}) translate(${-x} ${-y})`;

function Quadrant({ id, opacity, shrink, children }) {
  const { c, title, color, note } = Q[id];
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity} transform={toward(c, shrink)}>
      <Label x={c[0] - 380} y={c[1] - 120} size={30} anchor="start" color={color} weight={700}>{title}</Label>
      {children}
      <Label x={c[0]} y={c[1] + 150} size={26} color={C.pencil}>{note}</Label>
    </g>
  );
}

const LOOP_ANGLES = [Math.PI, (Math.PI * 3) / 4, Math.PI / 4, 0];
const HPOS = { 1: [0, 90], 2: [-80, 30], 3: [80, 30], 4: [-140, -30], 6: [20, -30], 12: [-60, -90] };

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const strip = easeInOut(p.strip);
  const overlay = Math.max(inOut(seg(p['fourier-dual'], 0, 0.2), seg(p['fourier-dual'], 0.9, 1)), inOut(seg(p.commdiag, 0, 0.2), seg(p.commdiag, 0.9, 1)));
  const one = easeInOut(seg(p.one, 0, 0.6));
  const q = id => easeOut(seg(p[id], 0, 0.3)) * (1 - 0.8 * overlay) * (1 - one);
  const dots = [[560, 560], [820, 400], [1100, 400], [1360, 560]];
  const col = [C.red, C.blue, C.ochre, C.green];

  return (
    <g>
      <g opacity={1 - strip}>
        <Disc c={[700, 480]} r={150} color={C.red} opacity={0.7} />
        <path d="M1000,300 L1200,640 L820,640 Z" fill={C.yellow} opacity={0.75} />
        <Circle c={[1260, 460]} r={120} color={C.blue} width={10} />
        <Stroke pts={[[500, 760], [700, 700], [900, 740], [1400, 620]]} color={C.ochre} width={16} />
        <rect x={1380} y={560} width={120} height={180} fill={C.green} opacity={0.6} />
      </g>

      <g opacity={strip * (1 - easeInOut(seg(p.monoid, 0, 0.2)))}>
        {dots.map((d, i) => (
          <g key={i}>
            <Disc c={d} r={22} color={C.ink} scale={strip} />
            <Loop at={d} r={30} angle={LOOP_ANGLES[i]} progress={easeOut(seg(p.axioms, 0.55, 0.8))} color={C.pencil} width={3} />
          </g>
        ))}
        <Arrow from={dots[0]} to={dots[1]} gap={34} label="f" progress={easeInOut(seg(p.axioms, 0.05, 0.25))} />
        <Arrow from={dots[1]} to={dots[2]} gap={34} label="g" progress={easeInOut(seg(p.axioms, 0.15, 0.35))} />
        <Arrow from={dots[2]} to={dots[3]} gap={34} label="h" progress={easeInOut(seg(p.axioms, 0.25, 0.45))} />
        <Arrow from={dots[0]} to={dots[2]} bend={-330} gap={34} color={C.violet} label="g∘f" progress={easeInOut(seg(p.axioms, 0.35, 0.55))} />
        <Arrow from={dots[1]} to={dots[3]} bend={220} gap={34} color={C.violet} label="h∘g" progress={easeInOut(seg(p.axioms, 0.4, 0.6))} />
        <Label x={W / 2} y={800} size={38} font="math" italic opacity={seg(p.axioms, 0.6, 0.8)}>h∘(g∘f) = (h∘g)∘f　　id∘f = f = f∘id</Label>
      </g>

      <Quadrant id="monoid" opacity={q('monoid')} shrink={one}>
        <Disc c={Q.monoid.c} r={24} color={C.ink} />
        {['a', 'b', 'c'].map((n, i) => (
          <Loop key={n} at={Q.monoid.c} r={44} angle={-Math.PI / 2 + ((i - 1) * 2 * Math.PI) / 3} color={col[i === 1 ? 3 : i]} label={n} progress={easeOut(seg(p.monoid, 0.1 + i * 0.1, 0.4 + i * 0.1))} />
        ))}
      </Quadrant>

      <Quadrant id="poset" opacity={q('poset')} shrink={one}>
        {hasseEdges(12).map(([a, b]) => (
          <Arrow key={`${a}${b}`} from={add(Q.poset.c, HPOS[a])} to={add(Q.poset.c, HPOS[b])} gap={20} width={3} head={11} color={C.blue} progress={easeOut(seg(p.poset, 0.1, 0.5))} />
        ))}
        {divisors(12).map(d => (
          <g key={d}>
            <Disc c={add(Q.poset.c, HPOS[d])} r={16} color={C.ink} />
            <Label x={add(Q.poset.c, HPOS[d])[0] + 26} y={add(Q.poset.c, HPOS[d])[1] + 8} size={22} anchor="start">{d}</Label>
          </g>
        ))}
      </Quadrant>

      <Quadrant id="metric" opacity={q('metric')} shrink={one}>
        {[[-150, 60], [0, -70], [150, 60]].map((o, i) => (
          <Disc key={i} c={add(Q.metric.c, o)} r={16} color={C.ink} />
        ))}
        <Arrow from={add(Q.metric.c, [-150, 60])} to={add(Q.metric.c, [0, -70])} gap={22} label="3" color={C.ochre} progress={easeOut(seg(p.metric, 0.1, 0.35))} />
        <Arrow from={add(Q.metric.c, [0, -70])} to={add(Q.metric.c, [150, 60])} gap={22} label="4" color={C.ochre} progress={easeOut(seg(p.metric, 0.25, 0.5))} />
        <Arrow from={add(Q.metric.c, [-150, 60])} to={add(Q.metric.c, [150, 60])} gap={22} bend={50} label="6 ≤ 3 + 4" color={C.ink} progress={easeOut(seg(p.metric, 0.45, 0.7))} />
      </Quadrant>

      <Quadrant id="games" opacity={q('games')} shrink={one}>
        {[[-170, 0, 'G'], [0, 0, 'H'], [170, 0, 'K']].map(([x, y, n]) => (
          <g key={n}>
            <Disc c={add(Q.games.c, [x, y])} r={26} color={C.green} />
            <Label x={Q.games.c[0] + x} y={Q.games.c[1] + y + 10} size={28} color={C.paper} weight={700} font="math">{n}</Label>
          </g>
        ))}
        <Arrow from={add(Q.games.c, [-170, 0])} to={add(Q.games.c, [0, 0])} gap={34} bend={-40} label="σ" progress={easeOut(seg(p.games, 0.1, 0.35))} />
        <Arrow from={add(Q.games.c, [0, 0])} to={add(Q.games.c, [170, 0])} gap={34} bend={-40} label="τ" progress={easeOut(seg(p.games, 0.25, 0.5))} />
        <Arrow from={add(Q.games.c, [-170, 0])} to={add(Q.games.c, [170, 0])} gap={34} bend={70} label="τ∘σ" color={C.violet} progress={easeOut(seg(p.games, 0.45, 0.7))} />
      </Quadrant>

      <g opacity={inOut(seg(p['fourier-dual'], 0, 0.2), seg(p['fourier-dual'], 0.9, 1))}>
        <Card x={420} y={330} w={1080} h={360} />
        <Label x={W / 2} y={420} size={44} font="math" italic>G ⟼ Ĝ = Hom(G, 𝕋)</Label>
        <Label x={W / 2} y={500} size={34} font="math" italic>φ : G → H　⟼　φ̂ : Ĥ → Ĝ</Label>
        <Label x={W / 2} y={580} size={30}>箭头反向——一个反变函子；再做一次就回到原处（Pontryagin 对偶）</Label>
      </g>

      <g opacity={inOut(seg(p.commdiag, 0, 0.2), seg(p.commdiag, 0.9, 1))}>
        <Card x={520} y={260} w={880} h={520} />
        {[[760, 360], [1160, 360], [760, 640], [1160, 640]].map((d, i) => <Disc key={i} c={d} r={18} color={C.ink} />)}
        <Arrow from={[760, 360]} to={[1160, 360]} gap={30} color={C.red} progress={easeOut(seg(p.commdiag, 0.1, 0.3))} />
        <Arrow from={[1160, 360]} to={[1160, 640]} gap={30} color={C.red} progress={easeOut(seg(p.commdiag, 0.25, 0.45))} />
        <Arrow from={[760, 360]} to={[760, 640]} gap={30} color={C.blue} progress={easeOut(seg(p.commdiag, 0.4, 0.6))} />
        <Arrow from={[760, 640]} to={[1160, 640]} gap={30} color={C.blue} progress={easeOut(seg(p.commdiag, 0.55, 0.75))} />
        <Label x={W / 2} y={510} size={40} opacity={seg(p.commdiag, 0.75, 0.9)} color={C.green}>=</Label>
        <Label x={W / 2} y={740} size={30} opacity={seg(p.commdiag, 0.75, 0.9)}>红路 = 蓝路 ⇔ 这一格的“交换子”为零</Label>
      </g>

      <g opacity={easeOut(seg(p.one, 0.5, 0.9))}>
        <Disc c={[W / 2, 520]} r={30} color={C.violet} />
        <Loop at={[W / 2, 520]} r={44} angle={-Math.PI / 2} color={C.ink} width={5} />
      </g>
    </g>
  );
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

export default { beats, View };
