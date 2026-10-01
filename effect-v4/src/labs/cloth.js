// 终：没有要跑的程序，旋钮只决定高亮哪一根线。
import { THREADS } from '../scenes/clothData.js';

export const lab = {
  knobs: [{ id: 'focus', label: '看哪一根线', options: [{ value: '', label: '整匹布' }].concat(THREADS.map(t => ({ value: t.id, label: t.name }))) }],
  defaults: { focus: '' },
  async run() {
    return {};
  },
};
