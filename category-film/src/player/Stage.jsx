// 画面 = f(时间线, t)。这里没有任何状态：同一个 t 永远渲染出同一幅画。
import { locate, makeClock } from '../core/timeline.js';
import { CHAPTERS } from '../core/graph.js';
import { config } from '../film.config.js';
import { MapView, MAP_W } from '../map/MapView.jsx';
import { Label, Disc } from '../paint/Brush.jsx';
import { C, W, H, chapterColor } from '../paint/theme.js';
import { pulse } from '../paint/ease.js';

export function Stage({ timeline, t }) {
  const { entry, time, index } = locate(timeline, t);
  const clock = makeClock(entry, time, timeline.kept);
  const { View } = entry.scene;
  const fade = config.stage.fade;
  const last = index === timeline.entries.length - 1;
  const opacity = Math.min(1, clock.t / fade, last ? 1 : (clock.dur - clock.t) / fade);

  return (
    <svg className="stage" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={entry.node.title} data-scene={entry.id}>
      <g opacity={Math.max(0, opacity)}>
        <View clock={clock} />
      </g>
      <Hud entry={entry} kept={timeline.kept} seconds={clock.t} />
    </svg>
  );
}

function Hud({ entry, kept, seconds }) {
  const chapter = CHAPTERS[entry.node.chapter];
  const color = chapterColor(entry.node.chapter);
  const scale = 0.3;
  return (
    <g className="hud">
      <Disc c={[86, 86]} r={34} color={color} seed={3} />
      <Label x={86} y={98} size={32} color={C.paper} weight={700}>
        {chapter.mark}
      </Label>
      <Label x={140} y={74} size={24} anchor="start" color={C.pencil}>
        {chapter.name}
      </Label>
      <Label x={140} y={112} size={34} anchor="start" weight={600}>
        {entry.node.title}
      </Label>
      <g transform={`translate(${W - MAP_W * scale - 36}, 28) scale(${scale})`} opacity={0.9}>
        <MapView kept={kept} current={entry.id} labels={false} links={false} pulse={pulse(seconds)} />
      </g>
    </g>
  );
}
