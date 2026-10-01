// 七 · 资源与 Scope。开门、开灯、开窗；离开时倒过来关。出错、被打断，收尾一个都不漏。
// 每一段的起止时间来自 labs/scope.js 在测试时钟上的真实运行。
import code from '../../snippets/07-scope.ts?raw';
import { lab, AXIS_MS, THINGS } from '../labs/scope.js';
import { Axis, C, Cross, Cut, Line, Path, Text } from '../paint/ink.jsx';
import { lerp, ramp } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';
import { lanes, replayDur, virtualTime } from './replay.js';

const MS_PER_S = 200;
const TROUBLE = { none: '一切正常', fail: '待着时出错', interrupt: '400ms 时被打断', acquire: '窗打不开' };

const releaseOrder = trace => trace.events.filter(e => e.kind === 'released').map(e => e.label);

// 一张时间图。geo 决定画在哪里、画多大；vt 是回放到的虚拟时间。
function Chart({ trace, vt, geo, labels = true }) {
  const { x0, x1, ys, my, size } = geo;
  const xOf = t => x0 + ((x1 - x0) * t) / AXIS_MS;
  const L = lanes(trace);
  const w = size / 2.6;
  const bracket = (x, y, open) => {
    const s = open ? 1 : -1;
    return <Path d={`M ${x + 8 * s} ${y - w} L ${x} ${y - w} L ${x} ${y + w} L ${x + 8 * s} ${y + w}`} w={2.5} />;
  };
  const main = L[0] ?? {};
  const mainEnd = main.leave ?? main.fail ?? main.interrupted;
  return (
    <g>
      {THINGS.map((thing, i) => {
        const e = L[i + 1] ?? {};
        const y = ys[i];
        if (e.acquiring == null || vt < e.acquiring) return null;
        const got = e.acquired ?? e['acquire-failed'];
        return (
          <g key={thing}>
            {bracket(xOf(e.acquiring), y, true)}
            <Line x1={xOf(e.acquiring)} y1={y} x2={xOf(Math.min(vt, got))} y2={y} w={size / 2.4} />
            {labels && (
              <Text x={xOf(e.acquiring) + 2} y={y - size * 0.95} size={size} anchor="start">
                {`开${thing}`}
              </Text>
            )}
            {e['acquire-failed'] != null && vt >= got && <Cross x={xOf(got) + 10} y={y} size={size / 3} />}
            {e.acquired != null && vt > e.acquired && <Line x1={xOf(e.acquired)} y1={y} x2={xOf(Math.min(vt, e.releasing ?? AXIS_MS))} y2={y} w={2} color={C.pencil} />}
            {e.releasing != null && vt > e.releasing && (
              <>
                <Line x1={xOf(e.releasing)} y1={y} x2={xOf(Math.min(vt, e.released))} y2={y} w={size / 2.4} color={C.a} />
                {labels && (
                  <Text x={xOf(e.released) - 2} y={y - size * 0.95} size={size} anchor="end" color={C.a}>
                    {`关${thing}`}
                  </Text>
                )}
              </>
            )}
            {e.released != null && vt >= e.released && bracket(xOf(e.released), y, false)}
          </g>
        );
      })}
      {main.stay != null && vt > main.stay && (
        <g>
          <Line x1={xOf(main.stay)} y1={my} x2={xOf(Math.min(vt, mainEnd))} y2={my} w={3} dash="2 7" />
          {labels && (
            <Text x={xOf(main.stay) + 4} y={my - size * 0.8} size={size * 0.9} anchor="start" color={C.pencil}>
              待着
            </Text>
          )}
          {main.fail != null && vt >= main.fail && <Cross x={xOf(main.fail) + 8} y={my} size={size / 3} />}
          {main.interrupted != null && vt >= main.interrupted && <Cut x={xOf(main.interrupted)} y={my} size={size * 0.7} color={C.e} w={3.5} />}
        </g>
      )}
    </g>
  );
}

const BIG = { x0: 320, x1: 1300, ys: [270, 350, 430], my: 520, size: 24 };

function Stack({ trace, vt, o }) {
  const L = lanes(trace);
  const plates = THINGS.map((thing, i) => ({ thing, ...(L[i + 1] ?? {}) })).filter(p => p.acquired != null && vt >= p.acquired && (p.releasing == null || vt < p.releasing));
  return (
    <g opacity={o}>
      <Text x={1450} y={210} size={20} color={C.pencil}>
        Scope 里登记的收尾
      </Text>
      <Line x1={1370} y1={500} x2={1530} y2={500} color={C.pencil} w={2} />
      {plates.map((p, i) => (
        <g key={p.thing}>
          <rect x={1380} y={500 - (i + 1) * 52} width={140} height={44} rx={6} style={{ fill: C.aSoft, stroke: C.a, strokeWidth: 2 }} />
          <Text x={1450} y={500 - (i + 1) * 52 + 30} size={22} color={C.a}>
            {`关${p.thing}`}
          </Text>
        </g>
      ))}
    </g>
  );
}

function View({ clock, params, trace }) {
  const { p } = clock;
  const acquire = p('acquire');
  const nest = p('nest');
  const release = p('release');
  const trouble = p('trouble');
  const layer = p('layer');
  const story = trace.runs.none;
  const yours = trace.yours;
  const replaying = release > 0;
  const vt = replaying ? virtualTime(clock, 'release', yours.end, MS_PER_S) : nest > 0 ? lerp(80, 240, ramp(nest, 0.1, 0.7)) : lerp(0, 80, ramp(acquire, 0.25, 0.6));
  const shown = replaying ? yours : story;
  const big = 1 - ramp(trouble, 0, 0.15);

  return (
    <g>
      <g opacity={big}>
        <Axis x0={BIG.x0} x1={BIG.x1} y={640} ms={AXIS_MS} every={100} p={ramp(acquire, 0, 0.3)} label={t => (t % 200 === 0 ? `${t}` : '')} />
        <Chart trace={shown} vt={vt} geo={BIG} />
        <Stack trace={shown} vt={vt} o={ramp(acquire, 0.4, 0.6)} />
        {replaying && vt < yours.end && <Line x1={BIG.x0 + ((BIG.x1 - BIG.x0) * vt) / AXIS_MS} y1={220} x2={BIG.x0 + ((BIG.x1 - BIG.x0) * vt) / AXIS_MS} y2={640} color={C.pencil} w={1.5} />}
        {acquire > 0 && !replaying && (
          <Text x={800} y={170} size={22} color={C.pencil} opacity={ramp(acquire, 0.6, 0.8)}>
            拿的同时，就登记好怎么还
          </Text>
        )}
        {replaying && (
          <g opacity={vt >= yours.end ? 1 : 0}>
            <Text x={800} y={170} size={24} mono>
              {`收尾顺序：${releaseOrder(yours).join(' → ')}`}
            </Text>
            <Text x={800} y={740} size={24} mono color={yours.exit.ok ? C.a : C.e}>
              {`${fmtExit(yours.exit)} · ${yours.end}ms`}
            </Text>
          </g>
        )}
      </g>

      {/* 四种情况并排：收尾一个都不漏 */}
      {trouble > 0 && (
        <g opacity={ramp(trouble, 0.1, 0.3) * (1 - ramp(layer, 0, 0.2))}>
          {Object.entries(trace.runs).map(([kind, run], i) => {
            const gx = i % 2 === 0 ? 110 : 830;
            const gy = i < 2 ? 160 : 470;
            const geo = { x0: gx + 40, x1: gx + 620, ys: [gy + 70, gy + 110, gy + 150], my: gy + 195, size: 16 };
            return (
              <g key={kind} opacity={ramp(trouble, 0.15 + i * 0.1, 0.3 + i * 0.1)}>
                <Text x={gx + 40} y={gy + 20} size={22} anchor="start" weight={600} color={kind === params.trouble ? C.e : C.ink}>
                  {TROUBLE[kind]}
                </Text>
                <Chart trace={run} vt={run.end} geo={geo} labels={false} />
                <Text x={gx + 40} y={gy + 250} size={18} mono anchor="start" color={C.a}>
                  {`收尾：${releaseOrder(run).join(' → ')}`}
                </Text>
              </g>
            );
          })}
        </g>
      )}

      {/* Layer 也这样管资源 */}
      {layer > 0 && (
        <g opacity={ramp(layer, 0.2, 0.4)}>
          <Path d="M 640 330 L 600 330 L 600 470 L 640 470" w={4} />
          <Path d="M 960 330 L 1000 330 L 1000 470 L 960 470" w={4} color={C.a} />
          <path d={`M 744 380 A 56 56 0 0 0 856 380 Z`} style={{ fill: C.rSoft, stroke: C.r, strokeWidth: 2.5 }} />
          <Text x={800} y={372} size={22} mono color={C.r}>
            Weather.live
          </Text>
          <Text x={560} y={410} size={22} anchor="end" opacity={ramp(layer, 0.35, 0.5)}>
            服务建起来时拿
          </Text>
          <Text x={1040} y={410} size={22} anchor="start" color={C.a} opacity={ramp(layer, 0.45, 0.6)}>
            程序结束时还
          </Text>
          <Text x={800} y={560} size={22} color={C.pencil} opacity={ramp(layer, 0.6, 0.8)}>
            在 Layer.effect 里用 acquireRelease，资源的一生就交给了 Scope
          </Text>
        </g>
      )}
    </g>
  );
}

const releaseSay = ({ params, trace }) => {
  const order = releaseOrder(trace.yours).join('、');
  switch (params.trouble) {
    case 'fail':
      return `待到一半出了错：Scope 照样关闭，收尾倒序执行：${order}。错误留在 Exit 里。`;
    case 'interrupt':
      return `400 毫秒时被 timeout 打断：正在做的事停下，登记过的收尾照样倒序执行：${order}。`;
    case 'acquire':
      return `窗打不开：没拿到手的就不用还。已经拿到的灯和门，倒序还回去：${order}。`;
    default:
      return `离开时 Scope 关闭，收尾倒序执行：先关窗，再关灯，最后关门。后拿的先还：${order}。`;
  }
};

export const scene = {
  id: 'scope',
  mark: '七',
  title: '资源与 Scope',
  file: 'snippets/07-scope.ts',
  code,
  lab,
  replay: 'release',
  View,
  readout: ({ trace }) => [
    { k: '收尾顺序', v: releaseOrder(trace.yours).join(' → ') },
    { k: 'Exit', v: `${fmtExit(trace.yours.exit)} @ ${trace.yours.end}ms`, tone: trace.yours.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'acquire', say: 'acquireRelease 把“拿”和“还”写在一起：开门的同时，就登记好怎么关门。', hl: ['Effect.acquireRelease', 'Console.log(`关'] },
    { id: 'nest', say: '再开灯、开窗。每拿一样，Scope 里就多登记一个收尾动作，像一摞叠起来的盘子。', hl: ['open("灯")', 'open("窗")'] },
    { id: 'release', say: releaseSay, dur: ({ trace }) => replayDur(trace.yours.end, MS_PER_S) },
    { id: 'trouble', say: '四种情况放在一起看：正常、出错、被打断、拿不到。登记过的收尾一个都不会漏；没拿到手的，也不会去还。' },
    { id: 'layer', say: 'Layer 也是这样管资源的：服务建起来时拿，程序结束时还。资源的一生，交给 Scope。', hl: ['Effect.scoped'] },
  ],
};
