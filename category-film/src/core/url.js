// URL 是可分享的状态：?prune=fourier,hackenbush&speed=1.25&t=90&chrome=0&autoplay=1
import { normalizePruned } from './prune.js';

export function parseQuery(search, nodes, speeds) {
  const q = new URLSearchParams(search);
  const out = {};
  if (q.has('prune')) out.pruned = normalizePruned(nodes, q.get('prune').split(',').filter(Boolean));
  const speed = Number(q.get('speed'));
  if (speeds.includes(speed)) out.speed = speed;
  const t = Number(q.get('t'));
  if (q.has('t') && Number.isFinite(t) && t >= 0) out.t = t;
  if (q.get('autoplay') === '1') out.playing = true;
  return { state: out, chrome: q.get('chrome') !== '0' };
}

export function toQuery(state, { chrome = true } = {}) {
  const q = new URLSearchParams();
  if (state.pruned.length) q.set('prune', state.pruned.join(','));
  if (state.speed !== 1) q.set('speed', String(state.speed));
  if (!state.playing && state.t > 0) q.set('t', state.t.toFixed(1));
  if (!chrome) q.set('chrome', '0');
  const s = q.toString().replaceAll('%2C', ',');
  return s ? `?${s}` : '';
}
