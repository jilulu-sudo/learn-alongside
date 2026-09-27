// 知识地图的画法。同一个组件用在：片头的地图、右上角的小地图、剪枝面板、片尾。
// 坐标系固定为 1100 × 560，外面用 transform 缩放摆放。
import { NODES, LINKS, isTrunk, nodeById, CHAPTERS } from '../core/graph.js';
import { Stroke, Disc, Circle, Label } from '../paint/Brush.jsx';
import { quad, linePath, partial } from '../paint/brush.js';
import { C, chapterColor } from '../paint/theme.js';
import { clamp, seg } from '../paint/ease.js';

export const MAP_W = 1100;
export const MAP_H = 560;

function catmull(points, steps = 16) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const f = k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(points.at(-1));
  return out;
}

const TRUNK = NODES.filter(isTrunk);
const TRUNK_LINE = catmull(TRUNK.map(n => n.at));
const trunkShare = TRUNK.map((_, i) => i / (TRUNK.length - 1));

export function MapView({ kept, current, reveal = 1, pulse = 0, labels = true, links = true, linkLabels = false, onToggle, highlight }) {
  const shown = id => {
    const node = nodeById.get(id);
    const anchor = isTrunk(node) ? node : nodeById.get(topTrunk(node));
    return seg(reveal, trunkShare[TRUNK.indexOf(anchor)] * 0.85, trunkShare[TRUNK.indexOf(anchor)] * 0.85 + 0.15);
  };

  return (
    <g>
      <Stroke pts={TRUNK_LINE} color={C.ink} width={16} progress={reveal} seed={11} amp={3} />

      {NODES.filter(n => !isTrunk(n)).map(n => {
        const from = nodeById.get(n.parent).at;
        const pts = quad(from, n.at, 40);
        const k = shown(n.id);
        if (k <= 0) return null;
        return kept.has(n.id) ? (
          <Stroke key={n.id} pts={pts} color={chapterColor(n.chapter)} width={7 + pulse * 5} progress={k} />
        ) : (
          <path key={n.id} d={linePath(partial(pts, k))} fill="none" stroke={C.pencil} strokeWidth={2.5} strokeDasharray="6 9" />
        );
      })}

      {links &&
        LINKS.map(l => {
          const [a, b] = [nodeById.get(l.from), nodeById.get(l.to)];
          const alive = kept.has(l.from) && kept.has(l.to);
          const k = Math.min(shown(l.from), shown(l.to));
          if (k <= 0 || !alive) return null;
          const pts = quad(a.at, b.at, -Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]) * 0.18, 40);
          const hot = highlight && (highlight === l.from || highlight === l.to);
          return (
            <g key={`${l.from}-${l.to}`} opacity={k * (hot ? 1 : 0.7)}>
              <path d={linePath(pts)} fill="none" stroke={hot ? C.ink : C.pencil} strokeWidth={hot ? 2.5 : 1.8} strokeDasharray="2 7" strokeLinecap="round" />
              {linkLabels && hot && (
                <text x={pts[20][0]} y={pts[20][1] - 6} fontSize={15} textAnchor="middle" fill={C.ink} stroke={C.paper} strokeWidth={5} paintOrder="stroke" fontFamily="inherit">
                  {l.label}
                </text>
              )}
            </g>
          );
        })}

      {NODES.map(n => {
        const k = shown(n.id);
        if (k <= 0) return null;
        const trunk = isTrunk(n);
        const alive = kept.has(n.id);
        const r = trunk ? 22 : 14;
        const color = chapterColor(n.chapter);
        const clickable = onToggle && !trunk;
        return (
          <g
            key={n.id}
            opacity={clamp(k * 1.5)}
            data-node={n.id}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={clickable ? () => onToggle(n.id) : undefined}
          >
            {clickable && <circle cx={n.at[0]} cy={n.at[1]} r={34} fill="transparent" />}
            {alive ? <Disc c={n.at} r={r} color={color} scale={clamp(k * 2)} /> : <Circle c={n.at} r={r * 0.8} color={C.pencil} width={2.5} />}
            {current === n.id && <Circle c={n.at} r={r + 10 + pulse * 4} color={C.ink} width={3.5} seed={5} />}
            {labels && (
              <Label x={n.at[0]} y={n.at[1] + r + 30} size={trunk ? 24 : 20} color={alive ? C.ink : C.pencil} weight={trunk ? 600 : 400}>
                {n.short}
              </Label>
            )}
            {labels && trunk && CHAPTERS[n.chapter].mark && (
              <Label x={n.at[0]} y={n.at[1] + 8} size={20} color={C.paper} weight={700}>
                {CHAPTERS[n.chapter].mark}
              </Label>
            )}
          </g>
        );
      })}
    </g>
  );
}

function topTrunk(node) {
  let n = node;
  while (n.parent) n = nodeById.get(n.parent);
  return n.id;
}
