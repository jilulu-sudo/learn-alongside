// 终 · 织成一匹布。竖线是前七章的内核，横线是官方 onboarding 列出的开箱能力；交叉处打结表示“建在它上面”。
import code from '../../snippets/08-cloth.ts?raw';
import { lab } from '../labs/cloth.js';
import { C, Dot, Line, Seal, Text } from '../paint/ink.jsx';
import { ramp } from '../paint/ease.js';
import { THREADS, WARP } from './clothData.js';

const WX = i => 560 + i * 116;
const WY = j => 214 + j * 50;
const LEFT = 520;
const RIGHT = 1300;
const TOP = 170;
const BOTTOM = 720;

export const V4 = [
  ['包', '@effect/platform 等', '并进 effect；适配包单独发布，版本号统一'],
  ['体积', '—', '运行时重写，最小的程序打包约 6.3 KB（min + gzip）'],
  ['服务', 'Context.Tag', 'Context.Service'],
  ['捕获', 'Effect.catchAll', 'Effect.catch'],
  ['分叉', 'Effect.fork', 'Effect.forkChild'],
  ['结果', 'Either', 'Result'],
  ['路径', 'effect/unstable/http', 'effect/http（rc.118 起，ai、sql 等同理）'],
];

export const PATH = [
  ['01', 'The Effect Type', '核心想法'],
  ['02', 'Installation', '装好它'],
  ['03', 'Creating Effects', '第一个程序'],
  ['04', 'Two Types of Errors', '错误处理'],
  ['05', 'Basic Concurrency', '并发'],
];

function View({ clock, params }) {
  const { p } = clock;
  const warp = p('warp');
  const weft = p('weft');
  const eco = p('eco');
  const v4a = p('v4a');
  const v4b = p('v4b');
  const next = p('next');
  const dim = 1 - ramp(v4a, 0, 0.2);
  const focus = params.focus;
  const n = THREADS.length;

  const threadP = j => (THREADS[j].id === 'ecosystem' ? ramp(eco, 0.05, 0.4) : ramp(weft, 0.05 + (j / (n - 1)) * 0.8, 0.15 + (j / (n - 1)) * 0.8));
  const lit = id => (focus ? focus === id : eco > 0 && v4a === 0 ? id === 'ecosystem' : true);
  const described = THREADS.find(t => t.id === (focus || (eco > 0 && v4a === 0 ? 'ecosystem' : '')));

  return (
    <g>
      <g opacity={dim * (1 - ramp(next, 0, 0.2))}>
        {THREADS.map((t, j) => (
          <g key={t.id} opacity={lit(t.id) ? 1 : 0.3}>
            <Line x1={LEFT} y1={WY(j)} x2={RIGHT} y2={WY(j)} p={threadP(j)} w={t.id === 'ecosystem' ? 4 : 2.5} color={t.id === 'ecosystem' ? C.e : C.ink} />
            <Text x={LEFT - 20} y={WY(j) + 8} size={22} anchor="end" opacity={threadP(j)} color={t.id === 'ecosystem' ? C.e : C.ink}>
              {t.name}
            </Text>
          </g>
        ))}
        {WARP.map((w, i) => (
          <g key={w.id}>
            <Line x1={WX(i)} y1={TOP} x2={WX(i)} y2={BOTTOM} p={ramp(warp, 0.05 + i * 0.1, 0.25 + i * 0.1)} w={2.5} color={C.pencil} />
            <Text x={WX(i)} y={TOP - 20} size={24} opacity={ramp(warp, 0.1 + i * 0.1, 0.25 + i * 0.1)}>
              {w.name}
            </Text>
          </g>
        ))}
        {/* 结：这项能力建在这根内核线上 */}
        {THREADS.map((t, j) =>
          t.uses.map(u => {
            const i = WARP.findIndex(w => w.id === u);
            const o = ramp(threadP(j), 0.3 + (i / WARP.length) * 0.6, 0.4 + (i / WARP.length) * 0.6) * (lit(t.id) ? 1 : 0.3);
            return (
              <g key={`${t.id}-${u}`} opacity={o}>
                <rect x={WX(i) - 7} y={WY(j) - 7} width={14} height={14} transform={`rotate(45 ${WX(i)} ${WY(j)})`} style={{ fill: t.id === 'ecosystem' ? C.e : C.ink }} />
              </g>
            );
          }),
        )}
        {described && (
          <g>
            <Text x={(LEFT + RIGHT) / 2} y={782} size={26}>
              {`${described.name}：${described.line}`}
            </Text>
            <Text x={(LEFT + RIGHT) / 2} y={826} size={22} mono color={C.pencil}>
              {described.api}
            </Text>
          </g>
        )}
        {!described && weft > 0.9 && v4a === 0 && (
          <Text x={(LEFT + RIGHT) / 2} y={790} size={22} color={C.pencil}>
            右边可以挑一根线，看它是什么
          </Text>
        )}
      </g>

      {/* v4 的变化 */}
      {v4a > 0 && next === 0 && (
        <g>
          <Text x={800} y={170} size={30} weight={600} opacity={ramp(v4a, 0.1, 0.3)}>
            v4 改了什么
          </Text>
          {V4.map(([k, from, to], i) => {
            const at = i < 2 ? ramp(v4a, 0.25 + i * 0.25, 0.45 + i * 0.25) : ramp(v4b, 0.05 + (i - 2) * 0.15, 0.2 + (i - 2) * 0.15);
            const y = 250 + i * 72;
            return (
              <g key={k} opacity={at}>
                <Text x={250} y={y} size={22} anchor="end" color={C.pencil}>
                  {k}
                </Text>
                <Text x={290} y={y} size={22} mono anchor="start" color={C.pencil}>
                  {from}
                </Text>
                <Text x={720} y={y} size={22} anchor="middle" color={C.pencil}>
                  →
                </Text>
                <Text x={770} y={y} size={22} mono={i >= 2} anchor="start" color={C.ink}>
                  {to}
                </Text>
              </g>
            );
          })}
        </g>
      )}

      {/* 下一步：官方学习路径 */}
      {next > 0 && (
        <g>
          <Line x1={240} y1={420} x2={1360} y2={420} p={ramp(next, 0.1, 0.5)} w={3} />
          {PATH.map(([num, en, zh], i) => {
            const x = 300 + i * 250;
            const o = ramp(next, 0.2 + i * 0.1, 0.35 + i * 0.1);
            return (
              <g key={num} opacity={o}>
                <Dot x={x} y={420} r={11} />
                <Text x={x} y={380} size={22} mono color={C.pencil}>
                  {num}
                </Text>
                <Text x={x} y={474} size={26}>
                  {zh}
                </Text>
                <Text x={x} y={510} size={18} mono color={C.pencil}>
                  {en}
                </Text>
              </g>
            );
          })}
          <Seal x={776} y={600} size={48} char="终" opacity={ramp(next, 0.75, 0.85)} />
          <Text x={800} y={720} size={30} opacity={ramp(next, 0.8, 0.95)}>
            线已经在你手里了
          </Text>
        </g>
      )}
    </g>
  );
}

export const scene = {
  id: 'cloth',
  mark: '终',
  title: '织成一匹布',
  file: 'snippets/08-cloth.ts',
  code,
  lab,
  replay: null,
  labHint: '挑一根线，看它是什么',
  View,
  readout: ({ params }) => {
    const t = THREADS.find(x => x.id === params.focus);
    return t ? [{ k: t.name, v: t.line }, { k: 'API', v: t.api, tone: 'r' }] : [];
  },
  beats: [
    { id: 'warp', say: '回头看，前面七章，每一章都是同一根线的一种用法：值、步骤、错误、时间、纤程、依赖、资源。' },
    { id: 'weft', say: '横着穿过它们的，是 Effect 开箱即有的能力：类型化错误、重试调度、结构化并发、资源安全、依赖注入、可观测性、流、Schema、配置。每一项都打结在前面那几根线上。', dur: 16 },
    { id: 'eco', say: '最后一根是整个生态：HTTP、SQL、CLI、AI、RPC、集群与工作流，都长在同一个内核上，都在 effect 这一个包里。', hl: ['from "effect/http"', 'from "effect/sql"', 'from "effect/cli"', 'from "effect/ai"', 'from "effect/workflow"'] },
    { id: 'v4a', say: 'v4 改了什么？先是形状：@effect/platform、rpc、cluster 等并进了 effect，只剩平台、数据库驱动、AI 提供方这类适配包单独发布，所有包共用一个版本号。运行时也重写了，最小的程序打包只有约 6.3 KB。', hl: ['一个包、一个版本号'] },
    { id: 'v4b', say: '再是名字：Context.Tag 换成 Context.Service，catchAll 改叫 catch，fork 改叫 forkChild，Either 改叫 Result。从 rc.118 开始，effect/unstable/* 里的模块也搬到了 effect/* 下面。', hl: ['rc.118 起'] },
    { id: 'next', say: '下一步，照官方的学习路径走：Effect 类型、安装、第一个程序、错误处理、并发。线已经在你手里了。', hl: ['Effect.retry', 'Effect.timeout', 'Effect.withSpan'] },
  ],
};
