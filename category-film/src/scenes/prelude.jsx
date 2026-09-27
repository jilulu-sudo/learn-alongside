import { Arrow, Disc, Label, Stroke, Code } from '../paint/Brush.jsx';
import { MapView, MAP_W } from '../map/MapView.jsx';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, pulse, seg } from '../paint/ease.js';

const beats = [
  { id: 'paper', say: '我原本画抽象画，后来转去读哲学。回头一看，才发现这辈子只画过两样东西。' },
  { id: 'dots', say: '点，和点之间的箭头。' },
  { id: 'compose', say: '从 A 到 B 一笔，从 B 到 C 一笔，两笔可以合成一笔 A 到 C。这叫组合，记作 g∘f。' },
  { id: 'reducer', say: '你们写过 reducer：state 收到一个 action，变成下一个 state。那也是一支箭头；一串 action，就是一串首尾相接的箭头。' },
  { id: 'map', say: '今晚的画有五个岛：半群、Möbius 与 Fourier、热带代数、组合博弈、范畴论。一条粗线把它们串起来。' },
  { id: 'prune', say: '粗线是主干，细线是旁枝。旁枝可以剪掉，主干照样讲得通。按 M 打开地图，剪掉你暂时不想看的枝。' },
];

const A = [560, 560];
const B = [960, 400];
const Cc = [1360, 560];

function View({ clock }) {
  const p = clock.p;
  const sketch = 1 - easeInOut(p('map'));
  const relabel = easeInOut(p('reducer'));
  const mapIn = easeOut(p('map'));
  const hero = inOut(p('paper'), p('dots')) * 0.9 + 0.1 * sketch;

  const name = (a, b) => (relabel < 0.5 ? a : b);
  const nameOpacity = Math.abs(relabel - 0.5) * 2;

  return (
    <g>
      <g opacity={hero}>
        <Stroke pts={[[240, 820], [700, 520], [1180, 260], [1620, 180]]} width={40} color={C.ink} progress={easeInOut(seg(p('paper'), 0, 0.5))} seed={4} amp={6} />
        <Disc c={[1380, 600]} r={170} color={C.red} opacity={0.85 * easeOut(seg(p('paper'), 0.3, 0.8))} seed={9} />
        <Disc c={[620, 330]} r={70} color={C.yellow} opacity={0.9 * easeOut(seg(p('paper'), 0.5, 1))} seed={12} />
        <Stroke pts={[[400, 700], [900, 720]]} width={10} color={C.blue} progress={easeInOut(seg(p('paper'), 0.6, 1))} seed={2} />
      </g>

      <g opacity={sketch}>
        {[
          [A, C.red],
          [B, C.yellow],
          [Cc, C.blue],
        ].map(([c, col], i) => (
          <Disc key={i} c={c} r={34} color={col} scale={easeOut(seg(p('dots'), i * 0.15, 0.4 + i * 0.15))} />
        ))}
        <Arrow from={A} to={B} bend={-30} gap={48} progress={easeInOut(seg(p('dots'), 0.5, 0.75))} width={6} />
        <Arrow from={B} to={Cc} bend={-30} gap={48} progress={easeInOut(seg(p('dots'), 0.7, 0.95))} width={6} />
        <Arrow from={A} to={Cc} bend={260} gap={48} progress={easeInOut(seg(p('compose'), 0.2, 0.8))} width={7} color={C.violet} />

        <g opacity={nameOpacity * easeOut(seg(p('dots'), 0.3, 0.6))}>
          <Label x={A[0]} y={A[1] - 60} size={40} font="math" italic>{name('A', 's₀')}</Label>
          <Label x={B[0]} y={B[1] - 60} size={40} font="math" italic>{name('B', 's₁')}</Label>
          <Label x={Cc[0]} y={Cc[1] - 60} size={40} font="math" italic>{name('C', 's₂')}</Label>
          <Label x={740} y={440} size={36} font="math" italic>{name('f', 'add')}</Label>
          <Label x={1180} y={440} size={36} font="math" italic>{name('g', 'toggle')}</Label>
        </g>
        <Label x={960} y={775} size={40} font="math" italic color={C.violet} opacity={nameOpacity * easeOut(seg(p('compose'), 0.6, 1))}>
          {name('g ∘ f', '[add, toggle]')}
        </Label>
        <Code x={W / 2} y={860} anchor="middle" size={30} lines={['reduce(reducer, s₀, [add, toggle])  ===  s₂']} progress={seg(p('reducer'), 0.5, 1)} />
      </g>

      <g transform={`translate(${(W - MAP_W * 1.45) / 2}, 110) scale(1.45)`} opacity={mapIn}>
        <MapView kept={clock.keptSet} reveal={easeInOut(seg(p('map'), 0.05, 0.9))} pulse={p('prune') > 0 ? pulse(clock.since('prune')) : 0} links={p('prune') > 0.3} />
      </g>
      <Label x={W / 2} y={870} size={30} color={C.pencil} opacity={easeOut(seg(p('prune'), 0.4, 0.8))}>
        按 M 打开地图 · 点旁枝剪掉或接回
      </Label>
    </g>
  );
}

export default { beats, View };
