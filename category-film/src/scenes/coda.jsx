import { Label, Stroke, Disc, Circle, Arrow } from '../paint/Brush.jsx';
import { MapView, MAP_W } from '../map/MapView.jsx';
import { NODES, nodeById } from '../core/graph.js';
import { C, W } from '../paint/theme.js';
import { easeInOut, easeOut, inOut, seg } from '../paint/ease.js';

const beats = [
  { id: 'map', say: '回到地图。粗线是主干；你剪掉的枝，只留下一道铅笔印。' },
  { id: 'thread', say: '一路走来，其实只做了一件事：换掉“加法”是什么。叠画纸，沿偏序累加，取最小，异或，最后是箭头的组合本身。' },
  { id: 'painting', say: '这是今晚的画。每个留下来的岛，都留下一个母题。', dur: 10 },
  { id: 'end', say: '组合，是我找到的唯一一种笔触。谢谢你看到这里。' },
];

const THREAD = [
  ['semigroup', 'over'],
  ['mobius', 'Σ 沿偏序'],
  ['tropical', 'min'],
  ['nim', '⊕ 异或'],
  ['category', '∘'],
];

const S = 1.45;
const OX = (W - MAP_W * S) / 2;
const OY = 110;

// 每个节点贡献一个母题。剪掉的节点不画——所以每个人的最后一幅画都不一样。
const MOTIFS = {
  prelude: k => <Stroke pts={[[180, 860], [760, 520], [1300, 300], [1760, 220]]} width={46} color={C.ink} progress={k} seed={4} amp={7} />,
  semigroup: k => (
    <g opacity={k}>
      <Disc c={[520, 430]} r={150} color={C.red} opacity={0.7} seed={1} />
      <Disc c={[640, 480]} r={110} color={C.yellow} opacity={0.75} seed={2} />
      <Disc c={[570, 560]} r={90} color={C.blue} opacity={0.6} seed={3} />
    </g>
  ),
  commutator: k => <Stroke pts={[[300, 780], [420, 780], [420, 660], [300, 660], [300, 740]]} width={9} color={C.red} progress={k} seed={8} />,
  mobius: k => (
    <g opacity={k}>
      {[[980, 420, 900, 330], [980, 420, 1060, 330], [900, 330, 980, 240], [1060, 330, 980, 240]].map(([a, b, c, d], i) => (
        <Stroke key={i} pts={[[a, b], [c, d]]} width={6} color={C.blue} seed={20 + i} />
      ))}
    </g>
  ),
  fourier: k => (
    <g opacity={k}>
      <Circle c={[1180, 640]} r={120} color={C.blue} width={8} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <line key={i} x1={1180 + Math.cos(a) * 130} y1={640 + Math.sin(a) * 130} x2={1180 + Math.cos(a) * (150 + (i % 4 === 1 ? 40 : 0))} y2={640 + Math.sin(a) * (150 + (i % 4 === 1 ? 40 : 0))} stroke={C.blue} strokeWidth={5} />;
      })}
    </g>
  ),
  tropical: k => <Stroke pts={[[640, 800], [900, 800], [1120, 700], [1480, 460]]} width={14} color={C.ochre} progress={k} seed={31} />,
  dequant: k => <Stroke pts={[[640, 770], [860, 768], [1000, 740], [1150, 660], [1460, 440]]} width={5} color={C.blue} progress={k} seed={32} />,
  nim: k => (
    <g opacity={k}>
      {[0, 1, 2].map(i => (
        <g key={i}>
          <Stroke pts={[[1450 + i * 60, 520], [1440 + i * 60, 300]]} width={10} color={C.green} seed={40 + i} />
          <Disc c={[1440 + i * 60, 290]} r={16} color={[C.red, C.yellow, C.blue][i]} />
        </g>
      ))}
    </g>
  ),
  hackenbush: k => (
    <g opacity={k}>
      <Stroke pts={[[1660, 820], [1650, 720]]} width={12} color={C.blue} seed={50} />
      <Stroke pts={[[1650, 720], [1670, 620]]} width={12} color={C.red} seed={51} />
    </g>
  ),
  category: k => <Arrow from={[260, 360]} to={[1700, 560]} bend={-260} width={12} head={34} color={C.violet} progress={k} seed={60} />,
  functor: k => <Arrow from={[760, 260]} to={[1000, 200]} bend={-30} width={7} head={20} color={C.violet} progress={k} seed={61} />,
  natural: k => (
    <g opacity={k}>
      <Arrow from={[1560, 700]} to={[1680, 700]} width={4} head={12} seed={62} />
      <Arrow from={[1560, 700]} to={[1560, 800]} width={4} head={12} seed={63} />
      <Arrow from={[1680, 700]} to={[1680, 800]} width={4} head={12} seed={64} />
      <Arrow from={[1560, 800]} to={[1680, 800]} width={4} head={12} seed={65} />
    </g>
  ),
  coda: () => null,
};

function View({ clock }) {
  const p = Object.fromEntries(beats.map(b => [b.id, clock.p(b.id)]));
  const kept = NODES.filter(n => clock.kept(n.id));
  const cut = NODES.length - kept.length;
  const map = inOut(p.map, seg(p.painting, 0, 0.25));
  const paint = easeOut(seg(p.painting, 0.15, 0.3));

  return (
    <g>
      <g opacity={map}>
        <g transform={`translate(${OX}, ${OY}) scale(${S})`}>
          <MapView kept={clock.keptSet} links />
          {THREAD.map(([id, word], i) => {
            const [x, y] = nodeById.get(id).at;
            return (
              <text key={id} x={x} y={y - 42} textAnchor="middle" fontSize={26} fill={C.red} fontWeight={700} opacity={easeOut(seg(p.thread, 0.15 + i * 0.14, 0.3 + i * 0.14))}>
                {word}
              </text>
            );
          })}
        </g>
        <Label x={W / 2} y={150} size={30} color={C.pencil} opacity={easeOut(seg(p.map, 0.3, 0.7))}>
          {cut ? `这一版剪掉了 ${cut} 个节点，留下 ${kept.length} 个` : `十三个节点，一个没剪`}
        </Label>
      </g>

      <g opacity={paint}>
        {kept.map((n, i) => (
          <g key={n.id}>{MOTIFS[n.id](easeInOut(seg(p.painting, 0.2 + (i / kept.length) * 0.7, 0.3 + (i / kept.length) * 0.7)))}</g>
        ))}
      </g>

      <g opacity={easeOut(seg(p.end, 0.1, 0.5))}>
        <Label x={W / 2} y={130} size={50} weight={600}>组合，是唯一的笔触。</Label>
        <Label x={1760} y={880} size={28} color={C.pencil} anchor="end" font="serif" italic>—— 一位改行读哲学的画家</Label>
      </g>
    </g>
  );
}

export default { beats, View };
