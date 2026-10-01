// 七：资源与 Scope。snippets/07-scope.ts 的同一段程序：开门、开灯、开窗，待一会儿，离开。
// 每个“开”和“关”都要 80ms，这样倒序在时间轴上看得见。
import { Data, Effect } from 'effect';
import { record } from '../effect/record.js';

class Stuck extends Data.TaggedError('Stuck') {}
class Spilled extends Data.TaggedError('Spilled') {}

export const THINGS = ['门', '灯', '窗'];
export const AXIS_MS = 800;

export const lab = {
  knobs: [
    {
      id: 'trouble',
      label: '这一次',
      options: [
        { value: 'none', label: '一切正常' },
        { value: 'fail', label: '待着时出错' },
        { value: 'interrupt', label: '400ms 时被打断' },
        { value: 'acquire', label: '窗打不开' },
      ],
    },
  ],
  defaults: { trouble: 'none' },
  // “出错也好、被打断也好”那一拍并排比较四种情况，所以四种都跑；yours 是旋钮选中的那一种。
  async run({ trouble }) {
    const kinds = ['none', 'fail', 'interrupt', 'acquire'];
    const runs = Object.fromEntries(await Promise.all(kinds.map(async k => [k, await home(k)])));
    return { runs, yours: runs[trouble] };
  },
};

export const TROUBLES = ['none', 'fail', 'interrupt', 'acquire'];

function home(trouble) {
    return record(mark => {
      const open = (lane, thing) =>
        Effect.acquireRelease(
          Effect.gen(function* () {
            yield* mark(lane, 'acquiring', thing);
            yield* Effect.sleep(80);
            if (trouble === 'acquire' && thing === '窗') {
              yield* mark(lane, 'acquire-failed', thing);
              return yield* new Stuck();
            }
            yield* mark(lane, 'acquired', thing);
          }),
          () =>
            Effect.gen(function* () {
              yield* mark(lane, 'releasing', thing);
              yield* Effect.sleep(80);
              yield* mark(lane, 'released', thing);
            }),
        );
      const program = Effect.scoped(
        Effect.gen(function* () {
          for (const [i, thing] of THINGS.entries()) yield* open(i + 1, thing);
          yield* mark(0, 'stay');
          yield* Effect.sleep(trouble === 'fail' ? 150 : 300);
          if (trouble === 'fail') {
            yield* mark(0, 'fail');
            return yield* new Spilled();
          }
          yield* mark(0, 'leave');
        }).pipe(Effect.onInterrupt(() => mark(0, 'interrupted'))),
      );
      return trouble === 'interrupt' ? program.pipe(Effect.timeout(400)) : program;
    });
}
