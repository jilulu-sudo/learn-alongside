// 五 · 纤程与并发。五个任务（时长取自官方文档的例子），每种跑法都在测试时钟上真实跑过。
// 每一拍回放一份记录：哪一根线何时出发、何时结束、何时被中断。
import code from '../../snippets/05-fibers.ts?raw';
import { lab, AXIS_MS, DURATIONS } from '../labs/fibers.js';
import { Axis, C, Cross, Cut, Dot, Line, Text } from '../paint/ink.jsx';
import { ramp } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';
import { lanes, replayDur, virtualTime } from './replay.js';

const MS_PER_S = 160;
const X0 = 380;
const X1 = 1440;
const AY = 690;
const laneY = n => 250 + (n - 1) * 84;
const xOf = t => X0 + ((X1 - X0) * t) / AXIS_MS;

function Gantt({ trace, vt, only, faded = [] }) {
  const L = lanes(trace);
  const ids = only ?? [1, 2, 3, 4, 5];
  return (
    <g>
      {ids.map(n => {
        const e = L[n] ?? {};
        const y = laneY(n);
        const stop = e.end ?? e.fail ?? e.interrupt;
        const o = faded.includes(n) ? 0.3 : 1;
        if (e.start == null) {
          return (
            <Text key={n} x={X0 + 10} y={y + 8} size={20} anchor="start" color={C.pencil} opacity={vt >= trace.end ? o : 0}>
              没有开始
            </Text>
          );
        }
        return (
          <g key={n} opacity={o}>
            {e.start > 0 && <Line x1={xOf(0)} y1={y} x2={xOf(Math.min(vt, e.start))} y2={y} color={C.pencil} w={2} dash="3 9" />}
            {vt > e.start && <Line x1={xOf(e.start)} y1={y} x2={xOf(Math.min(vt, stop))} y2={y} w={10} color={e.interrupt != null ? C.pencil : C.ink} />}
            {vt >= stop && e.end != null && <Dot x={xOf(stop) + 4} y={y} r={10} color={C.a} />}
            {vt >= stop && e.fail != null && <Cross x={xOf(stop) + 6} y={y} size={10} />}
            {vt >= stop && e.interrupt != null && (
              <g>
                <Cut x={xOf(stop) + 4} y={y} size={18} color={C.e} />
                <Text x={xOf(stop) + 26} y={y + 7} size={20} anchor="start" color={C.pencil}>
                  中断
                </Text>
              </g>
            )}
          </g>
        );
      })}
      {vt >= trace.end && (
        <g>
          <Line x1={xOf(trace.end)} y1={200} x2={xOf(trace.end)} y2={AY} color={trace.exit.ok ? C.a : C.e} w={2} dash="6 6" />
          <Text x={xOf(trace.end)} y={190} size={22} mono color={trace.exit.ok ? C.a : C.e}>
            {`${trace.end}ms`}
          </Text>
        </g>
      )}
      {vt < trace.end && vt > 0 && <Line x1={xOf(vt)} y1={210} x2={xOf(vt)} y2={AY} color={C.pencil} w={1.5} />}
    </g>
  );
}

const STORY = [
  { id: 'seq', key: 'seq', head: 'Effect.all(tasks)' },
  { id: 'bounded', key: 'bounded', head: 'Effect.all(tasks, { concurrency: 2 })' },
  { id: 'unbounded', key: 'unbounded', head: 'Effect.all(tasks, { concurrency: "unbounded" })' },
  { id: 'fail', key: 'failed', head: '{ concurrency: "unbounded" } · 任务 2 在 100ms 失败' },
  { id: 'race', key: 'race', head: 'Effect.race(task(1, 200), task(2, 100))', only: [1, 2] },
  { id: 'yours', key: 'yours', head: null },
];

const yoursHead = ({ concurrency, failing }) =>
  `Effect.all(tasks, { concurrency: ${concurrency === 'unbounded' ? '"unbounded"' : concurrency} })${failing ? ` · 任务 ${failing} 失败` : ''}`;

function View({ clock, params, trace }) {
  const { p } = clock;
  const lanesIn = p('lanes');
  const current = [...STORY].reverse().find(s => p(s.id) > 0);
  const vt = current ? virtualTime(clock, current.id, trace[current.key].end, MS_PER_S) : 0;
  const shown = current ? trace[current.key] : null;

  return (
    <g>
      {[1, 2, 3, 4, 5].map(n => (
        <g key={n} opacity={ramp(lanesIn, 0.05 + n * 0.08, 0.2 + n * 0.08) * (current?.only && !current.only.includes(n) ? 0.25 : 1)}>
          <Text x={150} y={laneY(n) + 8} size={22} anchor="start" mono>
            {`task(${n}, ${DURATIONS[n - 1]})`}
          </Text>
          <Line x1={X0} y1={laneY(n)} x2={X1} y2={laneY(n)} color={C.faint} w={2} />
        </g>
      ))}
      <Axis x0={X0} x1={X1} y={AY} ms={AXIS_MS} every={100} p={ramp(lanesIn, 0.3, 0.7)} label={t => (t % 200 === 0 ? `${t}` : '')} />
      <Text x={X1} y={AY + 70} size={20} anchor="end" color={C.pencil} opacity={ramp(lanesIn, 0.6, 0.8)}>
        毫秒（测试时钟）
      </Text>

      {current && (
        <g key={current.id}>
          <Text x={800} y={140} size={26} mono>
            {current.head ?? yoursHead(params)}
          </Text>
          <Gantt trace={shown} vt={vt} only={current.only} />
          <Text x={800} y={800} size={24} mono color={shown.exit.ok ? C.a : C.e} opacity={vt >= shown.end ? 1 : 0}>
            {fmtExit(shown.exit)}
          </Text>
        </g>
      )}
      {!current && (
        <Text x={800} y={140} size={24} color={C.pencil} opacity={ramp(lanesIn, 0.5, 0.7)}>
          五个任务，五根纤程
        </Text>
      )}
    </g>
  );
}

const yoursSay = ({ params, trace }) => {
  const t = trace.yours;
  const c = params.concurrency === 'unbounded' ? '不限并发' : params.concurrency === 1 ? '一根一根地跑' : `最多 ${params.concurrency} 根同时跑`;
  if (t.exit.ok) return `换你来：${c}，五个任务用了 ${t.end} 毫秒。改改右边的并发数，再放一遍。`;
  const L = lanes(t);
  const cut = Object.values(L).filter(e => e.interrupt != null).length;
  const never = [1, 2, 3, 4, 5].filter(n => L[n]?.start == null).length;
  return `换你来：${c}，任务 ${params.failing} 在 ${t.end} 毫秒失败。${cut ? `正在跑的 ${cut} 根被一起中断` : '没有别的任务在跑'}${never ? `，还没出发的 ${never} 个任务不会再开始` : ''}。`;
};

export const scene = {
  id: 'fibers',
  mark: '五',
  title: '纤程与并发',
  file: 'snippets/05-fibers.ts',
  code,
  lab,
  replay: 'yours',
  View,
  readout: ({ trace }) => [
    { k: '用时', v: `${trace.yours.end}ms` },
    { k: 'Exit', v: fmtExit(trace.yours.exit), tone: trace.yours.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'lanes', say: '每个 Effect 都在一根纤程上运行。纤程很轻，像一根细线，开成千上万根也不费事。', hl: ['const task'] },
    {
      id: 'seq',
      say: ({ trace }) => `默认是顺序的：Effect.all 等一根走完，下一根才出发。五个任务一共 ${trace.seq.end} 毫秒。`,
      hl: ['Effect.all(tasks) //'],
      dur: ({ trace }) => replayDur(trace.seq.end, MS_PER_S),
    },
    {
      id: 'bounded',
      say: ({ trace }) => `concurrency: 2：同一时刻最多两根线在走。一根结束，排队的下一根马上接上，一共 ${trace.bounded.end} 毫秒。`,
      hl: ['concurrency: 2'],
      dur: ({ trace }) => replayDur(trace.bounded.end, MS_PER_S),
    },
    {
      id: 'unbounded',
      say: ({ trace }) => `"unbounded"：全部同时出发，总时长等于最慢的那一根，${trace.unbounded.end} 毫秒。`,
      hl: ['"unbounded"'],
      dur: ({ trace }) => replayDur(trace.unbounded.end, MS_PER_S),
    },
    { id: 'fail', say: '其中一根失败，还在跑的兄弟会在同一刻被中断。这就是结构化并发：子线挂在父线上，不会留下没人管的孤儿。', dur: ({ trace }) => replayDur(trace.failed.end, MS_PER_S) },
    { id: 'race', say: 'race 让两根线赛跑：先到的赢，输的那根当场被中断，不会在后台继续耗着。', hl: ['Effect.race'], dur: ({ trace }) => replayDur(trace.race.end, MS_PER_S) },
    { id: 'yours', say: yoursSay, dur: ({ trace }) => replayDur(trace.yours.end, MS_PER_S) },
  ],
};
