import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, apply, summary, agenda, addMonths, nextRenewal, todayISO } from '../app/domain.js';

const TODAY = '2026-09-25';

const family = () => [
  { id: 's1', kind: 'subscription', name: '爱奇艺 VIP', amountCents: 2500, cycle: 'monthly', start: '2026-01-28' },
  { id: 's2', kind: 'subscription', name: '网易云音乐', amountCents: 14800, cycle: 'yearly', start: '2025-11-12' },
  { id: 's3', kind: 'subscription', name: 'iCloud+ 200GB', amountCents: 2100, cycle: 'monthly', start: '2025-06-03' },
  { id: 's4', kind: 'subscription', name: '腾讯视频', amountCents: 3000, cycle: 'monthly', start: '2026-03-15' },
  { id: 'p1', kind: 'purchase', name: '苹果', qty: 6, everyDays: 7, lastBought: null },
  { id: 'p2', kind: 'purchase', name: '香蕉', qty: 1, everyDays: 5, lastBought: '2026-09-21' },
  { id: 'p3', kind: 'purchase', name: '草莓', qty: 1, everyDays: null, lastBought: null },
  { id: 'a1', kind: 'activity', topic: '用 AI 记账', host: '爸爸', date: '2026-09-27' },
  { id: 'a2', kind: 'activity', topic: '太阳系', host: '小宇', date: '2026-10-04' },
  { id: 'a0', kind: 'activity', topic: '上周的分享', host: '妈妈', date: '2026-09-20' },
];

const load = items => items.reduce((s, item) => apply(s, { type: 'add', item }), emptyState());

test('P1 月付和年付混在一起时，每月订阅总额是 ¥88.33', () => {
  assert.equal(summary(load(family()), TODAY).monthlyCents, 8833);
});

test('P2 1 月 31 日开通的月付订阅，2 月在 28 日扣费，3 月回到 31 日', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-01-31', 2), '2026-03-31');
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
  const sub = { kind: 'subscription', cycle: 'monthly', start: '2026-01-31' };
  assert.equal(nextRenewal(sub, '2026-02-01'), '2026-02-28');
  assert.equal(nextRenewal(sub, '2026-03-01'), '2026-03-31');
});

test('P2 年付订阅的下次扣费日按开通日逐年推算', () => {
  assert.equal(nextRenewal({ cycle: 'yearly', start: '2025-11-12' }, TODAY), '2026-11-12');
  assert.equal(nextRenewal({ cycle: 'yearly', start: '2025-11-12' }, '2025-11-12'), '2025-11-12');
});

test('P2 7 天内的续费、要买的水果、分享按日期排进日程，过期的分享不出现', () => {
  const rows = agenda(load(family()), TODAY).map(r => `${r.date} ${r.text}`);
  assert.deepEqual(rows, [
    '2026-09-25 苹果 ×6',
    '2026-09-25 草莓 ×1',
    '2026-09-26 香蕉 ×1',
    '2026-09-27 用 AI 记账（爸爸）',
    '2026-09-28 爱奇艺 VIP 扣 ¥25.00',
  ]);
});

test('P3 周期水果买了之后离开日程，满周期后自动回来', () => {
  let s = apply(load(family()), { type: 'bought', id: 'p1', on: TODAY });
  const names = st => day => agenda(st, day).filter(r => r.kind === 'purchase').map(r => r.text);
  assert.deepEqual(names(s)(TODAY), ['草莓 ×1', '香蕉 ×1']);
  assert.ok(names(s)('2026-10-02').includes('苹果 ×6'));
});

test('P3 一次性水果买了就不再出现', () => {
  const s = apply(load(family()), { type: 'bought', id: 'p3', on: TODAY });
  assert.ok(!agenda(s, '2026-12-01').some(r => r.id === 'p3'));
});

test('P4 下次分享取今天及以后最近的一场', () => {
  assert.equal(summary(load(family()), TODAY).nextActivity.topic, '用 AI 记账');
  assert.equal(summary(load(family()), '2026-09-28').nextActivity.topic, '太阳系');
  assert.equal(summary(load(family()), '2026-10-05').nextActivity, null);
});

test('7 天内要买的水果数与日程一致', () => {
  assert.equal(summary(load(family()), TODAY).fruitDue, 3);
});

test('删除条目后它从日程和总额里消失', () => {
  const s = apply(load(family()), { type: 'remove', id: 's1' });
  assert.equal(summary(s, TODAY).monthlyCents, 8833 - 2500);
  assert.ok(!agenda(s, TODAY).some(r => r.id === 's1'));
});

test('P6 北京时间早上 7 点，今天是本地日期而不是 UTC 的前一天', () => {
  const at7amBeijing = new Date('2026-09-24T23:00:00Z');
  const local = new Date(at7amBeijing.getTime() + 8 * 3600e3);
  const fake = { getFullYear: () => local.getUTCFullYear(), getMonth: () => local.getUTCMonth(), getDate: () => local.getUTCDate() };
  assert.equal(at7amBeijing.toISOString().slice(0, 10), '2026-09-24');
  assert.equal(todayISO(fake), '2026-09-25');
});
