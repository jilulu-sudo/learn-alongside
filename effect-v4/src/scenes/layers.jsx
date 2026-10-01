// 六 · 服务与 Layer。R 是线上的缺口：缺什么，就空着什么形状。Layer 是填缺口的料。
// 结果来自直接运行 snippets/06-layers.ts 的 remind，用里面定义的 Weather.live / Weather.test。
import code from '../../snippets/06-layers.ts?raw';
import { lab } from '../labs/layers.js';
import { C, Dot, Line, Path, Sig, Text } from '../paint/ink.jsx';
import { lerp, ramp, seg } from '../paint/ease.js';
import { fmtExit } from '../paint/format.js';

const Y = 330;
const X0 = 200;
const X1 = 1400;
const R = 56;
const SOCKET = { weather: 560, notifier: 920 };
const HOME = { live: [300, 600], test: [540, 600], notifier: [1060, 600], http: [1300, 640] };

const semi = (cx, top) => `M ${cx - R} ${top} A ${R} ${R} 0 0 0 ${cx + R} ${top} Z`;
const square = (cx, top) => `M ${cx - R} ${top} L ${cx - R} ${top + 90} L ${cx + R} ${top + 90} L ${cx + R} ${top} Z`;
const tri = (cx, top, s = 1) => `M ${cx - 22 * s} ${top} L ${cx} ${top + 30 * s} L ${cx + 22 * s} ${top} Z`;
const holeTop = top => top + 10;

function Socket({ d, label, sub, o, subO }) {
  return (
    <g opacity={o}>
      <Path d={d} color={C.r} w={2.5} dash="6 7" />
      <Text x={label.x} y={Y - 28} size={24} mono color={C.r}>
        {label.text}
      </Text>
      <Text x={label.x} y={sub.y} size={19} mono color={C.r} opacity={subO}>
        {sub.text}
      </Text>
    </g>
  );
}

function Piece({ d, name, at, o = 1, children }) {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <path d={d} style={{ fill: C.rSoft, stroke: C.r, strokeWidth: 2.5 }} />
      {children}
      <Text x={at[0]} y={at[1]} size={20} mono color={C.r}>
        {name}
      </Text>
    </g>
  );
}

const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function View({ clock, params, trace }) {
  const { p } = clock;
  const needs = p('needs');
  const service = p('service');
  const layer = p('layer');
  const provide = p('provide');
  const swap = p('swap');
  const mine = provide > 0 && swap === 0;
  const live = params.weather === 'live';

  // 料的位置：故事里先把 Http 接进 Weather.live；“换你来”按旋钮把料放进缺口；最后一拍演示换料。
  const httpInLive = provide === 0 ? ramp(layer, 0.55, 0.85) : swap > 0 ? 1 : lerp(1, live && params.http ? 1 : 0, ramp(provide, 0, 0.2));
  const fill = ramp(provide, 0.15, 0.45);
  const swapK = ramp(swap, 0.35, 0.65);
  const liveK = swap > 0 ? 1 - swapK : live ? fill : 0;
  const testK = swap > 0 ? swapK : live ? 0 : fill;
  const notK = swap > 0 ? 1 : fill;

  const livePos = mix(HOME.live, [SOCKET.weather, Y], liveK);
  const testPos = mix(HOME.test, [SOCKET.weather, Y], testK);
  const notPos = mix(HOME.notifier, [SOCKET.notifier, Y], notK);
  const httpPos = mix(HOME.http, [livePos[0], holeTop(livePos[1])], httpInLive);

  const shelf = ramp(layer, 0.05, 0.3);
  const missing = mine && trace.yours.missing.length > 0;
  const filledW = liveK >= 1 || testK >= 1;
  const filledN = notK >= 1;
  const rLeft = [!filledW && 'Weather', !filledN && 'Notifier', missing && filledW && 'Http'].filter(Boolean);
  const sigR = needs > 0 && (provide > 0 || swap > 0) ? rLeft.join(' | ') || 'never' : 'Weather | Notifier';
  const out = swap > 0 ? null : mine ? trace.yours : null;
  const bead = mine && fill >= 1 ? seg(provide, 0.5, 0.85) : 0;
  const beadEnd = missing ? SOCKET.weather - R : X1;

  return (
    <g>
      {/* 主线：缺口两边断开，填上之后接通 */}
      <Line x1={X0} y1={Y} x2={SOCKET.weather - R} y2={Y} p={ramp(needs, 0, 0.3)} w={4} />
      <Line x1={SOCKET.weather + R} y1={Y} x2={SOCKET.notifier - R} y2={Y} p={ramp(needs, 0.2, 0.4)} w={4} />
      <Line x1={SOCKET.notifier + R} y1={Y} x2={X1} y2={Y} p={ramp(needs, 0.3, 0.5)} w={4} />
      {filledW && !(missing && liveK >= 1) && <Line x1={SOCKET.weather - R} y1={Y} x2={SOCKET.weather + R} y2={Y} w={4} />}
      {filledN && <Line x1={SOCKET.notifier - R} y1={Y} x2={SOCKET.notifier + R} y2={Y} w={4} />}
      <Dot x={X1} y={Y} r={13} color={C.a} opacity={ramp(needs, 0.45, 0.55)} />
      <Text x={X0} y={Y - 30} size={22} mono anchor="start" opacity={ramp(needs, 0.1, 0.3)}>
        remind
      </Text>

      <Socket
        d={semi(SOCKET.weather, Y)}
        label={{ x: SOCKET.weather, text: 'Weather' }}
        sub={{ y: Y + R + 44, text: 'today: Effect<"雨" | "晴">' }}
        o={ramp(needs, 0.4, 0.6)}
        subO={ramp(service, 0.1, 0.3) * (1 - ramp(layer, 0, 0.15))}
      />
      <Socket
        d={square(SOCKET.notifier, Y)}
        label={{ x: SOCKET.notifier, text: 'Notifier' }}
        sub={{ y: Y + 90 + 40, text: 'send(text): Effect<void>' }}
        o={ramp(needs, 0.5, 0.7)}
        subO={ramp(service, 0.3, 0.5) * (1 - ramp(layer, 0, 0.15))}
      />
      <Text x={800} y={200} size={22} color={C.pencil} opacity={ramp(service, 0.5, 0.7) * (1 - ramp(layer, 0, 0.15))}>
        Context.Service：一个名字，加一个接口
      </Text>

      {/* 料 */}
      <Piece d={semi(livePos[0], livePos[1])} name="Weather.live" at={[livePos[0], livePos[1] + R + 36]} o={shelf}>
        <Path d={tri(livePos[0], holeTop(livePos[1]), 0.9)} color={missing && liveK >= 1 ? C.e : C.r} w={2} dash="4 5" />
      </Piece>
      <Piece d={semi(testPos[0], testPos[1])} name="Weather.test" at={[testPos[0], testPos[1] + R + 36]} o={shelf} />
      <Piece d={square(notPos[0], notPos[1])} name="Notifier" at={[notPos[0], notPos[1] + 90 + 32]} o={shelf} />
      <g opacity={shelf}>
        <path d={tri(httpPos[0], httpPos[1], 0.9)} style={{ fill: C.r, stroke: C.r, strokeWidth: 2 }} />
        <Text x={httpPos[0]} y={httpPos[1] + 64} size={18} mono color={C.r} opacity={1 - httpInLive}>
          Http（演示，不联网）
        </Text>
      </g>
      <Text x={HOME.live[0] + 110} y={HOME.live[1] - 30} size={20} mono color={C.pencil} opacity={ramp(layer, 0.6, 0.8) * (provide === 0 ? 1 : 0)} anchor="start">
        Weather.live.pipe(Layer.provide(Http))
      </Text>

      {/* 走一遍 */}
      {bead > 0 && bead < 1 && <Dot x={lerp(X0, beadEnd, bead)} y={Y} r={11} />}
      {out && fill >= 1 && (
        <g opacity={ramp(provide, 0.85, 0.95)}>
          {missing ? (
            <>
              <Text x={800} y={200} size={24} mono color={C.e}>
                tsc：remind 还需要 Http，R 不是 never，不能运行
              </Text>
              <Text x={800} y={240} size={22} mono color={C.e}>
                {`硬跑的话：${fmtExit(out.exit)}`}
              </Text>
            </>
          ) : (
            <>
              <Text x={X1} y={Y - 40} size={26} anchor="end" color={C.a}>
                {`“${out.sent[0]}”`}
              </Text>
              <Text x={800} y={200} size={20} mono color={C.pencil}>
                {out.calls.length ? `Weather.live 调用了 Http.get("${out.calls[0]}")` : 'Weather.test 没有调用任何 Http'}
              </Text>
            </>
          )}
        </g>
      )}

      {/* 换料：同一个 remind，两块料，两种结果 */}
      {swap > 0 && (
        <g>
          <Text x={800} y={200} size={24} anchor="middle" color={C.a} opacity={ramp(swap, 0.05, 0.2) * (1 - ramp(swap, 0.3, 0.4))}>
            {`Weather.live → “${trace.live.sent[0]}”`}
          </Text>
          <Text x={800} y={200} size={24} anchor="middle" color={C.a} opacity={ramp(swap, 0.65, 0.8)}>
            {`Weather.test → “${trace.test.sent[0]}”`}
          </Text>
        </g>
      )}

      <Sig x={800} y={830} a="string" e="never" r={sigR} size={30} opacity={ramp(needs, 0.5, 0.7)} />
    </g>
  );
}

const provideSay = ({ params, trace }) => {
  const y = trace.yours;
  if (y.missing.length)
    return `这一次忘了给 Weather.live 接上 Http：缺口还在，R 里还剩 Http，tsc 不让你运行。硬跑的话，运行时会说：${y.exit.reasons[0].message}。`;
  if (params.weather === 'live') return `缺口都填上了，R 变成 never，线连成一根。Weather.live 问了一次 Http，今天晴：“${y.sent[0]}”。`;
  return `Weather.test 填进缺口，永远下雨：“${y.sent[0]}”。业务代码一个字没改。`;
};

export const scene = {
  id: 'layers',
  mark: '六',
  title: '服务与 Layer',
  file: 'snippets/06-layers.ts',
  code,
  lab,
  replay: 'provide',
  View,
  readout: ({ trace }) => [
    { k: 'R', v: trace.yours.missing.length ? trace.yours.missing.join(' | ') : 'never', tone: 'r' },
    { k: '通知', v: trace.yours.sent[0] ?? '（没有发出）' },
    { k: 'Exit', v: fmtExit(trace.yours.exit), tone: trace.yours.exit.ok ? 'a' : 'e' },
  ],
  beats: [
    { id: 'needs', say: 'R 是程序开跑之前需要的东西。在图上，它是线上的缺口：缺什么，就空着什么形状。', hl: ['yield* Weather', 'yield* Notifier', 'Effect<string, never, Weather | Notifier>'] },
    { id: 'service', say: 'Context.Service 定义一种缺口的形状：一个名字，加一个接口。程序只认形状，不管将来是谁来填。', hl: ['Context.Service<Weather', 'Context.Service<Notifier'] },
    { id: 'layer', say: 'Layer 是填缺口的料。料自己也可以有缺口：Weather.live 要先接上 Http，才是一块完整的料。', hl: ['Layer.effect(Weather', 'yield* Http', 'Layer.succeed(Weather'] },
    { id: 'provide', say: provideSay, dur: 7 },
    { id: 'swap', say: '测试时换一块料就行：同一个 remind，换上 Weather.test，结果跟着变。依赖是在边缘接上的，不是写死在里面的。', hl: ['static readonly test'] },
  ],
};
