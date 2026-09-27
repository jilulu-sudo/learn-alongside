// 在 Node 里把每一幕的每一拍都渲染一遍：拼错拍名、除零、越界都会在这里炸。
// 同一个 t 渲染两次必须一模一样——画面是时间的纯函数。
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NODES, LINKS, branchIds, nodeById } from '../src/core/graph.js';
import { compose } from '../src/core/timeline.js';
import { film } from '../src/film.js';
import { Stage } from '../src/player/Stage.jsx';

const cuts = [[], branchIds, ...branchIds.map(id => [id])];

describe('场景契约', () => {
  it('地图上每个节点都有场景，场景没有多余的', () => {
    expect(Object.keys(film.scenes).sort()).toEqual(NODES.map(n => n.id).sort());
  });

  it('拍名在场景内唯一；needs 只指向别的旁枝', () => {
    for (const [id, scene] of Object.entries(film.scenes)) {
      const ids = scene.beats.map(b => b.id);
      expect(new Set(ids).size, id).toBe(ids.length);
      for (const b of scene.beats) for (const n of b.needs ?? []) expect(branchIds.includes(n) && n !== id, `${id}/${b.id}`).toBe(true);
    }
  });

  it('跨章连线的两端都在地图上', () => {
    for (const l of LINKS) expect(nodeById.has(l.from) && nodeById.has(l.to)).toBe(true);
  });
});

describe.each(cuts.map(c => [c.join(',') || '完整版', c]))('逐拍渲染：%s', (_, pruned) => {
  const tl = compose(film, pruned);
  it('每一拍的开头、中间、结尾都能渲染，而且可重现', () => {
    for (const e of tl.entries) {
      for (const b of e.beats) {
        for (const t of [b.start, (b.start + b.end) / 2, b.end - 1e-3]) {
          const a = renderToStaticMarkup(<Stage timeline={tl} t={t} />);
          expect(a, `${e.id}/${b.id}@${t.toFixed(2)}`).toContain('<svg');
          expect(a).not.toMatch(/NaN|undefined/);
          if (b === e.beats[1]) expect(renderToStaticMarkup(<Stage timeline={tl} t={t} />)).toBe(a);
        }
      }
    }
  });
});
