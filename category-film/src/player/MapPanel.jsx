// 剪枝面板：点地图上的旁枝，或点下面的开关。主干没有开关。
import { NODES, isTrunk, nodeById } from '../core/graph.js';
import { MapView, MAP_W, MAP_H } from '../map/MapView.jsx';
import { locate } from '../core/timeline.js';

const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export function MapPanel({ state, timeline, dispatch }) {
  const { entry } = locate(timeline, state.t);
  const toggle = id => dispatch({ type: 'prune', id });
  return (
    <div className="panel" role="dialog" aria-label="知识地图" onClick={e => e.target === e.currentTarget && dispatch({ type: 'map', open: false })}>
      <div className="sheet">
        <header>
          <h2>知识地图</h2>
          <p>粗线是主干，一直保留；细线是旁枝，点一下剪掉或接回。剪掉一枝，它上面长出的枝一起消失，主干的旁白会自动跳过提到它的那几句。虚线是跨章的呼应，这里只标出和当前这一幕有关的几条。</p>
          <button onClick={() => dispatch({ type: 'map', open: false })} aria-label="关闭">×</button>
        </header>
        <svg viewBox={`-20 20 ${MAP_W + 60} ${MAP_H - 40}`} className="bigmap">
          <MapView kept={timeline.kept} current={entry.id} onToggle={toggle} linkLabels highlight={entry.id} />
        </svg>
        <ul className="branches">
          {NODES.filter(n => !isTrunk(n)).map(n => {
            const on = timeline.kept.has(n.id);
            const parentCut = !on && !state.pruned.includes(n.id);
            return (
              <li key={n.id}>
                <button aria-pressed={on} className={on ? 'on' : ''} onClick={() => toggle(n.id)} disabled={parentCut} data-branch={n.id}>
                  {on ? '✓' : '✂'} {n.title}
                </button>
                <small>{parentCut ? `随「${nodeById.get(n.parent).short}」一起剪掉` : `长在「${nodeById.get(n.parent).short}」上`}</small>
              </li>
            );
          })}
        </ul>
        <footer>
          当前剪辑：{timeline.entries.length} 幕，{mmss(timeline.total)}
          {state.pruned.length > 0 && (
            <button onClick={() => state.pruned.forEach(id => dispatch({ type: 'prune', id }))}>全部接回</button>
          )}
          <button onClick={() => dispatch({ type: 'jump', id: entry.id })}>从本幕开头看</button>
        </footer>
      </div>
    </div>
  );
}
