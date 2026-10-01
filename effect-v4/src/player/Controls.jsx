// 控制条：播放、上一拍/下一拍、进度（按拍分段）、速度、字幕、朗读。
import { config } from '../config.js';

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function Controls({ state, timeline, dispatch, stepTo, nextScene }) {
  const total = timeline?.total ?? 0;
  const ended = timeline && state.t >= total - 1e-6;
  return (
    <div className="controls">
      <button className="ctl play" onClick={() => dispatch({ type: 'toggle' })} aria-label={state.playing ? '暂停' : '播放'} disabled={!timeline}>
        {state.playing ? '❚❚' : '▶'}
      </button>
      <button className="ctl" onClick={() => dispatch({ type: 'step', to: stepTo(-1) })} aria-label="上一拍" disabled={!timeline}>
        ‹
      </button>
      <button className="ctl" onClick={() => dispatch({ type: 'step', to: stepTo(1) })} aria-label="下一拍" disabled={!timeline}>
        ›
      </button>
      <div className="scrub">
        <div className="beats">
          {timeline?.beats.map(b => (
            <button
              key={b.id}
              className={`beat ${state.t >= b.start && state.t < b.end ? 'now' : ''} ${state.t >= b.end ? 'done' : ''}`}
              style={{ flexGrow: b.end - b.start }}
              onClick={() => dispatch({ type: 'seek', t: b.start })}
              aria-label={`跳到这一拍：${b.say.slice(0, 16)}`}
              title={b.say}
            >
              <span style={{ width: `${Math.min(100, Math.max(0, ((state.t - b.start) / (b.end - b.start)) * 100))}%` }} />
            </button>
          ))}
        </div>
      </div>
      <span className="time">
        {fmt(state.t)} / {fmt(total)}
      </span>
      <select aria-label="速度" value={state.speed} onChange={e => dispatch({ type: 'speed', speed: Number(e.target.value) })}>
        {config.speeds.map(s => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
      <button className={`ctl text ${state.captions ? 'on' : ''}`} onClick={() => dispatch({ type: 'captions' })} aria-pressed={state.captions}>
        字幕
      </button>
      <button className={`ctl text ${state.voice ? 'on' : ''}`} onClick={() => dispatch({ type: 'voice' })} aria-pressed={state.voice}>
        朗读
      </button>
      {ended && nextScene && (
        <button className="ctl next" onClick={() => dispatch({ type: 'next' })}>
          下一章 · {nextScene.mark} {nextScene.title} →
        </button>
      )}
    </div>
  );
}
