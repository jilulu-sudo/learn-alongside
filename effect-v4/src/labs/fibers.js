// 五：并发。和 snippets/05-fibers.ts 同样的五个任务（时长取自官方文档的例子），
// 每种跑法都在测试时钟上真实跑一遍。
import { Data, Effect } from 'effect';
import { record } from '../effect/record.js';

class TaskFailed extends Data.TaggedError('TaskFailed') {}

export const DURATIONS = [200, 100, 210, 110, 150];
export const AXIS_MS = 800;

const tasks = (mark, failing = 0) =>
  DURATIONS.map((ms, i) => {
    const n = i + 1;
    return Effect.gen(function* () {
      yield* mark(n, 'start');
      yield* Effect.sleep(ms);
      if (n === failing) {
        yield* mark(n, 'fail');
        return yield* new TaskFailed({ n });
      }
      yield* mark(n, 'end');
      return n;
    }).pipe(Effect.onInterrupt(() => mark(n, 'interrupt')));
  });

export const lab = {
  knobs: [
    {
      id: 'concurrency',
      label: 'concurrency',
      options: [
        { value: 1, label: '1（默认顺序）' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 'unbounded', label: '"unbounded"' },
      ],
    },
    { id: 'failing', label: '哪个任务会失败', options: [{ value: 0, label: '都不' }, { value: 2, label: '任务 2' }, { value: 5, label: '任务 5' }] },
  ],
  defaults: { concurrency: 2, failing: 0 },
  async run({ concurrency, failing }) {
    const all = (concurrency, failing) => record(mark => Effect.all(tasks(mark, failing), { concurrency }));
    const [seq, bounded, unbounded, failed, race, yours] = await Promise.all([
      all(1, 0),
      all(2, 0),
      all('unbounded', 0),
      all('unbounded', 2),
      record(mark => {
        const [one, two] = tasks(mark);
        return Effect.race(one, two);
      }),
      all(concurrency, failing),
    ]);
    return { seq, bounded, unbounded, failed, race, yours };
  },
};
