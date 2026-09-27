// 播放器里所有的副作用都在这里：时钟、键盘、URL、语音。它们只读 state、只发 action。
import { useEffect, useRef } from 'react';
import { toQuery } from '../core/url.js';
import { config } from '../film.config.js';

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
  m: { type: 'map' },
  c: { type: 'captions' },
  v: { type: 'voice' },
  Escape: { type: 'map', open: false },
};

export function useKeyboard(dispatch) {
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('select, input, textarea')) return;
      if (e.key === 'f') return void (document.fullscreenElement ? document.exitFullscreen() : document.querySelector('.frame')?.requestFullscreen?.());
      const action = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);
}

export function useUrlSync(state, chrome) {
  const query = toQuery(state, { chrome });
  useEffect(() => {
    if (query !== window.location.search) history.replaceState(null, '', query || window.location.pathname);
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
