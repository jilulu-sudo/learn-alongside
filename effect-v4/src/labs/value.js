// 一：Effect 是值。和 snippets/01-value.ts 同一段程序，只是每次实验都从 count = 0 开始。
import { Effect } from 'effect';

export const lab = {
  knobs: [
    { id: 'runs', label: '调用 runSync 几次', options: [0, 1, 2, 3].map(n => ({ value: n, label: `${n} 次` })) },
    { id: 'map', label: '加上 map(n => n * 10)', options: [{ value: true, label: '加' }, { value: false, label: '不加' }] },
  ],
  defaults: { runs: 2, map: true },
  async run({ runs, map }) {
    let count = 0;
    const base = Effect.sync(() => ++count);
    const program = map ? base.pipe(Effect.map(n => n * 10)) : base;
    const afterCreate = count;
    const results = [];
    for (let i = 0; i < runs; i++) results.push(Effect.runSync(program));
    return { afterCreate, results, count };
  },
};
