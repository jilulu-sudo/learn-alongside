// 家庭周期事务的领域模型。纯函数，不碰 DOM 和 localStorage，浏览器和 node 测试共用。
//
// Item 是按 kind 区分的联合类型：
//   subscription { id, name, amountCents, cycle: 'monthly' | 'yearly', start: ISO }
//   purchase     { id, name, qty, everyDays: number | null, lastBought: ISO | null }
//   activity     { id, topic, host, date: ISO }
// ISO 指 'YYYY-MM-DD' 字符串。下次扣费日、下次该买的日子都由存下的事实推算出来，不单独存。

export const WINDOW_DAYS = 7;

export const emptyState = () => ({ items: [] });

export function apply(state, action) {
  switch (action.type) {
    case 'add':
      return { items: [...state.items, action.item] };
    case 'remove':
      return { items: state.items.filter(it => it.id !== action.id) };
    case 'bought':
      return { items: state.items.map(it => (it.id === action.id ? { ...it, lastBought: action.on } : it)) };
    default:
      throw new Error(`unknown action ${action.type}`);
  }
}

const KINDS = {
  subscription: {
    monthlyCents: it => (it.cycle === 'monthly' ? it.amountCents : it.amountCents / 12),
    due: (it, today) => nextRenewal(it, today),
    text: it => `${it.name} 扣 ¥${yuan(it.amountCents)}`,
  },
  purchase: {
    monthlyCents: () => 0,
    due: (it, today) => {
      if (it.lastBought === null) return today;
      if (it.everyDays === null) return null;
      return addDays(it.lastBought, it.everyDays);
    },
    text: it => `${it.name} ×${it.qty}`,
  },
  activity: {
    monthlyCents: () => 0,
    due: (it, today) => (it.date >= today ? it.date : null),
    text: it => `${it.topic}（${it.host}）`,
  },
};

export function agenda(state, today, days = WINDOW_DAYS) {
  const end = addDays(today, days);
  return state.items
    .map(it => ({ id: it.id, kind: it.kind, date: KINDS[it.kind].due(it, today), text: KINDS[it.kind].text(it) }))
    .filter(row => row.date !== null && row.date < end)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function summary(state, today) {
  const monthly = state.items.reduce((sum, it) => sum + KINDS[it.kind].monthlyCents(it), 0);
  const upcoming = state.items
    .filter(it => it.kind === 'activity' && it.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    monthlyCents: Math.round(monthly),
    fruitDue: agenda(state, today).filter(row => row.kind === 'purchase').length,
    nextActivity: upcoming[0] ?? null,
  };
}

// 家里共享的是微信群，不是这份数据。发一条消息占住“我去买”，比在各自手机上点认领更能防止买重。
export function shoppingMessage(state, today) {
  const rows = agenda(state, today).filter(row => row.kind === 'purchase');
  if (rows.length === 0) return null;
  return [`【我去买】${Number(today.slice(5, 7))}/${Number(today.slice(8))}`, ...rows.map(r => `· ${r.text}`)].join('\n');
}

export function nextRenewal(sub, today) {
  const step = sub.cycle === 'monthly' ? 1 : 12;
  const [sy, sm] = sub.start.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  let k = Math.max(0, Math.floor(((ty - sy) * 12 + (tm - sm)) / step));
  let date = addMonths(sub.start, k * step);
  while (date < today) date = addMonths(sub.start, ++k * step);
  return date;
}

export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(d, lastDay));
  return first.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function todayISO(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const yuan = cents => (cents / 100).toFixed(2);
