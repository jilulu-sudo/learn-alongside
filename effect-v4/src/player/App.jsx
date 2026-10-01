// 整个播放器只有一个 state、一个 reducer。画面由 state 推出，事件变成 action 回到 reducer。
import { useCallback, useEffect, useReducer } from 'react';
import { config } from '../config.js';
import { BY_ID, CHAPTERS, LABS, SCENES, replayBeat, timelineOf } from '../course.js';
import { initialState, makeReducer } from '../core/reducer.js';
import { locate, stepBeat } from '../core/timeline.js';
import { parseQuery } from '../core/url.js';
import { Stage } from './Stage.jsx';
import { Controls } from './Controls.jsx';
import { CodePanel, LabPanel } from './Side.jsx';
import { useFrames, useKeyboard, useLabRuns, useUrlSync, useVoice } from './effects.js';

const reducer = makeReducer({ chapters: CHAPTERS, timelineOf, replayBeat });
const boot = parseQuery(window.location.search, CHAPTERS);

export function App() {
  const [state, dispatch] = useReducer(reducer, null, () => initialState({ chapters: CHAPTERS, labs: LABS, defaults: config.defaults }, boot.state));
  const scene = BY_ID[state.chapter];
  const run = state.runs[state.chapter];
  const timeline = timelineOf(state, state.chapter);
  const beat = timeline ? locate(timeline, state.t).beat : null;
  const index = CHAPTERS.indexOf(state.chapter);
  const stepTo = useCallback(dir => (timeline ? stepBeat(timeline, state.t, dir) : 0), [timeline, state.t]);

  useLabRuns(state, CHAPTERS, LABS, dispatch);
  useFrames(state.playing && Boolean(timeline), dt => dispatch({ type: 'tick', dt }));
  useKeyboard(dispatch, stepTo);
  useUrlSync(state, boot.chrome, CHAPTERS[0]);
  useVoice(state, `${state.chapter}/${beat?.id}`, beat?.say);

  // 给端到端测试和好奇的人一个把手：在控制台里 __course.seek(12)。
  useEffect(() => {
    window.__course = { state, timeline, dispatch, seek: t => dispatch({ type: 'seek', t }), go: chapter => dispatch({ type: 'go', chapter, play: false }) };
  });

  return (
    <div className={`app ${boot.chrome ? '' : 'bare'}`}>
      <header className="top">
        <div className="brand">
          <span className="brand-title">一根线</span>
          <span className="brand-sub">Effect v4 · rc.118 · 一部可以拆开的动画课</span>
        </div>
        <nav className="chapters" aria-label="章节">
          {SCENES.map(s => (
            <button key={s.id} className="seal" aria-current={s.id === state.chapter ? 'step' : undefined} onClick={() => dispatch({ type: 'go', chapter: s.id })} title={`${s.mark} · ${s.title}`}>
              <span className="mark">{s.mark}</span>
              <span className="name">{s.title}</span>
            </button>
          ))}
        </nav>
      </header>
      <main className="layout">
        <section className="theater">
          <div className="frame">
            {timeline ? <Stage scene={scene} timeline={timeline} run={run} t={state.t} /> : <div className="stage placeholder" aria-busy="true" />}
            {!state.started && timeline && (
              <button className="start" onClick={() => dispatch({ type: 'play' })}>
                ▶ 开始
              </button>
            )}
          </div>
          <p className="turn">横过来看，画面更清楚</p>
          {boot.chrome && (
            <>
              <p className="caption" data-testid="caption" aria-live="polite">
                {state.captions ? beat?.say : ''}
              </p>
              <Controls state={state} timeline={timeline} dispatch={dispatch} stepTo={stepTo} nextScene={SCENES[index + 1]} />
              <p className="keys">空格 播放/暂停 · ← → 上一拍/下一拍 · N 下一章 · F 全屏</p>
            </>
          )}
        </section>
        {boot.chrome && (
          <aside className="side">
            <LabPanel scene={scene} knobs={state.knobs[state.chapter]} run={run} dispatch={dispatch} />
            <CodePanel scene={scene} anchors={beat?.hl ?? []} />
          </aside>
        )}
      </main>
    </div>
  );
}
