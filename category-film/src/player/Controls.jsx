import { config } from '../film.config.js';
import { chapterColor } from '../paint/theme.js';

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function Controls({ state, timeline, dispatch }) {
  const { total, entries } = timeline;
  const seekFrom = e => {
    const r = e.currentTarget.getBoundingClientRect();
    dispatch({ type: 'seek', t: ((e.clientX - r.left) / r.width) * total });
  };
  return (
    <div className="controls">
      <button onClick={() => dispatch({ type: 'step', dir: -1 })} title="上一拍（←）" aria-label="上一拍">⏮</button>
      <button className="play" onClick={() => dispatch({ type: 'toggle' })} title="播放 / 暂停（空格）" aria-label={state.playing ? '暂停' : '播放'} data-testid="play">
        {state.playing ? '❚❚' : '▶'}
      </button>
      <button onClick={() => dispatch({ type: 'step', dir: 1 })} title="下一拍（→）" aria-label="下一拍">⏭</button>

      <div className="track" onClick={seekFrom} data-testid="track">
        {entries.map(e => (
          <div
            key={e.id}
            className="chunk"
            title={e.node.title}
            style={{ flexGrow: e.end - e.start, background: chapterColor(e.node.chapter), opacity: e.node.parent ? 0.55 : 0.9 }}
          />
        ))}
        <div className="head" style={{ left: `${(state.t / total) * 100}%` }} />
      </div>

      <span className="time" data-testid="time">
        {mmss(state.t)} / {mmss(total)}
      </span>
      <select value={state.speed} onChange={e => dispatch({ type: 'speed', speed: Number(e.target.value) })} aria-label="播放速度">
        {config.speeds.map(s => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
      <button className={state.captions ? 'on' : ''} onClick={() => dispatch({ type: 'captions' })} title="字幕（C）">字幕</button>
      <button className={state.voice ? 'on' : ''} onClick={() => dispatch({ type: 'voice' })} title="朗读旁白（V），用浏览器自带的语音">朗读</button>
      <button className={state.mapOpen ? 'on' : ''} onClick={() => dispatch({ type: 'map' })} title="知识地图与剪枝（M）" data-testid="open-map">地图</button>
    </div>
  );
}
