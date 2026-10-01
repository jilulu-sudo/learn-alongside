// 二：Effect.gen 与 Effect.fn。直接运行 snippets/02-gen.ts 的 greetUser，
// 用记录型 Tracer 收下 Effect.fn 自动产生的 span：哪一站跑了、哪一站失败，都是观测到的。
import { greetUser } from '../../snippets/02-gen.ts';
import { recordSync } from '../effect/record.js';

export const INPUTS = ['42', 'abc', '7'];

export const lab = {
  knobs: [{ id: 'input', label: 'greetUser(input) 的 input', options: INPUTS.map(s => ({ value: s, label: `"${s}"` })) }],
  defaults: { input: 'abc' },
  async run({ input }) {
    const { spans, exit } = recordSync(() => greetUser(input));
    return { spans, exit };
  },
};
