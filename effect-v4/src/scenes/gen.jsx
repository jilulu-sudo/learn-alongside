// 二 · 一步一步写。Effect.gen 像 async/await；第一处失败就短路。
// 哪几站真的跑了，来自记录型 Tracer 收到的 span（Effect.fn 自动产生），不是推断出来的。
import code from '../../snippets/02-gen.ts?raw';
import { lab } from '../labs/gen.js';
import { C, Dot, Line, Path, Sig, Tag, Text } from '../paint/ink.jsx';
import { along, lerp, quad, ramp, seg } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';

const Y = 420;
const X0 = 200;
const X1 = 1400;
const STATIONS = [
  { id: 'parse', x: 480, call: 'yield* parse(input)', error: 'ParseError' },
  { id: 'findUser', x: 840, call: 'yield* findUser(id)', error: 'UserNotFound' },
  { id: 'return', x: 1180, call: 'return `你好，${name}`', error: null },
];
const branchEnd = s => [s.x + 110, 610];
const branchD = s => `M ${s.x} ${Y} Q ${s.x + 10} 610 ${branchEnd(s)[0]} 610`;

// 这一次运行到了哪一站、在哪一站失败：只看 span。
function pathOf(trace) {
  const ran = new Set(trace.spans.map(s => s.name));
  const failed = trace.spans.find(s => s.parent && s.exit && !s.exit.ok)?.name ?? null;
  const reached = trace.exit.ok ? STATIONS.length : STATIONS.findIndex(s => s.id === failed) + 1;
  return { ran, failed, reached };
}

function Bead({ trace, p }) {
  if (p <= 0) return null;
  const { failed } = pathOf(trace);
  const stop = failed ? STATIONS.find(s => s.id === failed) : null;
  const mainEnd = stop ? stop.x : X1;
  const main = stop ? seg(p, 0, 0.7) : p;
  const [x, y] =
    stop && p > 0.7 ? quad([stop.x, Y], [stop.x + 10, 610], branchEnd(stop), seg(p, 0.7, 1)) : along([[X0, Y], [mainEnd, Y]], main);
  return <Dot x={x} y={y} r={11} />;
}

function Spans({ trace, o }) {
  if (o <= 0) return null;
  const root = trace.spans.find(s => !s.parent);
  const { failed } = pathOf(trace);
  const stop = failed ? STATIONS.find(s => s.id === failed) : null;
  const rootEnd = stop ? stop.x + 60 : X1;
  const bar = (x1, x2, y, label, ok, i) => (
    <g key={label} opacity={ramp(o, 0.1 + i * 0.2, 0.3 + i * 0.2)}>
      <Line x1={x1} y1={y} x2={x2} y2={y} w={8} color={ok ? C.ink : C.e} />
      <Text x={x1} y={y - 16} size={20} mono anchor="start" color={ok ? C.pencil : C.e}>
        {label}
      </Text>
    </g>
  );
  return (
    <g>
      {root && bar(X0, rootEnd, 200, `span ${root.name}`, root.exit.ok, 0)}
      {trace.spans
        .filter(s => s.parent)
        .map((s, i) => {
          const st = STATIONS.find(x => x.id === s.name);
          return bar(st.x - 80, st.x + 60, 262, `span ${s.name}`, s.exit.ok, i + 1);
        })}
    </g>
  );
}

function View({ clock, params, trace }) {
  const { p } = clock;
  const gen = p('gen');
  const union = p('union');
  const short = p('short');
  const fn = p('fn');
  const pipe = p('pipe');
  const { ran, reached } = pathOf(trace);
  const replaying = short > 0;
  const stationOpacity = i => (replaying && i >= reached && !ran.has(STATIONS[i].id) ? 0.35 : 1);

  return (
    <g>
      {/* 主线与三站 */}
      <Line x1={X0} y1={Y} x2={X1} y2={Y} p={ramp(gen, 0, 0.3)} w={4} />
      {replaying && reached < STATIONS.length && (
        <Line x1={STATIONS[reached - 1]?.x ?? X0} y1={Y} x2={X1} y2={Y} w={6} color={C.paper} />
      )}
      {replaying && reached < STATIONS.length && (
        <Line x1={STATIONS[reached - 1]?.x ?? X0} y1={Y} x2={X1} y2={Y} w={3} dash="10 12" color={C.pencil} />
      )}
      {STATIONS.map((s, i) => (
        <g key={s.id} opacity={stationOpacity(i)}>
          <Dot x={s.x} y={Y} r={16} hollow opacity={ramp(gen, 0.2 + i * 0.1, 0.3 + i * 0.1)} />
          <Text x={s.x} y={Y - 36} size={24} mono opacity={ramp(gen, 0.25 + i * 0.1, 0.35 + i * 0.1)}>
            {s.call}
          </Text>
        </g>
      ))}
      <Dot x={X1} y={Y} r={13} color={C.a} opacity={ramp(gen, 0.5, 0.6)} />
      <Text x={X1} y={Y + 52} size={24} mono color={C.a} opacity={ramp(gen, 0.55, 0.65)}>
        string
      </Text>
      <Text x={X0} y={Y + 52} size={22} mono color={C.pencil} anchor="start" opacity={ramp(short, 0.02, 0.1)}>
        {`greetUser("${params.input}")`}
      </Text>

      {/* 第一拍：yield* 一站一站往下走（示意） */}
      {gen > 0.55 && union === 0 && <Dot x={lerp(X0, X1, seg(gen, 0.6, 0.95))} y={Y} r={11} opacity={1 - seg(gen, 0.95, 1)} />}

      {/* 岔路：每一站可能的失败 */}
      {STATIONS.filter(s => s.error).map((s, i) => (
        <g key={s.error} opacity={stationOpacity(STATIONS.indexOf(s))}>
          <Path d={branchD(s)} color={C.e} w={3} p={ramp(union, 0.1 + i * 0.2, 0.35 + i * 0.2)} />
          <Tag x={branchEnd(s)[0] + 20} y={610} label={s.error} anchor="start" color={C.e} size={22} opacity={ramp(union, 0.3 + i * 0.2, 0.45 + i * 0.2)} />
        </g>
      ))}

      {/* 短路：按 span 记录走一遍 */}
      {replaying && <Bead trace={trace} p={seg(short, 0.08, 0.6)} />}
      <Text
        x={trace.exit.ok ? X1 : 800}
        y={trace.exit.ok ? Y - 90 : 700}
        size={26}
        mono
        color={trace.exit.ok ? C.a : C.e}
        opacity={ramp(short, 0.6, 0.7) * (1 - ramp(pipe, 0, 0.2))}
        anchor={trace.exit.ok ? 'end' : 'middle'}
      >
        {fmtExit(trace.exit)}
      </Text>

      {/* Effect.fn 的 span：来自记录型 Tracer */}
      <g opacity={1 - ramp(pipe, 0, 0.2)}>
        <Spans trace={trace} o={fn} />
      </g>

      {/* pipe：从外面套上去的行为 */}
      {['Effect.withSpan("greet")', 'Effect.timeout("1 second")', 'Effect.retry({ times: 2 })'].map((label, i) => {
        const pad = 50 + i * 46;
        const o = ramp(pipe, 0.15 + i * 0.2, 0.35 + i * 0.2);
        return (
          <g key={label} opacity={o}>
            <rect x={X0 - pad} y={Y - 80 - i * 46} width={X1 - X0 + pad * 2} height={160 + i * 92} rx={24 + i * 10} style={{ fill: 'none', stroke: C.r, strokeWidth: 2, strokeDasharray: '2 8' }} />
            <Text x={X0 - pad + 24} y={Y - 92 - i * 46} size={20} mono anchor="start" color={C.r}>
              {`.pipe(${label})`}
            </Text>
          </g>
        );
      })}

      <Sig x={800} y={810} a="string" e="ParseError | UserNotFound" r="never" opacity={ramp(union, 0.6, 0.8)} size={30} />
    </g>
  );
}

const SHORT = {
  42: '输入 "42"：三站都走完，Tracer 收到 greetUser、parse、findUser 三个 span，结果是“你好，Ada”。',
  abc: '输入 "abc"：parse 就失败了。后面的站点根本没有执行，Tracer 也只收到两个 span；图上它们还是虚线。',
  7: '输入 "7"：parse 过了，findUser 找不到这个人，在第二站落进 UserNotFound 的岔路。',
};

export const scene = {
  id: 'gen',
  mark: '二',
  title: '一步一步写',
  file: 'snippets/02-gen.ts',
  code,
  lab,
  replay: 'short',
  View,
  readout: ({ trace }) => [
    { k: 'span', v: trace.spans.map(s => `${s.name}${s.exit?.ok ? '' : ' ✕'}`).join(' · ') },
    { k: 'Exit', v: fmtExit(trace.exit), tone: trace.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'gen', say: 'Effect.gen 让你像写 async/await 一样写：yield* 取出一个 Effect 的结果，再往下走一站。', hl: ['yield* parse(input)', 'yield* findUser(id)'] },
    { id: 'union', say: '每一站可能失败的方式，都挂在这一站下面。整段程序的错误类型，就是这些岔路的并集。', hl: ['ParseError | UserNotFound'] },
    { id: 'short', say: ({ params }) => SHORT[params.input], hl: ['return yield* new'], dur: 6 },
    { id: 'fn', say: '每一站都用 Effect.fn 起了名字。名字会变成 span：上面这几道横杠，是一个真的 Tracer 在这次运行里收到的记录。', hl: ['Effect.fn("greetUser")', 'Effect.fn("parse")', 'Effect.fn("findUser")'] },
    { id: 'pipe', say: '别的行为从外面加：用 pipe 套上 retry、timeout、withSpan，都是线外的一圈，不必改动里面的任何一步。' },
  ],
};
