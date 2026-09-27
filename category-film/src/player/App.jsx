// 整个播放器只有一个 state、一个 reducer。视图由 state 推出，事件变成 action 回到 reducer。
import { useReducer, useEffect } from 'react';
import { config } from '../film.config.js';
import { NODES } from '../core/graph.js';
import { initialState, makeReducer } from '../core/reducer.js';
import { parseQuery } from '../core/url.js';
import { locate } from '../core/timeline.js';
import { derive } from '../film.js';
import { Stage } from './Stage.jsx';
import { Controls } from './Controls.jsx';
import { MapPanel } from './MapPanel.jsx';
import { useFrames, useKeyboard, useUrlSync, useVoice } from './effects.js';

const reducer = makeReducer({ nodes: NODES, derive });
const boot = parseQuery(window.location.search, NODES, config.speeds);

export function App() {
  const [state, dispatch] = useReducer(reducer, null, () => initialState(config.defaults, boot.state));
  const timeline = derive(state.pruned);
  const { entry, beat } = locate(timeline, state.t);

  useFrames(state.playing, dt => dispatch({ type: 'tick', dt }));
  useKeyboard(dispatch);
  useUrlSync(state, boot.chrome);
  useVoice(state, `${entry.id}/${beat.id}`, beat.say);

  // 给端到端测试和好奇的人一个把手：在控制台里 __film.seek(120)。
  useEffect(() => {
    window.__film = { state, timeline, dispatch, seek: t => dispatch({ type: 'seek', t }) };
  });

  return (
    <div className={`player ${boot.chrome ? '' : 'bare'}`}>
      <div className="frame">
        <Stage timeline={timeline} t={state.t} />
        {state.captions && beat.say && (
          <p className="caption" key={`${entry.id}/${beat.id}`} data-testid="caption">
            {beat.say}
          </p>
        )}
        {!state.playing && state.t === 0 && boot.chrome && (
          <button className="start" onClick={() => dispatch({ type: 'play' })}>
            ▶ 开始放映
          </button>
        )}
        {state.mapOpen && <MapPanel state={state} timeline={timeline} dispatch={dispatch} />}
      </div>
      {boot.chrome && <Controls state={state} timeline={timeline} dispatch={dispatch} />}
    </div>
  );
}
