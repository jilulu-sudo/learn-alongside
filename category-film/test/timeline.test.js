import { describe, it, expect } from 'vitest';
import { NODES, branchIds, isTrunk } from '../src/core/graph.js';
import { keptIds, normalizePruned, togglePruned } from '../src/core/prune.js';
import { compose, locate, makeClock, remap, stepBeat, beatDuration } from '../src/core/timeline.js';
import { film } from '../src/film.js';

const subsets = xs => xs.reduce((acc, x) => [...acc, ...acc.map(s => [...s, x])], [[]]);
const trunk = NODES.filter(isTrunk).map(n => n.id);

describe('剪枝', () => {
  it('剪掉一枝，它的子孙一起消失，主干不受影响', () => {
    const kept = keptIds(NODES, ['functor']);
    expect(kept.has('functor')).toBe(false);
    expect(kept.has('natural')).toBe(false);
    expect(kept.has('category')).toBe(true);
  });

  it('主干和未知 id 剪不掉', () => {
    expect(normalizePruned(NODES, ['semigroup', 'nope', 'fourier', 'fourier'])).toEqual(['fourier']);
    expect(togglePruned(NODES, [], 'category')).toEqual([]);
  });

  it('再点一次就接回来', () => {
    expect(togglePruned(NODES, ['fourier'], 'fourier')).toEqual([]);
  });
});

describe('任意剪枝组合下的时间线', () => {
  for (const pruned of subsets(branchIds)) {
    it(`剪 [${pruned.join(', ') || '无'}]`, () => {
      const tl = compose(film, pruned);
      const ids = tl.entries.map(e => e.id);
      const kept = keptIds(NODES, pruned);

      // 主干全在，而且顺序和地图一致
      expect(ids.filter(id => trunk.includes(id))).toEqual(trunk);
      expect(ids).toEqual(NODES.map(n => n.id).filter(id => kept.has(id)));

      // 留下的旁枝，它的父节点也一定留着；被点名剪掉的一个都不在
      for (const e of tl.entries) if (e.node.parent) expect(ids).toContain(e.node.parent);
      for (const id of pruned) expect(ids).not.toContain(id);

      // 没有一句旁白提到被剪掉的节点
      for (const e of tl.entries) {
        const declared = film.scenes[e.id].beats;
        for (const b of e.beats) {
          const needs = declared.find(d => d.id === b.id).needs ?? [];
          expect(needs.every(id => kept.has(id))).toBe(true);
        }
      }

      // 时间首尾相接，没有缝也没有重叠
      let t = 0;
      for (const e of tl.entries) {
        expect(e.start).toBeCloseTo(t);
        for (const b of e.beats) {
          expect(b.start).toBeCloseTo(t);
          t = b.end;
        }
        expect(e.end).toBeCloseTo(t);
      }
      expect(tl.total).toBeCloseTo(t);
    });
  }
});

describe('定位与时钟', () => {
  const tl = compose(film, []);

  it('边界：t 落在两幕交界时属于后一幕，t = total 属于最后一幕', () => {
    const second = tl.entries[1];
    expect(locate(tl, second.start).entry.id).toBe(second.id);
    expect(locate(tl, tl.total).entry.id).toBe('coda');
    expect(locate(tl, -5).time).toBe(0);
  });

  it('clock.p 在拍前为 0、拍中线性、拍后为 1', () => {
    const e = tl.entries[0];
    const b = e.beats[1];
    const mid = (b.start + b.end) / 2;
    expect(makeClock(e, b.start - 0.01, tl.kept).p(b.id)).toBe(0);
    expect(makeClock(e, mid, tl.kept).p(b.id)).toBeCloseTo(0.5);
    expect(makeClock(e, b.end + 0.01, tl.kept).p(b.id)).toBe(1);
  });

  it('被剪掉的拍进度恒为 0；拼错的拍名直接报错', () => {
    const cut = compose(film, ['fourier']);
    const nim = cut.entries.find(e => e.id === 'nim');
    const clock = makeClock(nim, nim.end, cut.kept);
    expect(clock.p('link-fourier')).toBe(0);
    expect(clock.has('link-fourier')).toBe(false);
    expect(() => clock.p('link-fouirer')).toThrow(/没有声明/);
  });

  it('拍的时长跟着旁白字数走，也可以用 dur 固定', () => {
    const pace = { charsPerSecond: 5, pad: 1, minBeat: 3 };
    expect(beatDuration({ say: '一二三四五六七八九十' }, pace)).toBe(3);
    expect(beatDuration({ say: '一'.repeat(40) }, pace)).toBe(9);
    expect(beatDuration({ say: '一'.repeat(40), dur: 2 }, pace)).toBe(2);
  });
});

describe('剪枝时播放头的去向', () => {
  const full = compose(film, []);
  const noFourier = compose(film, ['fourier']);

  it('当前幕还在：停在同一拍的同一进度', () => {
    const e = full.entries.find(x => x.id === 'tropical');
    const b = e.beats[2];
    const t = b.start + 0.3 * (b.end - b.start);
    const after = remap(full, noFourier, t);
    const loc = locate(noFourier, after);
    expect(loc.entry.id).toBe('tropical');
    expect(loc.beat.id).toBe(b.id);
    expect((after - loc.beat.start) / (loc.beat.end - loc.beat.start)).toBeCloseTo(0.3);
  });

  it('当前幕被剪掉：跳到下一个还在的幕开头', () => {
    const e = full.entries.find(x => x.id === 'fourier');
    const after = remap(full, noFourier, e.start + 5);
    expect(locate(noFourier, after).entry.id).toBe('tropical');
    expect(after).toBeCloseTo(noFourier.entries.find(x => x.id === 'tropical').start);
  });

  it('当前拍被剪掉：回到本幕开头', () => {
    const nim = full.entries.find(x => x.id === 'nim');
    const b = nim.beats.find(x => x.id === 'link-fourier');
    const after = remap(full, noFourier, b.start + 1);
    expect(after).toBeCloseTo(noFourier.entries.find(x => x.id === 'nim').start);
  });
});

describe('逐拍跳转', () => {
  const tl = compose(film, []);
  const b = tl.entries[1].beats[2];

  it('下一拍是严格在后面的第一个拍起点', () => {
    expect(stepBeat(tl, b.start, 1)).toBeCloseTo(tl.entries[1].beats[3].start);
  });

  it('刚进拍时“上一拍”回到前一拍；拍中间时回到本拍开头', () => {
    expect(stepBeat(tl, b.start + 0.1, -1)).toBeCloseTo(tl.entries[1].beats[1].start);
    expect(stepBeat(tl, b.start + 2, -1)).toBeCloseTo(b.start);
  });
});
