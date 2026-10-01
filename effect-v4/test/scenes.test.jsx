// 每一章、每一种旋钮组合、每一拍：用真实运行的记录把画面渲染出来，检查没有 NaN、没有异常，
// 同一时刻渲染两次结果相同；旁白的高亮锚点都能在屏幕上的代码里找到；画面上的类型与代码里的类型一致。
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { config } from '../src/config.js';
import { SCENES } from '../src/course.js';
import { compose } from '../src/core/timeline.js';
import { Stage } from '../src/player/Stage.jsx';
import { linesOf, highlighted } from '../src/player/highlight.js';
import { HANDLED, remaining } from '../src/scenes/errors.jsx';
import { THREADS, WARP } from '../src/scenes/clothData.js';

const combos = knobs =>
  knobs.reduce((acc, k) => acc.flatMap(params => k.options.map(o => ({ ...params, [k.id]: o.value }))), [{}]);

describe.each(SCENES.map(s => [s.id, s]))('%s', (id, scene) => {
  test('默认参数在旋钮的选项里', () => {
    for (const k of scene.lab.knobs) expect(k.options.map(o => o.value)).toContain(scene.lab.defaults[k.id]);
  });

  test('每一拍的高亮锚点都在屏幕上的代码里', () => {
    const lines = linesOf(scene.code);
    for (const beat of scene.beats) for (const anchor of beat.hl ?? []) expect(highlighted(lines, [anchor]).size, `${beat.id}: ${anchor}`).toBeGreaterThan(0);
  });

  test('所有旋钮组合、每一拍的开头/中间/结尾都能画，画两次结果相同', async () => {
    for (const params of combos(scene.lab.knobs)) {
      const trace = await scene.lab.run(params);
      const run = { params, trace };
      const timeline = compose(scene, run, config.pace);
      expect(timeline.total).toBeGreaterThan(0);
      for (const b of timeline.beats) {
        expect(b.say.length, `${b.id} 没有旁白`).toBeGreaterThan(4);
        expect(b.say).not.toMatch(/undefined|NaN|\[object/);
        for (const f of [0.02, 0.5, 0.98]) {
          const t = b.start + (b.end - b.start) * f;
          const html = renderToStaticMarkup(<Stage scene={scene} timeline={timeline} run={run} t={t} />);
          // 属性里不能出现坏数；文字里可以有“undefined”这样的真实错误信息（比如 profile is undefined）。
          expect(html, `${JSON.stringify(params)} ${b.id}@${f}`).not.toMatch(/="[^"]*(?:NaN|undefined|Infinity)[^"]*"|\[object/);
          expect(html).toContain(`data-beat="${b.id}"`);
          expect(renderToStaticMarkup(<Stage scene={scene} timeline={timeline} run={run} t={t} />)).toBe(html);
        }
      }
      if (scene.readout)
        for (const row of scene.readout(run)) {
          expect(row.v, row.k).toBeTypeOf('string');
          expect(row.v).not.toMatch(/NaN|\[object/);
        }
    }
  }, 60_000);
});

test('第三章画面上的错误类型，和 snippets/03-errors.ts 里三个函数标注的类型一致', () => {
  const code = SCENES.find(s => s.id === 'errors').code;
  const annotated = name => code.match(new RegExp(`export const ${name} = \\([^)]*\\)?[^:]*\\): Effect\\.Effect<string, ([^>]+)>`, 'm'))?.[1] ?? code.match(new RegExp(`export const ${name} = \\(\\s*happens: Happens\\s*\\): Effect\\.Effect<string, ([^>]+)>`, 'm'))?.[1];
  expect(annotated('fetchProfile')).toBe(remaining('none').join(' | '));
  expect(annotated('asGuest')).toBe(remaining('NotFound').join(' | '));
  expect(annotated('never')).toBe('never');
  expect(remaining('all')).toEqual([]);
  expect(Object.keys(HANDLED)).toEqual(['none', 'NotFound', 'all']);
});

test('终幕的布：每一个结都打在存在的竖线上，生态那根线穿过所有竖线', () => {
  const ids = new Set(WARP.map(w => w.id));
  for (const t of THREADS) for (const u of t.uses) expect(ids.has(u), `${t.id} → ${u}`).toBe(true);
  expect(THREADS.find(t => t.id === 'ecosystem').uses).toHaveLength(WARP.length);
  expect(new Set(WARP.map(w => w.chapter))).toEqual(new Set(SCENES.map(s => s.id).filter(id => !['sign', 'cloth'].includes(id))));
});
