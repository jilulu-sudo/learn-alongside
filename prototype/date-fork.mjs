// 实验：1 月 31 日开通的月付订阅，JS 自带的 setMonth 会算出哪天扣费？
const naive = (iso, months) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
};
for (const [start, n] of [['2026-01-31', 1], ['2026-01-31', 2], ['2026-03-31', 1], ['2024-02-29', 12]]) {
  console.log(`${start} + ${n} 个月 -> setMonth 得到 ${naive(start, n)}`);
}
