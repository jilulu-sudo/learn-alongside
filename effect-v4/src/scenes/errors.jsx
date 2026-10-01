// 三 · 两种错误。预期内的失败是带标签的岔路，catchTag 架桥接回主线，类型随之变窄；
// defect 不在图纸上，桥也接不住。结果全部来自直接运行 snippets/03-errors.ts。
import code from '../../snippets/03-errors.ts?raw';
import { lab } from '../labs/errors.js';
import { C, Dot, Line, Path, Sig, Tag, Text } from '../paint/ink.jsx';
import { along, quad, ramp, seg } from '../paint/ease.js';
import { fmtExit, firstReason } from '../paint/format.js';

const Y = 280;
const X0 = 200;
const X1 = 1400;
const SX = 420;
const TAGS = [
  { tag: 'NotFound', x: 520, y: 470, join: 1160, via: 'catchTag("NotFound")' },
  { tag: 'Timeout', x: 700, y: 530, join: 1240, via: 'catchTag("Timeout")' },
  { tag: 'Unauthorized', x: 880, y: 590, join: 1320, via: 'catch' },
];
// 每一级处理接回了哪些标签（与 snippets/03-errors.ts 里三个函数的类型一致，见 test/scenes.test.jsx）。
export const HANDLED = { none: [], NotFound: ['NotFound'], all: ['NotFound', 'Timeout', 'Unauthorized'] };
export const remaining = handled => TAGS.map(t => t.tag).filter(t => !HANDLED[handled].includes(t));

const ctrl = t => [SX + (t.x - SX) * 0.15, Y + (t.y - Y) * 0.95];
const branchD = t => `M ${SX} ${Y} Q ${ctrl(t)[0]} ${ctrl(t)[1]} ${t.x} ${t.y}`;
const branchAt = (t, k) => quad([SX, Y], ctrl(t), [t.x, t.y], k);
const chipRight = t => t.x + 30 + t.tag.length * 13.2 + 22;
const bridgeD = t => `M ${chipRight(t)} ${t.y} C ${t.join - 40} ${t.y}, ${t.join} ${Y + 80}, ${t.join} ${Y}`;
const bridgePoints = t => [[chipRight(t), t.y], [t.join - 60, t.y - 10], [t.join - 8, Y + 90], [t.join, Y]];
const crackPoints = [[SX, Y], [SX - 14, Y + 80], [SX + 12, Y + 160], [SX - 10, Y + 240], [SX + 8, Y + 320], [SX - 4, Y + 400]];
const CRACK = `M ${crackPoints.map(([x, y]) => `${x} ${y}`).join(' L ')}`;

// 珠子按一次运行的结果走：成功走主线；失败走对应岔路；被接回就过桥回主线；defect 掉进裂缝。
function Bead({ happens, handled, p }) {
  if (p <= 0) return null;
  let pt;
  if (happens === 'ok') pt = along([[X0, Y], [X1, Y]], p);
  else if (happens === 'bug') pt = p < 0.35 ? along([[X0, Y], [SX, Y]], seg(p, 0, 0.35)) : along(crackPoints, seg(p, 0.35, 1));
  else {
    const t = TAGS.find(x => x.tag === happens);
    const caught = HANDLED[handled].includes(happens);
    if (p < 0.25) pt = along([[X0, Y], [SX, Y]], seg(p, 0, 0.25));
    else if (p < (caught ? 0.55 : 1)) pt = branchAt(t, seg(p, 0.25, caught ? 0.55 : 1));
    else if (p < 0.8) pt = along([[t.x, t.y], ...bridgePoints(t)], seg(p, 0.55, 0.8));
    else pt = along([[t.join, Y], [X1, Y]], seg(p, 0.8, 1));
  }
  return <Dot x={pt[0]} y={pt[1]} r={11} />;
}

function View({ clock, params, trace }) {
  const { p } = clock;
  const tags = p('tags');
  const catchTag = p('catchTag');
  const narrow = p('narrow');
  const defect = p('defect');
  const run = p('run');
  const cause = p('cause');
  const mine = run > 0;

  // 故事里桥是一座一座架起来的；到了“换你来”，桥按你的旋钮来。
  const bridge = tag =>
    mine ? (HANDLED[params.handled].includes(tag) ? 1 : 0) : tag === 'NotFound' ? ramp(catchTag, 0.1, 0.5) : ramp(narrow, tag === 'Timeout' ? 0.1 : 0.4, tag === 'Timeout' ? 0.4 : 0.7);
  const left = TAGS.map(t => t.tag).filter(t => bridge(t) < 1);
  const sigE = left.length ? left.join(' | ') : 'never';
  const result = trace.exit;
  const reason = firstReason(result);

  return (
    <g>
      <Line x1={X0} y1={Y} x2={X1} y2={Y} p={ramp(tags, 0, 0.25)} w={4} />
      <Dot x={SX} y={Y} r={16} hollow opacity={ramp(tags, 0.1, 0.2)} />
      <Text x={SX} y={Y - 36} size={24} mono opacity={ramp(tags, 0.15, 0.25)}>
        fetchProfile(happens)
      </Text>
      <Dot x={X1} y={Y} r={13} color={C.a} opacity={ramp(tags, 0.2, 0.3)} />
      <Text x={X1} y={Y - 30} size={24} mono color={C.a} opacity={ramp(tags, 0.2, 0.3)}>
        string
      </Text>

      {TAGS.map((t, i) => {
        const b = bridge(t.tag);
        return (
          <g key={t.tag}>
            <Path d={branchD(t)} color={C.e} w={3} p={ramp(tags, 0.25 + i * 0.12, 0.45 + i * 0.12)} />
            <Tag x={t.x + 30} y={t.y} label={t.tag} anchor="start" color={C.e} size={22} opacity={ramp(tags, 0.4 + i * 0.12, 0.5 + i * 0.12)} />
            <Path d={bridgeD(t)} color={C.ink} w={3} p={b} />
            <Text x={chipRight(t) + 20} y={t.y + 34} size={19} mono anchor="start" color={C.pencil} opacity={ramp(b, 0.6, 1)}>
              {t.via}
            </Text>
          </g>
        );
      })}

      {/* defect：不在图纸上的裂缝 */}
      <g opacity={ramp(defect, 0.05, 0.25) * (mine && params.happens !== 'bug' ? 0.25 : 1)}>
        <Path d={CRACK} color={C.e} w={2.5} dash="3 9" />
        <Text x={SX - 30} y={Y + 400} size={22} mono anchor="end" color={C.e}>
          Effect.die
        </Text>
        <Text x={SX - 30} y={Y + 434} size={20} anchor="end" color={C.pencil}>
          不在 E 里，桥也接不住
        </Text>
      </g>
      {defect > 0 && !mine && <Bead happens="bug" handled="all" p={seg(defect, 0.25, 0.75)} />}
      {defect > 0 && !mine && (
        <Text x={SX + 40} y={Y + 400} size={22} mono anchor="start" color={C.e} opacity={ramp(defect, 0.75, 0.85)}>
          {fmtExit(trace.defect)}
        </Text>
      )}

      {/* 换你来：按旋钮走一遍，结果来自真实运行 */}
      {mine && <Bead happens={params.happens} handled={params.handled} p={seg(run, 0.05, 0.6)} />}
      {mine && (
        <Text x={860} y={700} size={26} mono color={result.ok ? C.a : C.e} opacity={ramp(run, 0.6, 0.7) * (1 - ramp(cause, 0, 0.15))}>
          {fmtExit(result)}
        </Text>
      )}

      {/* Cause：运行时记得每一种失败 */}
      {cause > 0 &&
        [
          ['fail', 'Fail', '预期内的失败，在 E 里'],
          ['die', 'Die', 'defect，不在 E 里'],
          ['interrupt', 'Interrupt', '被中断'],
        ].map(([kind, name, note], i) => {
          const on = reason?.kind === kind;
          const x = 640 + i * 300;
          return (
            <g key={kind} opacity={ramp(cause, 0.1 + i * 0.12, 0.3 + i * 0.12)}>
              <Tag x={x} y={712} label={name} color={on ? C.e : C.pencil} fill={on ? C.eSoft : C.paper} size={24} />
              <Text x={x} y={760} size={20} color={C.pencil}>
                {note}
              </Text>
            </g>
          );
        })}
      <Text x={940} y={660} size={22} color={C.pencil} opacity={ramp(cause, 0.4, 0.6)}>
        {result.ok ? '这一次没有失败，Cause 是空的' : `这一次的 Cause：${reason.kind === 'die' ? 'Die' : reason.kind === 'fail' ? 'Fail' : 'Interrupt'}`}
      </Text>

      <Sig x={800} y={836} a="string" e={sigE} r="never" size={30} opacity={ramp(tags, 0.5, 0.7)} />
    </g>
  );
}

const NAMES = { none: '一条也没接', NotFound: '只接回了 NotFound', all: '三条全部接回' };
const runSay = ({ params, trace }) => {
  const r = firstReason(trace.exit);
  const what = params.happens === 'ok' ? '这一次成功了' : params.happens === 'bug' ? '这一次是一个 bug' : `这一次发生 ${params.happens}`;
  const outcome = trace.exit.ok
    ? `，程序拿到 ${JSON.stringify(trace.exit.value)}。`
    : r.kind === 'die'
      ? '：桥接不住它，程序以 Die 结束。'
      : `：${r.tag} 还留在 E 里，程序以 Fail(${r.tag}) 结束。`;
  return `${what}，${NAMES[params.handled]}${outcome}`;
};

export const scene = {
  id: 'errors',
  mark: '三',
  title: '两种错误',
  file: 'snippets/03-errors.ts',
  code,
  lab,
  replay: 'run',
  View,
  readout: ({ params, trace }) => [
    { k: 'E', v: remaining(params.handled).join(' | ') || 'never', tone: 'e' },
    { k: 'Exit', v: fmtExit(trace.exit), tone: trace.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'tags', say: '预期之内的失败，是带标签的值：NotFound、Timeout、Unauthorized。它们在类型里，也在图上，各是一条岔路。', hl: ['NotFound | Timeout | Unauthorized'] },
    { id: 'catchTag', say: 'catchTag("NotFound") 在这条岔路上架一座桥，把它接回主线。类型里的 NotFound 随之消失。', hl: ['Effect.catchTag("NotFound"', 'Timeout | Unauthorized>'] },
    { id: 'narrow', say: '每接回一条，错误类型就窄一点。再用 catchTag 接回 Timeout，最后用 catch 兜住剩下的：E 变成 never。', hl: ['Effect.catchTag("Timeout"', 'Effect.catch(', 'Effect.Effect<string, never>'] },
    { id: 'defect', say: '另一种失败不在图纸上：程序的 bug、被打破的约定。它叫 defect，用 Effect.die 表示。类型里看不到，桥也接不住。', hl: ['Effect.die'] },
    { id: 'run', say: runSay, dur: 6 },
    { id: 'cause', say: '运行时记得一切：fail、die、interrupt 都收在 Cause 里。在程序的边界上用 Exit 或 catchCause 去看、去报告，而不是在业务逻辑里悄悄吞掉。' },
  ],
};
