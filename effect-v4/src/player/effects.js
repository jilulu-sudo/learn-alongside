// 播放器里所有的副作用都在这里：时钟、键盘、跑实验、地址栏、语音。它们只读 state、只发 action。
import { useEffect, useRef } from 'react';
import { config } from '../config.js';
import { keyOf } from '../core/reducer.js';
import { toQuery } from '../core/url.js';

export function useFrames(active, onFrame) {
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    if (!active) return;
    let last = performance.now();
    let id = requestAnimationFrame(function loop(now) {
      cb.current(Math.min(0.1, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [active]);
}

const KEYS = {
  ' ': { type: 'toggle' },
  ArrowLeft: { type: 'step', dir: -1 },
  ArrowRight: { type: 'step', dir: 1 },
  c: { type: 'captions' },
  v: { type: 'voice' },
  n: { type: 'next' },
};

export function useKeyboard(dispatch, stepTo) {
  const step = useRef(stepTo);
  step.current = stepTo;
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === ' ' && e.target.closest?.('button')) return;
      if (e.key === 'f') return void toggleFullscreen();
      const action = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!action) return;
      e.preventDefault();
      dispatch(action.type === 'step' ? { type: 'step', to: step.current(action.dir) } : action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
}

// 旋钮变了，就把这一章的实验真的跑一遍（Effect 程序跑在测试时钟上），跑完把参数和记录一起交回。
// 当前章节优先，其余章节随后在后台准备好，切换时不用等。
export function useLabRuns(state, chapters, labs, dispatch) {
  const inflight = useRef(new Map());
  useEffect(() => {
    const order = [state.chapter, ...chapters.filter(id => id !== state.chapter)];
    for (const id of order) {
      const params = state.knobs[id];
      const key = keyOf(params);
      if (state.runs[id] && keyOf(state.runs[id].params) === key) continue;
      if (inflight.current.get(id) === key) continue;
      inflight.current.set(id, key);
      Promise.resolve(labs[id].run(params)).then(
        trace => {
          if (inflight.current.get(id) === key) inflight.current.delete(id);
          dispatch({ type: 'ran', chapter: id, params, trace });
        },
        error => {
          inflight.current.delete(id);
          console.error(`实验 ${id} 没有跑完`, error);
        },
      );
    }
  }, [state.chapter, state.knobs, state.runs, chapters, labs, dispatch]);
}

// 全屏在有些嵌入环境里不被允许：失败就算了，不报错。
function toggleFullscreen() {
  const request = document.fullscreenElement ? document.exitFullscreen?.() : document.querySelector('.frame')?.requestFullscreen?.();
  request?.catch?.(() => {});
}

// 地址栏记住章节和时间。嵌在别的页面里时可能不允许改地址，那就不记。
export function useUrlSync(state, chrome, first) {
  const query = toQuery(state, { chrome, first });
  useEffect(() => {
    try {
      if (query !== window.location.search) history.replaceState(null, '', query || window.location.pathname);
    } catch {
      // 不能改地址栏时，播放不受影响。
    }
  }, [query]);
}

// 浏览器自带的语音合成。每进入新的一拍就读这一拍的旁白；暂停或关掉就停。
export function useVoice({ voice, playing, speed }, beatKey, text) {
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    if (!voice || !playing || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = config.lang;
    u.rate = speed;
    synth.speak(u);
  }, [voice, playing, speed, beatKey, text]);
}
