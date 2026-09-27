import { describe, it, expect } from 'vitest';
import { NODES } from '../src/core/graph.js';
import { initialState, makeReducer } from '../src/core/reducer.js';
import { parseQuery, toQuery } from '../src/core/url.js';
import { derive } from '../src/film.js';
import { config } from '../src/film.config.js';

const reducer = makeReducer({ nodes: NODES, derive });
const s0 = initialState(config.defaults);
const run = (state, ...actions) => actions.reduce(reducer, state);

describe('播放器 reducer', () => {
  it('暂停时 tick 不动；播放时按速度前进', () => {
    expect(run(s0, { type: 'tick', dt: 1 }).t).toBe(0);
    const s = run(s0, { type: 'play' }, { type: 'speed', speed: 2 }, { type: 'tick', dt: 0.5 });
    expect(s.t).toBeCloseTo(1);
  });

  it('播到结尾自动停住，再按播放从头开始', () => {
    const total = derive([]).total;
    const end = run(s0, { type: 'seek', t: total - 0.1 }, { type: 'play' }, { type: 'tick', dt: 1 });
    expect(end).toMatchObject({ t: total, playing: false });
    expect(run(end, { type: 'play' }).t).toBe(0);
  });

  it('seek 被夹在 [0, total]', () => {
    expect(run(s0, { type: 'seek', t: -3 }).t).toBe(0);
    expect(run(s0, { type: 'seek', t: 1e9 }).t).toBe(derive([]).total);
  });

  it('剪主干是空操作，状态引用不变', () => {
    expect(run(s0, { type: 'prune', id: 'semigroup' })).toBe(s0);
  });

  it('剪枝后播放头跟着内容走', () => {
    const tropical = derive([]).entries.find(e => e.id === 'tropical');
    const s = run(s0, { type: 'seek', t: tropical.start + 2 }, { type: 'prune', id: 'fourier' });
    expect(s.pruned).toEqual(['fourier']);
    expect(s.t).toBeCloseTo(derive(['fourier']).entries.find(e => e.id === 'tropical').start + 2);
  });

  it('jump 到被剪掉的幕是空操作', () => {
    const s = run(s0, { type: 'prune', id: 'fourier' });
    expect(run(s, { type: 'jump', id: 'fourier' })).toBe(s);
  });
});

describe('URL', () => {
  it('解析时丢掉主干和未知 id、非法速度', () => {
    const { state, chrome } = parseQuery('?prune=fourier,nim,xyz&speed=3&t=12.5&chrome=0', NODES, config.speeds);
    expect(state).toEqual({ pruned: ['fourier'], t: 12.5 });
    expect(chrome).toBe(false);
  });

  it('往返一致', () => {
    const s = { ...s0, pruned: ['dequant', 'fourier'], speed: 1.25, t: 42 };
    const { state } = parseQuery(toQuery(s), NODES, config.speeds);
    expect(state).toEqual({ pruned: ['dequant', 'fourier'], speed: 1.25, t: 42 });
  });

  it('播放中不写 t，避免每帧改地址栏', () => {
    expect(toQuery({ ...s0, t: 10, playing: true })).toBe('');
  });
});
