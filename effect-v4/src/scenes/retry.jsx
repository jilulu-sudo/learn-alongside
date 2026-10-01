// 四 · 重试与时间。请求每次 100ms，失败后按时间表等待再来；timeout 到点切断。
// 每一个刻度、每一段等待，都来自 labs/retry.js 在测试时钟上的真实运行。
import code from '../../snippets/04-retry.ts?raw';
import { lab } from '../labs/retry.js';
import { Axis, C, Cross, Cut, Dot, Line, Path, Text } from '../paint/ink.jsx';
import { ramp } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';
import { lanes, replayDur, virtualTime } from './replay.js';

const X0 = 180;
const X1 = 1460;
const Y = 470;
const AY = 660;
// 记录在 2 秒以内，就用 0–2000 的轴；否则用 0–4000。timeout 最长 2 秒，总在轴内。
export const axisOf = trace => (trace.end <= 2000 ? 2000 : 4000);
const scaleOf = ms => t => X0 + ((X1 - X0) * t) / ms;

export function attemptsOf(trace) {
  const L = lanes(trace);
  return Object.keys(L)
    .map(Number)
    .filter(k => k > 0)
    .sort((a, b) => a - b)
    .map(k => ({ k, start: L[k].start, end: L[k].fail ?? L[k].ok ?? L[k].interrupt, outcome: L[k].ok != null ? 'ok' : L[k].interrupt != null ? 'interrupt' : 'fail' }));
}
export const waitsOf = trace => {
  const a = attemptsOf(trace);
  return a.slice(1).map((x, i) => ({ from: a[i].end, to: x.start, ms: x.start - a[i].end }));
};
const cutOf = trace => lanes(trace)[0]?.cut;

const policyText = ({ schedule, times }) =>
  `Effect.retry({ schedule: Schedule.${schedule === 'exponential' ? 'exponential("100 millis")' : 'spaced("200 millis")'}, times: ${times} })`;

function Timeline({ trace, vt, params, xOf, labels = true }) {
  const attempts = attemptsOf(trace);
  const waits = waitsOf(trace);
  const cut = cutOf(trace);
  return (
    <g>
      {waits.map((w, i) =>
        vt > w.from ? (
          <g key={`w${i}`}>
            <Path
              d={`M ${xOf(w.from)} ${Y} Q ${(xOf(w.from) + xOf(w.to)) / 2} ${Y - 70 - Math.min(80, w.ms / 8)} ${xOf(w.to)} ${Y}`}
              color={C.pencil}
              w={2}
              p={Math.min(1, (vt - w.from) / Math.max(1, w.ms))}
            />
            {labels && (
              <Text x={(xOf(w.from) + xOf(w.to)) / 2} y={Y - 52 - Math.min(80, w.ms / 8) / 2 - 12} size={20} mono color={C.pencil} opacity={vt >= w.to ? 1 : 0}>
                {`等 ${w.ms}`}
              </Text>
            )}
          </g>
        ) : null,
      )}
      {/* 等待中被 timeout 切断：从上一次结束画到切断处 */}
      {cut != null && attempts.length > 0 && attempts.at(-1).outcome === 'fail' && vt > attempts.at(-1).end && (
        <Path
          d={`M ${xOf(attempts.at(-1).end)} ${Y} Q ${(xOf(attempts.at(-1).end) + xOf(cut)) / 2} ${Y - 90} ${xOf(cut)} ${Y - 40}`}
          color={C.pencil}
          w={2}
          dash="4 8"
          p={Math.min(1, (vt - attempts.at(-1).end) / Math.max(1, cut - attempts.at(-1).end))}
        />
      )}
      {attempts.map(a =>
        vt > a.start ? (
          <g key={a.k}>
            <Line x1={xOf(a.start)} y1={Y} x2={xOf(Math.min(vt, a.end))} y2={Y} w={12} color={a.outcome === 'interrupt' ? C.pencil : C.ink} />
            {labels && (
              <Text x={xOf(a.start) + (xOf(a.end) - xOf(a.start)) / 2} y={Y + 46} size={20} mono color={C.pencil}>
                {`#${a.k}`}
              </Text>
            )}
            {vt >= a.end && a.outcome === 'fail' && <Cross x={xOf(a.end) + 4} y={Y - 26} size={8} />}
            {vt >= a.end && a.outcome === 'ok' && <Dot x={xOf(a.end) + 4} y={Y} r={12} color={C.a} />}
            {vt >= a.end && a.outcome === 'interrupt' && <Cut x={xOf(a.end)} y={Y} size={20} color={C.e} />}
          </g>
        ) : null,
      )}
      {params.timeout > 0 && (
        <g>
          <Line x1={xOf(params.timeout)} y1={330} x2={xOf(params.timeout)} y2={AY + 10} color={C.e} w={2} dash="6 8" />
          <Text x={xOf(params.timeout)} y={316} size={20} mono color={C.e}>
            {`timeout ${params.timeout}ms`}
          </Text>
        </g>
      )}
      {cut != null && vt >= cut && <Cut x={xOf(cut)} y={Y - 40} size={22} color={C.e} w={4} />}
    </g>
  );
}

function View({ clock, params, trace }) {
  const { p } = clock;
  const axis = p('axis');
  const retry = p('retry');
  const run = p('run');
  const exp = p('exp');
  const timeout = p('timeout');
  const ops = p('ops');
  const axisMs = axisOf(trace);
  const xOf = scaleOf(axisMs);
  const vt = run > 0 ? virtualTime(clock, 'run', trace.end) : 0;
  const waits = waitsOf(trace);
  const attempts = attemptsOf(trace);
  const pre = run === 0;

  return (
    <g>
      <Axis x0={X0} x1={X1} y={AY} ms={axisMs} every={axisMs / 8} p={ramp(axis, 0, 0.5)} label={t => (t === 0 ? '0' : `${t}ms`)} />
      {/* 第一拍：一次请求的样子 */}
      {pre && (
        <g opacity={ramp(axis, 0.4, 0.6)}>
          <Line x1={xOf(0)} y1={Y} x2={xOf(Math.min(100, 100 * ramp(axis, 0.5, 0.8)))} y2={Y} w={12} />
          <Cross x={xOf(100) + 4} y={Y - 26} size={8} opacity={ramp(axis, 0.8, 0.9)} />
          <Text x={xOf(100) + 30} y={Y + 8} size={22} anchor="start" color={C.pencil} opacity={ramp(axis, 0.8, 0.95)}>
            一次请求：100 毫秒，失败
          </Text>
        </g>
      )}
      <Text x={800} y={170} size={24} mono opacity={ramp(retry, 0.1, 0.3) * (1 - ramp(ops, 0, 0.2))}>
        {policyText(params)}
      </Text>
      {pre && retry > 0 && (
        <Text x={800} y={220} size={22} color={C.pencil} opacity={ramp(retry, 0.4, 0.6)}>
          时间表决定：失败之后，要不要再来，隔多久再来
        </Text>
      )}

      {run > 0 && <Timeline trace={trace} vt={vt} params={params} xOf={xOf} />}
      {run > 0 && vt < trace.end && <Line x1={xOf(vt)} y1={340} x2={xOf(vt)} y2={AY} color={C.pencil} w={1.5} />}

      {/* 结果 */}
      <Text x={800} y={760} size={26} mono color={trace.exit.ok ? C.a : C.e} opacity={run > 0 && vt >= trace.end ? 1 - ramp(ops, 0.5, 0.7) : 0}>
        {`${fmtExit(trace.exit)} · ${trace.end}ms`}
      </Text>

      {/* 退避：等待的长短 */}
      <Text x={800} y={220} size={24} mono color={C.ink} opacity={ramp(exp, 0.1, 0.3) * (1 - ramp(timeout, 0, 0.15))}>
        {waits.length ? `等待：${waits.map(w => w.ms).join(' → ')} 毫秒` : '这一次没有等待：第一次就结束了'}
      </Text>

      {/* timeout 的说明 */}
      <Text x={800} y={220} size={22} color={C.pencil} opacity={ramp(timeout, 0.1, 0.3) * (1 - ramp(ops, 0, 0.15))}>
        {params.timeout === 0
          ? '这一次没有设 timeout。把它拨到 800 毫秒试试'
          : cutOf(trace) != null
            ? `${params.timeout} 毫秒一到就切断：${attempts.at(-1)?.outcome === 'interrupt' ? '正在跑的那一次被中断' : '还在等待的重试被取消'}，结果是 TimeoutError`
            : `${trace.end} 毫秒就结束了，${params.timeout} 毫秒的 timeout 没有用上`}
      </Text>

      {/* 叠起来的算子 */}
      {ops > 0 &&
        ['request', `.pipe(${policyText(params).replace('Effect.retry', 'Effect.retry')})`, params.timeout ? `.pipe(Effect.timeout("${params.timeout} millis"))` : null]
          .filter(Boolean)
          .map((line, i) => (
            <Text key={i} x={250 + i * 30} y={150 + i * 40} size={22} mono anchor="start" opacity={ramp(ops, 0.1 + i * 0.15, 0.3 + i * 0.15)} color={i === 0 ? C.ink : C.r}>
              {line}
            </Text>
          ))}
      <Text x={800} y={770} size={22} color={C.pencil} opacity={ramp(ops, 0.6, 0.8)}>
        图上每一个刻度，都来自这段程序在测试时钟上的一次真实运行
      </Text>
    </g>
  );
}

const runSay = ({ params, trace }) => {
  const a = attemptsOf(trace);
  const w = waitsOf(trace);
  const kind = params.schedule === 'exponential' ? 'exponential("100 millis") 让等待每次翻倍' : 'spaced("200 millis") 让每次都等 200 毫秒';
  const waits = w.length ? `等待依次是 ${w.map(x => x.ms).join('、')} 毫秒。` : '';
  const end = trace.exit.ok ? `第 ${a.at(-1).k} 次成功，用时 ${trace.end} 毫秒。` : cutOf(trace) != null ? `到 ${trace.end} 毫秒被 timeout 切断。` : `重试 ${params.times} 次之后放弃，带着最后一次的 Flaky 失败。`;
  return `${kind}。${waits}${end}`;
};

export const scene = {
  id: 'retry',
  mark: '四',
  title: '重试与时间',
  file: 'snippets/04-retry.ts',
  code,
  lab,
  replay: 'run',
  View,
  readout: ({ trace }) => [
    { k: '请求', v: `${attemptsOf(trace).length} 次` },
    { k: '等待', v: waitsOf(trace).map(w => `${w.ms}ms`).join(' → ') || '无' },
    { k: 'Exit', v: `${fmtExit(trace.exit)} @ ${trace.end}ms`, tone: trace.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'axis', say: '把时间铺开成一条横轴。这次的请求每次要 100 毫秒，而且前几次会失败。', hl: ['Effect.sleep("100 millis")', 'attempts < 4'] },
    { id: 'retry', say: 'Effect.retry 拿一张时间表 Schedule 来决定：失败之后要不要再来，隔多久再来。', hl: ['Effect.retry({', 'times: 5'] },
    { id: 'run', say: runSay, dur: ({ trace }) => replayDur(trace.end) },
    { id: 'exp', say: '退避是声明出来的，不是循环写出来的：换一张时间表，等待就换一种长法。', hl: ['Schedule.exponential'] },
    { id: 'timeout', say: '再套一层 timeout：到点就切断。切断不是撒手不管，正在跑的那一次会被中断、清理干净。', hl: ['Effect.timeout("2 seconds")'] },
    { id: 'ops', say: '重试、退避、超时，各是一个算子，叠起来就是一条策略。改右边的旋钮，这段程序会在测试时钟上重新跑一遍。', hl: ['request.pipe('] },
  ],
};
