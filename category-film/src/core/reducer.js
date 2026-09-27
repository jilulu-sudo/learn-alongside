// 单向数据流：播放器的一切变化都是 (state, action) → state。
// derive(pruned) 返回时间线；它是纯函数，这里只是借它来夹紧时间、换算剪枝前后的位置。
import { remap, stepBeat } from './timeline.js';
import { togglePruned } from './prune.js';

export function initialState(defaults, overrides = {}) {
  return {
    t: 0,
    playing: false,
    speed: defaults.speed,
    pruned: defaults.pruned,
    captions: defaults.captions,
    voice: defaults.voice,
    mapOpen: false,
    ...overrides,
  };
}

export function makeReducer({ nodes, derive }) {
  const clampT = (state, t) => Math.min(derive(state.pruned).total, Math.max(0, t));

  return function reducer(state, action) {
    switch (action.type) {
      case 'play': {
        const total = derive(state.pruned).total;
        return { ...state, playing: true, t: state.t >= total ? 0 : state.t };
      }
      case 'pause':
        return { ...state, playing: false };
      case 'toggle':
        return reducer(state, { type: state.playing ? 'pause' : 'play' });
      case 'tick': {
        if (!state.playing) return state;
        const total = derive(state.pruned).total;
        const t = state.t + action.dt * state.speed;
        return t >= total ? { ...state, t: total, playing: false } : { ...state, t };
      }
      case 'seek':
        return { ...state, t: clampT(state, action.t) };
      case 'jump': {
        const entry = derive(state.pruned).entries.find(e => e.id === action.id);
        return entry ? { ...state, t: entry.start } : state;
      }
      case 'step':
        return { ...state, t: stepBeat(derive(state.pruned), state.t, action.dir) };
      case 'speed':
        return { ...state, speed: action.speed };
      case 'prune': {
        const pruned = togglePruned(nodes, state.pruned, action.id);
        if (pruned.join() === state.pruned.join()) return state;
        return { ...state, pruned, t: remap(derive(state.pruned), derive(pruned), state.t) };
      }
      case 'captions':
        return { ...state, captions: !state.captions };
      case 'voice':
        return { ...state, voice: !state.voice };
      case 'map':
        return { ...state, mapOpen: action.open ?? !state.mapOpen };
      default:
        return state;
    }
  };
}
