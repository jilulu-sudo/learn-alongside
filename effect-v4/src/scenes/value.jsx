// 一 · 程序是值。Effect 是一张图纸：创建、组合都不执行；runSync 才沿着图纸走一遍。
// count 的读数、每次运行的结果，全部来自 labs/value.js 的真实运行。
import code from '../../snippets/01-value.ts?raw';
import { lab } from '../labs/value.js';
import { C, Dot, Line, Sig, Text } from '../paint/ink.jsx';
import { lerp, ramp, seg } from '../paint/ease.js';

const Y = 430;
const X0 = 170;
const XM = 620;
const X1 = 1070;
const BOX = { x: 1210, y: 300, w: 250, h: 230 };

// 第 k 颗珠子（从 0 数）：这一拍里的珠子依次出发，各自走完自己那一段进度。
function beadsOf(p, ks) {
  const n = ks.length;
  return ks.map((k, i) => {
    const a = 0.08 + (0.8 * i) / n;
    return { k, t: seg(p, a, a + (0.8 / n) * 0.75) };
  });
}

function View({ clock, params, trace }) {
  const { p } = clock;
  const make = p('make');
  const compose = p('compose');
  const run = p('run');
  const again = p('again');
  const value = p('value');
  const end = params.map ? X1 : XM;
  const fade = 1 - ramp(value, 0, 0.25);

  const first = trace.results.length > 0 ? beadsOf(run, [0]) : [];
  const rest = beadsOf(again, trace.results.slice(1).map((_, i) => i + 1));
  const beads = [...first, ...rest];
  const arrived = beads.filter(b => b.t >= 1).length;
  const solid = beads.length ? Math.max(...beads.map(b => b.t)) : 0;
  const count = arrived === 0 ? trace.afterCreate : arrived;

  return (
    <g>
      <g opacity={fade}>
        {/* 图纸：虚线。走过的地方变成实线。 */}
        <Line x1={X0} y1={Y} x2={XM} y2={Y} p={ramp(make, 0, 0.4)} dash="10 12" w={3} color={C.pencil} />
        {params.map && <Line x1={XM} y1={Y} x2={X1} y2={Y} p={ramp(compose, 0.3, 0.7)} dash="10 12" w={3} color={C.pencil} />}
        <Line x1={X0} y1={Y} x2={end} y2={Y} p={solid} w={4} />
        <Dot x={X0} y={Y} r={10} hollow opacity={ramp(make, 0, 0.1)} />
        <Text x={(X0 + XM) / 2} y={Y - 34} size={24} mono opacity={ramp(make, 0.2, 0.4)}>
          Effect.sync(() =&gt; ++count)
        </Text>
        {params.map && (
          <>
            <Dot x={XM} y={Y} r={10} hollow opacity={ramp(compose, 0.3, 0.4)} />
            <Dot x={X1} y={Y} r={10} hollow opacity={ramp(compose, 0.6, 0.7)} />
            <Text x={(XM + X1) / 2} y={Y - 34} size={24} mono opacity={ramp(compose, 0.4, 0.6)}>
              Effect.map(n =&gt; n * 10)
            </Text>
          </>
        )}
        {!params.map && <Dot x={XM} y={Y} r={10} hollow opacity={ramp(make, 0.3, 0.4)} />}
        <Text x={(X0 + end) / 2} y={Y + 62} size={24} color={C.pencil} opacity={ramp(make, 0.45, 0.6) * (1 - ramp(run, 0, 0.1))}>
          一张还没开工的图纸
        </Text>

        {/* 组合返回新图纸，旧的那张原样还在 */}
        {params.map && (
          <g opacity={ramp(compose, 0.05, 0.3) * (1 - ramp(run, 0, 0.15))}>
            <Line x1={X0} y1={250} x2={XM} y2={250} dash="10 12" w={3} color={C.pencil} />
            <Dot x={X0} y={250} r={8} hollow />
            <Dot x={XM} y={250} r={8} hollow />
            <Text x={XM + 30} y={258} size={22} anchor="start" color={C.pencil}>
              原来那张：没有变
            </Text>
          </g>
        )}
        {!params.map && (
          <Text x={XM + 40} y={Y + 8} size={24} anchor="start" color={C.pencil} opacity={ramp(compose, 0.1, 0.3) * (1 - ramp(run, 0, 0.1))}>
            这次没有加 map
          </Text>
        )}

        {/* 运行：每颗珠子是一次 runSync */}
        {beads.map(b =>
          b.t > 0 && b.t < 1 ? <Dot key={b.k} x={lerp(X0, end, b.t)} y={Y} r={11} /> : null,
        )}
        {beads.map((b, i) => (
          <Text key={`r${b.k}`} x={end + 34} y={Y + 10 + (i - (beads.length - 1) / 2) * 44} size={28} mono anchor="start" color={C.a} opacity={ramp(b.t, 0.95, 1)}>
            {`→ ${trace.results[b.k]}`}
          </Text>
        ))}
        {trace.results.length === 0 && (
          <Text x={(X0 + end) / 2} y={Y + 62} size={24} color={C.pencil} opacity={ramp(run, 0.2, 0.4)}>
            一次也没有运行：图纸一直是图纸
          </Text>
        )}

        {/* count 的真实读数 */}
        <g opacity={ramp(make, 0.4, 0.6)}>
          <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={8} style={{ fill: 'none', stroke: C.rule, strokeWidth: 2 }} />
          <Text x={BOX.x + BOX.w / 2} y={BOX.y + 46} size={24} mono color={C.pencil}>
            count
          </Text>
          <Text x={BOX.x + BOX.w / 2} y={BOX.y + 168} size={120} mono weight={600}>
            {String(count)}
          </Text>
          <Text x={BOX.x + BOX.w / 2} y={BOX.y + BOX.h + 40} size={20} color={C.pencil}>
            真实读数
          </Text>
        </g>
      </g>

      {/* 程序是值：一排图纸，放在数组里 */}
      {value > 0 && (
        <g opacity={ramp(value, 0.15, 0.4)}>
          <Text x={800} y={300} size={30} mono>
            const plans = [
          </Text>
          {['program', 'program.pipe(Effect.retry(…))', 'program.pipe(Effect.timeout(…))'].map((label, i) => {
            const x = 340 + i * 460;
            const o = ramp(value, 0.25 + i * 0.1, 0.4 + i * 0.1);
            return (
              <g key={label} opacity={o}>
                <rect x={x - 210} y={360} width={420} height={120} rx={10} style={{ fill: 'none', stroke: C.pencil, strokeWidth: 2 }} />
                <Line x1={x - 120} y1={410} x2={x + 120} y2={410} dash="8 10" color={C.pencil} />
                <Dot x={x - 120} y={410} r={7} hollow />
                <Dot x={x + 120} y={410} r={7} hollow />
                <Text x={x} y={454} size={19} mono color={C.pencil}>
                  {label}
                </Text>
              </g>
            );
          })}
          <Text x={800} y={545} size={30} mono>
            ]
          </Text>
          <Text x={800} y={620} size={24} color={C.pencil} opacity={ramp(value, 0.6, 0.8)}>
            存起来、传出去、组合起来；最后在一处运行
          </Text>
        </g>
      )}

      <Sig x={800} y={800} a="number" e="never" r="never" opacity={ramp(make, 0.5, 0.7)} />
    </g>
  );
}

export const scene = {
  id: 'value',
  mark: '一',
  title: '程序是值',
  file: 'snippets/01-value.ts',
  code,
  lab,
  replay: 'run',
  View,
  readout: ({ params, trace }) => [
    { k: '创建之后', v: `count = ${trace.afterCreate}` },
    { k: `runSync × ${params.runs}`, v: trace.results.length ? trace.results.join('、') : '（没有运行）', tone: 'a' },
    { k: '最后', v: `count = ${trace.count}` },
  ],
  beats: [
    { id: 'make', say: 'Effect.sync(() => ++count) 什么也不做。它只是把要做的事记下来，像一张还没开工的图纸。count 仍然是 0。', hl: ['Effect.sync', '仍然是 0'] },
    {
      id: 'compose',
      say: ({ params }) =>
        params.map
          ? '往上加一步 map，也只是在图纸上续画一段。pipe 返回一张新图纸，原来那张原封不动。'
          : '这一次没有加 map：图纸只有一步。加不加，count 都还是 0。',
      hl: ['Effect.map'],
    },
    {
      id: 'run',
      say: ({ trace }) =>
        trace.results.length
          ? `直到在程序的边缘调用 Effect.runSync，运行时才沿着图纸走一遍：count 变成 1，得到 ${trace.results[0]}。`
          : '这一次一次也没有调用 runSync：图纸一直是图纸，count 停在 0。',
      hl: ['Effect.runSync(program) // 10'],
    },
    {
      id: 'again',
      say: ({ trace }) =>
        trace.results.length > 1
          ? `同一张图纸可以再走一遍。一共走了 ${trace.results.length} 遍，得到 ${trace.results.join('、')}；每走一遍，count 才加一。`
          : '同一张图纸可以走很多遍；每走一遍，count 才加一。试试把右边的次数调到 3。',
      hl: ['Effect.runSync(program) // 20'],
      dur: ({ trace }) => 2.2 * Math.max(1, trace.results.length - 1) + 1.5,
    },
    { id: 'value', say: '所以 Effect<A, E, R> 是一个值：可以存起来、传出去、组合起来，最后在一处运行。', hl: ['export const program'] },
  ],
};
