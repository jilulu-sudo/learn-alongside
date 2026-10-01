// 画面 = f(本章的时间线, 参数, 记录, t)。这里没有任何状态：同一组输入永远画出同一帧。
import { config } from '../config.js';
import { makeClock } from '../core/timeline.js';
import { C, Seal, Text } from '../paint/ink.jsx';

const { width: W, height: H, fade } = config.stage;

export function Stage({ scene, timeline, run, t }) {
  const clock = makeClock(timeline, t);
  const { View } = scene;
  const opacity = Math.min(1, clock.t / fade + 0.0001);
  return (
    <svg className="stage" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${scene.mark} · ${scene.title}`} data-scene={scene.id} data-beat={clock.beat}>
      <rect x={0} y={0} width={W} height={H} style={{ fill: C.paper }} />
      <Seal x={64} y={52} size={48} char={scene.mark} />
      <Text x={128} y={88} size={30} anchor="start" weight={600}>
        {scene.title}
      </Text>
      <g opacity={opacity}>
        <View clock={clock} params={run.params} trace={run.trace} />
      </g>
    </svg>
  );
}
