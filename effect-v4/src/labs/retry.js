// 四：重试与时间。snippets/04-retry.ts 的同一段程序，加了记号，参数可调；在测试时钟上真实运行。
import { Data, Effect, Schedule } from 'effect';
import { record } from '../effect/record.js';

class Flaky extends Data.TaggedError('Flaky') {}

export const AXIS_MS = 4000;

export const lab = {
  knobs: [
    { id: 'succeedOn', label: '第几次请求会成功', options: [1, 2, 3, 4, 5].map(n => ({ value: n, label: `第 ${n} 次` })).concat({ value: 0, label: '永远失败' }) },
    {
      id: 'schedule',
      label: '时间表 Schedule',
      options: [
        { value: 'exponential', label: 'exponential("100 millis")' },
        { value: 'spaced', label: 'spaced("200 millis")' },
      ],
    },
    { id: 'times', label: 'times：最多重试几次', options: [0, 1, 2, 3, 5].map(n => ({ value: n, label: String(n) })) },
    {
      id: 'timeout',
      label: 'timeout',
      options: [
        { value: 0, label: '不设' },
        { value: 800, label: '800 毫秒' },
        { value: 2000, label: '2 秒' },
      ],
    },
  ],
  defaults: { succeedOn: 4, schedule: 'exponential', times: 5, timeout: 2000 },
  run({ succeedOn, schedule, times, timeout }) {
    return record(mark => {
      let n = 0;
      const request = Effect.gen(function* () {
        const k = ++n;
        yield* mark(k, 'start');
        yield* Effect.sleep(100);
        if (succeedOn === 0 || k < succeedOn) {
          yield* mark(k, 'fail');
          return yield* new Flaky();
        }
        yield* mark(k, 'ok');
        return `第 ${k} 次成功`;
      }).pipe(Effect.onInterrupt(() => mark(n, 'interrupt')));
      const policy = schedule === 'exponential' ? Schedule.exponential('100 millis') : Schedule.spaced('200 millis');
      const retried = request.pipe(
        Effect.retry({ schedule: policy, times }),
        Effect.onInterrupt(() => mark(0, 'cut')),
      );
      return timeout ? retried.pipe(Effect.timeout(timeout)) : retried;
    });
  },
};
