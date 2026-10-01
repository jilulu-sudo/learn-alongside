// 序：同一个除法，两种写法。直接调用 snippets/00-divide.ts 里展示的那两个函数。
import { divide, divideOrThrow } from '../../snippets/00-divide.ts';
import { recordSync } from '../effect/record.js';

const B = [2, 0];

export const lab = {
  knobs: [{ id: 'b', label: 'divide(4, b) 的 b', options: B.map(b => ({ value: b, label: String(b) })) }],
  defaults: { b: 0 },
  async run() {
    const cases = {};
    for (const b of B) {
      let plain;
      try {
        plain = { ok: true, value: divideOrThrow(4, b) };
      } catch (e) {
        plain = { ok: false, thrown: e.message };
      }
      cases[b] = { plain, effect: recordSync(() => divide(4, b)).exit };
    }
    return { cases };
  },
};
