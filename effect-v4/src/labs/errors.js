// 三：两种错误。直接运行 snippets/03-errors.ts 的三个函数：不处理 / 接回 NotFound / 全部接回。
import { asGuest, fetchProfile, never } from '../../snippets/03-errors.ts';
import { recordSync } from '../effect/record.js';

export const HAPPENS = ['ok', 'NotFound', 'Timeout', 'Unauthorized', 'bug'];
const HANDLED = { none: fetchProfile, NotFound: asGuest, all: never };

export const lab = {
  knobs: [
    { id: 'happens', label: '这一次发生了什么', options: HAPPENS.map(h => ({ value: h, label: h === 'ok' ? '成功' : h === 'bug' ? 'bug（defect）' : h })) },
    {
      id: 'handled',
      label: '接回哪些岔路',
      options: [
        { value: 'none', label: '不接' },
        { value: 'NotFound', label: 'catchTag("NotFound")' },
        { value: 'all', label: '再加 catchTag + catch' },
      ],
    },
  ],
  defaults: { happens: 'NotFound', handled: 'NotFound' },
  async run({ happens, handled }) {
    return {
      exit: recordSync(() => HANDLED[handled](happens)).exit,
      // defect 那一拍固定演示：全部接回之后，bug 仍然穿过去
      defect: recordSync(() => never('bug')).exit,
    };
  },
};
