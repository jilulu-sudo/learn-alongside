// 时间线、播放器状态、地址栏：纯函数，逐条检查边界。
import { describe, expect, test } from 'vitest';
import { beatDuration, compose, locate, makeClock, spokenLength, stepBeat } from '../src/core/timeline.js';
import { initialState, keyOf, makeReducer } from '../src/core/reducer.js';
import { parseQuery, toQuery } from '../src/core/url.js';
import { highlighted, tokenizeLine } from '../src/player/highlight.js';
import { fmtExit } from '../src/paint/format.js';

const pace = { charsPerSecond: 5, latinWeight: 0.5, pad: 1, minBeat: 2 };
const scene = {
  id: 's',
  beats: [
    { id: 'a', say: '一二三四五六七八九十' },
    { id: 'b', say: ({ params }) => `参数 ${params.n}`, dur: ({ trace }) => trace.len },
    { id: 'c', say: 'ab' },
  ],
};
const ctx = { params: { n: 1 }, trace: { len: 7 } };

describe('timeline', () => {
  test('拍长：中文一个字算一个字，字母按权重，空白不算；写了 dur 取较长者；不短于 minBeat', () => {
    expect(spokenLength('一二 ab', 0.5)).toBe(3);
    expect(beatDuration(scene.beats[0], ctx, pace)).toBe(10 / 5 + 1);
    expect(beatDuration(scene.beats[1], ctx, pace)).toBe(7);
    expect(beatDuration(scene.beats[2], ctx, pace)).toBe(2);
  });

  test('compose 首尾相接；locate 把 t 夹在 [0, total] 里', () => {
    const tl = compose(scene, ctx, pace);
    expect(tl.beats.map(b => [b.start, b.end])).toEqual([[0, 3], [3, 10], [10, 12]]);
    expect(tl.beats[1].say).toBe('参数 1');
    expect(locate(tl, -5).beat.id).toBe('a');
    expect(locate(tl, 3).beat.id).toBe('b');
    expect(locate(tl, 99)).toMatchObject({ time: 12, index: 2 });
  });

  test('clock.p 是拍内进度；拼错拍名立刻报错', () => {
    const clock = makeClock(compose(scene, ctx, pace), 6.5);
    expect(clock.p('a')).toBe(1);
    expect(clock.p('b')).toBe(0.5);
    expect(clock.p('c')).toBe(0);
    expect(clock.since('b')).toBe(3.5);
    expect(clock.beat).toBe('b');
    expect(() => clock.p('nope')).toThrow(/没有声明拍 nope/);
  });

  test('上一拍先回到本拍开头，再回到上一拍；下一拍到底就是终点', () => {
    const tl = compose(scene, ctx, pace);
    expect(stepBeat(tl, 5, -1)).toBe(3);
    expect(stepBeat(tl, 3.2, -1)).toBe(0);
    expect(stepBeat(tl, 3.2, 1)).toBe(10);
    expect(stepBeat(tl, 11, 1)).toBe(12);
  });
});

describe('reducer', () => {
  const labs = { s: { defaults: { n: 1 } }, u: { defaults: { m: 'x' } } };
  const timelineOf = (state, id) => (state.runs[id] ? compose(scene, state.runs[id], pace) : null);
  const reducer = makeReducer({ chapters: ['s', 'u'], timelineOf, replayBeat: () => 'b' });
  const boot = initialState({ chapters: ['s', 'u'], labs, defaults: { speed: 1, captions: true, voice: false } });
  const ran = (state, params, trace = { len: 7 }) => reducer(state, { type: 'ran', chapter: 's', params, trace });

  test('没有记录时时钟不走；有了记录，播放到本章结尾自动停下', () => {
    let s = reducer(boot, { type: 'play' });
    s = reducer(s, { type: 'tick', dt: 1 });
    expect(s.t).toBe(0);
    s = ran(s, { n: 1 });
    s = reducer(s, { type: 'tick', dt: 5 });
    expect(s.t).toBe(5);
    s = reducer(s, { type: 'tick', dt: 50 });
    expect(s).toMatchObject({ t: 12, playing: false });
    expect(reducer(s, { type: 'play' }).t).toBe(0);
  });

  test('拨旋钮：等到新记录回来，才跳到回放那一拍并播放', () => {
    let s = ran(boot, { n: 1 });
    s = reducer(s, { type: 'knob', chapter: 's', id: 'n', value: 2 });
    expect(s.knobs.s).toEqual({ n: 2 });
    expect(s.runs.s.params).toEqual({ n: 1 });
    s = ran(s, { n: 2 }, { len: 4 });
    expect(s).toMatchObject({ t: 3, playing: true, replay: { s: false } });
    expect(s.runs.s.params).toEqual({ n: 2 });
  });

  test('过时的记录不会覆盖新的', () => {
    let s = ran(boot, { n: 1 });
    s = reducer(s, { type: 'knob', chapter: 's', id: 'n', value: 3 });
    const stale = ran(s, { n: 2 });
    expect(stale).toBe(s);
  });

  test('切章从头开始；最后一章没有下一章', () => {
    let s = reducer(boot, { type: 'go', chapter: 'u' });
    expect(s).toMatchObject({ chapter: 'u', t: 0, playing: true });
    expect(reducer(s, { type: 'next' })).toBe(s);
    expect(reducer(boot, { type: 'go', chapter: 'zzz' })).toBe(boot);
  });

  test('keyOf 只看参数内容', () => {
    expect(keyOf({ a: 1 })).toBe(keyOf({ a: 1 }));
  });
});

describe('url', () => {
  test('章节与时间往返；默认第一章、t = 0 时地址栏干净', () => {
    const q = toQuery({ chapter: 'retry', t: 12.34 }, { first: 'sign' });
    expect(q).toBe('?ch=retry&t=12.3');
    expect(parseQuery(q, ['sign', 'retry'])).toEqual({ state: { chapter: 'retry', t: 12.3 }, chrome: true });
    expect(toQuery({ chapter: 'sign', t: 0 }, { first: 'sign' })).toBe('');
    expect(parseQuery('?ch=nope&chrome=0', ['sign'])).toEqual({ state: { chapter: undefined, t: 0 }, chrome: false });
  });
});

describe('代码面板与 Exit 的写法', () => {
  test('分词保留原文', () => {
    const line = 'const x = Effect.succeed("a") // 注释';
    expect(tokenizeLine(line).map(t => t.text).join('')).toBe(line);
    expect(tokenizeLine(line).find(t => t.kind === 'comment').text).toBe('// 注释');
    expect(highlighted(['a', 'b Effect.fail', 'c'], ['Effect.fail'])).toEqual(new Set([1]));
  });

  test('Exit 的几种样子', () => {
    expect(fmtExit({ ok: true, value: 'x' })).toBe('Exit.succeed("x")');
    expect(fmtExit({ ok: false, reasons: [{ kind: 'fail', tag: 'Flaky', message: 'Flaky' }] })).toBe('Exit.fail(Flaky)');
    expect(fmtExit({ ok: false, reasons: [{ kind: 'fail', tag: null, message: 'boom' }] })).toBe('Exit.fail(Error: boom)');
    expect(fmtExit({ ok: false, reasons: [{ kind: 'die', tag: null, message: 'bug' }] })).toBe('Exit.die(bug)');
    expect(fmtExit({ ok: false, reasons: [{ kind: 'interrupt' }, { kind: 'die', message: 'x' }] })).toBe('Exit.failCause(Interrupt + Die(x))');
  });
});
