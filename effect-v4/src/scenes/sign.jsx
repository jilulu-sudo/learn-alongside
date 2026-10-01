// 序 · 签名不说真话。同一个除法：普通函数在 b = 0 时从签名之外掉下去；Effect 把这条路画进图里。
import code from '../../snippets/00-divide.ts?raw';
import { lab } from '../labs/sign.js';
import { C, Dot, Line, Path, Seal, Sig, Text } from '../paint/ink.jsx';
import { along, lerp, quad, ramp, seg } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';

const Y = 380;
const X0 = 300;
const X1 = 1300;
const XM = 800;
const E_END = [1010, 580];
const MARKS = ['序', '一', '二', '三', '四', '五', '六', '七', '终'];

const branch = `M ${XM} ${Y} Q ${XM + 60} ${E_END[1]} ${E_END[0]} ${E_END[1]}`;
const onBranch = t => quad([XM, Y], [XM + 60, E_END[1]], E_END, t);

// 一颗珠子走完一次 divide(4, b)：b = 2 走主线到 A；b = 0 在中间拐进红色岔路到 E。
function Walk({ b, p, label = true }) {
  if (p <= 0) return null;
  const main = b === 0 ? seg(p, 0, 0.55) : p;
  const [x, y] = b === 0 && p > 0.55 ? onBranch(seg(p, 0.55, 1)) : along([[X0, Y], [b === 0 ? XM : X1, Y]], main);
  return (
    <g>
      <Dot x={x} y={y} r={11} />
      {label && (
        <Text x={x} y={y - 26} size={22} mono opacity={1 - seg(p, 0.9, 1)}>
          {`4, ${b}`}
        </Text>
      )}
    </g>
  );
}

function View({ clock, trace, params }) {
  const { p } = clock;
  const cases = trace.cases;
  const fn = p('fn');
  const crack = p('crack');
  const three = p('three');
  const rails = p('rails');
  const run = p('run');
  const title = p('title');
  const glyph = ramp(three, 0, 0.2);
  const fadeAll = 1 - ramp(title, 0, 0.18);
  const crackOpen = ramp(crack, 0, 0.15) * (1 - glyph);
  const fall = seg(crack, 0.5, 0.85);
  const [fx, fy] = quad([XM, Y], [XM + 140, Y - 40], [XM + 180, 820], fall);

  return (
    <g>
      <g opacity={fadeAll}>
        <Text x={XM} y={Y - 92} size={30} mono opacity={ramp(fn, 0.1, 0.35)}>
          {glyph > 0.5 ? 'divide(a: number, b: number)' : '(a: number, b: number) => number'}
        </Text>

        {/* 主线；裂缝出现时中间断开 */}
        <Line x1={X0} y1={Y} x2={XM - 14 * crackOpen} y2={Y} p={ramp(fn, 0, 0.3) * 1.0} w={4} />
        <Line x1={XM + 14 * crackOpen} y1={Y} x2={X1} y2={Y} p={seg(fn, 0.15, 0.3)} w={4} />
        {crackOpen > 0 && (
          <Path d={`M ${XM - 14} ${Y - 18} L ${XM - 4} ${Y - 4} L ${XM - 12} ${Y + 6} L ${XM + 2} ${Y + 20}`} color={C.e} w={2.5} opacity={crackOpen} />
        )}

        {/* 第一拍：b = 2，走到底，得到 2 */}
        <g opacity={1 - ramp(crack, 0, 0.12)}>
          <Walk b={2} p={seg(fn, 0.4, 0.85)} />
        </g>
        <Text x={X1 + 30} y={Y + 10} size={30} mono anchor="start" opacity={ramp(fn, 0.85, 0.95) * (1 - ramp(crack, 0, 0.15)) * (1 - glyph)}>
          {String(cases[2].plain.value)}
        </Text>
        <Text x={X1 + 30} y={Y + 10} size={26} mono anchor="start" color={C.pencil} opacity={(1 - glyph) * ramp(fn, 0.2, 0.3) * ramp(crack, 0, 0.15)}>
          number
        </Text>

        {/* 第二拍：b = 0，珠子在裂缝处掉出签名 */}
        {crack > 0.2 && glyph < 1 && (
          <g opacity={1 - glyph}>
            {fall === 0 ? (
              <Walk b={2} p={seg(crack, 0.2, 0.5) * 0.49} label={false} />
            ) : (
              <>
                <Path d={`M ${XM} ${Y} Q ${XM + 140} ${Y - 40} ${XM + 180} 820`} color={C.e} w={2} dash="2 10" opacity={0.7 * fall} />
                <Dot x={fx} y={fy} r={11} opacity={1 - seg(crack, 0.8, 0.95)} />
              </>
            )}
            <Text x={XM - 250} y={Y - 26} size={22} mono opacity={seg(crack, 0.2, 0.3) * (1 - seg(crack, 0.5, 0.6))}>
              4, 0
            </Text>
            <Text x={XM + 220} y={610} size={26} mono anchor="start" color={C.e} opacity={ramp(crack, 0.55, 0.7)}>
              {`throw: ${cases[0].plain.thrown}`}
            </Text>
            <Text x={XM + 220} y={652} size={24} anchor="start" color={C.pencil} opacity={ramp(crack, 0.65, 0.8)}>
              签名里没有这条路
            </Text>
          </g>
        )}

        {/* 第三拍起：三个出口 */}
        <Path d={branch} color={C.e} w={4} p={ramp(three, 0.15, 0.45)} />
        <Dot x={E_END[0]} y={E_END[1]} r={13} color={C.e} opacity={ramp(three, 0.4, 0.5)} />
        <Text x={E_END[0] + 30} y={E_END[1] + 10} size={28} mono anchor="start" color={C.e} opacity={ramp(three, 0.45, 0.55)}>
          Error
        </Text>
        <Dot x={X1} y={Y} r={13} color={C.a} opacity={ramp(three, 0.3, 0.4)} />
        <Text x={X1 + 30} y={Y + 10} size={28} mono anchor="start" color={C.a} opacity={ramp(three, 0.35, 0.45)}>
          number
        </Text>
        <Path d={`M ${X0 + 14} ${Y - 28} L ${X0 - 6} ${Y - 28} L ${X0 - 6} ${Y + 28} L ${X0 + 14} ${Y + 28}`} color={C.r} w={4} p={ramp(three, 0.55, 0.7)} />
        <Text x={X0 - 30} y={Y + 10} size={28} mono anchor="end" color={C.r} opacity={ramp(three, 0.6, 0.7)}>
          never
        </Text>
        {[
          [X1, Y - 40, '成功 · A', C.a, 0.35],
          [E_END[0], E_END[1] + 56, '失败 · E', C.e, 0.45],
          [X0 - 70, Y - 48, '需要 · R', C.r, 0.6],
        ].map(([x, y, s, c, at]) => (
          <Text key={s} x={x} y={y} size={22} color={c} opacity={ramp(three, at, at + 0.1) * (1 - ramp(rails, 0, 0.1))}>
            {s}
          </Text>
        ))}

        {/* 第四拍：先 b = 2 到 A，再 b = 0 沿岔路到 E。结果来自真实的 Exit */}
        {rails > 0 && run === 0 && (
          <g>
            <Walk b={2} p={seg(rails, 0.05, 0.4)} />
            <Walk b={0} p={seg(rails, 0.45, 0.85)} />
            <Text x={X1 + 30} y={Y + 52} size={22} mono anchor="start" color={C.a} opacity={ramp(rails, 0.38, 0.45)}>
              {fmtExit(cases[2].effect)}
            </Text>
            <Text x={E_END[0] + 30} y={E_END[1] + 52} size={22} mono anchor="start" color={C.e} opacity={ramp(rails, 0.85, 0.92)}>
              {fmtExit(cases[0].effect)}
            </Text>
          </g>
        )}

        {/* 第五拍：你选的 b */}
        {run > 0 && (
          <g opacity={1 - ramp(title, 0, 0.15)}>
            <Walk b={params.b} p={seg(run, 0.05, 0.5)} />
            {[
              [`divideOrThrow(4, ${params.b})`, cases[params.b].plain.ok ? String(cases[params.b].plain.value) : `throw: ${cases[params.b].plain.thrown}`, cases[params.b].plain.ok ? C.ink : C.e, 0.5],
              [`Effect.runSyncExit(divide(4, ${params.b}))`, fmtExit(cases[params.b].effect), cases[params.b].effect.ok ? C.a : C.e, 0.6],
            ].map(([left, right, color, at], i) => (
              <g key={i} opacity={ramp(run, at, at + 0.1)}>
                <Text x={XM - 20} y={680 + i * 44} size={24} mono anchor="end">
                  {left}
                </Text>
                <Text x={XM} y={680 + i * 44} size={24} mono anchor="start" color={C.pencil}>
                  →
                </Text>
                <Text x={XM + 44} y={680 + i * 44} size={24} mono anchor="start" color={color}>
                  {right}
                </Text>
              </g>
            ))}
          </g>
        )}

        <Sig
          x={XM}
          y={800}
          a="number"
          e="Error"
          r="never"
          show={{ a: ramp(three, 0.3, 0.4), e: ramp(three, 0.45, 0.55), r: ramp(three, 0.6, 0.7) }}
          opacity={ramp(three, 0.25, 0.35) * (1 - ramp(run, 0.4, 0.5))}
        />
      </g>

      {/* 片名 */}
      {title > 0 && (
        <g>
          <Text x={XM} y={420} size={140} weight={600} opacity={ramp(title, 0.15, 0.35)} spacing={24}>
            一根线
          </Text>
          <Text x={XM} y={500} size={30} color={C.pencil} opacity={ramp(title, 0.3, 0.45)}>
            Effect v4 的九段小课 · effect@4.0.0-rc.118
          </Text>
          <Line x1={400} y1={610} x2={1200} y2={610} p={ramp(title, 0.35, 0.65)} w={3} />
          {MARKS.map((m, i) => {
            const x = lerp(400, 1200, i / (MARKS.length - 1));
            return <Seal key={m} x={x - 20} y={590} size={40} char={m} opacity={ramp(title, 0.4 + i * 0.04, 0.48 + i * 0.04)} />;
          })}
        </g>
      )}
    </g>
  );
}

export const scene = {
  id: 'sign',
  mark: '序',
  title: '签名不说真话',
  file: 'snippets/00-divide.ts',
  code,
  lab,
  replay: 'run',
  View,
  readout: ({ params, trace }) => {
    const c = trace.cases[params.b];
    return [
      { k: `divideOrThrow(4, ${params.b})`, v: c.plain.ok ? String(c.plain.value) : `throw：${c.plain.thrown}`, tone: c.plain.ok ? '' : 'e' },
      { k: `divide(4, ${params.b})`, v: fmtExit(c.effect), tone: c.effect.ok ? 'a' : 'e' },
    ];
  },
  beats: [
    { id: 'fn', say: '先看一个普通的函数：divide(a, b) 收两个数，还一个数。签名上就写了这么多。', hl: ['divideOrThrow = (a: number, b: number): number'] },
    { id: 'crack', say: '可是 b 等于 0 的时候，它会 throw。签名里没有这条路：线在半路断开，值从图外掉了下去。', hl: ['throw new Error'] },
    { id: 'three', say: 'Effect 的想法很朴素：把看不见的也写进类型。一个程序有三个出口：成功、失败，和它开跑之前需要的东西。', hl: ['Effect.Effect<number, Error, never>'] },
    { id: 'rails', say: '失败不再是断口，而是画在图上的一条岔路。你看得见它，编译器也看得见它。', hl: ['Effect.fail(new Error', 'Effect.succeed(a / b)'] },
    {
      id: 'run',
      say: ({ params }) =>
        params.b === 0
          ? '换你来拨：b = 0。普通函数直接抛出异常；Effect 的版本走红色岔路，失败装在 Exit 里交还给你。'
          : '换你来拨：b = 2。两个版本都得到 2；区别在于，Effect 的签名早就告诉过你，它也可能失败。',
      hl: ['Effect.runSync'],
    },
    { id: 'title', say: '这部小片子只讲这一根线：怎么画它，怎么走它，最后怎么把很多根织成一匹布。' },
  ],
};
