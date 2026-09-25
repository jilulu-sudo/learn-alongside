// 浏览器这一层：读写 localStorage、解析表单、渲染。所有输入校验都放在这里，domain.js 只收合法数据。
import { emptyState, apply, agenda, summary, todayISO, addDays, nextRenewal, yuan } from './domain.js';

const KEY = 'family-agenda:v1';
const $ = sel => document.querySelector(sel);
const LABEL = { subscription: '订阅', purchase: '水果', activity: '学习' };

let state = load();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(parsed?.items) ? parsed : emptyState();
  } catch {
    return emptyState();
  }
}

function dispatch(action) {
  state = apply(state, action);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    $('[data-testid=error]').textContent = '浏览器不允许保存，刷新后数据会丢失。';
  }
  render();
}

function when(date, today) {
  if (date < today) return '已过期';
  if (date === today) return '今天';
  if (date === addDays(today, 1)) return '明天';
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8))} 周${'日一二三四五六'[new Date(`${date}T00:00:00Z`).getUTCDay()]}`;
}

function row(kind, text, dateText, button) {
  const li = document.createElement('li');
  li.innerHTML = '<span class="tag"></span><span class="text"></span><span class="when"></span>';
  li.querySelector('.tag').textContent = LABEL[kind];
  li.querySelector('.text').textContent = text;
  li.querySelector('.when').textContent = dateText;
  if (button) li.append(button);
  return li;
}

function button(label, testid, onClick, cls = '') {
  const b = document.createElement('button');
  b.textContent = label;
  b.dataset.testid = testid;
  b.className = cls;
  b.onclick = onClick;
  return b;
}

function render() {
  const today = todayISO();
  const s = summary(state, today);
  $('[data-testid=monthly]').textContent = `¥${yuan(s.monthlyCents)}`;
  $('[data-testid=fruit-due]').textContent = `${s.fruitDue} 样`;
  $('[data-testid=next-activity]').textContent = s.nextActivity ? `${when(s.nextActivity.date, today)} ${s.nextActivity.topic}` : '暂无';

  $('[data-testid=agenda]').replaceChildren(
    ...agenda(state, today).map(r =>
      row(r.kind, r.text, when(r.date, today),
        r.kind === 'purchase' ? button('买了', `bought-${r.id}`, () => dispatch({ type: 'bought', id: r.id, on: today })) : null),
    ),
  );
  $('[data-testid=empty]').hidden = state.items.length > 0;

  $('[data-testid=all-items]').replaceChildren(
    ...state.items.map(it => {
      const detail = {
        subscription: () => `¥${yuan(it.amountCents)}/${it.cycle === 'monthly' ? '月' : '年'}，下次 ${nextRenewal(it, today)}`,
        purchase: () => (it.everyDays ? `每 ${it.everyDays} 天` : '一次性'),
        activity: () => it.date,
      }[it.kind]();
      return row(it.kind, it.name ?? it.topic, detail, button('删除', `remove-${it.id}`, () => dispatch({ type: 'remove', id: it.id }), 'ghost'));
    }),
  );
}

// 表单是系统边界：字符串在这里变成合法的领域数据，不合法就提示并拒收。
const PARSE = {
  subscription: f => {
    const amountCents = Math.round(Number(f.amount) * 100);
    if (!(amountCents > 0)) throw new Error('金额要是大于 0 的数字');
    return { name: f.name.trim(), amountCents, cycle: f.cycle, start: f.start };
  },
  purchase: f => {
    const qty = f.qty === '' ? 1 : Number(f.qty);
    const everyDays = f.everyDays === '' ? null : Number(f.everyDays);
    if (!Number.isInteger(qty) || qty < 1) throw new Error('数量要是正整数');
    if (everyDays !== null && (!Number.isInteger(everyDays) || everyDays < 1)) throw new Error('间隔天数要是正整数，或者留空');
    return { name: f.name.trim(), qty, everyDays, lastBought: null };
  },
  activity: f => ({ topic: f.topic.trim(), host: f.host.trim(), date: f.date }),
};

document.querySelectorAll('form[data-kind]').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const kind = form.dataset.kind;
    try {
      const fields = PARSE[kind](Object.fromEntries(new FormData(form)));
      dispatch({ type: 'add', item: { id: crypto.randomUUID(), kind, ...fields } });
      form.reset();
      $('[data-testid=error]').textContent = '';
    } catch (err) {
      $('[data-testid=error]').textContent = err.message;
    }
  });
});

$('[data-testid=seed]').onclick = () => {
  const t = todayISO();
  [
    { kind: 'subscription', name: '爱奇艺 VIP', amountCents: 2500, cycle: 'monthly', start: '2026-01-28' },
    { kind: 'subscription', name: '网易云音乐', amountCents: 14800, cycle: 'yearly', start: '2025-11-12' },
    { kind: 'subscription', name: 'iCloud+ 200GB', amountCents: 2100, cycle: 'monthly', start: '2025-06-03' },
    { kind: 'subscription', name: '腾讯视频', amountCents: 3000, cycle: 'monthly', start: '2026-03-15' },
    { kind: 'purchase', name: '苹果', qty: 6, everyDays: 7, lastBought: null },
    { kind: 'purchase', name: '香蕉', qty: 1, everyDays: 5, lastBought: addDays(t, -4) },
    { kind: 'purchase', name: '草莓', qty: 1, everyDays: null, lastBought: null },
    { kind: 'activity', topic: '用 AI 记账', host: '爸爸', date: addDays(t, 2) },
    { kind: 'activity', topic: '太阳系', host: '小宇', date: addDays(t, 9) },
  ].forEach(item => dispatch({ type: 'add', item: { id: crypto.randomUUID(), ...item } }));
};

render();
