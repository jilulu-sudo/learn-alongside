import { Label, Arrow, Disc, Loop, Code, Card } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';

const beats = [
  { id: 'free', say: '回到你的 store。左边只有一个点，箭头是 action 列表，组合是拼接，恒等是空列表。这是 action 的自由幺半群——一个单对象范畴。' },
  { id: 'set', say: '右边是所有可能的 state，这里只有四个：主题亮或暗，语言中或英。箭头是函数 State → State。' },
  { id: 'reduce', say: 'reduce 把左边每支箭头送到右边一支箭头：[T] 送到“切换主题”，[L] 送到“切换语言”，[T, L] 送到先切主题再切语言。' },
  { id: 'law', say: '它保持组合：拼接送到函数复合，空列表送到恒等。这两条就是函子定律，也是你能分批 dispatch、能重放 action 做时间旅行调试的原因。' },
  { id: 'map', say: '你每天用的 Array.map 也是函子：先 map f 再 map g，等于 map 它们的复合。编译器和你手写的循环融合，靠的就是这一条。' },
];

// 一个真 reducer：四个 state，两个 action。
const reducer = (s, a) => (a === 'T' ? { ...s, dark: !s.dark } : { ...s, en: !s.en });
const run = xs => s => xs.reduce(reducer, s);
const STATES = [
  { dark: false, en: false },
  { dark: true, en: false },
  { dark: false, en: true },
  { dark: true, en: true },
];
const key = s => `${+s.dark}${+s.en}`;
const POS = { '00': [1250, 330], '10': [1610, 330], '01': [1250, 640], '11': [1610, 640] };
const label = s => `${s.dark ? '☾' : '☀'} ${s.en ? 'En' : '中'}`;

const same = (a, b) => key(a) === key(b);
const LAW_HOLDS = STATES.every(s => same(run(['T', 'L'])(s), run(['L'])(run(['T'])(s))) && same(run([])(s), s));

const f = x => x + 1;
const g = x => x * 2;
const XS = [1, 2, 3];
const TWO_PASS = XS.map(f).map(g);
const FUSED = XS.map(x => g(f(x)));

function Image({ xs, color, progress, bend = 0 }) {
  return STATES.map(s => {
    const t = run(xs)(s);
    return <Arrow key={key(s)} from={POS[key(s)]} to={POS[key(t)]} bend={bend} gap={46} width={4} head={14} color={color} progress={progress} seed={key(s).charCodeAt(1) + xs.length} />;
  });
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const cats = 1 - easeInOut(seg(p.map, 0, 0.3));
  const O = [460, 480];

  return (
    <g>
      <g opacity={cats}>
        <g opacity={easeOut(seg(p.free, 0, 0.3))}>
          <Disc c={O} r={30} color={C.ink} />
          <Label x={O[0] + 80} y={O[1] + 12} size={30} font="mono" anchor="start">Action*</Label>
          <Loop at={O} r={52} angle={-Math.PI / 2 - 0.8} color={C.red} label="[T]" progress={easeOut(seg(p.free, 0.2, 0.45))} />
          <Loop at={O} r={52} angle={-Math.PI / 2 + 0.8} color={C.blue} label="[L]" progress={easeOut(seg(p.free, 0.35, 0.6))} />
          <Loop at={O} r={52} angle={Math.PI / 2} color={C.violet} label="[T, L]" progress={easeOut(seg(p.free, 0.5, 0.75))} />
          <Label x={O[0]} y={O[1] + 300} size={26} color={C.pencil} opacity={seg(p.free, 0.7, 1)}>组合 = ++　恒等 = []</Label>
        </g>

        <g opacity={easeOut(seg(p.set, 0, 0.3))}>
          {STATES.map(s => (
            <g key={key(s)}>
              <Disc c={POS[key(s)]} r={40} color={s.dark ? C.ink : C.yellow} seed={key(s).length + key(s).charCodeAt(0)} />
              <Label x={POS[key(s)][0]} y={POS[key(s)][1] + 12} size={28} color={s.dark ? C.paper : C.ink} weight={700}>{label(s)}</Label>
            </g>
          ))}
          <Label x={1430} y={790} size={28} font="mono">State</Label>
        </g>

        <Arrow from={[640, 480]} to={[1120, 480]} bend={-60} width={10} head={26} label="reduce" size={34} progress={easeInOut(seg(p.reduce, 0, 0.2))} />
        <Image xs={['T']} color={C.red} bend={-30} progress={easeOut(seg(p.reduce, 0.2, 0.45))} />
        <Image xs={['L']} color={C.blue} bend={-30} progress={easeOut(seg(p.reduce, 0.4, 0.65))} />
        <Image xs={['T', 'L']} color={C.violet} bend={0} progress={easeOut(seg(p.reduce, 0.6, 0.85))} />
      </g>

      <g opacity={inOut(seg(p.law, 0, 0.3), seg(p.map, 0, 0.3))}>
        <Card x={260} y={180} w={760} h={170} />
        <Label x={640} y={250} size={30} font="mono">reduce(xs ++ ys) = reduce(ys) ∘ reduce(xs)</Label>
        <Label x={640} y={305} size={30} font="mono">reduce([]) = id</Label>
        <Label x={640} y={840} size={28} color={LAW_HOLDS ? C.green : C.red}>
          {LAW_HOLDS ? '对四个 state 逐一检查：两条都成立 ✓' : '不成立'}
        </Label>
      </g>

      <g opacity={easeOut(seg(p.map, 0.2, 0.5))}>
        <Code
          x={W / 2}
          y={380}
          anchor="middle"
          size={34}
          progress={easeOut(seg(p.map, 0.2, 0.8))}
          lines={[
            `[1, 2, 3].map(x => x + 1).map(x => x * 2)  // [${TWO_PASS}]`,
            `[1, 2, 3].map(x => (x + 1) * 2)             // [${FUSED}]`,
            '',
            'map(g ∘ f) = map(g) ∘ map(f)      map(id) = id',
          ]}
        />
      </g>
    </g>
  );
}

export default { beats, View };
