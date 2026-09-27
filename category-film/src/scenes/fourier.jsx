import { Label, Stroke, Disc, Card, Circle, Arrow } from '../paint/Brush.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';
import { indicator, convolve, convolveByFourier, dft, cabs, phasorChain, cmul } from '../math/fourier.js';

const beats = [
  { id: 'stamps', say: '邮局只有四种面值的邮票：1、2、5、7。贴两张，能凑出哪些邮资？每种有几种贴法？' },
  { id: 'direct', say: '老实做：所有配对都试一遍，数一数和为 n 的有几对。这叫卷积：r = 1_A ∗ 1_A。' },
  { id: 'clock', say: '换个画法。把 0 到 15 排在一个 16 格的钟面上，加法就是在钟面上走格子。' },
  { id: 'char', say: 'Fourier 的念头是：找一种函数，把加法变成乘法。钟面上的指针正好如此：走 a 格再走 b 格，角度相加，就是复数相乘。' },
  { id: 'transform', say: '每个频率 k 让指针每格转 k 下。把 A 里四个元素的指针首尾相接，终点就是 Â(k)。让 k 从 0 扫到 15。' },
  { id: 'square', say: '在频率这一侧，卷积变成逐点相乘：每支箭头自己乘自己——长度平方，角度加倍。' },
  { id: 'inverse', say: '再变回来，得到的正好是刚才一对一对数出来的 r(n)。一格不差。' },
  { id: 'why', say: '加性数论里的难题——哥德巴赫、等差数列——说到底，都是在频率一侧估计这些箭头有多长。' },
  { id: 'link', say: 'Möbius 反演的是偏序上的累加，Fourier 反演的是群上的卷积。同一个念头，两种方言：找到让累加变简单的那组坐标。' },
];

const N = 16;
const A = [1, 2, 5, 7];
const IND = indicator(A, N);
const R_DIRECT = convolve(IND, IND);
const R_FOURIER = convolveByFourier(IND, IND);
const MAX_ERR = Math.max(...R_DIRECT.map((v, i) => Math.abs(v - R_FOURIER[i])));
const SPEC = dft(IND);
const HUE = [C.red, C.yellow, C.blue, C.green];

const O = [1320, 460];
const R = 190;
const at = z => [O[0] + z.re * R, O[1] - z.im * R];
const onClock = (x, r = R) => [O[0] + Math.cos((2 * Math.PI * x) / N) * r, O[1] - Math.sin((2 * Math.PI * x) / N) * r];

const histX = n => 175 + n * 46;
const HB = 790;

function Histogram({ direct, fourier }) {
  return (
    <g>
      <line x1={150} y1={HB} x2={900} y2={HB} stroke={C.ink} strokeWidth={3} />
      {R_DIRECT.map((v, n) => (
        <g key={n}>
          <rect x={histX(n) - 16} y={HB - v * 60 * direct} width={32} height={v * 60 * direct} fill={C.blue} opacity={0.8} />
          {fourier > 0 && <rect x={histX(n) - 21} y={HB - R_FOURIER[n] * 60 * fourier} width={42} height={Math.max(0, R_FOURIER[n] * 60 * fourier)} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray="6 4" />}
          <Label x={histX(n)} y={HB + 30} size={20} color={C.pencil}>{n}</Label>
        </g>
      ))}
      <Label x={525} y={HB + 60} size={26} font="math" italic opacity={direct}>r(n) = #{'{'}(a, b) ∈ A²: a + b = n{'}'}</Label>
    </g>
  );
}

function Grid({ p }) {
  const cell = 64;
  const x0 = 330;
  const y0 = 340;
  return (
    <g>
      {A.map((a, i) => (
        <g key={i}>
          <Label x={x0 + i * cell + cell / 2} y={y0 - 14} size={26} font="mono" color={HUE[i]} weight={700}>{a}</Label>
          <Label x={x0 - 20} y={y0 + i * cell + cell / 2 + 9} size={26} font="mono" color={HUE[i]} weight={700} anchor="end">{a}</Label>
        </g>
      ))}
      {A.flatMap((a, i) =>
        A.map((b, j) => {
          const k = easeOut(seg(p, (i * 4 + j) / 20, (i * 4 + j) / 20 + 0.2));
          return (
            <g key={`${i}${j}`} opacity={k}>
              <rect x={x0 + j * cell + 3} y={y0 + i * cell + 3} width={cell - 6} height={cell - 6} fill={C.paper} stroke={C.pencil} />
              <Label x={x0 + j * cell + cell / 2} y={y0 + i * cell + cell / 2 + 10} size={26} font="mono">{a + b}</Label>
            </g>
          );
        }),
      )}
    </g>
  );
}

function Clock({ opacity, children }) {
  return (
    <g opacity={opacity}>
      <Circle c={O} r={R} width={4} color={C.ink} />
      {Array.from({ length: N }, (_, x) => {
        const inA = A.includes(x);
        const [px, py] = onClock(x);
        const [lx, ly] = onClock(x, R + 34);
        return (
          <g key={x}>
            <circle cx={px} cy={py} r={inA ? 11 : 5} fill={inA ? HUE[A.indexOf(x)] : C.ink} />
            <Label x={lx} y={ly + 9} size={22} color={inA ? C.ink : C.pencil} weight={inA ? 700 : 400}>{x}</Label>
          </g>
        );
      })}
      {children}
    </g>
  );
}

function Chain({ k, scale = 0.36, opacity = 1 }) {
  const pts = phasorChain(A, k, N).map(z => [O[0] + z.re * R * scale, O[1] - z.im * R * scale]);
  return (
    <g opacity={opacity}>
      {pts.slice(1).map((pt, i) => (
        <Arrow key={i} from={pts[i]} to={pt} color={HUE[i]} width={5} head={12} seed={i + 1} />
      ))}
      <Arrow from={O} to={pts.at(-1)} color={C.ink} width={8} head={18} seed={9} />
    </g>
  );
}

const specX = k => 1085 + k * 42;
const SB = 860;

function Spectrum({ k, squared, opacity }) {
  return (
    <g opacity={opacity}>
      <line x1={1060} y1={SB} x2={1760} y2={SB} stroke={C.ink} strokeWidth={2} />
      {SPEC.map((z, i) => {
        const shown = i <= k;
        const h = cabs(z) * 22 * (1 - squared) + cabs(z) ** 2 * 5.5 * squared;
        return shown ? <rect key={i} x={specX(i) - 13} y={SB - h} width={26} height={h} fill={i === k ? C.ink : C.violet} opacity={0.8} /> : null;
      })}
      <Label x={1780} y={SB - 10} size={26} anchor="start" font="math" italic opacity={1 - squared}>|Â(k)|</Label>
      <Label x={1780} y={SB - 10} size={26} anchor="start" font="math" italic opacity={squared}>|Â(k)|²</Label>
    </g>
  );
}

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const left = 1 - easeInOut(seg(p.why, 0, 0.3));
  const right = easeOut(p.clock) * (1 - easeInOut(seg(p.why, 0, 0.3)));
  const k = p.square > 0 ? 3 : Math.min(N - 1, Math.floor(seg(p.transform, 0.05, 0.95) * N));
  const z = SPEC[3];
  const z2 = cmul(z, z);

  return (
    <g>
      <g opacity={left}>
        {A.map((a, i) => (
          <g key={a} opacity={easeOut(seg(p.stamps, i * 0.1, 0.4 + i * 0.1))}>
            <rect x={180 + i * 150} y={170} width={110} height={120} rx={4} fill={C.paper} stroke={HUE[i]} strokeWidth={6} strokeDasharray="4 4" />
            <Label x={235 + i * 150} y={250} size={52} weight={700} color={HUE[i]}>{a}</Label>
          </g>
        ))}
        <g opacity={inOut(seg(p.direct, 0, 0.2), seg(p.clock, 0, 0.3))}>
          <Grid p={p.direct} />
        </g>
        <Histogram direct={easeOut(seg(p.direct, 0.5, 1))} fourier={easeOut(seg(p.inverse, 0.1, 0.6))} />
        <Label x={525} y={430} size={34} color={MAX_ERR < 1e-9 ? C.green : C.red} opacity={easeOut(seg(p.inverse, 0.6, 0.9))}>
          Fourier 算的 vs 数出来的：最大差 {MAX_ERR.toExponential(1)}
        </Label>
      </g>

      <Clock opacity={right}>
        <g opacity={inOut(p.char, seg(p.transform, 0, 0.2))}>
          <Arrow from={O} to={onClock(2, R * 0.8)} color={HUE[1]} width={7} progress={easeInOut(seg(p.char, 0.2, 0.4))} />
          <Arrow from={O} to={onClock(5, R * 0.8)} color={HUE[2]} width={7} progress={easeInOut(seg(p.char, 0.4, 0.6))} />
          <Arrow from={O} to={onClock(7, R * 0.8)} color={C.violet} width={9} progress={easeInOut(seg(p.char, 0.6, 0.8))} />
          <Label x={O[0]} y={O[1] + R + 84} size={32} font="math" italic opacity={seg(p.char, 0.7, 0.9)}>
            χ(2 + 5) = χ(2) · χ(5)
          </Label>
        </g>
        {p.transform > 0 && <Chain k={k} opacity={1 - easeInOut(seg(p.inverse, 0, 0.3))} />}
        {p.square > 0 && (
          <g opacity={easeOut(seg(p.square, 0.3, 0.6)) * (1 - easeInOut(seg(p.inverse, 0, 0.3)))}>
            <Arrow from={O} to={at({ re: z2.re * 0.07, im: z2.im * 0.07 })} color={C.red} width={8} head={18} seed={13} />
            <Label x={at({ re: z2.re * 0.07, im: z2.im * 0.07 })[0] + 16} y={at({ re: z2.re * 0.07, im: z2.im * 0.07 })[1] - 14} size={30} anchor="start" font="math" italic color={C.red}>Â(3)²</Label>
          </g>
        )}
        <Label x={O[0]} y={O[1] + R + 84} size={30} font="math" italic opacity={inOut(seg(p.transform, 0.1, 0.3), seg(p.square, 0, 0.2))}>
          k = {k}：Â(k) = Σ_(a∈A) e^(−2πi·ka/16)
        </Label>
      </Clock>
      <Spectrum k={p.square > 0 ? N - 1 : k} squared={easeInOut(seg(p.square, 0.3, 0.8))} opacity={easeOut(seg(p.transform, 0, 0.1)) * right} />

      <g opacity={inOut(seg(p.why, 0.2, 0.5), seg(p.link, 0, 0.3))}>
        <Card x={310} y={290} w={1300} h={400} />
        <Label x={W / 2} y={390} size={40} font="math" italic>r(n) = (1/16) Σ_k Â(k)² · e^(2πi·kn/16)</Label>
        <Label x={W / 2} y={480} size={32}>要知道 r(n) 是否为正，只需知道哪些 Â(k) 很长</Label>
        <Label x={W / 2} y={560} size={30} color={C.pencil}>长的箭头 = A 里藏着的周期性结构（主弧）；其余是噪声（次弧）</Label>
        <Label x={W / 2} y={630} size={30} color={C.pencil}>哥德巴赫、Roth 三项等差定理，都是这样估计的</Label>
      </g>

      <g opacity={easeOut(seg(p.link, 0.2, 0.6))}>
        <Label x={560} y={330} size={40} weight={600} color={C.blue}>Möbius</Label>
        <Label x={560} y={400} size={30}>偏序上的累加 ζ</Label>
        <Label x={560} y={450} size={30}>反演：μ</Label>
        <Label x={1360} y={330} size={40} weight={600} color={C.violet}>Fourier</Label>
        <Label x={1360} y={400} size={30}>群上的卷积 ∗</Label>
        <Label x={1360} y={450} size={30}>反演：逆变换</Label>
        <Stroke pts={[[760, 400], [1160, 400]]} width={6} color={C.ink} progress={easeInOut(seg(p.link, 0.4, 0.8))} />
        <Label x={W / 2} y={600} size={34}>同一个念头：换一组坐标，让“累加”变成对角的</Label>
        <Label x={W / 2} y={660} size={28} color={C.pencil}>特征标 χ 是 (ℤ₁₆, +) → (ℂˣ, ×) 的同态——第一幕的“保持运算”又出现了</Label>
      </g>
    </g>
  );
}

export default { beats, View };
